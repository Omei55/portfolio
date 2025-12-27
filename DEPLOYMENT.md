# 🚀 Portfolio Deployment Guide

## Option 1: Vercel (Recommended - Easiest)

### Steps:
1. **Push your code to GitHub** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit - 3D Portfolio"
   git remote add origin https://github.com/YOUR_USERNAME/portfolio-website.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite app
   - Click "Deploy"
   - Done! Your site will be live in ~2 minutes

3. **Your site will be available at:**
   - `https://your-project-name.vercel.app`
   - You can add a custom domain later

### Advantages:
- ✅ Zero configuration needed
- ✅ Automatic deployments on every push
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Preview deployments for PRs

---

## Option 2: GitHub Pages

### Setup Steps:

1. **Install gh-pages package:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json:**
   Add these scripts:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. **Update vite.config.js:**
   ```js
   export default defineConfig({
     plugins: [react()],
     base: '/your-repo-name/', // Replace with your GitHub repo name
   });
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages:**
   - Go to your repo on GitHub
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: gh-pages
   - Save

6. **Your site will be at:**
   - `https://YOUR_USERNAME.github.io/your-repo-name/`

---

## Option 3: Netlify

### Steps:
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Sign up with GitHub
4. Click "New site from Git"
5. Select your repository
6. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click "Deploy site"

---

## Quick Comparison

| Feature | Vercel | Netlify | GitHub Pages |
|---------|--------|---------|--------------|
| Free | ✅ | ✅ | ✅ |
| Setup Time | 2 min | 3 min | 10 min |
| Auto Deploy | ✅ | ✅ | Manual |
| Custom Domain | ✅ | ✅ | ✅ |
| React SPA Support | ✅ Excellent | ✅ Excellent | ⚠️ Needs config |
| CDN | ✅ | ✅ | ⚠️ Limited |

---

## Recommendation: **Use Vercel**

It's the fastest, easiest, and best optimized for React apps like yours!

