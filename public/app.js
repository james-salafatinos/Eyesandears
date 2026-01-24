let files = [];
let currentView = 'audio';

async function loadFiles() {
    try {
        const endpoint = currentView === 'audio' ? '/api/audio/files' : '/api/images/files';
        const response = await fetch(endpoint);
        const data = await response.json();
        files = data.files;
        renderFiles();
        updateStats();
    } catch (error) {
        console.error('Error loading files:', error);
        showError('Failed to load files');
    }
}

function renderFiles() {
    const fileList = document.getElementById('fileList');
    
    if (files.length === 0) {
        const mediaType = currentView === 'audio' ? 'audio files' : 'images';
        fileList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <div class="empty-state-text">No ${mediaType} yet</div>
                <div class="empty-state-subtext">Start capturing to see files here</div>
            </div>
        `;
        return;
    }
    
    if (currentView === 'audio') {
        fileList.innerHTML = files.map(file => `
            <div class="file-item" data-filename="${file.name}">
                <div class="file-info">
                    <div class="file-name">🎵 ${file.name}</div>
                    <div class="file-meta">
                        <span>📊 ${formatSize(file.size)}</span>
                        <span>📅 ${formatDate(file.modified)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-play" onclick="playAudio('${file.name}')">
                        <span>▶️</span> Play
                    </button>
                    <button class="btn btn-download" onclick="downloadFile('${file.name}')">
                        <span>⬇️</span> Download
                    </button>
                    <button class="btn btn-process" onclick="processFile('${file.name}')">
                        <span>⚙️</span> Process
                    </button>
                    <button class="btn btn-danger" onclick="deleteFile('${file.name}')">
                        <span>🗑️</span> Delete
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        fileList.innerHTML = files.map(file => `
            <div class="file-item" data-filename="${file.name}">
                <div class="file-info">
                    <div class="file-name">📷 ${file.name}</div>
                    <div class="file-meta">
                        <span>📊 ${formatSize(file.size)}</span>
                        <span>📅 ${formatDate(file.modified)}</span>
                    </div>
                </div>
                <div class="file-preview">
                    <img src="/api/images/files/${file.name}" alt="${file.name}" class="thumbnail" onclick="viewImage('${file.name}')">
                </div>
                <div class="file-actions">
                    <button class="btn btn-view" onclick="viewImage('${file.name}')">
                        <span>👁️</span> View
                    </button>
                    <button class="btn btn-download" onclick="downloadImage('${file.name}')">
                        <span>⬇️</span> Download
                    </button>
                    <button class="btn btn-process" onclick="processImage('${file.name}')">
                        <span>⚙️</span> Process
                    </button>
                    <button class="btn btn-danger" onclick="deleteImage('${file.name}')">
                        <span>🗑️</span> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
}

function updateStats() {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    document.getElementById('totalFiles').textContent = totalFiles;
    document.getElementById('totalSize').textContent = formatSize(totalSize);
    document.getElementById('totalFilesLabel').textContent = currentView === 'audio' ? 'Total Audio' : 'Total Images';
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function playAudio(filename) {
    const audio = new Audio(`/api/audio/files/${filename}`);
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
        showError('Failed to play audio');
    });
}

async function downloadFile(filename) {
    try {
        window.location.href = `/api/audio/files/${filename}`;
    } catch (error) {
        console.error('Error downloading file:', error);
        showError('Failed to download file');
    }
}

async function downloadImage(filename) {
    try {
        window.location.href = `/api/images/files/${filename}`;
    } catch (error) {
        console.error('Error downloading image:', error);
        showError('Failed to download image');
    }
}

function viewImage(filename) {
    window.open(`/api/images/files/${filename}`, '_blank');
}

async function deleteFile(filename) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/audio/files/${filename}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('File deleted successfully');
            loadFiles();
        } else {
            showError('Failed to delete file');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showError('Failed to delete file');
    }
}

async function deleteImage(filename) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/images/files/${filename}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('Image deleted successfully');
            loadFiles();
        } else {
            showError('Failed to delete image');
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        showError('Failed to delete image');
    }
}

async function processFile(filename) {
    try {
        const response = await fetch(`/api/audio/files/${filename}/process`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess(`File "${filename}" queued for processing`);
        } else {
            showError(data.error || 'Failed to process file');
        }
    } catch (error) {
        console.error('Error processing file:', error);
        showError('Failed to process file');
    }
}

async function processImage(filename) {
    try {
        const response = await fetch(`/api/images/files/${filename}/process`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess(`Image "${filename}" queued for processing`);
        } else {
            showError(data.error || 'Failed to process image');
        }
    } catch (error) {
        console.error('Error processing image:', error);
        showError('Failed to process image');
    }
}

function switchView(view) {
    currentView = view;
    document.getElementById('audioViewBtn').classList.toggle('active', view === 'audio');
    document.getElementById('imageViewBtn').classList.toggle('active', view === 'images');
    loadFiles();
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

document.getElementById('refreshBtn').addEventListener('click', loadFiles);
document.getElementById('audioViewBtn').addEventListener('click', () => switchView('audio'));
document.getElementById('imageViewBtn').addEventListener('click', () => switchView('images'));

loadFiles();
