import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  limit,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import AdminAnalytics from './AdminAnalytics';
import { seedSampleUserData } from '../utils/seedAdminData';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  nationName?: string;
  leaderName?: string;
  lastLoginAt?: Timestamp;
  createdAt?: Timestamp;
  totalPlayTime?: number; // in minutes
  sessionCount?: number;
  currentSession?: {
    startTime: Timestamp;
    lastActivity: Timestamp;
  };
  gameStats?: {
    year?: number;
    totalPopulation?: number;
    economyScore?: number;
    technologiesUnlocked?: number;
    disastersSurvived?: number;
    highestEconomyResource?: number;
  };
  status?: 'active' | 'suspended' | 'banned';
  suspendedUntil?: Timestamp;
  suspensionReason?: string;
  moderationNotes?: string[];
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  averagePlayTime: number;
  totalSessions: number;
  suspendedUsers: number;
  topNations: UserData[];
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'leaderboard' | 'analytics' | 'moderation'>('overview');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'banned'>('all');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load all users - try different approaches
      let usersSnapshot;
      try {
        // First try with ordering by lastLoginAt
        const usersQuery = query(collection(db, 'users'), orderBy('lastLoginAt', 'desc'));
        usersSnapshot = await getDocs(usersQuery);
      } catch (error) {
        console.log('lastLoginAt ordering failed, trying alternative approaches...');
        try {
          // Try ordering by different common fields
          const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
          usersSnapshot = await getDocs(usersQuery);
        } catch (error2) {
          console.log('createdAt ordering failed, getting all users without ordering...');
          // Get all users without ordering
          const usersQuery = query(collection(db, 'users'));
          usersSnapshot = await getDocs(usersQuery);
        }
      }
      
      const rawUsersData = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      
      console.log('Raw users data sample:', rawUsersData.slice(0, 2));
      console.log(`Loaded ${rawUsersData.length} users from Firebase`);
      
      // Process and clean user data
      const usersData = rawUsersData.map(user => ({
        ...user,
        // Ensure we have basic fields
        displayName: user.displayName || user.name || null,
        nationName: user.nationName || null,
        leaderName: user.leaderName || null,
        totalPlayTime: user.totalPlayTime || 0,
        sessionCount: user.sessionCount || 0,
        status: user.status || 'active',
        // Handle different timestamp formats
        lastLoginAt: user.lastLoginAt || user.lastLogin || null,
        createdAt: user.createdAt || user.created || null
      })) as UserData[];
      
      // Load game data for better statistics
      let gamesData: any[] = [];
      try {
        const gamesQuery = query(collection(db, 'games'));
        const gamesSnapshot = await getDocs(gamesQuery);
        gamesData = gamesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`Loaded ${gamesData.length} games from Firebase`);
      } catch (error) {
        console.log('No games collection found');
      }

      // Load user actions for analytics
      let actionsData: any[] = [];
      try {
        const actionsQuery = query(collection(db, 'user_actions'), orderBy('timestamp', 'desc'), limit(1000));
        const actionsSnapshot = await getDocs(actionsQuery);
        actionsData = actionsSnapshot.docs.map(doc => doc.data());
        console.log(`Loaded ${actionsData.length} user actions from Firebase`);
      } catch (error) {
        console.log('No user_actions collection found');
      }
      
      setUsers(usersData);
      
      // Calculate admin stats with real data
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Calculate active users (logged in within last 7 days)
      const activeUsers = usersData.filter(u => {
        if (!u.lastLoginAt) return false;
        try {
          const lastLogin = u.lastLoginAt.toDate ? u.lastLoginAt.toDate() : new Date(u.lastLoginAt);
          return lastLogin >= sevenDaysAgo;
        } catch (error) {
          console.log('Error parsing lastLoginAt for user:', u.uid, u.lastLoginAt);
          return false;
        }
      });

      // Calculate new users today
      const newUsersToday = usersData.filter(u => {
        if (!u.createdAt) return false;
        try {
          const createdAt = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
          return createdAt >= today;
        } catch (error) {
          console.log('Error parsing createdAt for user:', u.uid, u.createdAt);
          return false;
        }
      });

      // Calculate total play time and sessions
      const totalPlayTime = usersData.reduce((sum, u) => sum + (u.totalPlayTime || 0), 0);
      const totalSessions = usersData.reduce((sum, u) => sum + (u.sessionCount || 0), 0);
      const averagePlayTime = usersData.length > 0 ? totalPlayTime / usersData.length : 0;

      // Find top nations based on available game stats
      const topNations = usersData
        .filter(u => u.gameStats && (u.gameStats.economyScore || u.gameStats.year || u.gameStats.totalPopulation))
        .sort((a, b) => {
          // Sort by economy score first, then by year, then by population
          const aScore = (a.gameStats?.economyScore || 0) * 1000 + (a.gameStats?.year || 1925) + (a.gameStats?.totalPopulation || 0);
          const bScore = (b.gameStats?.economyScore || 0) * 1000 + (b.gameStats?.year || 1925) + (b.gameStats?.totalPopulation || 0);
          return bScore - aScore;
        })
        .slice(0, 10);

      const stats: AdminStats = {
        totalUsers: usersData.length,
        activeUsers: activeUsers.length,
        newUsersToday: newUsersToday.length,
        averagePlayTime: averagePlayTime,
        totalSessions: totalSessions,
        suspendedUsers: usersData.filter(u => u.status === 'suspended' || u.status === 'banned').length,
        topNations: topNations
      };
      
      console.log('Admin stats calculated:', {
        ...stats,
        sampleUsers: usersData.slice(0, 3),
        activeUsersSample: activeUsers.slice(0, 2),
        newUsersSample: newUsersToday.slice(0, 2)
      });
      
      setAdminStats(stats);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (uid: string, days: number, reason: string) => {
    try {
      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + days);
      
      await updateDoc(doc(db, 'users', uid), {
        status: 'suspended',
        suspendedUntil: Timestamp.fromDate(suspendUntil),
        suspensionReason: reason,
        moderationNotes: [`Suspended for ${days} days: ${reason} (${new Date().toISOString()})`]
      });
      
      await loadAdminData(); // Refresh data
      alert(`User suspended for ${days} days`);
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user');
    }
  };

  const unsuspendUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'active',
        suspendedUntil: null,
        suspensionReason: null
      });
      
      await loadAdminData(); // Refresh data
      alert('User unsuspended successfully');
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Error unsuspending user');
    }
  };

  const banUser = async (uid: string, reason: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'banned',
        suspensionReason: reason,
        moderationNotes: [`Permanently banned: ${reason} (${new Date().toISOString()})`]
      });
      
      await loadAdminData(); // Refresh data
      alert('User banned permanently');
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Error banning user');
    }
  };

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nationName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && (!user.status || user.status === 'active')) ||
      user.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600">World Order Game Administration</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</p>
              <div className="flex gap-2">
                <button
                  onClick={loadAdminData}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Refresh Data
                </button>
                {users.length === 0 && (
                  <button
                    onClick={async () => {
                      const success = await seedSampleUserData();
                      if (success) {
                        await loadAdminData();
                      }
                    }}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Add Sample Data
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: '📊 Overview', icon: '📊' },
                { key: 'users', label: '👥 Users', icon: '👥' },
                { key: 'leaderboard', label: '🏆 Leaderboard', icon: '🏆' },
                { key: 'analytics', label: '📈 Analytics', icon: '📈' },
                { key: 'moderation', label: '🛡️ Moderation', icon: '🛡️' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Debug Information */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Information</h3>
              <div className="text-sm text-yellow-700">
                <p>Total Users Found: {users.length}</p>
                <p>Admin Stats Available: {adminStats ? 'Yes' : 'No'}</p>
                {users.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Sample User Data:</p>
                    <pre className="text-xs bg-yellow-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(users[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {adminStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{adminStats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{adminStats.activeUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🆕</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">New Today</p>
                  <p className="text-2xl font-bold text-blue-600">{adminStats.newUsersToday.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Play Time</p>
                  <p className="text-2xl font-bold text-purple-600">{formatPlayTime(Math.round(adminStats.averagePlayTime))}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🎮</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                  <p className="text-2xl font-bold text-indigo-600">{adminStats.totalSessions.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Suspended</p>
                  <p className="text-2xl font-bold text-red-600">{adminStats.suspendedUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>
              </div>
            )}

            {!adminStats && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center text-gray-500">
                  <p>No statistics available. This could be because:</p>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>No users found in Firebase</li>
                    <li>Firebase connection issues</li>
                    <li>Missing required user data fields</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search users by email, name, or nation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Play Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{user.nationName || 'No nation'}</div>
                          <div className="text-sm text-gray-500">{user.leaderName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPlayTime(user.totalPlayTime || 0)}
                        <div className="text-xs text-gray-500">
                          {user.sessionCount || 0} sessions
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.lastLoginAt ? 
                          (user.lastLoginAt.toDate ? 
                            new Date(user.lastLoginAt.toDate()).toLocaleDateString() :
                            new Date(user.lastLoginAt).toLocaleDateString()
                          ) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          !user.status || user.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : user.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && adminStats && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🏆 Top Nations</h2>
            <div className="space-y-4">
              {adminStats.topNations.map((user, index) => (
                <div key={user.uid} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-2xl mr-4">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{user.nationName}</h3>
                      <p className="text-sm text-gray-600">Leader: {user.leaderName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {user.gameStats?.economyScore?.toLocaleString()} Economy
                    </div>
                    <div className="text-sm text-gray-600">
                      Year: {user.gameStats?.year} • Pop: {user.gameStats?.totalPopulation?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.gameStats?.technologiesUnlocked} techs • {user.gameStats?.disastersSurvived} disasters survived
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📈 Analytics & Insights</h2>
            <AdminAnalytics />
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🛡️ Moderation Tools</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Suspended Users */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Suspended Users</h3>
                <div className="space-y-3">
                  {users.filter(u => u.status === 'suspended').map(user => (
                    <div key={user.uid} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{user.displayName || user.email}</p>
                          <p className="text-sm text-gray-600">{user.nationName}</p>
                          {user.suspensionReason && (
                            <p className="text-xs text-yellow-700 mt-1">Reason: {user.suspensionReason}</p>
                          )}
                          {user.suspendedUntil && (
                            <p className="text-xs text-gray-500">
                              Until: {user.suspendedUntil.toDate().toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => unsuspendUser(user.uid)}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Unsuspend
                        </button>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.status === 'suspended').length === 0 && (
                    <p className="text-gray-500 text-center py-4">No suspended users</p>
                  )}
                </div>
              </div>

              {/* Banned Users */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Banned Users</h3>
                <div className="space-y-3">
                  {users.filter(u => u.status === 'banned').map(user => (
                    <div key={user.uid} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{user.displayName || user.email}</p>
                        <p className="text-sm text-gray-600">{user.nationName}</p>
                        {user.suspensionReason && (
                          <p className="text-xs text-red-700 mt-1">Reason: {user.suspensionReason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.status === 'banned').length === 0 && (
                    <p className="text-gray-500 text-center py-4">No banned users</p>
                  )}
                </div>
              </div>
            </div>

            {/* Moderation Statistics */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {users.filter(u => !u.status || u.status === 'active').length}
                </div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {users.filter(u => u.status === 'suspended').length}
                </div>
                <div className="text-sm text-gray-600">Suspended</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.status === 'banned').length}
                </div>
                <div className="text-sm text-gray-600">Banned</div>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Display Name</label>
                      <p className="text-gray-900">{selectedUser.displayName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nation Name</label>
                      <p className="text-gray-900">{selectedUser.nationName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Leader Name</label>
                      <p className="text-gray-900">{selectedUser.leaderName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Play Time</label>
                      <p className="text-gray-900">{formatPlayTime(selectedUser.totalPlayTime || 0)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sessions</label>
                      <p className="text-gray-900">{selectedUser.sessionCount || 0}</p>
                    </div>
                  </div>

                  {selectedUser.gameStats && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Game Statistics</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>Current Year: {selectedUser.gameStats.year}</div>
                        <div>Population: {selectedUser.gameStats.totalPopulation?.toLocaleString()}</div>
                        <div>Economy Score: {selectedUser.gameStats.economyScore?.toLocaleString()}</div>
                        <div>Technologies: {selectedUser.gameStats.technologiesUnlocked}</div>
                        <div>Disasters Survived: {selectedUser.gameStats.disastersSurvived}</div>
                        <div>Highest Economy: {selectedUser.gameStats.highestEconomyResource}</div>
                      </div>
                    </div>
                  )}

                  {(!selectedUser.status || selectedUser.status === 'active') && (
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={() => {
                          const days = prompt('Suspend for how many days?');
                          const reason = prompt('Reason for suspension:');
                          if (days && reason) {
                            suspendUser(selectedUser.uid, parseInt(days), reason);
                            setSelectedUser(null);
                          }
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Suspend User
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Reason for permanent ban:');
                          if (reason && confirm('Are you sure you want to permanently ban this user?')) {
                            banUser(selectedUser.uid, reason);
                            setSelectedUser(null);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Ban User
                      </button>
                    </div>
                  )}

                  {selectedUser.status === 'suspended' && (
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to unsuspend this user?')) {
                            unsuspendUser(selectedUser.uid);
                            setSelectedUser(null);
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Unsuspend User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;