import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuth } from '../utils/AuthContext';
import useMultiplayerSync from '../hooks/useMultiplayerSync';

interface EventNotification {
  id: string;
  type: 'trade_offer' | 'war_declared' | 'attack_launched' | 'tech_researched' | 'turn_ended';
  title: string;
  message: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
}

const MultiplayerEventsFeed: React.FC = () => {
  const { currentUser } = useAuth();
  const { 
    multiplayer, 
    markEventAsRead 
  } = useGameStore();
  
  const { 
    gameEvents, 
    players,
    isMultiplayer 
  } = useMultiplayerSync();

  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert game events to user-friendly notifications
  useEffect(() => {
    const newNotifications: EventNotification[] = gameEvents.map(event => {
      const fromPlayer = players[event.fromUserId || ''];
      const toPlayer = players[event.targetUserId || ''];
      
      let notification: EventNotification = {
        id: event.id,
        type: event.type,
        title: '',
        message: '',
        timestamp: event.timestamp,
        priority: 'medium'
      };

      switch (event.type) {
        case 'trade_offer':
          notification = {
            ...notification,
            title: 'Trade Offer Received',
            message: `${fromPlayer?.nationName || 'Unknown'} wants to trade with you`,
            priority: 'high',
            actionRequired: true
          };
          break;
          
        case 'war_declared':
          notification = {
            ...notification,
            title: 'War Declared!',
            message: `${fromPlayer?.nationName || 'Unknown'} has declared war on ${toPlayer?.nationName || 'you'}`,
            priority: 'high'
          };
          break;
          
        case 'attack_launched':
          notification = {
            ...notification,
            title: 'Under Attack!',
            message: `${fromPlayer?.nationName || 'Unknown'} has launched an attack`,
            priority: 'high'
          };
          break;
          
        case 'tech_researched':
          notification = {
            ...notification,
            title: 'Technology Breakthrough',
            message: `${fromPlayer?.nationName || 'Unknown'} has researched ${event.data?.techName || 'new technology'}`,
            priority: 'low'
          };
          break;
          
        case 'turn_ended':
          notification = {
            ...notification,
            title: 'Turn Complete',
            message: `${fromPlayer?.nationName || 'Unknown'} has ended their turn`,
            priority: 'low'
          };
          break;
      }

      return notification;
    });

    setNotifications(newNotifications.reverse()); // Most recent first
  }, [gameEvents, players]);

  const handleMarkAsRead = (eventId: string) => {
    markEventAsRead(eventId);
  };

  const handleClearAll = () => {
    gameEvents.forEach(event => markEventAsRead(event.id));
  };

  const unreadCount = notifications.length;

  if (!isMultiplayer) {
    return null;
  }

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-900/20';
      case 'low': return 'border-gray-500 bg-gray-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trade_offer': return '🤝';
      case 'war_declared': return '⚔️';
      case 'attack_launched': return '💥';
      case 'tech_researched': return '🔬';
      case 'turn_ended': return '🔄';
      default: return '📢';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      {/* Notification toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
          unreadCount > 0 
            ? 'bg-red-600/20 border-red-500/50 text-red-300' 
            : 'bg-gray-800/90 border-gray-600 text-gray-300'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">🔔</span>
          <span className="font-medium">Events</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Events list */}
      {isExpanded && (
        <div className="mt-2 bg-gray-800/95 border border-gray-600 rounded-lg shadow-xl backdrop-blur-sm">
          <div className="p-3 border-b border-gray-600 flex justify-between items-center">
            <h3 className="font-semibold text-white">Game Events</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No recent events
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${getPriorityColor(notification.priority)} cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getTypeIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white text-sm truncate">
                            {notification.title}
                          </h4>
                          {notification.actionRequired && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              Action
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <div className="text-xs text-gray-400 mt-2">
                          {formatTimeAgo(notification.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplayerEventsFeed;