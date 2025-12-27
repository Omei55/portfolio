# 📝 Guide: Adding a New Project to Portfolio

This guide provides step-by-step commands to add a new project to your GitHub portfolio repository.

## Prerequisites

- Git installed and configured
- GitHub personal access token (if using token authentication)
- Your project files ready to be added

## Step-by-Step Commands

### 1. Navigate to Portfolio Workspace

```bash
cd /Users/omkarvilassapkal/Cursor/portfolio-workspace
```

### 2. Pull Latest Changes from GitHub

```bash
git pull origin main
```

### 3. Create Project Directory

Replace `your-project-name` with your actual project name (use lowercase with hyphens):

```bash
mkdir -p projects/your-project-name
```

### 4. Copy Your Project Files

Copy your project from its current location to the portfolio:

```bash
cp -r /path/to/your/project/* portfolio-workspace/projects/your-project-name/
```

**Example:**
```bash
cp -r /Users/omkarvilassapkal/Cursor/MyNewProject/* portfolio-workspace/projects/my-new-project/
```

### 5. Clean Up Unnecessary Files

Remove files that shouldn't be in the repository:

```bash
cd projects/your-project-name

# Remove node_modules
rm -rf node_modules
rm -rf */node_modules
rm -rf */*/node_modules

# Remove build/dist directories
rm -rf dist
rm -rf build
rm -rf */dist
rm -rf */build

# Remove .env files (sensitive data)
rm -f .env
rm -f */.env
rm -f */*/.env

# Remove .git directory if copied
rm -rf .git

# Remove .DS_Store files (macOS)
find . -name ".DS_Store" -delete

# Remove any other temporary/cache files
rm -rf .cache
rm -rf *.log
```

### 6. Verify Required Files

Check that essential files are present:

```bash
# Check for README.md
test -f README.md && echo "✓ README.md present" || echo "✗ README.md missing"

# Check for package.json (if Node.js project)
test -f package.json && echo "✓ package.json present" || echo "✗ package.json missing"

# Check for .gitignore
test -f .gitignore && echo "✓ .gitignore present" || echo "✗ .gitignore missing"
```

### 7. Update Portfolio README

Edit the main README.md to add your new project:

```bash
cd /Users/omkarvilassapkal/Cursor/portfolio-workspace
nano README.md
# or use your preferred editor: code README.md, vim README.md, etc.
```

Add your project in the same format as existing projects:

```markdown
### 🎯 [Your Project Name](./projects/your-project-name/)

Brief description of your project.

**Technologies:** Technology1, Technology2, Technology3  
**Key Features:**
- Feature 1
- Feature 2
- Feature 3

[View Project Details →](./projects/your-project-name/README.md)
```

Also update:
- Project count (e.g., "Total Projects: 3")
- Add any new technologies to the Technical Skills section

### 8. Stage All Changes

```bash
cd /Users/omkarvilassapkal/Cursor/portfolio-workspace
git add -A
```

### 9. Check What Will Be Committed

```bash
git status
```

Review the changes to ensure everything looks correct.

### 10. Commit Changes

```bash
git commit -m "Add [Your Project Name] project to portfolio"
```

### 11. Push to GitHub

**Option A: Using Personal Access Token (if configured)**

```bash
git push origin main
```

**Option B: Using Token in URL (if needed)**

```bash
git push https://ghp_YOUR_TOKEN@github.com/Omei55/portfolio.git main
```

### 12. Verify on GitHub

Visit your portfolio repository to confirm the project was added:
```
https://github.com/Omei55/portfolio
```

## Quick Reference: Complete Command Sequence

Here's the complete sequence in one block (replace placeholders):

```bash
# 1. Navigate to workspace
cd /Users/omkarvilassapkal/Cursor/portfolio-workspace

# 2. Pull latest changes
git pull origin main

# 3. Create project directory
mkdir -p projects/your-project-name

# 4. Copy project files
cp -r /path/to/your/project/* projects/your-project-name/

# 5. Clean up
cd projects/your-project-name
rm -rf node_modules */node_modules */*/node_modules
rm -rf dist build */dist */build
rm -f .env */.env */*/.env
rm -rf .git
find . -name ".DS_Store" -delete
rm -rf .cache *.log
cd ../..

# 6. Update README.md (edit manually)
# Add your project description to README.md

# 7. Stage, commit, and push
git add -A
git commit -m "Add [Your Project Name] project to portfolio"
git push origin main
```

## Tips

1. **Project Naming**: Use lowercase with hyphens (e.g., `my-awesome-project`)
2. **README.md**: Always include a comprehensive README.md in your project directory
3. **.gitignore**: Make sure your project has a proper .gitignore file
4. **Sensitive Data**: Never commit `.env` files, API keys, or passwords
5. **File Size**: Avoid committing large binary files or datasets
6. **Consistency**: Follow the same structure and format as existing projects

## Troubleshooting

### If push fails due to authentication:
```bash
# Set up credential helper
git config --global credential.helper store

# Or use token in remote URL
git remote set-url origin https://ghp_YOUR_TOKEN@github.com/Omei55/portfolio.git
```

### If you need to undo a commit:
```bash
git reset --soft HEAD~1  # Undo commit but keep changes
git reset --hard HEAD~1  # Undo commit and discard changes (be careful!)
```

### If you need to remove a project:
```bash
git rm -r projects/project-to-remove
git commit -m "Remove project-name from portfolio"
git push origin main
```

---

**Last Updated:** December 2024

