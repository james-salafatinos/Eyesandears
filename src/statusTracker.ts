import * as fs from 'fs';
import * as path from 'path';

const STATUS_FILE = path.join(__dirname, '..', 'processing-status.json');

export interface FileStatus {
  filename: string;
  type: 'audio' | 'image';
  status: 'unprocessed' | 'processing' | 'processed' | 'failed';
  createdAt: string;
  processedAt?: string;
  error?: string;
}

interface StatusData {
  files: { [key: string]: FileStatus };
}

function loadStatus(): StatusData {
  if (!fs.existsSync(STATUS_FILE)) {
    return { files: {} };
  }
  
  try {
    const data = fs.readFileSync(STATUS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading status file:', error);
    return { files: {} };
  }
}

function saveStatus(data: StatusData): void {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving status file:', error);
  }
}

export function getFileKey(type: 'audio' | 'image', filename: string): string {
  return `${type}:${filename}`;
}

export function registerFile(type: 'audio' | 'image', filename: string): void {
  const data = loadStatus();
  const key = getFileKey(type, filename);
  
  if (!data.files[key]) {
    data.files[key] = {
      filename,
      type,
      status: 'unprocessed',
      createdAt: new Date().toISOString()
    };
    saveStatus(data);
  }
}

export function getFileStatus(type: 'audio' | 'image', filename: string): FileStatus | null {
  const data = loadStatus();
  const key = getFileKey(type, filename);
  return data.files[key] || null;
}

export function updateFileStatus(
  type: 'audio' | 'image',
  filename: string,
  status: FileStatus['status'],
  error?: string
): void {
  const data = loadStatus();
  const key = getFileKey(type, filename);
  
  if (data.files[key]) {
    data.files[key].status = status;
    if (status === 'processed' || status === 'failed') {
      data.files[key].processedAt = new Date().toISOString();
    }
    if (error) {
      data.files[key].error = error;
    }
    saveStatus(data);
  }
}

export function deleteFileStatus(type: 'audio' | 'image', filename: string): void {
  const data = loadStatus();
  const key = getFileKey(type, filename);
  delete data.files[key];
  saveStatus(data);
}

export function getUnprocessedFiles(): FileStatus[] {
  const data = loadStatus();
  return Object.values(data.files).filter(f => f.status === 'unprocessed');
}

export function getAllStatuses(): FileStatus[] {
  const data = loadStatus();
  return Object.values(data.files);
}

export function cleanupOldStatuses(maxAgeHours: number = 24): void {
  const data = loadStatus();
  const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
  
  Object.keys(data.files).forEach(key => {
    const file = data.files[key];
    const fileTime = new Date(file.processedAt || file.createdAt).getTime();
    
    if (file.status === 'processed' && fileTime < cutoffTime) {
      delete data.files[key];
    }
  });
  
  saveStatus(data);
}
