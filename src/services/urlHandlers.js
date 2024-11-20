import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { analyzeContent } from './aiAnalysis.js';
import { XMLParser } from 'fast-xml-parser';
dotenv.config();

// GitHub Repository Handler
async function handleGitHubUrl(url) {
  try {
    const token = process.env.GITHUB_TOKEN;
    const [owner, repo] = url.replace('https://github.com/', '').split('/');
    
    console.log('Fetching repo:', owner, repo);
    
    const repoResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const data = repoResponse.data;
    let summary = data.description || '';

    try {
      // Try to get README, but don't fail if we can't
      const readmeResponse = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      const readmeContent = Buffer.from(readmeResponse.data.content, 'base64').toString('utf8');
      summary = await analyzeContent(readmeContent) || data.description || '';
    } catch (readmeError) {
      console.log('README fetch error:', readmeError.message);
      // Use repo description as fallback
      summary = data.description || 'No description available';
    }

    return {
      type: 'repository',
      title: data.full_name,
      description: data.description || '',
      summary: summary,
      url: data.html_url,
      date: data.created_at,
      stars: data.stargazers_count,
      language: data.language,
      topics: data.topics || [],
      accessible: true
    };
  } catch (error) {
    console.error('Error handling GitHub URL:', error);
    return {
      type: 'repository',
      url: url,
      title: url.split('/').slice(-2).join('/'),
      summary: `Unable to access repository: ${error.response?.status === 404 ? 'Not found' : 'Access error'}`,
      description: '',
      date: new Date().toISOString(),
      accessible: false,
      error: error.message
    };
  }
}

// ArXiv Paper Handler
async function handleArxivUrl(url) {
  try {
    const arxivId = url.match(/\d+\.\d+/)[0];
    const apiUrl = `http://export.arxiv.org/api/query?id_list=${arxivId}`;
    const response = await axios.get(apiUrl);
    
    // Parse XML response
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    const result = parser.parse(response.data);
    
    // Check if entry exists
    if (!result.feed.entry) {
      return {
        type: 'research',
        url: url,
        summary: 'Paper not found - Invalid arXiv ID',
        accessible: false,
        error: 'Not found'
      };
    }

    const entry = result.feed.entry;

    // Extract authors safely
    const authors = Array.isArray(entry.author) 
      ? entry.author.map(a => a.name).join(', ')
      : entry.author?.name || 'Unknown Author';

    // Clean and format the abstract
    const abstract = `Title: ${entry.title}\n\nAbstract: ${entry.summary}`
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Get categories/topics safely
    const categories = Array.isArray(entry.category)
      ? entry.category.map(c => c['@_term'])
      : entry.category ? [entry.category['@_term']] : [];

    // Get PDF link safely
    const pdfLink = Array.isArray(entry.link)
      ? entry.link.find(l => l['@_title'] === 'pdf')?.['@_href']
      : entry.link?.['@_href'];

    return {
      type: 'research',
      title: entry.title?.replace(/\n\s+/g, ' ').trim() || 'Untitled',
      authors: authors,
      summary: await analyzeContent(abstract),
      url: url,
      date: entry.published || new Date().toISOString(),
      pdf: pdfLink || `${url}.pdf`,
      categories: categories,
      arxivId: arxivId,
      accessible: true
    };
  } catch (error) {
    console.error('Error handling arXiv URL:', error);
    return {
      type: 'research',
      url: url,
      summary: error.response?.status === 404 
        ? 'Paper not found - Invalid arXiv ID'
        : 'Error accessing paper',
      accessible: false,
      error: error.message
    };
  }
}

// Article Handler
async function handleArticleUrl(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArticleBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Get basic metadata first
    const title = $('meta[property="og:title"]').attr('content') || 
                 $('title').text() || 
                 new URL(url).pathname;
                 
    const description = $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="description"]').attr('content') || 
                       '';

    // Try multiple content selectors
    let content = '';
    const selectors = [
      'article',
      '[role="main"]',
      '.article-content',
      '.post-content',
      'main',
      '#content',
      '.content'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        content = element
          .clone()
          .find('script, style, nav, header, footer, .comments, .social-share')
          .remove()
          .end()
          .text()
          .trim();
        
        if (content.length > 100) break;
      }
    }

    // If no content found, try paragraph text
    if (content.length < 100) {
      content = $('p').slice(0, 5).text().trim();
    }

    // Clean the content
    const cleanContent = content
      .replace(/\s+/g, ' ')
      .replace(/\.([A-Z])/g, '. $1')
      .trim();

    // Always return an object, even if content is short
    return {
      type: 'article',
      title: title.trim(),
      description: description.trim(),
      summary: cleanContent.length > 100 
        ? await analyzeContent(cleanContent.substring(0, 1000))
        : 'Unable to extract meaningful content',
      url: url,
      date: $('meta[property="article:published_time"]').attr('content') || 
            $('time').attr('datetime') || 
            new Date().toISOString(),
      source: new URL(url).hostname,
      accessible: cleanContent.length > 100,
      contentLength: cleanContent.length
    };

  } catch (error) {
    console.error('Error handling article URL:', error);
    return {
      type: 'article',
      url: url,
      title: new URL(url).pathname,
      description: '',
      summary: `Error accessing article: ${error.message}`,
      date: new Date().toISOString(),
      source: new URL(url).hostname,
      accessible: false,
      error: error.message
    };
  }
}

// URL Type Detector and Router
export async function processUrl(url) {
  try {
    let result;
    if (url.includes('github.com')) {
      result = await handleGitHubUrl(url);
    } else if (url.includes('arxiv.org')) {
      result = await handleArxivUrl(url);
    } else {
      result = await handleArticleUrl(url);
    }

    // Ensure we have at least these fields
    return {
      type: result?.type || 'unknown',
      url: url,
      title: result?.title || url,
      summary: result?.summary || 'Unable to process content',
      description: result?.description || '',
      date: result?.date || new Date().toISOString(),
      accessible: result?.accessible || false,
      ...result
    };
  } catch (error) {
    console.error('Error in processUrl:', error);
    return {
      type: 'unknown',
      url: url,
      title: url,
      summary: 'Error processing content',
      description: '',
      date: new Date().toISOString(),
      accessible: false,
      error: error.message
    };
  }
}