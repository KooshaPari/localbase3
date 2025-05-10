# LocalBase Frontend

LocalBase Frontend is a React-based web application for interacting with the LocalBase decentralized AI compute marketplace. It provides interfaces for both AI users and GPU providers.

## Features

- User dashboard for AI inference requests
- Provider portal for GPU owners
- Marketplace for discovering providers
- Analytics and monitoring tools
- Wallet integration for payments

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Web3 wallet (MetaMask or Keplr)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/localbase-frontend.git
cd localbase-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Configuration

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://localhost:26657
NEXT_PUBLIC_CHAIN_ID=localbase-1
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Architecture

The LocalBase Frontend is built with:

- Next.js for server-side rendering and routing
- React for UI components
- Tailwind CSS for styling
- Supabase for authentication and database
- CosmJS for blockchain interactions

### Main Components

#### User Dashboard

- Model selection
- Inference request form
- Request history
- Usage analytics
- Billing information

#### Provider Portal

- Provider registration
- Hardware management
- Model configuration
- Earnings dashboard
- Performance metrics

#### Marketplace

- Provider discovery
- Model filtering
- Price comparison
- Provider ratings and reviews
- Geographic filtering

#### Wallet Integration

- Cosmos SDK wallet integration
- Transaction history
- Balance management
- Payment processing

## Development

### Folder Structure

```
localbase-frontend/
├── components/        # Reusable UI components
├── contexts/          # React contexts for state management
├── hooks/             # Custom React hooks
├── pages/             # Next.js pages
├── public/            # Static assets
├── services/          # API and blockchain services
├── styles/            # Global styles
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## License

This project is licensed under the MIT License - see the LICENSE file for details.
