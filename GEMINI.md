
# Gemini Project Brief: World Order

This document provides a summary of the World Order project and guidelines for the Gemini assistant.

## Project Summary

World Order is a historical nation-building simulator where players lead a chosen nation from 1925 to the present day. It is a web-based strategy game built with React, TypeScript, and Vite.

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **3D Visualization**: Three.js, Babylon.js
- **Authentication & Hosting**: Firebase
- **Build Tool**: Vite

## Development Guidelines

### Running the Project

- **Development Server**: `npm run dev`
- **Production Build**: `npm run build`
- **Linting**: `npm run lint`
- **Deployment**: `npm run deploy`

### Project Structure

- **`src/components/`**: React components, organized by feature.
- **`src/store/`**: Zustand store for global state management.
- **`src/data/`**: Static game data, such as country information and technology trees.
- **`src/utils/`**: Utility functions, including Firebase configuration and helper hooks.
- **`src/assets/`**: Static assets like images and SVGs.

### Coding Conventions

- **Component Naming**: Use PascalCase for component files (e.g., `NationSelector.tsx`).
- **Styling**: Use Tailwind CSS for styling. Utility classes are preferred over custom CSS. The `cn` utility in `src/utils/cn.ts` is available for merging class names.
- **State Management**: Use the Zustand store (`src/store/gameStore.ts`) for global state. For local component state, use React hooks (`useState`, `useReducer`).
- **Commits**: Follow conventional commit standards.

### Adding New Features

When adding a new feature, please adhere to the existing project structure and conventions. For example, a new UI component should be placed in the `src/components/` directory, and any related state should be added to the Zustand store if it needs to be accessed globally.
