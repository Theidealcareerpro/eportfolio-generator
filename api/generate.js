
const formidable = require('formidable-serverless');
const { put } = require('@vercel/blob');

const generatePortfolioHTML = (data) => {
  const { name, profession, tagline, summary, about, user_email, linkedin, phone, skills, skillProficiencies, projects, template } = data;
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${name || 'Your Name'}'s ePortfolio</title>
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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://eportfolio.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new formidable.IncomingForm();
    const [fields, files] = await form.parse(req);

    // Log incoming fields for debugging
    console.log('Received fields:', fields);

    // Parse JSON fields with fallback
    const formData = {
      name: fields.name?.[0] || '',
      profession: fields.profession?.[0] || '',
      tagline: fields.tagline?.[0] || '',
      summary: fields.summary?.[0] || '',
      about: fields.about?.[0] || '',
      user_email: fields.user_email?.[0] || '',
      linkedin: fields.linkedin?.[0] || '',
      phone: fields.phone?.[0] || '',
      skills: fields.skills?.[0] ? JSON.parse(fields.skills[0] || '["", "", "", ""]') : ['', '', '', ''],
      skillProficiencies: fields.skillProficiencies?.[0] ? JSON.parse(fields.skillProficiencies[0] || '[80, 70, 60, 50]') : [80, 70, 60, 50],
      projects: fields.projects?.[0] ? JSON.parse(fields.projects[0] || '[{ "title": "", "description": "", "link": "", "category": "" }, { "title": "", "description": "", "link": "", "category": "" }]') : [
        { title: '', description: '', link: '', category: '' },
        { title: '', description: '', link: '', category: '' },
      ],
      template: fields.template?.[0] || 'default',
    };

    // Handle files
    const cvFile = files.cv?.[0] || null;
    const imageFile = files.image?.[0] || null;

    // Generate unique ID
    const portfolioId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Generate HTML
    const html = generatePortfolioHTML(formData);

    // Store in Vercel Blob
    const blob = await put(`portfolios/${portfolioId}.html`, html, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Error generating portfolio:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to generate portfolio: ' + error.message });
  }
};
