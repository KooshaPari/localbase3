# LocalBase Test Suite

This document provides instructions on how to run the test suite for the LocalBase project.

## Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)

## Running Tests

### Running All Tests

To run all tests across all components, use the `run-all-tests.sh` script:

```bash
./run-all-tests.sh
```

This script will:

1. Run unit tests for the frontend
2. Run end-to-end tests for the frontend
3. Run accessibility tests for the frontend
4. Run performance tests for the frontend
5. Run unit tests for the API
6. Run load tests for the API
7. Run tests for the blockchain component (if it exists)
8. Run tests for the provider component (if it exists)
9. Run integration tests (if they exist)

### Running Tests for Specific Components

#### Frontend Tests

##### Unit Tests

```bash
cd localbase-frontend
npm test
```

To run with coverage:

```bash
cd localbase-frontend
npm test -- --coverage
```

##### End-to-End Tests

```bash
cd localbase-frontend
npm run test:e2e
```

##### Accessibility Tests

```bash
cd localbase-frontend
npm run test:accessibility
```

##### Performance Tests

```bash
cd localbase-frontend
npm run test:performance
```

#### API Tests

##### Unit Tests

```bash
cd localbase-api
npm test
```

To run with coverage:

```bash
cd localbase-api
npm test -- --coverage
```

##### Load Tests

```bash
cd localbase-api
npm run test:load
```

## Test Structure

### Frontend Test Structure

#### Unit Tests

The frontend unit tests are organized as follows:

- `__tests__/app/`: Tests for Next.js app components
- `__tests__/components/`: Tests for React components
- `__tests__/contexts/`: Tests for React contexts
- `__tests__/lib/`: Tests for utility functions and API clients

#### End-to-End Tests

The frontend end-to-end tests are organized as follows:

- `cypress/e2e/`: Cypress end-to-end tests
  - `homepage.cy.ts`: Tests for the homepage
  - `auth.cy.ts`: Tests for authentication flows
  - `dashboard.cy.ts`: Tests for the dashboard
  - `jobs.cy.ts`: Tests for job management
  - `api-keys.cy.ts`: Tests for API key management
  - `accessibility.cy.ts`: Tests for accessibility compliance

#### Accessibility Tests

Accessibility tests use Cypress with axe-core to check for WCAG compliance:

- `cypress/e2e/accessibility.cy.ts`: Tests for accessibility compliance across all pages

#### Performance Tests

Performance tests use Lighthouse to measure performance metrics:

- `lighthouse-reports/`: Generated Lighthouse reports
- `run-performance-tests.sh`: Script to run Lighthouse tests

### API Test Structure

#### Unit Tests

The API unit tests are organized as follows:

- `__tests__/app.test.js`: Tests for the main Express app
- `__tests__/routes/`: Tests for API routes
- `__tests__/middleware/`: Tests for middleware functions
- `__tests__/utils/`: Tests for utility functions

#### Load Tests

The API load tests are organized as follows:

- `load-tests/`: k6 load test scripts
  - `api-load-test.js`: Load test for the API endpoints
- `load-test-reports/`: Generated load test reports

## Continuous Integration

Tests are automatically run on GitHub Actions for every push to the `main` and `develop` branches, as well as for every pull request to these branches.

The workflow is defined in `.github/workflows/test.yml`.

## Code Coverage

Code coverage reports are generated when running tests with the `--coverage` flag. The reports are available in the `coverage` directory of each component.

To view the coverage report:

1. Run tests with coverage
2. Open `coverage/lcov-report/index.html` in your browser

Coverage reports are also uploaded to Codecov for every push to the `main` and `develop` branches, as well as for every pull request to these branches.

## Writing Tests

### Writing Unit Tests

#### Frontend Unit Tests

Frontend unit tests use Jest and React Testing Library. Here's an example of a component test:

```jsx
import { render, screen, fireEvent } from "@testing-library/react";
import MyComponent from "@/components/MyComponent";

describe("MyComponent", () => {
	it("renders correctly", () => {
		render(<MyComponent />);
		expect(screen.getByText("Hello, World!")).toBeInTheDocument();
	});

	it("handles click events", () => {
		const handleClick = jest.fn();
		render(<MyComponent onClick={handleClick} />);
		fireEvent.click(screen.getByRole("button"));
		expect(handleClick).toHaveBeenCalled();
	});
});
```

#### API Unit Tests

API unit tests use Jest and Supertest. Here's an example of a route test:

```js
const request = require("supertest");
const app = require("../../src/app");

describe("GET /v1/models", () => {
	it("should return a list of models", async () => {
		const response = await request(app)
			.get("/v1/models")
			.set("Authorization", "Bearer test-api-key");

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("object", "list");
		expect(response.body).toHaveProperty("data");
		expect(Array.isArray(response.body.data)).toBe(true);
	});
});
```

### Writing End-to-End Tests

End-to-end tests use Cypress. Here's an example of a Cypress test:

```js
describe("Homepage", () => {
	beforeEach(() => {
		cy.visit("/");
	});

	it("displays the hero section", () => {
		cy.get("h1").contains("Decentralized AI Compute Marketplace");
		cy.get("a").contains("Get Started");
		cy.get("a").contains("Learn More");
	});

	it("navigates to sign up page when clicking Get Started", () => {
		cy.get("a").contains("Get Started").click();
		cy.url().should("include", "/signup");
	});
});
```

### Writing Accessibility Tests

Accessibility tests use Cypress with axe-core. Here's an example:

```js
describe("Accessibility Tests", () => {
	beforeEach(() => {
		cy.injectAxe();
	});

	it("Homepage should be accessible", () => {
		cy.visit("/");
		cy.checkA11y();
	});
});
```

### Writing Performance Tests

Performance tests use Lighthouse. The configuration is defined in `lighthouse-config.js`:

```js
module.exports = {
	extends: "lighthouse:default",
	settings: {
		onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
		formFactor: "desktop",
		throttling: {
			rttMs: 40,
			throughputKbps: 10240,
			cpuSlowdownMultiplier: 1,
		},
	},
};
```

### Writing Load Tests

Load tests use k6. Here's an example of a k6 test:

```js
import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
	stages: [
		{ duration: "30s", target: 10 },
		{ duration: "1m", target: 10 },
		{ duration: "30s", target: 50 },
		{ duration: "1m", target: 50 },
		{ duration: "30s", target: 0 },
	],
	thresholds: {
		http_req_duration: ["p(95)<500"],
	},
};

export default function () {
	const response = http.get("http://localhost:8000/v1/models", {
		headers: {
			Authorization: "Bearer test-api-key",
		},
	});

	check(response, {
		"status is 200": (r) => r.status === 200,
	});

	sleep(1);
}
```

## Troubleshooting

### Tests Failing Due to Missing Dependencies

If tests are failing due to missing dependencies, try running:

```bash
npm install
```

in the component directory.

### Tests Failing Due to Environment Variables

Some tests may require environment variables to be set. Check the component's README for details on required environment variables.

For local development, you can create a `.env.test` file in the component directory with the required environment variables.

### Tests Hanging

If tests are hanging, it may be due to a test that's not completing. Try running tests with the `--verbose` flag to see which test is hanging:

```bash
npm test -- --verbose
```
