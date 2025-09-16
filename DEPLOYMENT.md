# GitHub Pages Deployment Guide

This guide explains how to deploy your Urdu Document Editor to GitHub Pages.

## Prerequisites

1. A GitHub repository (public or private)
2. Node.js and npm installed locally
3. Git configured with your GitHub credentials

## Deployment Methods

### Method 1: Automatic Deployment with GitHub Actions (Recommended)

This method automatically deploys your app whenever you push to the main/master branch.

#### Setup Steps:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment configuration"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click on "Settings" tab
   - Scroll down to "Pages" section
   - Under "Source", select "GitHub Actions"
   - Save the settings

3. **Deploy:**
   - The GitHub Action will automatically run when you push to main/master
   - Check the "Actions" tab to monitor deployment progress
   - Once complete, your app will be available at: `https://yourusername.github.io/urdocs/`

### Method 2: Manual Deployment

If you prefer manual control over deployments:

1. **Install gh-pages package:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Configure GitHub Pages:**
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose "gh-pages" branch and "/ (root)" folder

## Configuration Details

### Vite Configuration
The app is configured with:
- Base path: `/urdocs/` for production builds
- Output directory: `dist`
- Optimized chunk splitting for better performance

### GitHub Actions Workflow
Located at `.github/workflows/deploy.yml`, the workflow:
- Runs on push to main/master branches
- Installs dependencies and builds the project
- Deploys to GitHub Pages using the `gh-pages` action

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the `public` folder with your domain
2. Update the GitHub Actions workflow to include the CNAME
3. Configure DNS settings with your domain provider

## Troubleshooting

### Common Issues:

1. **404 Errors:**
   - Ensure the base path in `vite.config.ts` matches your repository name
   - Check that GitHub Pages is enabled and configured correctly

2. **Build Failures:**
   - Check the Actions tab for detailed error logs
   - Ensure all dependencies are properly installed
   - Verify that the build command works locally: `npm run build`

3. **Assets Not Loading:**
   - Verify the base path configuration
   - Check that all assets are included in the build output

### Local Testing:

Test the production build locally:
```bash
npm run build
npm run preview
```

## Environment Variables

The app uses `NODE_ENV=production` for production builds. If you need additional environment variables:

1. Add them to the GitHub Actions workflow
2. Use GitHub repository secrets for sensitive data
3. Update the build process accordingly

## Performance Optimization

The build is optimized with:
- Code splitting for vendor, editor, and UI libraries
- Tree shaking for smaller bundle sizes
- Optimized asset handling

## Security Considerations

- No sensitive data should be committed to the repository
- Use GitHub secrets for any required API keys
- Ensure all dependencies are up to date

## Monitoring

- Monitor deployment status in the GitHub Actions tab
- Check GitHub Pages settings for any configuration issues
- Use browser developer tools to debug any runtime issues

## Support

For issues related to:
- GitHub Pages: Check GitHub documentation
- Vite build: Refer to Vite documentation
- React app: Check React documentation

Your app should now be successfully deployed to GitHub Pages!
