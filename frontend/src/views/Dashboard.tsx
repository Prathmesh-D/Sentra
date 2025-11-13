import { FiUpload, FiDownload, FiShield, FiHardDrive, FiClock, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { HiOutlineLockClosed } from "react-icons/hi";
import { BsFileEarmarkText } from "react-icons/bs";
import { AiFillFileImage, AiFillFilePdf, AiFillFileWord, AiFillFileExcel, AiFillFileZip } from "react-icons/ai";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import { dashboardService } from '@/api';
import type { DashboardStats, RecentActivity, EncryptionBreakdown, FileTypeBreakdown } from '@/api';
import { toast } from 'react-hot-toast';

// Utility function to clear dashboard cache (can be called from other components)
export const clearDashboardCache = () => {
  sessionStorage.removeItem('dashboardData');
  sessionStorage.removeItem('dashboardCacheTimestamp');
};

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [hasAnimated, setHasAnimated] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [activityData, setActivityData] = useState<RecentActivity[]>([]);
  const [encryptionBreakdown, setEncryptionBreakdown] = useState<EncryptionBreakdown[]>([]);
  const [fileTypeDistribution, setFileTypeDistribution] = useState<FileTypeBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when component mounts - target the scrollable parent
    const scrollableParent = document.querySelector('.overflow-y-auto');
    if (scrollableParent) {
      scrollableParent.scrollTop = 0;
    }
    
    // Check if animations have already played in this session
    const animated = sessionStorage.getItem('dashboardAnimated');
    if (animated) {
      setHasAnimated(true);
    } else {
      sessionStorage.setItem('dashboardAnimated', 'true');
    }

    // Load cached data first
    loadCachedData();
    setLoading(false);
  }, []);

  const loadCachedData = () => {
    try {
      const cachedData = sessionStorage.getItem('dashboardData');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setDashboardStats(data.stats);
        setActivityData(data.recent_activity);
        setEncryptionBreakdown(data.encryption_breakdown || []);
        setFileTypeDistribution(data.file_type_distribution || []);
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  };

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const data = await dashboardService.getDashboardData();
      
      // Update state
      setDashboardStats(data.stats);
      setActivityData(data.recent_activity);
      setEncryptionBreakdown(data.encryption_breakdown || []);
      setFileTypeDistribution(data.file_type_distribution || []);
      
      // Cache the data
      sessionStorage.setItem('dashboardData', JSON.stringify(data));
      sessionStorage.setItem('dashboardCacheTimestamp', Date.now().toString());
      
      if (forceRefresh) {
        toast.success('Dashboard refreshed successfully');
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error(error.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format storage with proper units
  const formatStorage = (mb: number): string => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  // Prepare stats data
  const stats = dashboardStats ? [
    {
      id: 1,
      title: "Files Sent",
      value: String(dashboardStats.files_sent),
      change: null,
      changeType: "neutral",
      icon: FiUpload,
      color: "bg-gradient-to-br from-[#b2f7ef]/50 to-[#b2f7ef]/20",
      iconBg: "bg-[#b2f7ef]",
      iconColor: "text-[#084d45]",
    },
    {
      id: 2,
      title: "Files Received",
      value: String(dashboardStats.files_received),
      change: null,
      changeType: "neutral",
      icon: FiDownload,
      color: "bg-gradient-to-br from-[#97eeff]/50 to-[#97eeff]/20",
      iconBg: "bg-[#97eeff]",
      iconColor: "text-[#084d45]",
    },
    {
      id: 3,
      title: "Sensitive Files",
      value: String(dashboardStats.sensitive_files),
      change: null,
      changeType: "neutral",
      icon: FiShield,
      color: "bg-gradient-to-br from-[#f7d6e0]/50 to-[#f7d6e0]/20",
      iconBg: "bg-[#f7d6e0]",
      iconColor: "text-[#8b1e3f]",
    },
    {
      id: 4,
      title: "Storage Used",
      value: formatStorage(dashboardStats.storage_used_mb),
      subtitle: `of ${formatStorage(dashboardStats.storage_limit_mb)}`,
      change: `${((dashboardStats.storage_used_mb / dashboardStats.storage_limit_mb) * 100).toFixed(1)}%`,
      changeType: "neutral",
      icon: FiHardDrive,
      color: "bg-gradient-to-br from-[#f2b5d4]/50 to-[#f2b5d4]/20",
      iconBg: "bg-[#f2b5d4]",
      iconColor: "text-[#6b1e49]",
    },
  ] : [
    {
      id: 1,
      title: "Files Sent",
      value: loading ? "..." : "0",
      change: null,
      changeType: "neutral",
      icon: FiUpload,
      color: "bg-gradient-to-br from-[#b2f7ef]/50 to-[#b2f7ef]/20",
      iconBg: "bg-[#b2f7ef]",
      iconColor: "text-[#084d45]",
    },
    {
      id: 2,
      title: "Files Received",
      value: loading ? "..." : "0",
      change: null,
      changeType: "neutral",
      icon: FiDownload,
      color: "bg-gradient-to-br from-[#97eeff]/50 to-[#97eeff]/20",
      iconBg: "bg-[#97eeff]",
      iconColor: "text-[#084d45]",
    },
    {
      id: 3,
      title: "Sensitive Files",
      value: loading ? "..." : "0",
      change: null,
      changeType: "neutral",
      icon: FiShield,
      color: "bg-gradient-to-br from-[#f7d6e0]/50 to-[#f7d6e0]/20",
      iconBg: "bg-[#f7d6e0]",
      iconColor: "text-[#8b1e3f]",
    },
    {
      id: 4,
      title: "Storage Used",
      value: loading ? "..." : "0 MB",
      subtitle: "of 100 GB",
      change: "0%",
      changeType: "neutral",
      icon: FiHardDrive,
      color: "bg-gradient-to-br from-[#f2b5d4]/50 to-[#f2b5d4]/20",
      iconBg: "bg-[#f2b5d4]",
      iconColor: "text-[#6b1e49]",
    },
  ];

  // Map activity data to include icons and colors
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'encrypted':
      case 'decrypted':
        return { icon: HiOutlineLockClosed, iconColor: "text-[#b2f7ef]", iconBg: "bg-[#b2f7ef]/20" };
      case 'shared':
        return { icon: FiUpload, iconColor: "text-[#97eeff]", iconBg: "bg-[#97eeff]/20" };
      case 'downloaded':
        return { icon: FiDownload, iconColor: "text-[#f7d6e0]", iconBg: "bg-[#f7d6e0]/20" };
      case 'deleted':
        return { icon: FiShield, iconColor: "text-[#f2b5d4]", iconBg: "bg-[#f2b5d4]/20" };
      default:
        return { icon: BsFileEarmarkText, iconColor: "text-gray-500", iconBg: "bg-gray-500/20" };
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const recentActivity = activityData.map((activity) => {
    const iconData = getActivityIcon(activity.action);
    return {
      id: activity.id,
      action: activity.action.charAt(0).toUpperCase() + activity.action.slice(1),
      fileName: activity.file_name,
      time: formatTimestamp(activity.timestamp),
      ...iconData,
    };
  });

  // Helper function to get file type icon
  const getFileTypeIcon = (type: string): any => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pdf')) return AiFillFilePdf;
    if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg') || lowerType.includes('jpeg') || lowerType.includes('gif')) return AiFillFileImage;
    if (lowerType.includes('doc') || lowerType.includes('txt')) return AiFillFileWord;
    if (lowerType.includes('xls') || lowerType.includes('csv') || lowerType.includes('spreadsheet')) return AiFillFileExcel;
    if (lowerType.includes('zip') || lowerType.includes('rar') || lowerType.includes('archive')) return AiFillFileZip;
    return BsFileEarmarkText;
  };

  // Helper function to get file type color
  const getFileTypeColor = (type: string): { color: string, iconColor: string } => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pdf')) return { color: 'bg-red-100', iconColor: 'text-red-600' };
    if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg') || lowerType.includes('jpeg') || lowerType.includes('gif')) return { color: 'bg-purple-100', iconColor: 'text-purple-600' };
    if (lowerType.includes('doc') || lowerType.includes('txt')) return { color: 'bg-blue-100', iconColor: 'text-blue-600' };
    if (lowerType.includes('xls') || lowerType.includes('csv') || lowerType.includes('spreadsheet')) return { color: 'bg-green-100', iconColor: 'text-green-600' };
    if (lowerType.includes('zip') || lowerType.includes('rar') || lowerType.includes('archive')) return { color: 'bg-orange-100', iconColor: 'text-orange-600' };
    return { color: 'bg-gray-100', iconColor: 'text-gray-600' };
  };

  // AES Encryption Usage Data - now from API
  const aesUsageData = encryptionBreakdown.map((item, index) => ({
    type: item.type,
    count: item.count,
    percentage: item.percentage,
    color: index === 0 ? 'from-[#b2f7ef] to-[#97eeff]' : 'from-[#f7d6e0] to-[#f2b5d4]'
  }));

  // File Type Distribution Data - now from API
  const fileTypeData = fileTypeDistribution.map(item => {
    const colors = getFileTypeColor(item.type);
    return {
      type: item.type,
      count: item.count,
      percentage: item.percentage,
      icon: getFileTypeIcon(item.type),
      ...colors
    };
  });

  const quickStats = dashboardStats ? [
    {
      label: "Active Files",
      value: String(dashboardStats.active_files),
      icon: FiCheckCircle,
      color: "text-green-600",
    },
    {
      label: "Expired Files",
      value: String(dashboardStats.expired_files),
      icon: FiClock,
      color: "text-orange-600",
    },
    {
      label: "Total Files",
      value: String(dashboardStats.total_files),
      icon: BsFileEarmarkText,
      color: "text-blue-600",
    },
  ] : [
    {
      label: "Active Files",
      value: loading ? "..." : "0",
      icon: FiCheckCircle,
      color: "text-green-600",
    },
    {
      label: "Expired Files",
      value: loading ? "..." : "0",
      icon: FiClock,
      color: "text-orange-600",
    },
    {
      label: "Total Files",
      value: loading ? "..." : "0",
      icon: BsFileEarmarkText,
      color: "text-blue-600",
    },
  ];

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          {/* Beautiful animated loader */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            {/* Outer rotating circle */}
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            
            {/* Gradient rotating arc */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#b2f7ef] border-r-[#97eeff] animate-spin"></div>
            
            {/* Inner pulsing circle */}
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#b2f7ef] to-[#97eeff] animate-pulse opacity-20"></div>
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <HiOutlineLockClosed className="w-12 h-12 text-[#084d45] animate-pulse" />
            </div>
          </div>
          
          {/* Loading text with gradient */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#084d45] via-[#0a6d5f] to-[#084d45] bg-clip-text text-transparent animate-pulse mb-2">
            Loading Dashboard
          </h2>
          <p className="text-gray-500 text-sm">
            Fetching your encrypted files data...
          </p>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-[#b2f7ef] animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-[#97eeff] animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-[#f2b5d4] animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Welcome Banner */}
      <div className={`bg-gradient-to-r from-[#b2f7ef] via-[#97eeff] to-[#f2b5d4] rounded-2xl p-8 border-3 border-gray-200/80 shadow-lg ${!hasAnimated ? 'animate-in fade-in duration-500' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#084d45] mb-2">
              Welcome back, {user?.full_name || user?.username || 'User'}! 👋
            </h1>
            <p className="text-[#084d45]/80 text-lg">
              Secure your files with end-to-end encryption and share them safely.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={loading}
              className="bg-white/40 backdrop-blur-sm rounded-xl p-3 hover:bg-white/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh dashboard"
            >
              <FiRefreshCw className={`w-5 h-5 text-[#084d45] ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-[#084d45]/70 mb-1">Today's Date</p>
              <p className="text-2xl font-bold text-[#084d45]">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={stat.id}
            className={`${stat.color} rounded-2xl p-6 border-3 border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-default ${!hasAnimated ? 'animate-in fade-in' : ''}`}
            style={!hasAnimated ? { animationDelay: `${index * 100 + 200}ms`, animationFillMode: 'backwards' } : {}}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.iconBg} ${stat.iconColor} p-3 rounded-xl shadow-md`}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.change && (
                <span
                  className={`text-sm font-semibold px-2 py-1 rounded-lg ${
                    stat.changeType === "increase"
                      ? "bg-green-100 text-green-700"
                      : stat.changeType === "decrease"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Quick Stats - Takes 3 columns (now on left) */}
        <div className={`lg:col-span-3 bg-white rounded-2xl p-6 border-3 border-gray-200/80 shadow-sm ${!hasAnimated ? 'animate-in fade-in duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '600ms', animationFillMode: 'backwards' } : {}}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Stats</h2>
          
          {/* Stats Grid - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {quickStats.map((stat, index) => (
              <div key={index} className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200/50 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-white rounded-lg shadow-sm mb-3">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <span className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</span>
                  <span className="text-xs font-medium text-gray-600">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Storage Progress Bar */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-[#b2f7ef]/10 to-[#97eeff]/10 border-2 border-[#b2f7ef]/30 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiHardDrive className="w-5 h-5 text-[#084d45]" />
                <span className="text-sm font-semibold text-gray-900">Storage Usage</span>
              </div>
              <span className="text-sm font-bold text-[#084d45]">
                {dashboardStats ? `${((dashboardStats.storage_used_mb / dashboardStats.storage_limit_mb) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] rounded-full transition-all duration-500 shadow-inner progress-fill-animate"
                style={{ width: dashboardStats ? `${((dashboardStats.storage_used_mb / dashboardStats.storage_limit_mb) * 100).toFixed(1)}%` : '0%' }}
              ></div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">{dashboardStats ? formatStorage(dashboardStats.storage_used_mb) : '0 MB'} used</p>
              <p className="text-xs text-gray-600">{dashboardStats ? formatStorage(dashboardStats.storage_limit_mb) : '0 MB'} total</p>
            </div>
          </div>

          {/* Quick Actions - 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button 
              onClick={() => onNavigate?.('Encrypt')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[#b2f7ef]/30 to-[#b2f7ef]/10 border-2 border-[#b2f7ef]/50 text-[#084d45] font-semibold text-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 btn-click-animation glow-hover"
            >
              <FiShield className="w-4 h-4 icon-bounce-hover" />
              Encrypt File
            </button>
            <button 
              onClick={() => onNavigate?.('Inbox')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[#97eeff]/30 to-[#97eeff]/10 border-2 border-[#97eeff]/50 text-[#084d45] font-semibold text-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 btn-click-animation glow-hover"
            >
              <FiDownload className="w-4 h-4 icon-bounce-hover" />
              View Inbox
            </button>
          </div>
        </div>

        {/* Recent Activity - Takes 2 columns (now on right, single column) */}
        <div className={`lg:col-span-2 bg-white rounded-2xl p-6 border-3 border-gray-200/80 shadow-sm ${!hasAnimated ? 'animate-in fade-in duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '700ms', animationFillMode: 'backwards' } : {}}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-all duration-300 ease-in-out cursor-pointer group ${!hasAnimated ? 'stagger-item' : ''}`}
                style={!hasAnimated ? { animationDelay: `${800 + (index * 100)}ms` } : {}}
              >
                <div className={`${activity.iconBg} p-2 rounded-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                  <activity.icon className={`w-4 h-4 ${activity.iconColor} icon-bounce-hover`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {activity.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.action} • {activity.time}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Overview - Full Width */}
      <div className={`bg-white rounded-2xl p-6 border-3 border-gray-200/80 shadow-sm ${!hasAnimated ? 'animate-in fade-in duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '800ms', animationFillMode: 'backwards' } : {}}>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border-2 border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <FiCheckCircle className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">All Systems Secure</p>
                <p className="text-sm text-gray-600">{dashboardStats?.expired_files === 0 ? 'No threats detected' : `${dashboardStats?.expired_files || 0} expired files`}</p>
              </div>
            </div>
            <span className="text-green-700 font-bold">✓</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <HiOutlineLockClosed className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Active Encryptions</p>
                <p className="text-sm text-gray-600">{dashboardStats?.active_files || 0} files protected</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-700">{dashboardStats?.active_files || 0}</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 border-2 border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-200 rounded-lg">
                <FiClock className="w-6 h-6 text-orange-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Expired Files</p>
                <p className="text-sm text-gray-600">Requires attention</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-orange-700">{dashboardStats?.expired_files || 0}</span>
          </div>
        </div>
      </div>

      {/* Encryption & File Type Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AES Encryption Type Usage */}
        <div className={`bg-white rounded-2xl p-6 border-3 border-gray-200/80 shadow-sm ${!hasAnimated ? 'animate-in fade-in duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '1000ms', animationFillMode: 'backwards' } : {}}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AES Encryption Usage</h2>
          <div className="space-y-6">
            {/* Beautiful Radial Progress Bars */}
            {aesUsageData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No encryption data available yet.</p>
                <p className="text-sm text-gray-400 mt-2">Encrypt some files to see statistics here.</p>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-6">
              {aesUsageData.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="relative w-36 h-36">
                    {/* Radial Progress Circle */}
                    <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background Circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="8"
                      />
                      {/* Animated Progress Circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={`url(#gradient-${index})`}
                        strokeWidth="8"
                        strokeDasharray={`${data.percentage * 2.64} ${264 - data.percentage * 2.64}`}
                        strokeLinecap="round"
                        className="transition-all duration-1500 ease-out"
                        style={{ 
                          animationDelay: `${index * 0.3}s`,
                          filter: 'drop-shadow(0 0 8px rgba(178, 247, 239, 0.4))'
                        }}
                      />
                      {/* Gradients */}
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={index === 0 ? "#b2f7ef" : "#f7d6e0"} />
                          <stop offset="100%" stopColor={index === 0 ? "#97eeff" : "#f2b5d4"} />
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Center Content with Animation */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent animate-in fade-in duration-1000" style={{ animationDelay: `${index * 0.3 + 0.5}s` }}>
                        {data.percentage}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{data.count} files</p>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="mt-4 text-center">
                    <p className="text-lg font-bold text-gray-900">{data.type}</p>
                    <div className={`mt-2 h-1 w-20 rounded-full bg-gradient-to-r ${data.color} mx-auto`}></div>
                  </div>
                </div>
              ))}
            </div>
            )}
            
            {/* Comparison Stats */}
            {aesUsageData.length >= 2 && (
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-200">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#b2f7ef]/20 to-[#97eeff]/20 border-2 border-[#b2f7ef]/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#b2f7ef] to-[#97eeff]"></div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{aesUsageData[0].type}</p>
                </div>
                <p className="text-3xl font-bold text-[#084d45]">{aesUsageData[0].count}</p>
                <p className="text-xs text-gray-500 mt-1">Standard encryption</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#f7d6e0]/20 to-[#f2b5d4]/20 border-2 border-[#f7d6e0]/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#f7d6e0] to-[#f2b5d4]"></div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{aesUsageData[1].type}</p>
                </div>
                <p className="text-3xl font-bold text-[#8b1e3f]">{aesUsageData[1].count}</p>
                <p className="text-xs text-gray-500 mt-1">Maximum security</p>
              </div>
            </div>
            )}

            {/* Insight Card */}
            {aesUsageData.length >= 2 && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-200 rounded-lg mt-1">
                  <FiShield className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Security Insight</p>
                  <p className="text-sm text-gray-600">
                    {aesUsageData[1].percentage > 50 ? aesUsageData[1].type : aesUsageData[0].type} is your most used encryption. 
                    {aesUsageData[1].percentage > 60 
                      ? ' Excellent security practices! 🛡️' 
                      : ' Consider using AES-256 for sensitive files.'}
                  </p>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* File Type Distribution */}
        <div className={`bg-white rounded-2xl p-6 border-3 border-gray-200/80 shadow-sm ${!hasAnimated ? 'animate-in fade-in duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '1100ms', animationFillMode: 'backwards' } : {}}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">File Type Distribution</h2>
          <div className="space-y-4">
            {fileTypeData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No file type data available yet.</p>
                <p className="text-sm text-gray-400 mt-2">Upload some files to see distribution here.</p>
              </div>
            ) : (
              <>
            {fileTypeData.map((file, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${file.color} p-2 rounded-lg`}>
                      <file.icon className={`w-5 h-5 ${file.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{file.type}</p>
                      <p className="text-xs text-gray-500">{file.count} files</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{file.percentage}%</span>
                </div>
                {/* Animated Progress Bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${file.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ 
                      width: `${file.percentage}%`,
                      animationDelay: `${index * 0.1}s`
                    }}
                  ></div>
                </div>
              </div>
            ))}
            
            {/* Summary */}
            {fileTypeData.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#b2f7ef]/20 to-[#97eeff]/20 border-2 border-[#b2f7ef]/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#b2f7ef] rounded-lg">
                    <BsFileEarmarkText className="w-5 h-5 text-[#084d45]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Total Files Processed</p>
                    <p className="text-sm text-gray-600">All types combined</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-[#084d45]">{fileTypeData.reduce((sum, file) => sum + file.count, 0)}</span>
              </div>
            </div>
            )}
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
