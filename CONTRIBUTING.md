# Contributing to The Token Lab

We appreciate your interest in contributing to The Token Lab! This document outlines the process for contributing to this project and helps maintain a consistent workflow for all contributors.

## Branching Strategy

### Creating a New Branch

**Always create a new branch when making changes. This helps keep the main branch clean and allows for easier code reviews.**

### DO NOT DELETE BRANCHES WHAT-SO-EVER, they will archived instead (A branch is archived when named: `archived-v1.0.0`)

To create a new branch:

1. Ensure you're on the latest version of the main branch:
   ```
   git checkout master
   git pull origin master
   ```

2. Create a new branch with a descriptive name following semantic versioning:
   ```
   git checkout -b <version[num.num.num]> (i.e. v1.0.0)
   ```

## Semantic Versioning

Semantic Versioning (SemVer) is a versioning scheme that uses a three-part version number: MAJOR.MINOR.PATCH. Each part of the version number is incremented based on the type of changes made. Below are some examples:

- MAJOR: Incompatible (non-backwards-compatible) API changes or features
  ```1.0.0```
- MINOR: Backwards-compatible new features
  ```0.1.0```
- PATCH: Backwards-compatible bug fixes
  ```0.0.1```

When contributing, consider how your changes might affect the project's version number.

## Pull Requests

1. Before submitting a pull request, ensure your code adheres to the project's coding standards and passes all tests (if any).
2. Write a clear and concise description of your changes in the pull request (please be descriptive where necessary).
3. Reference any related issues in your pull request description.
4. Be prepared to make changes based on code review feedback.
5. **Please ensure that someone REVIEWS THE CODE PRIOR TO MERGING**. This is to ensure a "Maker" / "Checker" system.

## Code Style

- Follow the existing code style and conventions used in the project.
- Use consistent indentation (spaces or tabs as per project preference).
- Write clear, self-explanatory code and add comments where necessary.
- Do your best to ensure comments are also added on top of large or complex functions
- If there are tasks that needs to be done in the code being committed, add TODOs.

## Testing

- Ensure all existing tests (whatever it may be) pass before submitting a pull request. **Don't submit a "new feature" that doesn't compile.**

## Commit Messages

Write clear commit messages that explain briefly the changes made seperated by `/`. **For example**: "package.json updated / .gitignore updated / switch component added".

## Documentation

Update relevant documentation when making changes to the codebase (if necessary), including:

- README.md
- API documentation
- Code comments

## Questions and Support

If you have any questions or need support, please open an issue or reach out to the project maintainers.

Thank you for contributing to The Token Lab!