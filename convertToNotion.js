const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const marked = require('marked');
const crypto = require('crypto');

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const parentPageId = process.env.PARENT_PAGE_ID;

// Function to compute a file hash
function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

// Function to convert markdown to Notion blocks
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
async function createNotionPage(markdownContent, title) {
  const blocks = markdownToBlocks(markdownContent);
  console.log(`Creating Notion page: ${title}`);
  await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: {
      title: [{ text: { content: title } }]
    },
    children: blocks
  });
}

// Maintain a record of file hashes
const hashFilePath = path.join(__dirname, '.file_hashes.json');
let fileHashes = {};

if (fs.existsSync(hashFilePath)) {
  fileHashes = JSON.parse(fs.readFileSync(hashFilePath));
}

// Process files in the documentation directory
const documentationDir = path.join(__dirname, 'documentation');
fs.readdirSync(documentationDir).forEach(file => {
  if (file.endsWith('.md')) {
    const markdownFilePath = path.join(documentationDir, file);
    const currentHash = getFileHash(markdownFilePath);

    if (fileHashes[file] !== currentHash) {
      console.log(`File changed: ${file}`);
      const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');
      createNotionPage(markdownContent, file.replace('.md', ''));
      fileHashes[file] = currentHash;
    }
  }
});

// Save updated file hashes
fs.writeFileSync(hashFilePath, JSON.stringify(fileHashes, null, 2));
