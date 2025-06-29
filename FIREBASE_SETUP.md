# Firebase Setup Instructions

## The Problem
You're getting "Missing or insufficient permissions" errors because Firestore security rules haven't been configured for your project.

## Solution

### 1. Deploy Firestore Rules

The project now includes proper Firestore security rules. Deploy them using:

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase (if not already logged in)
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy the security rules
firebase deploy --only firestore:rules
```

### 2. Alternative: Manual Setup via Firebase Console

If you prefer to set up rules manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `worldordergameapp`
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the content from `firestore.rules`
5. Click **Publish**

### 3. Verify Setup

After deploying the rules, test the application:

1. Sign in to the application
2. Try creating a user profile
3. Test multiplayer lobby functionality
4. Verify no permission errors appear

## Security Rules Explanation

The rules provide:

- **User Profiles**: Users can only read/write their own profile data
- **Games**: Players can access games they're part of (host or participant)
- **Trade Offers**: Only involved parties can access trade data
- **War Events**: Only participants can access war event data
- **Public Data**: Leaderboards and statistics are publicly readable

## Firestore Structure

```
/users/{userId}
  - displayName, email, gameStats, etc.

/games/{gameId}
  - gameData, playerData, diplomaticStances, etc.
  /trade_offers/{offerId}
    - fromUserId, toUserId, resources, status
  /war_events/{eventId}
    - attackerId, defenderId, outcome, timestamp

/leaderboards/{document}
  - public leaderboard data

/statistics/{document}
  - public game statistics
```

## Quick Fix Commands

```bash
# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only indexes
firebase deploy --only firestore:indexes

# Deploy everything
firebase deploy

# Check your current project
firebase projects:list
firebase use --add  # if you need to select the project
```

## Testing

Once deployed, all these operations should work:
- ✅ User authentication and profile creation
- ✅ Multiplayer game creation and joining
- ✅ Real-time game state synchronization
- ✅ Trade offers and diplomatic actions
- ✅ War declarations and attacks

## Troubleshooting

If you still get permission errors:

1. **Check Firebase project selection**:
   ```bash
   firebase projects:list
   firebase use worldordergameapp
   ```

2. **Verify rules deployment**:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Check Firebase Console**: Ensure rules are active in the Firebase Console

4. **Clear browser cache**: Sometimes cached auth tokens cause issues

## Development vs Production

- **Development**: Rules allow broader access for testing
- **Production**: Consider tightening rules based on actual usage patterns

The current rules are production-ready and secure while allowing full multiplayer functionality.