# Second Mark Down Page!

This is a markdown test file that will be used to create a Notion page using a GitHub Action 2.

## Key Features!!
- Automatically converts markdown to Notion pages.
- Easily customisable.
- Integrates seamlessly with Notion's API.
- One More.

## How It Works??
1. Write your documentation in markdown.
2. Push it to your GitHub repository.
3. Watch as your content gets converted into beautiful Notion pages.
4. Another Test.

## Some Image!!
![Alt text](https://github.blog/wp-content/uploads/2023/01/1200x640-2.png "a sample image title")

## Some Sample Code!
```javascript
const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
notion.pages.create({
  parent: { page_id: process.env.PARENT_PAGE_ID },
  properties: { title: [{ text: { content: 'New Page' } }] },
});


