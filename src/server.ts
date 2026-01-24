import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ensureRecordingDir, RECORDING_DIR } from './audioCapture';
import { ensureImagesDir, IMAGES_DIR } from './imageCapture';
import * as statusTracker from './statusTracker';

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
        statusTracker.registerFile('audio', file);
        const status = statusTracker.getFileStatus('audio', file);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          status: status?.status || 'unprocessed'
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
        statusTracker.registerFile('image', file);
        const status = statusTracker.getFileStatus('image', file);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          status: status?.status || 'unprocessed'
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
    statusTracker.deleteFileStatus('audio', filename);
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
    statusTracker.deleteFileStatus('image', filename);
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

app.get('/api/unprocessed', (req: Request, res: Response) => {
  try {
    const unprocessed = statusTracker.getUnprocessedFiles();
    const filesWithPaths = unprocessed.map(file => ({
      ...file,
      downloadUrl: file.type === 'audio' 
        ? `/api/audio/files/${file.filename}`
        : `/api/images/files/${file.filename}`
    }));
    
    res.json({ files: filesWithPaths });
  } catch (error) {
    console.error('Error getting unprocessed files:', error);
    res.status(500).json({ error: 'Failed to get unprocessed files' });
  }
});

app.post('/api/files/:type/:filename/mark-processed', (req: Request, res: Response) => {
  try {
    const { type, filename } = req.params;
    
    if (type !== 'audio' && type !== 'image') {
      return res.status(400).json({ error: 'Invalid type. Must be audio or image' });
    }
    
    statusTracker.updateFileStatus(type as 'audio' | 'image', filename, 'processed');
    console.log(`Marked ${type} file as processed: ${filename}`);
    
    res.json({ success: true, message: 'File marked as processed' });
  } catch (error) {
    console.error('Error marking file as processed:', error);
    res.status(500).json({ error: 'Failed to mark file as processed' });
  }
});

app.delete('/api/files/:type/:filename/cleanup', (req: Request, res: Response) => {
  try {
    const { type, filename } = req.params;
    
    if (type !== 'audio' && type !== 'image') {
      return res.status(400).json({ error: 'Invalid type. Must be audio or image' });
    }
    
    const filepath = type === 'audio' 
      ? path.join(RECORDING_DIR, filename)
      : path.join(IMAGES_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filepath);
    statusTracker.deleteFileStatus(type as 'audio' | 'image', filename);
    console.log(`Cleaned up ${type} file: ${filename}`);
    
    res.json({ success: true, message: 'File cleaned up successfully' });
  } catch (error) {
    console.error('Error cleaning up file:', error);
    res.status(500).json({ error: 'Failed to clean up file' });
  }
});

app.get('/api/status', (req: Request, res: Response) => {
  try {
    const allStatuses = statusTracker.getAllStatuses();
    const summary = {
      total: allStatuses.length,
      unprocessed: allStatuses.filter(f => f.status === 'unprocessed').length,
      processing: allStatuses.filter(f => f.status === 'processing').length,
      processed: allStatuses.filter(f => f.status === 'processed').length,
      failed: allStatuses.filter(f => f.status === 'failed').length
    };
    
    res.json({ summary, files: allStatuses });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Audio recordings: ${RECORDING_DIR}`);
  console.log(`Images: ${IMAGES_DIR}`);
});
