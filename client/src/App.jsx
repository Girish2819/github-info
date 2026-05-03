const createProfileCsvContent = (repoData) => {
  const rows = [
    [
      'Full name',
      'Description',
      'URL',
      'Stars',
      'Forks',
      'Open Issues',
      'Default Branch',
      'License',
      'Visibility',
      'Is Fork',
      'Tech Stack'
    ]
  ];
  repoData.forEach(({ repo, stack }) => {
    rows.push([
      repo.full_name,
      repo.description || '',
      repo.html_url,
      repo.stargazers_count,
      repo.forks_count,
      repo.open_issues_count,
      repo.default_branch,
      repo.license?.name || 'None',
      repo.private ? 'Private' : 'Public',
      repo.fork ? 'Yes' : 'No',
      stack.join('; ')
    ]);
  });
  return rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
};

const downloadProfileCsv = (repoData, username) => {
  const csv = createProfileCsvContent(repoData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${username}-repos-info.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
import { useState } from 'react';

const API = import.meta.env.VITE_API_URL;

fetch(`${API}/api/github?username=${username}`)

const GITHUB_API = 'https://api.github.com';

const simpleTechStack = (files, languages) => {
  const tech = new Set();

  if (languages) {
    Object.keys(languages).forEach((lang) => tech.add(lang));
  }

  const lowercase = files.map((file) => file.toLowerCase());

  if (lowercase.some((path) => path.endsWith('package.json'))) tech.add('Node.js / JavaScript');
  if (lowercase.some((path) => path.endsWith('requirements.txt') || path.endsWith('pyproject.toml') || path.endsWith('setup.py'))) tech.add('Python');
  if (lowercase.some((path) => path.endsWith('pom.xml') || path.endsWith('.java') || path.includes('maven'))) tech.add('Java');
  if (lowercase.some((path) => path.endsWith('build.gradle') || path.endsWith('gradle.properties'))) tech.add('Gradle');
  if (lowercase.some((path) => path.endsWith('go.mod') || path.endsWith('.go'))) tech.add('Go');
  if (lowercase.some((path) => path.endsWith('composer.json') || path.includes('php'))) tech.add('PHP');
  if (lowercase.some((path) => path.endsWith('dockerfile') || path.includes('docker'))) tech.add('Docker');
  if (lowercase.some((path) => path.endsWith('readme.md'))) tech.add('Markdown');
  if (lowercase.some((path) => path.endsWith('.rs'))) tech.add('Rust');
  if (lowercase.some((path) => path.endsWith('.swift'))) tech.add('Swift');
  if (lowercase.some((path) => path.endsWith('.kt') || lowercase.some((path) => path.endsWith('.kts')))) tech.add('Kotlin');
  if (lowercase.some((path) => path.endsWith('.cs'))) tech.add('C#');
  if (lowercase.some((path) => path.endsWith('.cpp') || path.endsWith('.h') || path.endsWith('.hpp'))) tech.add('C++');
  if (lowercase.some((path) => path.endsWith('.c'))) tech.add('C');

  return Array.from(tech).slice(0, 8);
};

const parseGitHubQuery = (query) => {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // match repo url
  const repoUrl = trimmed.match(/github\.com\/([^\/]+)\/([^\/]+)(?:[\/?#]|$)/i);
  if (repoUrl && repoUrl[1] && repoUrl[2]) {
    return { type: 'repo', value: `${repoUrl[1]}/${repoUrl[2]}` };
  }

  // match profile url
  const profileUrl = trimmed.match(/github\.com\/([^\/]+)(?:[\/?#]|$)/i);
  if (profileUrl && profileUrl[1]) {
    return { type: 'profile', value: profileUrl[1] };
  }

  const direct = trimmed.split('/').filter(Boolean);
  if (direct.length === 2) return { type: 'repo', value: `${direct[0]}/${direct[1]}` };
  if (direct.length === 1) return { type: 'profile', value: direct[0] };

  return null;
};

const fetchJson = async (url) => {
  const headers = {
    Accept: 'application/vnd.github+json',
  };

  if (import.meta.env.VITE_GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${message}`);
  }
  return res.json();
};

const createCsvContent = (repo, stack, languages, files) => {
  const totalBytes = languages ? Object.values(languages).reduce((sum, value) => sum + value, 0) : 0;
  const languageLines = languages
    ? Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .map(([lang, bytes]) => `${lang}: ${((bytes / totalBytes) * 100).toFixed(1)}%`)
        .join('; ')
    : '';

  const rows = [
    ['Field', 'Value'],
    ['Full name', repo.full_name],
    ['Description', repo.description || ''],
    ['URL', repo.html_url],
    ['Stars', repo.stargazers_count],
    ['Forks', repo.forks_count],
    ['Open Issues', repo.open_issues_count],
    ['Default Branch', repo.default_branch],
    ['License', repo.license?.name || 'None'],
    ['Visibility', repo.private ? 'Private' : 'Public'],
    ['Tech Stack', stack.join('; ')],
    ['Languages', languageLines],
    ['Top Files', files.join('; ')],
  ];

  return rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
};

const downloadCsv = (repo, stack, languages, files) => {
  const csv = createCsvContent(repo, stack, languages, files);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${repo.full_name.replace('/', '-')}-repo-info.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function App() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [files, setFiles] = useState([]);
  const [stack, setStack] = useState([]);
  const [languages, setLanguages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileRepos, setProfileRepos] = useState(null);

  const searchRepo = async (event) => {
    event?.preventDefault();
    setError('');
    setResult(null);
    setFiles([]);
    setLanguages(null);
    setStack([]);
    setProfileRepos(null);

    const parsed = parseGitHubQuery(query);
    if (!parsed) {
      setError('Enter a valid GitHub repository/profile URL or owner/repo/owner identifier.');
      return;
    }

    setLoading(true);

    if (parsed.type === 'repo') {
      try {
        const repo = await fetchJson(`${GITHUB_API}/repos/${parsed.value}`);
        const langs = await fetchJson(`${GITHUB_API}/repos/${parsed.value}/languages`);
        const tree = await fetchJson(`${GITHUB_API}/repos/${parsed.value}/git/trees/${repo.default_branch}?recursive=1`);
        const allFiles = (tree.tree || [])
          .filter((entry) => entry.type === 'blob')
          .map((entry) => entry.path)
          .slice(0, 120);

        setResult(repo);
        setLanguages(langs);
        setFiles(allFiles);
        setStack(simpleTechStack(allFiles, langs));
      } catch (err) {
        if (err.message && err.message.includes('403')) {
          setError('GitHub API rate limit exceeded. Please add a GitHub token in your .env as VITE_GITHUB_TOKEN and restart.');
        } else {
          setError(err.message.replace(/\n/g, ' '));
        }
      } finally {
        setLoading(false);
      }
    } else if (parsed.type === 'profile') {
      try {
        let allRepos = [];
        let page = 1;
        let fetched = [];
        do {
          fetched = await fetchJson(`${GITHUB_API}/users/${parsed.value}/repos?per_page=100&type=owner&sort=updated&page=${page}`);
          allRepos = allRepos.concat(fetched);
          page++;
        } while (fetched.length === 100);

        setProfileRepos([]);

        const repoData = await Promise.all(
          allRepos.slice(0, 20).map(async (repo) => {
            try {
              const langs = await fetchJson(`${GITHUB_API}/repos/${repo.full_name}/languages`);
              let stack = [];
              try {
                const tree = await fetchJson(`${GITHUB_API}/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`);
                const allFiles = (tree.tree || [])
                  .filter((entry) => entry.type === 'blob')
                  .map((entry) => entry.path)
                  .slice(0, 120);
                stack = simpleTechStack(allFiles, langs);
              } catch {
                stack = simpleTechStack([], langs);
              }
              return { repo, stack };
            } catch {
              return { repo, stack: [] };
            }
          })
        );

        setProfileRepos({
          repos: allRepos,
          repoData
        });
      } catch (err) {
        if (err.message && err.message.includes('403')) {
          setError('GitHub API rate limit exceeded. Please add a GitHub token in your .env as VITE_GITHUB_TOKEN and restart.');
        } else {
          setError(err.message.replace(/\n/g, ' '));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const languageChips = languages
    ? Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([lang, bytes]) => `${lang} • ${((bytes / Object.values(languages).reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%`)
    : [];

  return (
    <div className="page">
      <div className="logo">Repo Search</div>
      <div className="search-box">
        <form className="search-form" onSubmit={searchRepo}>
          <input
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Paste a public GitHub repo/profile URL or type owner/repo/owner"
          />
          <button className="search-button" type="submit" disabled={!query.trim() || loading}>
            Search
          </button>
        </form>
        <p className="helper-text">Example: github.com/facebook/react, facebook/react, github.com/facebook</p>
      </div>

      {loading && <div className="loading">Loading repository data…</div>}
      {error && <div className="error">{error}</div>}

      {/* Repo result */}
      {result && (
        <div className="results">
          <div className="result-header">
            <div>
              <h2 className="repo-name">{result.full_name}</h2>
              <p className="repo-description">{result.description || 'No description available.'}</p>
            </div>
            <div className="badge-row">
              <span className="badge">Stars: {result.stargazers_count.toLocaleString()}</span>
              <span className="badge">Forks: {result.forks_count.toLocaleString()}</span>
              <span className="badge">Open Issues: {result.open_issues_count.toLocaleString()}</span>
            </div>
          </div>

          <div className="meta-row">
            <span className="badge">Default branch: {result.default_branch}</span>
            <span className="badge">License: {result.license?.name || 'None'}</span>
            <span className="badge">Visibility: {result.private ? 'Private' : 'Public'}</span>
            <button
              className="download-button"
              type="button"
              onClick={() => downloadCsv(result, stack, languages, files)}
            >
              Download CSV
            </button>
          </div>

          <div className="section-title">Tech stack</div>
          <div className="stack-row">
            {stack.length > 0 ? (
              stack.map((item) => (
                <span key={item} className="stack-chip">{item}</span>
              ))
            ) : (
              <span className="stack-chip">Unable to detect a strong tech stack yet.</span>
            )}
          </div>

          {languageChips.length > 0 && (
            <>
              <div className="section-title">Detected languages</div>
              <div className="stack-row">
                {languageChips.map((chip) => (
                  <span key={chip} className="stack-chip">{chip}</span>
                ))}
              </div>
            </>
          )}

          <div className="section-title">Top files</div>
          <div className="file-list">
            {files.length > 0 ? (
              files.map((file) => (
                <div key={file} className="file-item">
                  {file}
                </div>
              ))
            ) : (
              <div className="file-item">No files available for this repository.</div>
            )}
          </div>
        </div>
      )}

      {/* Profile result */}
      {profileRepos && profileRepos.repos && profileRepos.repoData && (
        <div className="results">
          <div className="section-title">
            Total repositories: {profileRepos.repos.length}
            {' | '}Forked repositories: {profileRepos.repos.filter(r => r.fork).length}
            {' | '}Original repositories: {profileRepos.repos.filter(r => !r.fork).length}
          </div>
          <button
            className="download-button"
            type="button"
            style={{ marginBottom: '1rem' }}
            onClick={() => downloadProfileCsv(profileRepos.repoData, profileRepos.repos[0]?.owner?.login || 'user')}
          >
            Download CSV (all shown repos)
          </button>
          {profileRepos.repos.length === 0 && <div>No repositories found for this user.</div>}
          {profileRepos.repoData.map(({ repo, stack }) => (
            <div key={repo.id} className="profile-repo-card">
              <div className="repo-name">{repo.full_name} {repo.fork && <span className="badge">Fork</span>}</div>
              <div className="repo-description">{repo.description || 'No description available.'}</div>
              <div className="badge-row">
                <span className="badge">Stars: {repo.stargazers_count.toLocaleString()}</span>
                <span className="badge">Forks: {repo.forks_count.toLocaleString()}</span>
                <span className="badge">Visibility: {repo.private ? 'Private' : 'Public'}</span>
              </div>
              <div className="stack-row">
                {stack.length > 0 ? (
                  stack.map((item) => (
                    <span key={item} className="stack-chip">{item}</span>
                  ))
                ) : (
                  <span className="stack-chip">No tech stack detected.</span>
                )}
              </div>
            </div>
          ))}
          {profileRepos.repos.length > 20 && (
            <div className="helper-text">Showing tech stack for first 20 repos. Only counts above are complete.</div>
          )}
        </div>
      )}
    </div>
  );
}
