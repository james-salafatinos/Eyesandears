import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const IMAGES_DIR = path.join(__dirname, '..', 'images');
const CAPTURE_INTERVAL_SECONDS = 1;

function ensureImagesDir(): void {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log(`Created images directory: ${IMAGES_DIR}`);
  }
}

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
}

function captureImage(): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `image_${getTimestamp()}.jpg`;
    const filepath = path.join(IMAGES_DIR, filename);
    
    console.log(`Capturing image: ${filename}`);
    
    let captureArgs: string[];
    
    if (process.platform === 'linux') {
      captureArgs = [
        '-o', filepath,
        '-t', '1',
        '--nopreview',
        '--width', '1920',
        '--height', '1080',
        '--quality', '85'
      ];
      
      const raspistill = spawn('raspistill', captureArgs);
      
      raspistill.stderr.on('data', (data) => {
        console.log(`raspistill: ${data}`);
      });
      
      raspistill.on('close', (code) => {
        if (code === 0) {
          console.log(`Image saved: ${filename}`);
          resolve(filepath);
        } else {
          reject(new Error(`raspistill exited with code ${code}`));
        }
      });
      
      raspistill.on('error', (err) => {
        reject(new Error(`Failed to start raspistill: ${err.message}`));
      });
    } else {
      captureArgs = [
        '-f', 'dshow',
        '-i', 'video=Integrated Camera',
        '-frames:v', '1',
        '-q:v', '2',
        filepath
      ];
      
      const ffmpeg = spawn('ffmpeg', captureArgs);
      
      ffmpeg.stderr.on('data', (data) => {
        console.log(`ffmpeg: ${data}`);
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`Image saved: ${filename}`);
          resolve(filepath);
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });
      
      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to start ffmpeg: ${err.message}`));
      });
    }
  });
}

async function continuousCapture(): Promise<void> {
  console.log('Starting continuous image capture...');
  console.log(`Capturing images every ${CAPTURE_INTERVAL_SECONDS} second(s)`);
  console.log(`Saving to: ${IMAGES_DIR}`);
  console.log('Press Ctrl+C to stop\n');
  
  ensureImagesDir();
  
  while (true) {
    try {
      await captureImage();
      await new Promise(resolve => setTimeout(resolve, CAPTURE_INTERVAL_SECONDS * 1000));
    } catch (error) {
      console.error('Capture error:', error);
      console.log('Retrying in 5 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

if (require.main === module) {
  continuousCapture().catch(console.error);
}

export { captureImage, ensureImagesDir, IMAGES_DIR };
