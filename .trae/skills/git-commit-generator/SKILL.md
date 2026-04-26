---
name: "git-commit-generator"
description: "Analyzes git changes and generates conventional commit messages (feat, fix, chore, etc.). Invoke when user asks to generate commit message or when about to commit changes."
---

# Git Commit Message Generator

This skill automatically analyzes git changes and generates conventional commit messages following the Conventional Commits specification.

## How to Use

When the user asks to generate a commit message, follow these steps:

1. **Check git status** to see which files have been modified
2. **View the git diff** to understand what changes were made
3. **Analyze the changes** to determine the appropriate type (feat, fix, chore, docs, style, refactor, test, perf)
4. **Generate a commit message** following the conventional commits format

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type Options

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect code meaning (white-space, formatting, etc)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries

## Example Workflow

1. Run `git status` to see modified files
2. Run `git diff` to view the changes
3. Analyze the diff to understand what was changed
4. Generate an appropriate commit message
5. Optionally, run `git commit -m "<message>"` to commit the changes

## Usage Example

When user says: "Generate a commit message" or "What should I commit?" or similar, invoke this skill.
