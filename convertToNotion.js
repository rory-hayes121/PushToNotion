const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const marked = require('marked'); // Markdown parser library

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const parentPageId = process.env.PARENT_PAGE_ID;

// Function to convert markdown to Notion blocks
function markdownToBlocks(markdownContent) {
  const tokens = marked.lexer(markdownContent);
  const blocks = tokens.map(token => {
    switch (token.type) {
      case 'heading':
        return {
          object: 'block',
          type: `heading_${token.depth}`,
          heading_1: { text: [{ type: 'text', text: { content: token.text } }] }
        };
      case 'paragraph':
        return {
          object: 'block',
          type: 'paragraph',
          paragraph: { text: [{ type: 'text', text: { content: token.text } }] }
        };
      case 'list':
        return {
          object: 'block',
          type: token.ordered ? 'numbered_list_item' : 'bulleted_list_item',
          [token.ordered ? 'numbered_list_item' : 'bulleted_list_item']: {
            text: [{ type: 'text', text: { content: token.text } }]
          }
        };
      case 'code':
        return {
          object: 'block',
          type: 'code',
          code: {
            text: [{ type: 'text', text: { content: token.text } }],
            language: token.lang || 'plaintext'
          }
        };
      default:
        return null;
    }
  }).filter(block => block !== null);

  return blocks;
}

// Function to create a Notion page
async function createNotionPage(markdownContent, title) {
  const blocks = markdownToBlocks(markdownContent);
  await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: {
      title: [{ text: { content: title } }]
    },
    children: blocks
  });
}

// Read markdown files and trigger the Notion API call
const markdownFilePath = path.join(__dirname, 'documentation/example.md');
const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');
createNotionPage(markdownContent, 'Example Notion Page');
