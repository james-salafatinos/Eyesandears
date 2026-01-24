# Eyes and Ears 3 - Audio Capture & Management System

Audio capture system that records 30-second audio chunks and provides a web interface for managing recordings.

## Features

- **Audio Capture**: Records audio in 30-second chunks using FFmpeg
- **Web UI**: Modern interface to view, download, delete, and process audio files
- **File Management**: Upload, download, and delete audio recordings
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

## Installation

1. Clone the repository and navigate to the project directory

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
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
- View all recorded audio files
- Download recordings
- Delete recordings
- Upload audio files
- Process files (placeholder for future processing logic)

### Recording Audio

To start continuous audio recording (30-second chunks):

```bash
npm run capture
```

This will:
- Create a `recordings/` directory if it doesn't exist
- Record 30-second audio chunks continuously
- Save files as `audio_YYYY-MM-DDTHH-MM-SS.wav`
- Continue recording until you press Ctrl+C

### Audio Format

Recordings are saved as WAV files with the following specifications:
- Sample Rate: 16000 Hz
- Channels: 1 (mono)
- Encoding: PCM 16-bit

## Project Structure

```
eyesandears3/
├── src/
│   ├── audioCapture.ts    # Audio recording logic
│   └── server.ts          # Express API server
├── public/
│   ├── index.html         # Web UI
│   ├── styles.css         # Styling
│   └── app.js             # Frontend logic
├── recordings/            # Audio files (created automatically)
├── dist/                  # Compiled JavaScript (created on build)
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

- `GET /api/files` - List all audio files
- `GET /api/files/:filename` - Download a specific file
- `DELETE /api/files/:filename` - Delete a specific file
- `POST /api/files/:filename/process` - Process a file (placeholder)
- `POST /api/upload` - Upload an audio file

## Windows Testing

On Windows, FFmpeg uses DirectShow for audio capture. Make sure your microphone is set as the default recording device.

To test audio capture:
1. Run `npm run build`
2. Run `npm run capture`
3. Speak into your microphone
4. Check the `recordings/` folder for WAV files

## Raspberry Pi Deployment

1. Transfer the project to your Raspberry Pi
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run the server: `npm start`
5. Run audio capture: `npm run capture`

For automatic startup on boot, consider creating a systemd service.

## Troubleshooting

### Windows: "Cannot find microphone"
- Check that your microphone is connected and set as default
- Run `ffmpeg -list_devices true -f dshow -i dummy` to list available devices
- Update the device name in `audioCapture.ts` if needed

### Raspberry Pi: "Cannot open audio device"
- Check ALSA configuration: `arecord -l`
- Test recording: `arecord -d 5 test.wav`
- Ensure your user has audio permissions: `sudo usermod -a -G audio $USER`

### TypeScript Errors
The lint errors shown in the IDE are expected before running `npm install`. They will resolve once dependencies are installed.

## Future Enhancements

- Implement actual audio processing logic
- Add authentication
- Support for different audio formats
- Real-time audio visualization
- Automatic transcription
- Cloud storage integration

## License

ISC
