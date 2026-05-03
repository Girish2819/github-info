import { useState } from 'react';

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

const parseRepoQuery = (query) => {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const githubUrl = trimmed.match(/github\.com\/([^\/]+)\/([^\/]+)(?:[\/\?#]|$)/i);
  if (githubUrl && githubUrl[1] && githubUrl[2]) {
    return `${githubUrl[1]}/${githubUrl[2]}`;
  }

  const direct = trimmed.split('/').filter(Boolean);
  if (direct.length === 2) return `${direct[0]}/${direct[1]}`;

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

  const searchRepo = async (event) => {
    event?.preventDefault();
    setError('');
    setResult(null);
    setFiles([]);
    setLanguages(null);
    setStack([]);

    const repoSlug = parseRepoQuery(query);
    if (!repoSlug) {
      setError('Enter a valid GitHub repository URL or owner/repo identifier.');
      return;
    }

    setLoading(true);

    try {
      const repo = await fetchJson(`${GITHUB_API}/repos/${repoSlug}`);
      const langs = await fetchJson(`${GITHUB_API}/repos/${repoSlug}/languages`);
      const tree = await fetchJson(`${GITHUB_API}/repos/${repoSlug}/git/trees/${repo.default_branch}?recursive=1`);
      const allFiles = (tree.tree || [])
        .filter((entry) => entry.type === 'blob')
        .map((entry) => entry.path)
        .slice(0, 120);

      setResult(repo);
      setLanguages(langs);
      setFiles(allFiles);
      setStack(simpleTechStack(allFiles, langs));
    } catch (err) {
      setError(err.message.replace(/\n/g, ' '));
    } finally {
      setLoading(false);
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
            placeholder="Paste a public GitHub repo URL or type owner/repo"
          />
          <button className="search-button" type="submit" disabled={!query.trim() || loading}>
            Search
          </button>
        </form>
        <p className="helper-text">Example: github.com/facebook/react or facebook/react</p>
      </div>

      {loading && <div className="loading">Loading repository data…</div>}
      {error && <div className="error">{error}</div>}

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
    </div>
  );
}
