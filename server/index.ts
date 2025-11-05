/**
 * QMS Application Server Wrapper
 * This file runs both the QMS backend and frontend within the Replit environment
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = path.resolve(__dirname, '..', 'BackEnd');
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend-new');
const BACKEND_SERVER = 'src/server.js';

console.log('🏥 Starting QMS Application...');
console.log('📁 Backend directory:', BACKEND_DIR);
console.log('📁 Frontend directory:', FRONTEND_DIR);

// Function to install frontend dependencies if needed
function installFrontendDeps() {
  return new Promise((resolve, reject) => {
    const nodeModulesPath = path.join(FRONTEND_DIR, 'node_modules');
    
    if (existsSync(nodeModulesPath)) {
      console.log('✅ Frontend dependencies already installed');
      resolve(true);
      return;
    }
    
    console.log('📦 Installing frontend dependencies...');
    const install = spawn('npm', ['install'], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: true
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Frontend dependencies installed successfully');
        resolve(true);
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
    
    install.on('error', (err) => {
      reject(err);
    });
  });
}

// Install frontend dependencies first, then start servers
installFrontendDeps()
  .then(() => {
    // Start the frontend Vite dev server
    console.log('🎨 Starting frontend on port 3000...');
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: FRONTEND_DIR,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        PORT: '3000',
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });

    frontend.on('error', (err) => {
      console.error('❌ Failed to start frontend:', err);
    });

    // Give frontend a moment to start, then start backend
    setTimeout(() => {
      console.log('🚀 Starting backend on port 5000...');
      
      // Run the QMS backend as a child process
      const backend = spawn('node', [BACKEND_SERVER], {
        cwd: BACKEND_DIR,
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          PORT: '5000',
          NODE_ENV: process.env.NODE_ENV || 'development'
        }
      });

      backend.on('error', (err) => {
        console.error('❌ Failed to start QMS backend:', err);
        process.exit(1);
      });

      backend.on('exit', (code, signal) => {
        if (code !== 0) {
          console.error(`❌ Backend exited with code ${code} and signal ${signal}`);
          frontend.kill();
          process.exit(code || 1);
        }
      });

      // Handle shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down QMS application...');
        backend.kill('SIGINT');
        frontend.kill('SIGINT');
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        backend.kill('SIGTERM');
        frontend.kill('SIGTERM');
        process.exit(0);
      });
    }, 3000);
  })
  .catch((err) => {
    console.error('❌ Failed to install frontend dependencies:', err);
    process.exit(1);
  });
