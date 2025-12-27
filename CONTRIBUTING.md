# Contributing to POD Market Analytics Dashboard

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (OS, Node.js version, CockroachDB version)

### Suggesting Features

Feature suggestions are welcome! Please open an issue with:
- A clear description of the proposed feature
- Use case and motivation
- Proposed implementation approach (if you have one)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation as needed
4. **Test your changes**
   - Ensure all existing tests pass
   - Test new functionality thoroughly
5. **Commit your changes**
   ```bash
   git commit -m "Add: description of your changes"
   ```
   Use clear, descriptive commit messages.
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues

## Code Style Guidelines

### JavaScript/Node.js

- Use ES6+ features where appropriate
- Follow existing code formatting
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Handle errors appropriately

### React

- Use functional components with hooks
- Keep components focused and reusable
- Use descriptive prop names
- Follow React best practices

### SQL

- Use parameterized queries to prevent SQL injection
- Format SQL queries for readability
- Add comments for complex queries

## Project Structure

Please maintain the existing project structure:

```
backend/        - Backend API code
frontend/       - Frontend React code
out/           - Data files (CSV)
docs/          - Additional documentation (if needed)
```

## Testing

Before submitting a PR:

- Test your changes locally
- Ensure the application builds without errors
- Test with different query types
- Verify multi-node cluster functionality (if applicable)

## Documentation

- Update README.md if you add new features
- Update PROJECT_DOCUMENTATION.md for technical changes
- Add comments to complex code sections

## Questions?

Feel free to open an issue for questions or clarifications!

Thank you for contributing! 🎉

