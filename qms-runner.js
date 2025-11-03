#!/usr/bin/env node

/**
 * QMS Application Runner
 * This script installs dependencies and runs both backend and frontend services
 */

import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = path.join(__dirname, 'BackEnd');
const FRONTEND_DIR = path.join(__dirname, 'frontend-new');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDependencies(dir) {
  const nodeModules = path.join(dir, 'node_modules');
  return existsSync(nodeModules);
}

function installDependencies(dir, name) {
  return new Promise((resolve, reject) => {
    log(`\n📦 Installing ${name} dependencies...`, 'blue');
    
    const npm = spawn('npm', ['install'], {
      cwd: dir,
      stdio: 'inherit',
      shell: true
    });

    npm.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${name} dependencies installed successfully`, 'green');
        resolve();
      } else {
        log(`❌ Failed to install ${name} dependencies`, 'red');
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
  });
}

async function runService(dir, command, name, color) {
  log(`\n🚀 Starting ${name}...`, color);
  
  const [cmd, ...args] = command.split(' ');
  const proc = spawn(cmd, args, {
    cwd: dir,
    stdio: 'inherit',
    shell: true
  });

  proc.on('error', (err) => {
    log(`❌ Error starting ${name}: ${err.message}`, 'red');
  });

  return proc;
}

async function main() {
  try {
    log('\n' + '='.repeat(60), 'cyan');
    log('🏥 QMS Application - Quality Management System', 'cyan');
    log('='.repeat(60) + '\n', 'cyan');

    // Check and install backend dependencies
    if (!checkDependencies(BACKEND_DIR)) {
      await installDependencies(BACKEND_DIR, 'Backend');
    } else {
      log('✓ Backend dependencies already installed', 'green');
    }

    // Check and install frontend dependencies
    if (!checkDependencies(FRONTEND_DIR)) {
      await installDependencies(FRONTEND_DIR, 'Frontend');
    } else {
      log('✓ Frontend dependencies already installed', 'green');
    }

    log('\n' + '='.repeat(60), 'cyan');
    log('Starting services...', 'cyan');
    log('='.repeat(60) + '\n', 'cyan');

    // Start backend
    const backend = await runService(BACKEND_DIR, 'npm run dev', 'Backend Server', 'blue');

    // Wait a bit for backend to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Start frontend
    const frontend = await runService(FRONTEND_DIR, 'npm run dev', 'Frontend', 'green');

    // Display info
    setTimeout(() => {
      log('\n' + '='.repeat(60), 'cyan');
      log('✅ QMS Application is running!', 'green');
      log('='.repeat(60), 'cyan');
      log('\n📍 Backend API:  http://localhost:5000', 'blue');
      log('📍 Frontend UI:  http://localhost:3000', 'green');
      log('\n📧 Default Login Credentials:', 'yellow');
      log('   Email:    admin@idatum.com', 'yellow');
      log('   Password: Admin@123', 'yellow');
      log('\n' + '='.repeat(60) + '\n', 'cyan');
    }, 5000);

    // Handle shutdown
    process.on('SIGINT', () => {
      log('\n\n🛑 Shutting down services...', 'yellow');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
