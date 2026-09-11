# Contributing to Power Gym Management System

Thank you for your interest in contributing to **Power Gym**! We welcome contributions of all kinds — bug fixes, new features, documentation improvements, and ideas. Please read this guide before submitting any pull requests.

---

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)

---

## 🤝 Code of Conduct

This project follows a professional, respectful, and inclusive environment. By contributing, you agree to treat all participants with respect and maintain a constructive tone in all communications.

---

## 🚀 Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/power-gym.git
   cd power-gym
   ```
3. **Add the upstream remote:**
   ```bash
   git remote add upstream https://github.com/Khashana22/power-gym.git
   ```
4. **Install dependencies** for both backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
5. **Set up your `.env` file** — copy `.env.example` and fill in your local values.
6. **Create a feature branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

---

## 🔄 Development Workflow

1. Sync your fork with the upstream `main` branch before starting any work:
   ```bash
   git fetch upstream
   git merge upstream/main
   ```
2. Make your changes in small, focused commits.
3. Run the build locally to make sure everything compiles cleanly:
   ```bash
   # Backend
   cd backend && npm run build

   # Frontend
   cd frontend && npm run build
   ```
4. Open a Pull Request against the `main` branch.

---

## ✍️ Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to Use |
| :--- | :--- |
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation changes only |
| `style:` | Formatting, no logic change |
| `refactor:` | Code restructuring without behavior change |
| `test:` | Adding or updating tests |
| `chore:` | Build process or tooling changes |

**Examples:**
```
feat: add export-to-PDF for monthly reports
fix: correct remaining days calculation for frozen subscriptions
docs: update API reference table in README
```

---

## 🔍 Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR.
- Fill in the PR template completely.
- Reference the related issue number (e.g. `Closes #42`).
- Ensure both `backend` and `frontend` build without errors.
- Preserve Arabic RTL layout and EGP currency formatting throughout the UI.
- Add a clear description of **what** changed and **why**.

---

## 🎨 Code Style

- **TypeScript** everywhere — no `any` types without explicit justification.
- **NestJS** backend: use DTOs, Guards, and decorators consistently.
- **Next.js** frontend: use `'use client'` only on interactive components; prefer Server Components where possible.
- **Tailwind CSS**: follow the existing dark theme palette — `#09090B`, `#18181B`, `#27272A`, primary `#F97316`.
- **Arabic UI**: all user-facing text must remain in Arabic; all code, comments, and variable names must be in English.

---

## 🐛 Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Steps to reproduce
- Expected vs. actual behavior
- Browser, OS, and device type
- Screenshots if applicable

For security vulnerabilities, do **not** open a public issue — see [SECURITY.md](SECURITY.md) instead.

---

<div align="center">
  <sub>Power Gym &mdash; Built with ❤️ by <a href="https://github.com/Khashana22">Sayed Khashana</a></sub>
</div>
