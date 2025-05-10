# LocalBase Documentation

This repository contains the documentation for the LocalBase project, a decentralized AI compute marketplace built on the Cosmos SDK.

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/localbase/localbase-docs.git
cd localbase-docs

# Install dependencies
npm install
```

### Local Development

```bash
# Start the development server
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```bash
# Build the website
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

The documentation site can be deployed to various platforms:

#### GitHub Pages

The repository is configured to deploy to GitHub Pages using GitHub Actions. When you push to the `main` branch, the site will be automatically built and deployed to the `gh-pages` branch.

#### Netlify

To deploy to Netlify:

1. Create a new site on Netlify
2. Connect it to your GitHub repository
3. Use the following build settings:
   - Build command: `npm run build`
   - Publish directory: `build`

#### Vercel

To deploy to Vercel:

1. Create a new project on Vercel
2. Connect it to your GitHub repository
3. Vercel will automatically detect the Docusaurus configuration

## Project Structure

```
localbase-docs/
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions workflow for deployment
├── docs/                   # Documentation files
│   ├── getting-started/    # Getting started guides
│   ├── guides/             # User guides
│   ├── api-reference/      # API reference
│   ├── blockchain/         # Blockchain documentation
│   ├── provider/           # Provider node documentation
│   └── frontend/           # Frontend documentation
├── src/                    # Source files
│   ├── components/         # React components
│   ├── css/                # CSS files
│   └── pages/              # Custom pages
├── static/                 # Static files
│   └── img/                # Images
├── docusaurus.config.js    # Docusaurus configuration
├── sidebars.js             # Sidebar configuration
├── package.json            # npm package configuration
├── netlify.toml            # Netlify configuration
└── vercel.json             # Vercel configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Guidelines

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
