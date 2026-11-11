# Contributing to cypress-performance-ui

First of all, thank you for your interest in contributing to **cypress-performance-ui**!

This is an open-source project created to make client-side performance testing easier with Cypress.

Contributions of all kinds are welcome, whether you're fixing a bug, suggesting a new feature, improving documentation, or sharing ideas.

## How Can You Contribute?

You can help by:

- Reporting bugs or unexpected behavior.
- Suggesting new features or improvements.
- Improving the HTML performance dashboard.
- Adding new browser performance metrics.
- Improving TypeScript support.
- Updating documentation and examples.
- Testing the plugin with different Cypress versions and browsers.

Even small contributions are appreciated!

## Reporting Bugs

If you find a bug, please open a GitHub Issue.

When reporting a bug, try to include:

- A short description of the problem.
- Steps to reproduce it.
- Expected and actual behavior.
- Cypress and Node.js versions.
- Screenshots or error messages, if available.

Please avoid sharing sensitive information, API keys, or private application data.

## Suggesting Features

Have an idea for a new feature?

Feel free to open a GitHub Issue and describe:

- What problem you want to solve.
- How the feature could help Cypress users.
- An example of how you would like it to work.

You don't need to have a complete technical solution before suggesting an idea.

## Getting Started

### 1. Fork and Clone the Repository

Fork the project on GitHub, then clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/cypress-performance-ui.git
cd cypress-performance-ui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Branch

Create a branch for your changes:

```bash
git checkout -b feature/my-improvement
```

For bug fixes, you can use a name like `fix/network-timing`.

### 4. Make Your Changes

The main project files include:

- `index.js` — Cypress commands and HTML dashboard generation.
- `index.d.ts` — TypeScript declarations.
- `plugin.js` — Cypress Node-side plugin tasks.
- `README.md` — Documentation and usage examples.
- `assets/` — Screenshots and other project assets.

Try to keep your changes focused and easy to understand.

If you add or change a Cypress command, please update the TypeScript declarations and README when needed.

### 5. Test Your Changes

Before submitting your changes:

- Make sure your code runs without errors.
- Test the affected commands in a Cypress project.
- Check that the HTML dashboard displays correctly.
- Verify that existing functionality still works.
- Update documentation if you changed how something works.

You can also check JavaScript syntax with:

```bash
node --check index.js
node --check plugin.js
```

If you add a new feature, including a simple Cypress example is always helpful.

### 6. Submit a Pull Request

When your changes are ready:

```bash
git add .
git commit -m "Add network performance improvement"
git push origin feature/my-improvement
```

Then open a Pull Request against the main repository.

In your Pull Request, please explain:

- What you changed.
- Why the change is useful.
- How you tested it.
- Any screenshots, especially for dashboard changes.

Small, focused Pull Requests are easier to review.

## Code Guidelines

There are no complicated rules, but please try to:

- Keep the code simple and readable.
- Follow the existing coding style.
- Avoid adding unnecessary dependencies.
- Keep existing Cypress commands backward compatible when possible.
- Handle missing or unsupported browser performance data safely.
- Avoid exposing sensitive request information in logs or reports.

## Questions or Help

If you're unsure about something, feel free to open a GitHub Issue and ask.

You don't need to be an expert in performance testing to contribute.

## Thank You!

Every bug report, suggestion, documentation update, and code contribution helps improve **cypress-performance-ui**.

Thanks for helping make performance testing easier for the Cypress community!

**Project:** https://github.com/pete2121/cypress-performance-ui
