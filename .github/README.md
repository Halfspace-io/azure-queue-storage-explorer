# GitHub Actions for VS Code Extension

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/Halfspace-io/azure-queue-storage-explorer)](https://github.com/Halfspace-io/azure-queue-storage-explorer/releases)
[![Build Status](https://github.com/Halfspace-io/azure-queue-storage-explorer/actions/workflows/cd.yml/badge.svg)](https://github.com/Halfspace-io/azure-queue-storage-explorer/actions)
[![License](https://img.shields.io/github/license/Halfspace-io/azure-queue-storage-explorer)](LICENSE)

This repository includes automated workflows for building, testing, and publishing the Azure Queue Storage Explorer VS Code extension.

## 🚀 Two-Stage Release Process

### Stage 1: Auto-Release on Merge
- **File**: `.github/workflows/auto-release.yml`
- **Triggers**: Push to `main` branch
- **Actions**:
  - Validates version is greater than latest release
  - Creates GitHub release with .vsix package
  - Updates changelog automatically
  - **Prevents duplicate or smaller versions**

### Stage 2: Publish to Marketplace
- **File**: `.github/workflows/publish-to-marketplace.yml`
- **Triggers**: GitHub release published, Manual dispatch
- **Actions**:
  - Downloads .vsix from GitHub release
  - Publishes to VS Code Marketplace
  - Updates release notes with marketplace link

## 📋 Your Release Workflow

### 1. **Development Phase**
```bash
# Make your changes
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 2. **Version Bump Phase**
```bash
# Manually edit package.json version
# Change "version": "1.0.0" to "version": "1.0.1"

# Commit and push
git add .
git commit -m "chore: bump version to X.X.X"
git push origin main
```

### 3. **Auto-Release Phase**
- GitHub Actions automatically:
  - ✅ Validates version > latest release
  - ✅ Creates GitHub release
  - ✅ Packages .vsix file
  - ✅ Updates changelog

### 4. **Publish Phase** (Manual)
- Go to GitHub Releases page
- Click "Publish to VS Code Marketplace" button
- Or use manual dispatch workflow

## 🔒 Version Protection

The auto-release workflow **prevents**:
- ❌ Creating releases with existing versions
- ❌ Creating releases with smaller versions
- ❌ Publishing from local machine

## 🛠️ Setup Instructions

### 1. Create Personal Access Token (PAT)

1. Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
2. Click "Create new Personal Access Token"
3. Set expiration (recommend 1 year)
4. Copy the token

### 2. Add GitHub Secrets

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VSCE_PAT`: Your Visual Studio Marketplace Personal Access Token
   - `GITHUB_TOKEN`: (Already exists) For GitHub API access

### 3. Test the Workflow

1. Make a small change
2. Bump version: `pnpm run bump:patch`
3. Commit and push: `git add . && git commit -m "test" && git push origin main`
4. Check GitHub Actions tab
5. Verify release is created
6. Manually trigger marketplace publish

## 📊 Workflow Status

- **Auto-Release**: Runs on every push to main
- **Publish**: Runs when you publish a GitHub release
- **CI**: Runs on every push and PR

## 🎯 Benefits

1. **Impossible to publish locally** - Everything goes through GitHub Actions
2. **Version validation** - Prevents duplicate/smaller versions
3. **Two-stage process** - Release first, publish when ready
4. **Automatic packaging** - .vsix files created automatically
5. **Changelog updates** - Automatic changelog generation

## 🚨 Troubleshooting

### Version Already Exists Error
```bash
# Check current version
cat package.json | grep version

# Manually edit package.json to bump version
# Then commit and push
git add . && git commit -m "chore: bump version" && git push origin main
```

### Workflow Failed
1. Check GitHub Actions tab for error details
2. Ensure all secrets are set correctly
3. Verify version is greater than latest release
4. Check if tests are passing

## 📝 Quick Commands

```bash
# Quick release workflow
# 1. Manually edit package.json version
# 2. Commit and push
git add .
git commit -m "chore: bump version"
git push origin main
# Wait for auto-release, then manually publish to marketplace
```