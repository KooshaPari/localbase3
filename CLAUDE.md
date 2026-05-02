# CLAUDE.md — localbase3

## Project Overview

localbase3 is a web application project using TypeScript and React. It provides local-first database capabilities via localbase-frontend.

## Technology Stack

- **Language**: TypeScript
- **Frontend**: React
- **Package Manager**: npm (detect from package-lock.json)
- **Testing**: Playwright for E2E tests

## Project Structure

- localbase-frontend/ — React frontend application

## Quality Gates

Run quality checks with:
- npm test
- npm run lint

## GitHub Actions

CI is configured via GitHub Actions workflows in .github/workflows/.

## Repository Settings

- Default branch: main
- Branch protection: PRs required for main
