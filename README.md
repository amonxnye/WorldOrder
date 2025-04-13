# World Order

World Order is a historical nation-building simulator where players lead their chosen nation from 1925 to the present day, navigating through historical eras, researching technologies, building their economy, and establishing diplomatic relations.

## Live Demo

The game is deployed and available at: [https://worldordergameapp.web.app](https://worldordergameapp.web.app)

## Features

- **Authentication System**: Sign in to save your progress and compete on leaderboards
- **Nation Selection**: Choose from real-world countries with unique starting attributes
- **Resource Management**: Balance various resources to grow your nation
- **Population Control**: Distribute your population among workers, soldiers, and scientists
- **Technology Tree**: Research technologies to advance your civilization
- **Banking System**: Manage your nation's finances
- **Education System**: Develop your nation's educational infrastructure
- **Yearly Objectives**: Complete objectives to earn rewards
- **Global Map**: Visualize your nation's presence on the world stage

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **3D Visualization**: Three.js, Babylon.js
- **Authentication & Hosting**: Firebase
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/worldorder.git
   cd worldorder
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server
   ```
   npm run dev
   ```

## Deployment

The app is configured for Firebase hosting. To deploy:

1. Build the production version
   ```
   npm run build
   ```

2. Deploy to Firebase
   ```
   npm run deploy
   ```

## Project Structure

- `src/components/` - React components
- `src/store/` - Zustand state management
- `src/data/` - Game data (countries, technologies, etc.)
- `src/utils/` - Utility functions and Firebase setup
- `src/assets/` - Static assets

## Game Flow

1. User signs in through Firebase Authentication
2. User selects a nation and enters their leader name
3. Game starts with the initial resources and technology level
4. User manages resources, researches technologies, and completes yearly objectives
5. Progress is saved automatically to Firebase

## Recent Additions

- **Population Manager**: Component to manage the distribution of population among workers, soldiers, and scientists
- **Nation Setup Flow**: Required flow for selecting a nation and leader name before starting the game
- **Game State Persistence**: Automatic saving of game state to Firebase
- **Improved UI**: Enhanced user interface with animations and responsive design

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgements

- Three.js and Babylon.js communities for 3D visualization
- Firebase for authentication and hosting
- The React team for an excellent framework
