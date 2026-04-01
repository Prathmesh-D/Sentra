# MinorUI Crypto - Desktop App

A hybrid crypto file encryption desktop application built with React, TypeScript, and Electron.

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development Mode
```bash
# Start both React dev server and Electron
npm run electron-dev
```

### Production Build
```bash
# Build for current platform
npm run build-electron

# Build for specific platforms
npm run build-electron-win    # Windows
npm run build-electron-mac    # macOS
npm run build-electron-linux  # Linux
```

### Manual Testing
```bash
# Build React app
npm run build

# Start Electron app
npm run electron
```

## Project Structure

```
├── electron/
│   ├── main.js          # Main Electron process
│   └── preload.js       # Preload script for secure IPC
├── src/                 # React application
├── build/               # Build assets and icons
├── dist/                # Built React app
└── dist-electron/       # Built Electron app
```

## Features

- **File Encryption**: Secure file encryption with hybrid cryptography
- **User Management**: Profile management and settings
- **Desktop Integration**: Native file dialogs and system integration
- **Cross-Platform**: Windows, macOS, and Linux support

## Security

- Context isolation enabled
- No node integration in renderer
- Secure IPC communication
- External link protection

## Building for Distribution

The app uses electron-builder for creating distributable packages:

- **Windows**: NSIS installer (.exe)
- **macOS**: DMG package (.dmg)
- **Linux**: AppImage (.AppImage)

## Development Notes

- Hot reload works for both React and Electron
- DevTools open automatically in development
- File dialogs use native OS dialogs
- App data persists between sessions