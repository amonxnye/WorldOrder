import { 
  doc, 
  updateDoc, 
  increment, 
  Timestamp,
  setDoc,
  getDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

interface SessionData {
  startTime: Timestamp;
  lastActivity: Timestamp;
  pageViews: number;
  actionsPerformed: number;
}

interface UserStats {
  totalPlayTime: number; // in minutes
  sessionCount: number;
  lastLoginAt: Timestamp;
  createdAt: Timestamp;
  currentSession?: SessionData;
  gameStats?: {
    year: number;
    totalPopulation: number;
    economyScore: number;
    technologiesUnlocked: number;
    disastersSurvived: number;
    highestEconomyResource: number;
    gamesCompleted: number;
    averageGameLength: number; // in minutes
  };
  behaviorMetrics?: {
    averageSessionLength: number; // in minutes
    mostActiveHour: number; // 0-23
    preferredGameSpeed: 'slow' | 'normal' | 'fast';
    featuresUsed: string[];
    lastFeatureUsed: string;
    clicksPerSession: number;
    timeToFirstAction: number; // seconds
  };
}

class UserTracker {
  private currentUser: User | null = null;
  private sessionStartTime: Date | null = null;
  private lastActivityTime: Date = new Date();
  private activityInterval: NodeJS.Timeout | null = null;
  private sessionData: SessionData | null = null;

  // Initialize tracking for a user
  async startTracking(user: User) {
    this.currentUser = user;
    this.sessionStartTime = new Date();
    this.lastActivityTime = new Date();
    
    // Initialize session data
    this.sessionData = {
      startTime: Timestamp.fromDate(this.sessionStartTime),
      lastActivity: Timestamp.fromDate(this.lastActivityTime),
      pageViews: 1,
      actionsPerformed: 0
    };

    try {
      // Update user login time and session start
      await this.updateUserStats({
        lastLoginAt: Timestamp.fromDate(this.sessionStartTime),
        sessionCount: increment(1),
        currentSession: this.sessionData
      });

      // Start activity tracking
      this.startActivityTracking();
      
      console.log('User tracking started for:', user.email);
    } catch (error) {
      console.error('Error starting user tracking:', error);
    }
  }

  // Stop tracking and save session data
  async stopTracking() {
    if (!this.currentUser || !this.sessionStartTime) return;

    try {
      const sessionEnd = new Date();
      const sessionDuration = Math.round((sessionEnd.getTime() - this.sessionStartTime.getTime()) / 1000 / 60); // minutes

      // Update user stats with session data
      await this.updateUserStats({
        totalPlayTime: increment(sessionDuration),
        currentSession: null // Clear current session
      });

      // Stop activity tracking
      if (this.activityInterval) {
        clearInterval(this.activityInterval);
        this.activityInterval = null;
      }

      console.log(`Session ended for ${this.currentUser.email}. Duration: ${sessionDuration} minutes`);
    } catch (error) {
      console.error('Error stopping user tracking:', error);
    }

    this.currentUser = null;
    this.sessionStartTime = null;
    this.sessionData = null;
  }

  // Track user activity (call this on user interactions)
  async trackActivity(actionType: string, details?: any) {
    if (!this.currentUser || !this.sessionData) return;

    this.lastActivityTime = new Date();
    this.sessionData.lastActivity = Timestamp.fromDate(this.lastActivityTime);
    this.sessionData.actionsPerformed++;

    try {
      // Update current session activity
      await this.updateUserStats({
        currentSession: this.sessionData
      });

      // Track specific action
      await this.trackUserAction(actionType, details);
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  // Track page views
  async trackPageView(pageName: string) {
    if (!this.sessionData) return;

    this.sessionData.pageViews++;
    await this.trackActivity('page_view', { page: pageName });
  }

  // Track game state changes
  async trackGameStateUpdate(gameState: any) {
    if (!this.currentUser) return;

    try {
      const gameStats = {
        year: gameState.year || 0,
        totalPopulation: this.calculateTotalPopulation(gameState.population),
        economyScore: Math.round(gameState.resources?.economy * 100) || 0,
        technologiesUnlocked: gameState.unlockedTechs?.length || 0,
        disastersSurvived: this.calculateDisastersSurvived(gameState),
        highestEconomyResource: Math.round(gameState.resources?.economy || 0)
      };

      await this.updateUserStats({ gameStats });
    } catch (error) {
      console.error('Error tracking game state:', error);
    }
  }

  // Private helper methods
  private async updateUserStats(updates: Partial<UserStats>) {
    if (!this.currentUser) return;

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      
      // Check if user document exists, create if not
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        const newUserData = {
          uid: this.currentUser.uid,
          email: this.currentUser.email,
          displayName: this.currentUser.displayName || null,
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          totalPlayTime: 0,
          sessionCount: 0,
          status: 'active',
          ...updates
        };
        
        console.log('Creating new user document:', newUserData);
        await setDoc(userRef, newUserData);
      } else {
        console.log('Updating existing user document with:', updates);
        await updateDoc(userRef, {
          lastLoginAt: Timestamp.now(),
          ...updates
        });
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  private async trackUserAction(actionType: string, details?: any) {
    if (!this.currentUser) return;

    try {
      // Store in a separate actions collection for detailed analytics
      const actionRef = doc(db, 'user_actions', `${this.currentUser.uid}_${Date.now()}`);
      await setDoc(actionRef, {
        userId: this.currentUser.uid,
        actionType,
        details: details || {},
        timestamp: Timestamp.now(),
        sessionId: this.sessionData?.startTime
      });
    } catch (error) {
      // Don't log errors for action tracking to avoid spam
      // console.error('Error tracking user action:', error);
    }
  }

  private startActivityTracking() {
    // Update activity every 30 seconds
    this.activityInterval = setInterval(async () => {
      if (this.sessionData) {
        // Check if user has been inactive for more than 5 minutes
        const now = new Date();
        const inactiveTime = now.getTime() - this.lastActivityTime.getTime();
        
        if (inactiveTime > 5 * 60 * 1000) { // 5 minutes
          // User is inactive, pause tracking
          return;
        }

        // Update last activity time
        this.sessionData.lastActivity = Timestamp.fromDate(now);
        
        try {
          await this.updateUserStats({
            currentSession: this.sessionData
          });
        } catch (error) {
          console.error('Error updating activity:', error);
        }
      }
    }, 30000); // 30 seconds
  }

  private calculateTotalPopulation(population: any): number {
    if (!population) return 0;
    return (population.men || 0) + (population.women || 0) + (population.children || 0);
  }

  private calculateDisastersSurvived(gameState: any): number {
    // This would need to be tracked in the game state
    // For now, estimate based on game progression
    const year = gameState.year || 1925;
    const yearsPlayed = year - 1925;
    return Math.floor(yearsPlayed * 0.3); // Estimate ~30% chance of disaster per year
  }

  // Public method to get current session info
  getCurrentSession(): SessionData | null {
    return this.sessionData;
  }

  // Check if user is currently active
  isActive(): boolean {
    if (!this.lastActivityTime) return false;
    const now = new Date();
    return (now.getTime() - this.lastActivityTime.getTime()) < 5 * 60 * 1000; // 5 minutes
  }
}

// Export singleton instance
export const userTracker = new UserTracker();

// Utility functions for admin dashboard
export const formatSessionTime = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  return date.toLocaleString();
};

export const calculateActiveUsers = async (): Promise<number> => {
  // This would query Firestore for users with recent activity
  // Implementation would depend on your indexing strategy
  return 0; // Placeholder
};

export const getUserAnalytics = async (userId: string): Promise<UserStats | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserStats;
    }
    return null;
  } catch (error) {
    console.error('Error getting user analytics:', error);
    return null;
  }
};

// Hook into window events for tracking
if (typeof window !== 'undefined') {
  // Track when user becomes active/inactive
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      userTracker.trackActivity('tab_focus');
    } else {
      userTracker.trackActivity('tab_blur');
    }
  });

  // Track when user leaves the page
  window.addEventListener('beforeunload', () => {
    userTracker.stopTracking();
  });
}