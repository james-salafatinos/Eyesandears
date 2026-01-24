import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ensureRecordingDir, RECORDING_DIR } from './audioCapture';
import { ensureImagesDir, IMAGES_DIR } from './imageCapture';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

ensureRecordingDir();
ensureImagesDir();

app.get('/api/audio/files', (req: Request, res: Response) => {
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
    console.error('Error reading audio files:', error);
    res.status(500).json({ error: 'Failed to read audio files' });
  }
});

app.get('/api/images/files', (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(IMAGES_DIR)
      .filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'))
      .map(file => {
        const filepath = path.join(IMAGES_DIR, file);
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
    console.error('Error reading image files:', error);
    res.status(500).json({ error: 'Failed to read image files' });
  }
});

app.get('/api/audio/files/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(RECORDING_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filepath);
  } catch (error) {
    console.error('Error serving audio file:', error);
    res.status(500).json({ error: 'Failed to serve audio file' });
  }
});

app.get('/api/images/files/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(IMAGES_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filepath);
  } catch (error) {
    console.error('Error serving image file:', error);
    res.status(500).json({ error: 'Failed to serve image file' });
  }
});

app.delete('/api/audio/files/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(RECORDING_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filepath);
    res.json({ success: true, message: 'Audio file deleted' });
  } catch (error) {
    console.error('Error deleting audio file:', error);
    res.status(500).json({ error: 'Failed to delete audio file' });
  }
});

app.delete('/api/images/files/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(IMAGES_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filepath);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

app.post('/api/audio/files/:filename/process', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(RECORDING_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log(`Processing audio file: ${filename}`);
    
    res.json({ 
      success: true, 
      message: 'Audio file queued for processing',
      filename: filename
    });
  } catch (error) {
    console.error('Error processing audio file:', error);
    res.status(500).json({ error: 'Failed to process audio file' });
  }
});

app.post('/api/images/files/:filename/process', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(IMAGES_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log(`Processing image: ${filename}`);
    
    res.json({ 
      success: true, 
      message: 'Image queued for processing',
      filename: filename
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Audio recordings: ${RECORDING_DIR}`);
  console.log(`Images: ${IMAGES_DIR}`);
});
