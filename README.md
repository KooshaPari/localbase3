# LocalBase

[![AI Slop Inside](https://sladge.net/badge.svg)](https://sladge.net)

LocalBase is a decentralized AI compute marketplace built on Cosmos SDK with provider software, OpenRouter-compatible API, and React frontend.

## Project Structure

- `localbase-frontend/`: Next.js frontend application
- `localbase-api/`: OpenAI-compatible API server
- `localbase-blockchain/`: Cosmos SDK blockchain for the marketplace
- `localbase-provider/`: Provider software for GPU owners
- `localbase-tests/`: Integration and security tests

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)
- Go (v1.19 or later, for blockchain component)
- Docker (for local development)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/localbase.git
cd localbase
```

2. Install dependencies for each component:

```bash
# Frontend
cd localbase-frontend
npm install

# API
cd ../localbase-api
npm install

# Return to root
cd ..
```

### Running the Application

#### Frontend

```bash
cd localbase-frontend
npm run dev
```

The frontend will be available at http://localhost:3000.

#### API

```bash
cd localbase-api
npm run dev
```

The API will be available at http://localhost:8000.

## Testing

We have a comprehensive test suite for all components of the LocalBase project. For detailed instructions on running tests, see [TEST-README.md](TEST-README.md).

### Running All Tests

To run all tests across all components:

```bash
./run-all-tests.sh
```

### Running Tests for Specific Components

#### Frontend Tests

```bash
cd localbase-frontend
npm test
```

#### API Tests

```bash
cd localbase-api
npm test
```

## Development

### Environment Variables

#### Frontend

Create a `.env.local` file in the `localbase-frontend` directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### API

Create a `.env` file in the `localbase-api` directory with the following variables:

```
PORT=8000
NODE_ENV=development
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

### Code Style

We use ESLint and Prettier for code style. To check your code:

```bash
# Frontend
cd localbase-frontend
npm run lint

# API
cd ../localbase-api
npm run lint
```

To automatically fix issues:

```bash
# Frontend
cd localbase-frontend
npm run lint:fix

# API
cd ../localbase-api
npm run lint:fix
```

## Deployment

### Frontend

The frontend can be deployed to Vercel:

```bash
cd localbase-frontend
vercel
```

### API

The API can be deployed to any Node.js hosting service, such as Heroku:

```bash
cd localbase-api
heroku create
git push heroku main
```

## Related Phenotype Projects

- **[DataKit](../DataKit/)** — ETL and schema validation for localbase data
- **[PhenoSchema](../PhenoSchema/)** — Schema management for localbase schemas
- **[cloud](../cloud/)** — Multi-tenant platform integrating localbase as edge db

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## License

MIT — see [LICENSE](./LICENSE).
