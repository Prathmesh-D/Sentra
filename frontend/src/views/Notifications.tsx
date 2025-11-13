import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { FiX, FiBell, FiDownload, FiUpload, FiShield, FiAlertCircle, FiCheckCircle, FiClock, FiTrash2, FiFilter } from "react-icons/fi";

type NotificationType = "download" | "upload" | "security" | "expiry" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionLink?: string;
}

export default function Notifications() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [filterType, setFilterType] = useState<NotificationType | "all">("all");
  const [showReadNotifications, setShowReadNotifications] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "download",
      title: "File Downloaded",
      message: "Alice Williams downloaded 'Budget_2025.xlsx' from your outbox",
      timestamp: new Date(2025, 10, 4, 10, 30),
      read: false,
      actionLabel: "View File",
      actionLink: "/outbox"
    },
    {
      id: "2",
      type: "upload",
      title: "New File Received",
      message: "John Smith sent you 'Financial_Report_Q4.pdf'",
      timestamp: new Date(2025, 10, 4, 9, 15),
      read: false,
      actionLabel: "Download",
      actionLink: "/inbox"
    },
    {
      id: "3",
      type: "expiry",
      title: "File Expiring Soon",
      message: "Your file 'NDA_Document.pdf' will expire in 2 days",
      timestamp: new Date(2025, 10, 4, 8, 0),
      read: false,
      actionLabel: "Extend",
      actionLink: "/outbox"
    },
    {
      id: "4",
      type: "security",
      title: "Security Alert",
      message: "Unusual login attempt detected from new device",
      timestamp: new Date(2025, 10, 3, 22, 45),
      read: true,
      actionLabel: "Review",
      actionLink: "/settings"
    },
    {
      id: "5",
      type: "download",
      title: "File Downloaded",
      message: "Bob Martinez downloaded 'Budget_2025.xlsx' from your outbox",
      timestamp: new Date(2025, 10, 3, 18, 20),
      read: true,
      actionLabel: "View File",
      actionLink: "/outbox"
    },
    {
      id: "6",
      type: "upload",
      title: "New File Received",
      message: "Sarah Johnson sent you 'Project_Proposal.docx'",
      timestamp: new Date(2025, 10, 3, 14, 30),
      read: true,
      actionLabel: "Download",
      actionLink: "/inbox"
    },
    {
      id: "7",
      type: "system",
      title: "System Update",
      message: "Sentra has been updated with new security features",
      timestamp: new Date(2025, 10, 3, 10, 0),
      read: true,
      actionLabel: "Learn More",
      actionLink: "/getting-started"
    },
    {
      id: "8",
      type: "expiry",
      title: "File Expired",
      message: "Your file 'Old_Contract.pdf' has expired and been removed",
      timestamp: new Date(2025, 10, 2, 16, 0),
      read: true,
    },
  ]);

  useEffect(() => {
    const scrollableParent = document.querySelector('.overflow-y-auto');
    if (scrollableParent) {
      scrollableParent.scrollTop = 0;
    }
    const animated = sessionStorage.getItem('notificationsAnimated');
    if (animated) {
      setHasAnimated(true);
    } else {
      sessionStorage.setItem('notificationsAnimated', 'true');
    }
  }, []);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "download":
        return <FiDownload className="w-5 h-5" />;
      case "upload":
        return <FiUpload className="w-5 h-5" />;
      case "security":
        return <FiShield className="w-5 h-5" />;
      case "expiry":
        return <FiClock className="w-5 h-5" />;
      case "system":
        return <FiBell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "download":
        return "bg-green-100 text-green-700";
      case "upload":
        return "bg-blue-100 text-blue-700";
      case "security":
        return "bg-red-100 text-red-700";
      case "expiry":
        return "bg-yellow-100 text-yellow-700";
      case "system":
        return "bg-purple-100 text-purple-700";
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read!');
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Notification deleted!');
  };

  const clearAllRead = () => {
    const readCount = notifications.filter(n => n.read).length;
    setNotifications(notifications.filter(n => !n.read));
    toast.success(`${readCount} read notifications cleared!`);
  };

  const filteredNotifications = notifications
    .filter(n => filterType === "all" || n.type === filterType)
    .filter(n => showReadNotifications || !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const notificationTypes: { value: NotificationType | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "download", label: "Downloads" },
    { value: "upload", label: "Uploads" },
    { value: "security", label: "Security" },
    { value: "expiry", label: "Expiry" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      {/* Header */}
      <div className={`${!hasAnimated ? 'animate-in fade-in slide-in-from-top-4 duration-700' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with your file activities and system alerts</p>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-gradient-to-r from-[#f2b5d4] to-[#f7d6e0] text-[#480d2a] font-bold rounded-full pulse-soft">
                {unreadCount} New
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`bg-gradient-to-br from-[#b2f7ef]/30 to-[#97eeff]/30 rounded-2xl p-6 border-2 border-[#b2f7ef]/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '100ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{notifications.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#b2f7ef]/50 rounded-lg flex items-center justify-center">
              <FiBell className="w-6 h-6 text-[#084d45]" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-[#f2b5d4]/30 to-[#f7d6e0]/30 rounded-2xl p-6 border-2 border-[#f2b5d4]/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '200ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Unread</p>
              <p className="text-3xl font-bold text-gray-900">{unreadCount}</p>
            </div>
            <div className="w-12 h-12 bg-[#f2b5d4]/50 rounded-lg flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-[#480d2a]" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-green-100/50 to-green-200/50 rounded-2xl p-6 border-2 border-green-300/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '300ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Downloads</p>
              <p className="text-3xl font-bold text-gray-900">{notifications.filter(n => n.type === "download").length}</p>
            </div>
            <div className="w-12 h-12 bg-green-300/50 rounded-lg flex items-center justify-center">
              <FiDownload className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-blue-100/50 to-blue-200/50 rounded-2xl p-6 border-2 border-blue-300/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '400ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Uploads</p>
              <p className="text-3xl font-bold text-gray-900">{notifications.filter(n => n.type === "upload").length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-300/50 rounded-lg flex items-center justify-center">
              <FiUpload className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className={`bg-white rounded-2xl p-6 border-2 border-gray-200/80 shadow-sm ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '500ms', animationFillMode: 'backwards' } : {}}>
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <FiFilter className="text-gray-600 w-5 h-5" />
            {notificationTypes.map(type => (
              <button
                key={type.value}
                onClick={() => {
                  if (type.value !== filterType) {
                    setFilterType(type.value);
                    setAnimationKey(prev => prev + 1);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 btn-click-animation ${
                  filterType === type.value
                    ? 'bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] text-[#084d45]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showReadNotifications}
                onChange={(e) => setShowReadNotifications(e.target.checked)}
                className="w-4 h-4 text-[#b2f7ef] border-gray-300 rounded focus:ring-[#b2f7ef]"
              />
              <span className="text-sm font-semibold text-gray-700">Show Read</span>
            </label>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-[#b2f7ef]/20 text-[#084d45] font-semibold rounded-lg hover:bg-[#b2f7ef]/30 transition-all duration-200 flex items-center gap-2 btn-click-animation"
              >
                <FiCheckCircle className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            {notifications.filter(n => n.read).length > 0 && (
              <button
                onClick={clearAllRead}
                className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-all duration-200 flex items-center gap-2 btn-click-animation"
              >
                <FiTrash2 className="w-4 h-4 icon-bounce-hover" />
                Clear Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className={`bg-white rounded-2xl border-2 border-gray-200/80 shadow-sm overflow-hidden ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '600ms', animationFillMode: 'backwards' } : {}}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {filterType === "all" ? "All Notifications" : `${notificationTypes.find(t => t.value === filterType)?.label} Notifications`}
          </h2>
          
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications found</p>
            </div>
          ) : (
            <div key={`notifications-list-${animationKey}`} className="space-y-3 tab-transition">
              {filteredNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-4 border-2 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer card-hover-animation ${
                    notification.read
                      ? 'border-gray-200 bg-gray-50/50'
                      : 'border-[#f2b5d4]/50 bg-gradient-to-r from-[#f2b5d4]/5 to-[#f7d6e0]/5'
                  } ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom-2 duration-500' : ''}`}
                  style={!hasAnimated ? { animationDelay: `${700 + index * 50}ms`, animationFillMode: 'backwards' } : {}}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)} icon-bounce-hover`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            {notification.title}
                            {!notification.read && (
                              <span className="inline-flex w-2 h-2 bg-[#f2b5d4] rounded-full"></span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-all duration-200 text-red-600"
                          title="Delete notification"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Action Button */}
                      {notification.actionLabel && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Navigate to:", notification.actionLink);
                            // TODO: Implement navigation
                          }}
                          className="mt-2 px-4 py-2 bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] text-[#084d45] font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-sm btn-click-animation"
                        >
                          {notification.actionLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
