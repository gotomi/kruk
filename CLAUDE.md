# CLAUDE.md - Guide for Working with Kruk Codebase

## Build Commands
- `npm run lint` - Runs ESLint on all files
- `npm run lint:fix` - Runs ESLint with auto-fix enabled
- `npm install` - Install dependencies
- `./bin/index.js` - Run the CLI tool directly (add required params)
- `npm test` - Run all tests
- `npm test -- -t "test name"` - Run specific test
- `npm run test:watch` - Run tests in watch mode

## Code Style Guidelines
- **Module System**: ES Modules (type: "module" in package.json)
- **Formatting**: Uses ESLint with Prettier integration
- **Exports**: Named exports preferred over default exports
- **Promises**: Use async/await pattern for handling promises
- **Parameters**: Use destructuring for function parameters when applicable
- **Error Handling**: Follow the handleErrors pattern in crux.js
- **Naming**: camelCase for variables and functions, PascalCase for classes
- **Types**: Use JSDoc comments for type annotations where needed

## Repository Structure
- `/src`: Core functionality and utilities
- `/bin`: CLI entry point
- `/example`: Examples of tool output

## CLI Tool Usage
- Always requires `--key` (API key) and `--urls` parameters
- Four output formats: table (default), distribution, json, csv
- Supports filtering by formFactor and effectiveConnectionType