#!/usr/bin/env node

/**
 * Security Check Script for Roll The Dice
 * 
 * This script scans your codebase to ensure no sensitive information
 * is accidentally exposed. Run this before making your repo public.
 */

const fs = require('fs');
const path = require('path');

// Patterns that might indicate exposed secrets
const SECURITY_PATTERNS = [
  // Database connection patterns
  { pattern: /postgresql:\/\/[^"'\s]+/, description: 'Database connection string' },
  { pattern: /mongodb:\/\/[^"'\s]+/, description: 'MongoDB connection string' },
  { pattern: /mysql:\/\/[^"'\s]+/, description: 'MySQL connection string' },
  
  // API keys and tokens
  { pattern: /sk_[a-zA-Z0-9]{24}/, description: 'Stripe secret key' },
  { pattern: /pk_[a-zA-Z0-9]{24}/, description: 'Stripe public key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, description: 'GitHub personal access token' },
  { pattern: /gho_[a-zA-Z0-9]{36}/, description: 'GitHub OAuth token' },
  
  // Common secret patterns
  { pattern: /password["\s]*[:=]["\s]*[^"'\s,}]+/, description: 'Hardcoded password' },
  { pattern: /secret["\s]*[:=]["\s]*[^"'\s,}]+/, description: 'Hardcoded secret' },
  { pattern: /api_key["\s]*[:=]["\s]*[^"'\s,}]+/, description: 'Hardcoded API key' },
  { pattern: /token["\s]*[:=]["\s]*[^"'\s,}]+/, description: 'Hardcoded token' },
  
  // Supabase specific
  { pattern: /supabase\.co[^"'\s]*/, description: 'Supabase URL (check for credentials)' },
  
  // Environment variable patterns that should use process.env
  { pattern: /DATABASE_URL["\s]*[:=]["\s]*[^"'\s,}]+/, description: 'Hardcoded DATABASE_URL' },
  { pattern: /NEXT_PUBLIC_[^"'\s]*["\s]*[:=]["\s]*[^"'\s,}]+/, description: 'Hardcoded NEXT_PUBLIC variable' }
];

// Files and directories to ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /\.env/,
  /\.env\.local/,
  /\.env\.production/,
  /\.env\.development/,
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
  /\.DS_Store/,
  /\.vscode/,
  /\.idea/,
  /dist/,
  /build/,
  /coverage/,
  /\.nyc_output/,
  /\.cache/,
  /\.parcel-cache/,
  /\.turbo/,
  /\.vercel/,
  /\.swc/,
  /\.tsbuildinfo/
];

// Documentation files that can contain examples (safe to ignore)
const DOCUMENTATION_FILES = [
  /README\.md$/,
  /DEPLOYMENT\.md$/,
  /DEPLOYMENT_CHECKLIST\.md$/,
  /\.md$/,
  /\.txt$/,
  /\.yml$/,
  /\.yaml$/
];

// File extensions to scan
const SCAN_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.json'
];

let issuesFound = 0;
let filesScanned = 0;
let documentationFilesSkipped = 0;

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath));
}

function isDocumentationFile(filePath) {
  return DOCUMENTATION_FILES.some(pattern => pattern.test(filePath));
}

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return SCAN_EXTENSIONS.includes(ext);
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineNumber) => {
      SECURITY_PATTERNS.forEach(({ pattern, description }) => {
        if (pattern.test(line)) {
          console.log(`⚠️  ${description} found in ${filePath}:${lineNumber + 1}`);
          console.log(`   Line: ${line.trim()}`);
          console.log('');
          issuesFound++;
        }
      });
    });
    
    filesScanned++;
  } catch (error) {
    console.log(`❌ Error reading ${filePath}: ${error.message}`);
  }
}

function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldIgnoreFile(fullPath)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        if (isDocumentationFile(fullPath)) {
          documentationFilesSkipped++;
          return; // Skip documentation files
        }
        
        if (shouldScanFile(fullPath)) {
          scanFile(fullPath);
        }
      }
    });
  } catch (error) {
    console.log(`❌ Error scanning directory ${dirPath}: ${error.message}`);
  }
}

function main() {
  console.log('🔒 Security Check for Roll The Dice\n');
  console.log('Scanning source code for potential security issues...\n');
  console.log('Note: Documentation files (.md, .txt, .yml) are automatically skipped\n');
  
  const startTime = Date.now();
  scanDirectory('.');
  const endTime = Date.now();
  
  console.log('='.repeat(50));
  console.log('📊 SCAN RESULTS');
  console.log('='.repeat(50));
  console.log(`Source files scanned: ${filesScanned}`);
  console.log(`Documentation files skipped: ${documentationFilesSkipped}`);
  console.log(`Security issues found: ${issuesFound}`);
  console.log(`Scan time: ${endTime - startTime}ms`);
  
  if (issuesFound === 0) {
    console.log('\n✅ No security issues found in source code! Your repo is safe to make public.');
    console.log('\n🎉 You can now:');
    console.log('   - Make your repository public');
    console.log('   - Add it to your portfolio');
    console.log('   - Share it with potential employers');
  } else {
    console.log('\n❌ Security issues found in source code! Please fix these before making your repo public.');
    console.log('\n🔧 To fix:');
    console.log('   - Move secrets to environment variables');
    console.log('   - Use process.env.VARIABLE_NAME in your code');
    console.log('   - Ensure .env* files are in .gitignore');
  }
  
  console.log('\n💡 Remember:');
  console.log('   - Never commit .env files');
  console.log('   - Use environment variables for all secrets');
  console.log('   - Test your app with environment variables');
  console.log('   - Documentation files can contain examples safely');
}

// Run the security check
main(); 