# CodewordApp Project Documentation

## Overview

**CodewordApp** is a React Native mobile application built with Expo that appears to be designed for playing codeword games. The app is currently in early development stages and is built using the Ignite boilerplate from Infinite Red.

## Project Details

- **Name**: CodewordApp
- **Version**: 1.0.0
- **Bundle ID**: `com.codewordapp`
- **Platform**: Cross-platform (iOS, Android, Web)
- **Framework**: React Native with Expo
- **Architecture**: New Architecture enabled with Hermes JavaScript engine

## Technology Stack

### Core Technologies

- **React Native**: 0.79.5
- **Expo**: ^53.0.15
- **TypeScript**: ~5.8.3
- **React**: 19.0.0
- **Expo Router**: ~5.1.2 (for navigation)

### Key Dependencies

- **Better Auth**: ^1.2.12 (Authentication system)
- **React Navigation**: ^7.0.14 (Navigation)
- **FlashList**: 1.8.1 (High-performance list component)
- **MMKV**: ^3.2.0 (Fast key-value storage)
- **Reanimated**: ~3.17.4 (Animations)
- **i18next**: ^23.14.0 (Internationalization)

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Maestro**: End-to-end testing
- **Reactotron**: Development debugging

## Project Structure

```
CodewordApp/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout with tab navigation
│   ├── home.tsx           # Home screen route
│   ├── games.tsx          # Games screen route
│   ├── profile.tsx        # Profile screen route
│   └── index.tsx          # Index route
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/           # Screen components
│   ├── services/          # API and external services
│   ├── theme/             # Design system and theming
│   ├── i18n/              # Internationalization
│   ├── utils/             # Utility functions
│   └── config/            # Configuration files
├── assets/                # Static assets (icons, images)
├── test/                  # Test files
└── llm-helpers/           # Documentation and helpers
```

## Features

### Current Implementation

1. **Tab Navigation**: Home, Games, and Profile tabs
2. **Authentication**: Better Auth integration (configured but not fully implemented)
3. **Internationalization**: Multi-language support with i18next
4. **Theme System**: Dark/light theme support
5. **Responsive Design**: Cross-platform UI components

### Planned Features (Based on UI)

1. **Game Management**: Join games via game codes
2. **User Profiles**: User account management
3. **Multiplayer**: Real-time game functionality (implied by game codes)

## Screens

### Home Screen (`src/screens/HomeScreen.tsx`)

- Welcome interface with test UI elements
- "Join a Game" button that navigates to games screen
- Currently displays test content (red box, blue text)

### Games Screen (`src/screens/GamesScreen.tsx`)

- Shows user's current games
- "Enter Game Code" button (functionality not implemented)
- Placeholder for game management features

### Profile Screen

- User profile management (not yet implemented)

## Authentication

The app uses **Better Auth** for authentication with the following features:

- Email and password authentication
- Social provider support (Google, GitHub, Apple, etc.)
- Session management
- Password reset functionality
- Two-factor authentication support
- API key authentication

### Current Status

- Better Auth is configured but not fully implemented
- Authentication utilities are set up in `src/utils/auth.ts`
- No actual authentication flow is currently active

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

```bash
yarn install
```

### Running the App

```bash
# Start development server
yarn start

# Run on iOS
yarn ios

# Run on Android
yarn android

# Run on Web
yarn web
```

### Building

```bash
# iOS builds
yarn build:ios:sim    # iOS Simulator
yarn build:ios:dev    # iOS Device (Development)
yarn build:ios:prod   # iOS Device (Production)

# Android builds
yarn build:android:sim    # Android Emulator
yarn build:android:dev    # Android Device (Development)
yarn build:android:prod   # Android Device (Production)
```

## Testing

### Unit Tests

```bash
yarn test
yarn test:watch
```

### End-to-End Tests

```bash
yarn test:maestro
```

## Configuration

### App Configuration (`app.json`)

- **Name**: CodewordApp
- **Bundle ID**: com.codewordapp
- **Version**: 1.0.0
- **Orientation**: Portrait
- **User Interface**: Automatic (dark/light mode)
- **New Architecture**: Enabled
- **JavaScript Engine**: Hermes

### Build Configuration (`eas.json`)

- Multiple build profiles for different environments
- Development, preview, and production configurations
- Local and cloud build options

## Internationalization

The app supports multiple languages:

- English (en)
- Spanish (es)
- French (fr)
- Arabic (ar)
- Hindi (hi)
- Japanese (ja)
- Korean (ko)

Translation files are located in `src/i18n/` directory.

## Theme System

The app includes a comprehensive theme system with:

- Color schemes (light and dark)
- Typography definitions
- Spacing utilities
- Component styling

## Development Workflow

### Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

### Debugging

- Reactotron for development debugging
- Error boundaries for error handling
- Crash reporting utilities

## Deployment

### Expo Updates

- Over-the-air updates enabled
- Fallback to cache timeout: 0

### Build Process

- Uses EAS Build for cloud builds
- Local build support for development
- Multiple build profiles for different environments

## Current Development Status

### Completed

- ✅ Project structure and setup
- ✅ Basic navigation (tab-based)
- ✅ UI component library
- ✅ Theme system
- ✅ Internationalization setup
- ✅ Authentication configuration
- ✅ Development tooling

### In Progress

- 🔄 Game logic implementation
- 🔄 Authentication flow
- 🔄 User profile management

### Planned

- 📋 Real-time multiplayer functionality
- 📋 Game code system
- 📋 User management features
- 📋 Game state management

## Notes

- The app is currently in early development with basic UI structure in place
- Authentication is configured but not actively used
- Game functionality is planned but not yet implemented
- The app uses modern React Native patterns and best practices
- Built on the Ignite boilerplate for rapid development

## Contributing

This project follows standard React Native and Expo development practices. The codebase is well-structured with clear separation of concerns and comprehensive tooling for development, testing, and deployment.
