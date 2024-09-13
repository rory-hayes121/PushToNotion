const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const markdown = require('markdown-it')(); 

const notionToken = 'development_secret_ooAtYOigdRsHzmbZI02si4vDNc0kxBerEEaqEDqYar6';
const parentPageId = '0ffadd06-ef6d-806b-85b9-f4d21a0ca5c8';

// Initialize Notion client
const notion = new Client({
  auth: notionToken,
});

async function createNotionPageFromMarkdown(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.md');
  const markdownContent = markdown.render(fileContent);

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
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              text: {
                content: markdownContent,
              },
            },
          ],
        },
      },
    ],
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
