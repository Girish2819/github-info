# GitHub Repo Search UI

A lightweight React + Vite app that mimics a search-style interface for exploring public GitHub repositories.

## Features
- Paste any public GitHub repo URL or `owner/repo`
- Fetch repository metadata from GitHub
- Show repo summary, stats, detected tech stack, and top files
- Google-style centered search experience

## Setup

1. Install dependencies:

```bash
cd '/home/girish/Desktop/Github info'
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the URL shown in the terminal.

## Production server

1. Build the app:

```bash
npm run build
```

2. Start the static server:

```bash
npm start
```

3. Open `http://localhost:3000` in your browser.

The `server.js` file is used to serve the production build from the `dist` folder.

## Usage
Enter a public GitHub repository URL like:

- `https://github.com/facebook/react`
- `facebook/react`

## Notes
- This app uses the GitHub REST API without authentication. For heavy use, add a personal access token or proxy the requests.
- The tech stack is inferred from repository languages and common repository files.
