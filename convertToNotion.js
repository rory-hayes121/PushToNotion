const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const markdown = require('markdown-it')(); // Markdown to HTML converter
const marked = require('marked'); // Markdown lexer for more control

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
});

const parentPageId = process.env.PARENT_PAGE_ID;

// Function to convert Markdown to Notion blocks
function markdownToBlocks(markdownContent) {
  const tokens = marked.lexer(markdownContent);
  const blocks = tokens.map(token => {
    switch (token.type) {
      case 'heading':
        return {
          object: 'block',
          type: `heading_${token.depth}`,
          [`heading_${token.depth}`]: {
            text: [{ type: 'text', text: { content: token.text } }]
          }
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
      case 'list_item':
        return {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            text: [{ type: 'text', text: { content: token.text } }]
          }
        };
      default:
        return null;
    }
  }).filter(block => block !== null);

  return blocks;
}

// Function to create a Notion page
async function createNotionPageFromMarkdown(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.md');
  const blocks = markdownToBlocks(fileContent);

  // Notion API request to create a page
  await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: {
      title: [
        {
          text: {
            content: fileName,
          },
        },
      ],
    },
    children: blocks,
  });

  console.log(`Page created for: ${fileName}`);
}

async function convertMarkdownFilesToNotion() {
  const directoryPath = path.join(__dirname, 'documentation');
  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    if (path.extname(file) === '.md') {
      const filePath = path.join(directoryPath, file);
      await createNotionPageFromMarkdown(filePath);
    }
  }
}

convertMarkdownFilesToNotion().catch(console.error);
