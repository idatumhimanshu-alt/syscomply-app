/**
 * QMS Application Server Wrapper
 * This file runs the QMS backend within the Replit environment
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = path.resolve(__dirname, '..', 'BackEnd');
const BACKEND_SERVER = 'src/server.js';

console.log('🏥 Starting QMS Application Backend...');
console.log('📁 Backend directory:', BACKEND_DIR);

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
    process.exit(code || 1);
  }
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down QMS backend...');
  backend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  backend.kill('SIGTERM');
  process.exit(0);
});
