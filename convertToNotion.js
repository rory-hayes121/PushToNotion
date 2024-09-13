const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
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

  // Log blocks for debugging
  console.log('Blocks to be sent:', JSON.stringify(blocks, null, 2));

  try {
    // Notion API request to create a page
    const response = await notion.pages.create({
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
    
    // Log response for debugging
    console.log('Notion API Response:', JSON.stringify(response, null, 2));
    console.log(`Page created for: ${fileName}`);
  } catch (error) {
    // Log errors if any
    console.error('Error creating Notion page:', error);
  }
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
