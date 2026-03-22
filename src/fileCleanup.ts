import * as fs from 'fs';
import * as path from 'path';
import * as statusTracker from './statusTracker';

export interface CleanupResult {
  deletedCount: number;
  deletedFiles: string[];
  retainedCount: number;
}

export function cleanupOldFiles(
  directory: string,
  retentionHours: number,
  fileType: 'audio' | 'image'
): CleanupResult {
  const result: CleanupResult = {
    deletedCount: 0,
    deletedFiles: [],
    retainedCount: 0
  };

  if (!fs.existsSync(directory)) {
    return result;
  }

  const now = Date.now();
  const retentionMs = retentionHours * 60 * 60 * 1000;
  const cutoffTime = now - retentionMs;

  try {
    const files = fs.readdirSync(directory);
    const extension = fileType === 'audio' ? '.wav' : '.jpg';
    const mediaFiles = files.filter(f => f.endsWith(extension));

    // Sort by modification time (oldest first)
    const filesWithStats = mediaFiles.map(filename => {
      const filepath = path.join(directory, filename);
      const stats = fs.statSync(filepath);
      return {
        filename,
        filepath,
        mtime: stats.mtime.getTime()
      };
    }).sort((a, b) => a.mtime - b.mtime);

    // Delete files older than retention period
    for (const file of filesWithStats) {
      if (file.mtime < cutoffTime) {
        try {
          fs.unlinkSync(file.filepath);
          statusTracker.deleteFileStatus(fileType, file.filename);
          result.deletedCount++;
          result.deletedFiles.push(file.filename);
          console.log(`[CLEANUP] Deleted old ${fileType}: ${file.filename}`);
        } catch (error) {
          console.error(`[CLEANUP] Failed to delete ${file.filename}:`, error);
        }
      } else {
        result.retainedCount++;
      }
    }

    if (result.deletedCount > 0) {
      console.log(`[CLEANUP] ${fileType}: Deleted ${result.deletedCount} old files, retained ${result.retainedCount}`);
    }
  } catch (error) {
    console.error(`[CLEANUP] Error during cleanup of ${directory}:`, error);
  }

  return result;
}
