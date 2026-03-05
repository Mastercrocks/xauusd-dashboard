#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if all required dependencies and configuration are in place
 */

import fs from 'fs';
import path from 'path';

const checks = {
  passed: [],
  failed: [],
};

console.log('\n🔍 XAUUSD Dashboard Setup Verification\n');
console.log('=' .repeat(50));

// Check 1: Node.js version
console.log('\n✓ Checking Node.js version...');
const nodeVersion = process.version;
if (parseFloat(nodeVersion.split('.')[0].slice(1)) >= 16) {
  console.log(`  ✅ Node.js ${nodeVersion} (OK)`);
  checks.passed.push('Node.js version');
} else {
  console.log(`  ❌ Node.js ${nodeVersion} (Need v16+)`);
  checks.failed.push('Node.js version');
}

// Check 2: package.json exists
console.log('\n✓ Checking package.json...');
if (fs.existsSync('./package.json')) {
  console.log('  ✅ package.json found');
  checks.passed.push('package.json');
} else {
  console.log('  ❌ package.json not found');
  checks.failed.push('package.json');
}

// Check 3: node_modules exists
console.log('\n✓ Checking dependencies...');
if (fs.existsSync('./node_modules')) {
  console.log('  ✅ node_modules installed');
  checks.passed.push('Dependencies');
} else {
  console.log('  ❌ node_modules not found. Run: npm install');
  checks.failed.push('Dependencies');
}

// Check 4: .env file
console.log('\n✓ Checking environment variables...');
if (fs.existsSync('./.env')) {
  const envContent = fs.readFileSync('./.env', 'utf-8');
  if (envContent.includes('VITE_OPENAI_API_KEY')) {
    console.log('  ✅ .env file exists with API key');
    checks.passed.push('Environment variables');
  } else {
    console.log('  ⚠️  .env exists but missing VITE_OPENAI_API_KEY');
    checks.failed.push('OpenAI API Key');
  }
} else {
  console.log('  ⚠️  .env file not found');
  console.log('     Create it: copy .env.example .env');
  console.log('     Then add: VITE_OPENAI_API_KEY=your_key_here');
  checks.failed.push('Environment variables');
}

// Check 5: Source files
console.log('\n✓ Checking source files...');
const requiredFiles = [
  './src/App.tsx',
  './src/main.tsx',
  './src/components/Dashboard.tsx',
  './src/services/aiAnalysisService.ts',
  './src/types/index.ts',
  './vite.config.ts',
  './tsconfig.json',
];

let allFilesExist = true;
requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} missing`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  checks.passed.push('Source files');
} else {
  checks.failed.push('Source files');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Verification Summary:\n');
console.log(`  ✅ Passed: ${checks.passed.length}`);
checks.passed.forEach((check) => {
  console.log(`     • ${check}`);
});

if (checks.failed.length > 0) {
  console.log(`\n  ❌ Failed: ${checks.failed.length}`);
  checks.failed.forEach((check) => {
    console.log(`     • ${check}`);
  });
}

// Final status
console.log('\n' + '='.repeat(50));
if (checks.failed.length === 0) {
  console.log('\n✅ All checks passed! Ready to start development.\n');
  console.log('Run: npm run dev\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above.\n');
  console.log('Common fixes:');
  console.log('  1. npm install                    (install dependencies)');
  console.log('  2. copy .env.example .env         (create env file)');
  console.log('  3. Add your OpenAI API key to .env\n');
  process.exit(1);
}
