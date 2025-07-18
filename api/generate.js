```javascript
const { parse } = require('querystring');
const fs = require('fs').promises;
const path = require('path');

// Helper to parse multipart form data (simplified, for Vercel)
const parseMultipartForm = async (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const boundary = req.headers['content-type'].split('boundary=')[1];
      const parts = body.split(`--${boundary}`);
      const formData = {};
      
      parts.forEach(part => {
        if (part.includes('Content-Disposition')) {
          const nameMatch = part.match(/name="([^"]+)"/);
          const filenameMatch = part.match(/filename="([^"]+)"/);
          if (nameMatch) {
            const name = nameMatch[1];
            const value = part.split('\r\n\r\n')[1]?.split('\r\n')[0]?.trim();
            if (value && !filenameMatch) {
              formData[name] = value;
            }
          }
        }
      });
      resolve(formData);
    });
    req.on('error', reject);
  });
};

// Helper to generate a simple HTML portfolio
const generatePortfolioHTML = (data) => {
  const { name, profession, tagline, summary, about, user_email, linkedin, phone, skills, skillProficiencies, projects, template } = data;
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${name}'s ePortfolio</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: 'Inter', sans-serif; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(to right, #4f46e5, #3b82f6); color: white; padding: 2rem; text-align: center; }
        .section { margin: 2rem 0; }
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .project-card { background: #f9fafb; padding: 1rem; border-radius: 8px; }
      </style>
    </head>
    <body class="${template === 'dark' ? 'bg-gray-900 text-white' : template === 'vibrant' ? 'bg-yellow-50 text-gray-900' : 'bg-gray-50 text-gray-900'}">
      <div class="container">
        <header class="header">
          <h1 class="text-3xl font-bold">${name || 'Your Name'}</h1>
          <p class="text-xl">${profession || 'Professional'}</p>
          ${tagline ? `<p class="italic">${tagline}</p>` : ''}
        </header>
        <section class="section">
          <h2 class="text-2xl font-semibold">About Me</h2>
          <p>${about || 'Tell your story here.'}</p>
        </section>
        <section class="section">
          <h2 class="text-2xl font-semibold">Professional Summary</h2>
          <p>${summary || 'Your professional background.'}</p>
        </section>
        <section class="section">
          <h2 class="text-2xl font-semibold">Skills</h2>
          <div class="skills-grid">
            ${skills ? skills.map((skill, i) => `
              <div>
                <p>${skill || `Skill ${i + 1}`}</p>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div class="bg-indigo-600 h-2.5 rounded-full" style="width: ${skillProficiencies[i] || 50}%"></div>
                </div>
              </div>
            `).join('') : '<p>No skills provided.</p>'}
          </div>
        </section>
        <section class="section">
          <h2 class="text-2xl font-semibold">Projects</h2>
          ${projects ? projects.map((project, i) => `
            <div class="project-card">
              <h3 class="text-xl font-semibold">${project.title || `Project ${i + 1}`}</h3>
              <p>${project.description || 'No description.'}</p>
              ${project.link ? `<a href="${project.link}" class="text-indigo-600 hover:underline" target="_blank">View Project</a>` : ''}
              <p class="text-gray-500">${project.category || 'Uncategorized'}</p>
            </div>
          `).join('') : '<p>No projects provided.</p>'}
        </section>
        <section class="section">
          <h2 class="text-2xl font-semibold">Contact</h2>
          <p>Email: ${user_email || 'Not provided'}</p>
          ${phone ? `<p>Phone: ${phone}</p>` : ''}
          ${linkedin ? `<p><a href="${linkedin}" class="text-indigo-600 hover:underline" target="_blank">LinkedIn Profile</a></p>` : ''}
        </section>
      </div>
    </body>
    </html>
  `;
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const formData = await parseMultipartForm(req);
    
    // Parse JSON fields (skills, projects)
    formData.skills = formData.skills ? JSON.parse(formData.skills) : ['', '', '', ''];
    formData.skillProficiencies = formData.skillProficiencies ? JSON.parse(formData.skillProficiencies) : [80, 70, 60, 50];
    formData.projects = formData.projects ? JSON.parse(formData.projects) : [
      { title: '', description: '', link: '', category: '' },
      { title: '', description: '', link: '', category: '' },
    ];

    // Generate unique ID for portfolio
    const portfolioId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Generate HTML
    const html = generatePortfolioHTML(formData);
    
    // TODO: Save HTML to storage (e.g., Vercel Blob, GitHub Pages, or filesystem)
    // For now, we'll mock the storage by returning a placeholder URL
    const portfolioUrl = `https://eportfolio-generator.vercel.app/portfolios/${portfolioId}`;
    
    // Example: Save to Vercel Blob (requires Vercel Blob SDK, uncomment if using)
    /*
    const { put } = require('@vercel/blob');
    const blob = await put(`portfolios/${portfolioId}.html`, html, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const portfolioUrl = blob.url;
    */

    // Example: Save to GitHub Pages (requires GitHub API setup, placeholder)
    /*
    const { Octokit } = require('@octokit/rest');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    await octokit.repos.createOrUpdateFileContents({
      owner: 'your-username',
      repo: 'eportfolio-generator',
      path: `portfolios/${portfolioId}.html`,
      message: `Add portfolio for ${formData.name}`,
      content: Buffer.from(html).toString('base64'),
    });
    const portfolioUrl = `https://your-username.github.io/eportfolio-generator/portfolios/${portfolioId}.html`;
    */

    // Return success response
    res.status(200).json({ url: portfolioUrl });
  } catch (error) {
    console.error('Error generating portfolio:', error);
    res.status(500).json({ error: 'Failed to generate portfolio' });
  }
};
```
