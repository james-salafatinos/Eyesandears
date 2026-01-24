import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const RECORDING_DIR = path.join(__dirname, '..', 'recordings');
const CHUNK_DURATION_SECONDS = 30;

function ensureRecordingDir(): void {
  if (!fs.existsSync(RECORDING_DIR)) {
    fs.mkdirSync(RECORDING_DIR, { recursive: true });
    console.log(`Created recordings directory: ${RECORDING_DIR}`);
  }
}

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
}

function recordAudioChunk(): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `audio_${getTimestamp()}.wav`;
    const filepath = path.join(RECORDING_DIR, filename);
    
    console.log(`Starting recording: ${filename}`);
    
    let ffmpegArgs: string[];
    
    if (process.platform === 'win32') {
      ffmpegArgs = [
        '-f', 'dshow',
        '-i', 'audio=Microphone',
        '-t', CHUNK_DURATION_SECONDS.toString(),
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        filepath
      ];
    } else {
      ffmpegArgs = [
        '-f', 'alsa',
        '-i', 'default',
        '-t', CHUNK_DURATION_SECONDS.toString(),
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        filepath
      ];
    }
    
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    
    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg: ${data}`);
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log(`Recording saved: ${filename}`);
        resolve(filepath);
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
    
    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to start FFmpeg: ${err.message}`));
    });
  });
}

async function continuousCapture(): Promise<void> {
  console.log('Starting continuous audio capture...');
  console.log(`Recording ${CHUNK_DURATION_SECONDS}-second chunks`);
  console.log(`Saving to: ${RECORDING_DIR}`);
  console.log('Press Ctrl+C to stop\n');
  
  ensureRecordingDir();
  
  while (true) {
    try {
      await recordAudioChunk();
      console.log('Waiting 1 second before next recording...\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Recording error:', error);
      console.log('Retrying in 5 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

if (require.main === module) {
  continuousCapture().catch(console.error);
}

export { recordAudioChunk, ensureRecordingDir, RECORDING_DIR };
