# Welcome to My First Mark Down Page

This is a markdown test file that will be used to create a Notion page using a GitHub Action.

## Key Features
- Automatically converts markdown to Notion pages
- Easily customizable
- Integrates seamlessly with Notion's API

## How It Works
1. Write your documentation in markdown.
2. Push it to your GitHub repository.
3. Watch as your content gets converted into beautiful Notion pages.

## Sample Code
```javascript
const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
notion.pages.create({
  parent: { page_id: process.env.PARENT_PAGE_ID },
  properties: { title: [{ text: { content: 'New Page' } }] },
});

