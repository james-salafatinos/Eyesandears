import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ensureRecordingDir, RECORDING_DIR } from './audioCapture';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

ensureRecordingDir();

app.get('/api/files', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(RECORDING_DIR)
      .filter(file => file.endsWith('.wav'))
      .map(file => {
        const filepath = path.join(RECORDING_DIR, file);
        const stats = fs.statSync(filepath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    
    res.json({ files });
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Failed to read files' });
  }
});

app.get('/api/files/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(RECORDING_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filepath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

app.delete('/api/files/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(RECORDING_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filepath);
    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.post('/api/files/:filename/process', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(RECORDING_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log(`Processing file: ${filename}`);
    
    res.json({ 
      success: true, 
      message: 'File queued for processing',
      filename: filename
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

app.post('/api/upload', express.raw({ type: 'audio/wav', limit: '50mb' }), (req: Request, res: Response) => {
  try {
    const filename = req.headers['x-filename'] as string || `upload_${Date.now()}.wav`;
    const filepath = path.join(RECORDING_DIR, filename);
    
    fs.writeFileSync(filepath, req.body);
    
    res.json({ 
      success: true, 
      message: 'File uploaded successfully',
      filename: filename
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Recordings directory: ${RECORDING_DIR}`);
});
