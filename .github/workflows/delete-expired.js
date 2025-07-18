```javascript
const { Octokit } = require("@octokit/rest");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function deleteExpiredRepos() {
  const { data: expired } = await supabase
    .from("portfolios")
    .select("repo_name")
    .lt("expires_at", new Date().toISOString());

  for (const { repo_name } of expired || []) {
    try {
      await octokit.repos.delete({
        owner: process.env.GITHUB_USER,
        repo: repo_name,
      });
      await supabase.from("portfolios").delete().eq("repo_name", repo_name);
      await supabase.from("analytics").delete().eq("repo_name", repo_name);
      console.log(`Deleted ${repo_name}`);
    } catch (error) {
      console.error(`Error deleting ${repo_name}: ${error.message}`);
    }
  }
}

deleteExpiredRepos();
```
