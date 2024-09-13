const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
});

const parentPageId = process.env.PARENT_PAGE_ID;

// Function to convert Markdown to Notion blocks
function markdownToBlocks(markdownContent) {
  const tokens = marked.lexer(markdownContent);
  const blocks = [];
  let currentListType = null;
  let listItems = [];

  tokens.forEach(token => {
    switch (token.type) {
      case 'heading':
        blocks.push({
          object: 'block',
          type: `heading_${token.depth}`,
          [`heading_${token.depth}`]: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: token.text || ''
                }
              }
            ]
          }
        });
        break;

      case 'paragraph':
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: token.text || ''
                }
              }
            ]
          }
        });
        break;

      case 'list_start':
        currentListType = token.ordered ? 'numbered_list_item' : 'bulleted_list_item';
        listItems = [];
        console.log('List start:', currentListType);
        break;

      case 'list_item':
        listItems.push({
          object: 'block',
          type: currentListType,
          [currentListType]: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: token.text || ''
                }
              }
            ]
          }
        });
        console.log('List item:', token.text);
        break;

      case 'list_end':
        if (listItems.length > 0) {
          blocks.push(...listItems);
          console.log('List end:', listItems);
        }
        currentListType = null;
        listItems = [];
        break;

      case 'code':
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: token.text || ''
                }
              }
            ],
            language: token.lang || 'plaintext'
          }
        });
        break;

      default:
        // Skip unsupported tokens
        break;
    }
  });

  // Handle any remaining list items if the document ends with a list
  if (listItems.length > 0) {
    blocks.push(...listItems);
    console.log('Remaining list items:', listItems);
  }

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
            type: 'text',
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
