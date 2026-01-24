let files = [];

async function loadFiles() {
    try {
        const response = await fetch('/api/files');
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
        fileList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <div class="empty-state-text">No audio files yet</div>
                <div class="empty-state-subtext">Upload a file or start recording to get started</div>
            </div>
        `;
        return;
    }
    
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
}

function updateStats() {
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    document.getElementById('totalFiles').textContent = totalFiles;
    document.getElementById('totalSize').textContent = formatSize(totalSize);
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

async function downloadFile(filename) {
    try {
        window.location.href = `/api/files/${filename}`;
    } catch (error) {
        console.error('Error downloading file:', error);
        showError('Failed to download file');
    }
}

async function deleteFile(filename) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/files/${filename}`, {
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

async function processFile(filename) {
    try {
        const response = await fetch(`/api/files/${filename}/process`, {
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

async function uploadFile(file) {
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'audio/wav',
                'X-Filename': file.name
            },
            body: file
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('File uploaded successfully');
            loadFiles();
        } else {
            showError(data.error || 'Failed to upload file');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        showError('Failed to upload file');
    }
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

document.getElementById('refreshBtn').addEventListener('click', loadFiles);

document.getElementById('fileUpload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (!file.name.endsWith('.wav')) {
            showError('Please upload a WAV file');
            return;
        }
        uploadFile(file);
        e.target.value = '';
    }
});

loadFiles();
