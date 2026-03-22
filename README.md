# Eyes and Ears 3 - Audio & Image Capture System

Multi-media capture system that records audio in 30-second chunks and captures images every second, with a web interface for managing all media.

## Features

- **Audio Capture**: Records audio in configurable chunks using FFmpeg
- **Image Capture**: Captures images at configurable intervals using Raspberry Pi Camera or webcam
- **Automatic Retention Policy**: Automatically deletes files older than configured retention period (default: 3 hours)
- **Web UI**: Modern interface with toggle between audio and image views
- **Audio Playback**: Play audio files directly in the browser
- **File Management**: View, download, delete, and process both audio and images
- **Processing Status Tracking**: Track which files are unprocessed, processing, or processed
- **Cross-Platform**: Works on Windows (development) and Raspberry Pi (deployment)

## Prerequisites

### Windows
- Node.js (v18 or higher)
- FFmpeg installed and added to PATH
  - Download from: https://ffmpeg.org/download.html
  - Or install via Chocolatey: `choco install ffmpeg`

### Raspberry Pi (Pi OS)
- Node.js (v18 or higher)
- FFmpeg: `sudo apt-get install ffmpeg`
- ALSA audio tools: `sudo apt-get install alsa-utils`
- Raspberry Pi Camera Module 3 (or compatible camera)
- Enable camera: `sudo raspi-config` → Interface Options → Camera

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd eyesandears3
```

2. Install dependencies:
```bash
npm install
```

3. Create configuration file:
```bash
cp config.example.json config.json
```

Edit `config.json` to customize capture settings (intervals, quality, directories).

4. Build the TypeScript code:
```bash
npm run build
```

## Usage

### Starting the Web Server

Start the Express server to access the web UI:

```bash
npm start
```

Then open your browser to: http://localhost:3000

The web interface allows you to:
- Toggle between Audio and Image views
- **Audio**: Play, download, delete, and process audio files
- **Images**: View thumbnails, open full-size, download, delete, and process images
- Real-time file statistics

### Recording Audio

Start capturing audio:

```bash
npm run capture:audio
```

This will:
- Record audio in configurable chunks (default: 30 seconds)
- Save files as `audio_YYYY-MM-DDTHH-MM-SS.wav`
- Continue recording until you press Ctrl+C

### Capturing Images

Start capturing images:

```bash
npm run capture:images
```

This will:
- Capture images at configurable intervals (default: 10 seconds)
- Save files as `image_YYYY-MM-DDTHH-MM-SS.jpg`
- Continue capturing until you press Ctrl+C

**Note**: On Raspberry Pi, this uses `rpicam-still`. On Windows, it uses FFmpeg with your webcam.

### Configuration

All capture settings are configurable in `config.json`:

**Audio Settings:**
- `chunkDurationSeconds`: Duration of each audio recording (default: 30)
- `sampleRate`: Audio sample rate in Hz (default: 16000)
- `channels`: Number of audio channels (default: 1 for mono)
- `codec`: Audio codec (default: pcm_s16le)
- `retentionHours`: Hours to retain audio files before auto-deletion (default: 3)

**Image Settings:**
- `captureIntervalSeconds`: Time between image captures (default: 10)
- `width`: Image width in pixels (default: 1920)
- `height`: Image height in pixels (default: 1080)
- `quality`: JPEG quality 0-100 (default: 85)
- `retentionHours`: Hours to retain images before auto-deletion (default: 3)

**Directory Settings:**
- `recordings`: Directory for audio files (default: ./recordings)
- `images`: Directory for image files (default: ./images)

## Project Structure

```
eyesandears3/
├── src/
│   ├── audioCapture.ts    # Audio recording logic
│   ├── imageCapture.ts    # Image capture logic
│   ├── server.ts          # Express API server
│   ├── statusTracker.ts   # Processing status tracking
│   └── fileCleanup.ts     # Automatic file retention cleanup
├── public/
│   ├── index.html         # Web UI
│   ├── styles.css         # Styling
│   └── app.js             # Frontend logic
├── recordings/            # Audio files (created automatically)
├── images/                # Image files (created automatically)
├── config.json            # Configuration file (create from example)
├── config.example.json    # Example configuration
├── dist/                  # Compiled JavaScript (created on build)
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

**Audio:**
- `GET /api/audio/files` - List all audio files
- `GET /api/audio/files/:filename` - Serve/download audio file
- `DELETE /api/audio/files/:filename` - Delete audio file
- `POST /api/audio/files/:filename/process` - Process audio file (placeholder)

**Images:**
- `GET /api/images/files` - List all image files
- `GET /api/images/files/:filename` - Serve/download image file
- `DELETE /api/images/files/:filename` - Delete image file
- `POST /api/images/files/:filename/process` - Process image (placeholder)

## Windows Testing

On Windows, FFmpeg uses DirectShow for audio capture. Make sure your microphone is set as the default recording device.

To test audio capture:
1. Run `npm run build`
2. Run `npm run capture:audio`
3. Speak into your microphone
4. Check the `recordings/` folder for WAV files

To test image capture:
1. Run `npm run build`
2. Run `npm run capture:images`
3. Check the `images/` folder for JPEG files

## Raspberry Pi Deployment

1. Transfer the project to your Raspberry Pi
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run the server: `npm start`
5. In separate terminals:
   - Audio capture: `npm run capture:audio`
   - Image capture: `npm run capture:images`

For automatic startup on boot, consider creating systemd services for each component.

## Troubleshooting

### Windows: "Cannot find microphone"
- Check that your microphone is connected and set as default
- Run `ffmpeg -list_devices true -f dshow -i dummy` to list available devices
- Update the device name in `audioCapture.ts` if needed

### Raspberry Pi: "Cannot open audio device"
- Check ALSA configuration: `arecord -l`
- Test recording: `arecord -d 5 test.wav`
- Ensure your user has audio permissions: `sudo usermod -a -G audio $USER`

### Raspberry Pi: "Camera not detected"
- Ensure camera is properly connected
- Enable camera: `sudo raspi-config` → Interface Options → Camera
- Test camera: `rpicam-still -o test.jpg`
- Check camera status: `vcgencmd get_camera`

### TypeScript Errors
The lint errors shown in the IDE are expected before running `npm install`. They will resolve once dependencies are installed.

## Future Enhancements

- Implement actual audio/image processing logic
- Add authentication
- Support for different media formats
- Real-time audio visualization
- Automatic transcription for audio
- Object detection for images
- Cloud storage integration
- Synchronized audio-image capture

## License

ISC
