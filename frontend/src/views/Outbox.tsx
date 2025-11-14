import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { FiUpload, FiClock, FiUser, FiFile, FiTag, FiSearch, FiFilter, FiX, FiPackage, FiAlertCircle, FiCheckCircle, FiTrash2, FiEye, FiArrowDown, FiArrowUp, FiRefreshCw } from "react-icons/fi";
import { HiOutlineLockClosed } from "react-icons/hi";
import { filesService } from '@/api';
import type { EncryptedFile } from '@/api';
import { clearDashboardCache } from './Dashboard';
import { clearInboxCache } from './Inbox';

// Utility function to clear outbox cache
export const clearOutboxCache = () => {
  sessionStorage.removeItem('outboxData');
  sessionStorage.removeItem('outboxCacheTime');
};

// UI-friendly interface
interface OutboxFile {
  id: string;
  fileName: string;
  recipients: string[];
  recipientEmails: string[];
  size: number;
  encryptionType: "AES-128" | "AES-256";
  tag: string;
  sentDate: Date;
  expiryDate: Date;
  downloads: number;
  maxDownloads?: number;
  compressed: boolean;
  selfDestruct: boolean;
  message?: string;
  processingMode: "ai" | "manual";
}

// Map API response to UI format
const mapApiFileToOutboxFile = (apiFile: EncryptedFile): OutboxFile => ({
  id: apiFile.id,
  fileName: apiFile.original_filename,
  recipients: apiFile.recipients,
  recipientEmails: apiFile.recipients, // Same as recipients
  size: apiFile.file_size,
  encryptionType: apiFile.encryption_type as "AES-128" | "AES-256",
  tag: apiFile.status,
  sentDate: new Date(apiFile.created_at),
  expiryDate: new Date(apiFile.expires_at),
  downloads: apiFile.download_count,
  maxDownloads: undefined, // API doesn't have this
  compressed: false,
  selfDestruct: apiFile.self_destruct,
  message: apiFile.message,
  processingMode: "ai", // Default
});

export default function Outbox() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<OutboxFile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<OutboxFile | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "size" | "downloads">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [fileToExtend, setFileToExtend] = useState<OutboxFile | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [outboxFiles, setOutboxFiles] = useState<OutboxFile[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Always start loading

  // Load cached outbox data
  const loadCachedOutbox = () => {
    try {
      const cached = sessionStorage.getItem('outboxData');
      if (cached) {
        const data = JSON.parse(cached);
        // Ensure all date fields are converted to Date objects
        const fixedData = data.map((file: any) => ({
          ...file,
          sentDate: typeof file.sentDate === 'string' ? new Date(file.sentDate) : file.sentDate,
          expiryDate: typeof file.expiryDate === 'string' ? new Date(file.expiryDate) : file.expiryDate,
        }));
        setOutboxFiles(fixedData);
      }
    } catch (error) {
      console.error('Failed to load cached outbox:', error);
    }
  };

  // Fetch outbox files from API
  const fetchOutboxFiles = async () => {
    try {
      setIsLoading(true); // Always set loading before API call
      const response = await filesService.getOutbox();
      console.log('Outbox API response:', response);
      // Map API response to UI format
      const mappedFiles = response.files.map(mapApiFileToOutboxFile);
      setOutboxFiles(mappedFiles);
      // Cache the data
      sessionStorage.setItem('outboxData', JSON.stringify(mappedFiles));
      sessionStorage.setItem('outboxCacheTime', Date.now().toString());
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load outbox';
      toast.error(errorMessage);
      console.error('Fetch outbox error:', error);
      // Set empty array on error to show empty state instead of white screen
      setOutboxFiles([]);
    } finally {
      setIsLoading(false); // Always stop loading after API call
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
  await fetchOutboxFiles();
    setIsRefreshing(false);
    toast.success('Outbox refreshed!');
  };

  useEffect(() => {
    const scrollableParent = document.querySelector('.overflow-y-auto');
    if (scrollableParent) {
      scrollableParent.scrollTop = 0;
    }
    const animated = sessionStorage.getItem('outboxAnimated');
    if (animated) {
      setHasAnimated(true);
    } else {
      sessionStorage.setItem('outboxAnimated', 'true');
    }

    // Always show loading spinner until API completes
    setIsLoading(true);
    // Load cached data instantly (but keep loading spinner)
    loadCachedOutbox();
    // Fetch fresh data and stop loading when done
  fetchOutboxFiles();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilExpiry = (expiryDate: Date): number => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getTagColor = (tag: string): string => {
    const colors: { [key: string]: string } = {
      "Confidential": "bg-red-100 text-red-700 border-red-300",
      "Internal": "bg-blue-100 text-blue-700 border-blue-300",
      "Legal": "bg-purple-100 text-purple-700 border-purple-300",
      "Public": "bg-green-100 text-green-700 border-green-300",
    };
    return colors[tag] || "bg-gray-100 text-gray-700 border-gray-300";
  };

  const filteredFiles = outboxFiles.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.recipients.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = filterTag === "all" || file.tag === filterTag;
    return matchesSearch && matchesTag;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "date":
        comparison = a.sentDate.getTime() - b.sentDate.getTime();
        break;
      case "size":
        comparison = a.size - b.size;
        break;
      case "downloads":
        comparison = a.downloads - b.downloads;
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (newSortBy: "date" | "size" | "downloads") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const openExtendModal = (file: OutboxFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setFileToExtend(file);
    setShowExtendModal(true);
  };

  const closeExtendModal = () => {
    setShowExtendModal(false);
    setFileToExtend(null);
  };

  const handleExtendExpiry = async (days: number) => {
    if (fileToExtend) {
      try {
        await filesService.extendExpiry(fileToExtend.id, days);
        toast.success(`Expiry extended by ${days} days!`);
        
        // Clear all caches
        clearDashboardCache();
        clearInboxCache();
        
        // Silently refresh outbox to show updated expiry
  await fetchOutboxFiles();
        closeExtendModal();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to extend expiry';
        toast.error(errorMessage);
        console.error('Extend expiry error:', error);
      }
    }
  };

  const openDetailsModal = (file: OutboxFile) => {
    setSelectedFile(file);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedFile(null);
  };

  const openDeleteModal = (file: OutboxFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setFileToDelete(null);
  };

  const handleDelete = async () => {
    if (fileToDelete) {
      try {
        await filesService.deleteFile(fileToDelete.id);
        toast.success(`${fileToDelete.fileName} deleted successfully!`);
        
        // Clear all caches
        clearDashboardCache();
        clearInboxCache();
        
        // Silently refresh outbox after deletion
  await fetchOutboxFiles();
        closeDeleteModal();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to delete file';
        toast.error(errorMessage);
        console.error('Delete error:', error);
      }
    }
  };

  const tags = ["all", ...Array.from(new Set(outboxFiles.map(f => f.tag)))];

  const totalDownloads = outboxFiles.reduce((sum, file) => sum + file.downloads, 0);
  const activeFiles = outboxFiles.filter(f => getDaysUntilExpiry(f.expiryDate) > 0).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          {/* Beautiful animated loader */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#b2f7ef] border-r-[#97eeff] animate-spin"></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#b2f7ef] to-[#97eeff] animate-pulse opacity-20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiUpload className="w-12 h-12 text-[#084d45] animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#084d45] via-[#0a6d5f] to-[#084d45] bg-clip-text text-transparent animate-pulse mb-2">
            Loading Outbox
          </h2>
          <p className="text-gray-500 text-sm">
            Fetching your sent files...
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-[#b2f7ef] animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-[#97eeff] animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-[#f2b5d4] animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: If not loading and no files, show empty outbox UI
  if (!isLoading && outboxFiles.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Your Outbox is Empty</h2>
          <p className="text-gray-500 text-sm mb-4">Sent files will appear here once you send them.</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] text-[#084d45] rounded-lg font-semibold hover:shadow-lg transition-all duration-200 mt-2"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      {/* Header */}
      <div className={`flex items-start justify-between ${!hasAnimated ? 'animate-in fade-in slide-in-from-top-4 duration-700' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Outbox</h1>
          <p className="text-gray-600">Track and manage files you've sent</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2.5 bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] text-[#084d45] rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-click-animation"
          title="Refresh outbox"
        >
          <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''} icon-spin-hover`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className={`bg-gradient-to-br from-[#b2f7ef]/30 to-[#97eeff]/30 rounded-2xl p-6 border-2 border-[#b2f7ef]/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '100ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sent</p>
              <p className="text-3xl font-bold text-gray-900">{outboxFiles.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#b2f7ef]/50 rounded-lg flex items-center justify-center">
              <FiUpload className="w-6 h-6 text-[#084d45]" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-[#f2b5d4]/30 to-[#f7d6e0]/30 rounded-2xl p-6 border-2 border-[#f2b5d4]/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '200ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Files</p>
              <p className="text-3xl font-bold text-gray-900">{activeFiles}</p>
            </div>
            <div className="w-12 h-12 bg-[#f2b5d4]/50 rounded-lg flex items-center justify-center">
              <FiFile className="w-6 h-6 text-[#480d2a]" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-[#97eeff]/20 to-[#b2f7ef]/20 rounded-2xl p-6 border-2 border-[#97eeff]/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '300ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Downloads</p>
              <p className="text-3xl font-bold text-gray-900">{totalDownloads}</p>
            </div>
            <div className="w-12 h-12 bg-[#97eeff]/50 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-[#084d45]" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-yellow-100/50 to-yellow-200/50 rounded-2xl p-6 border-2 border-yellow-300/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '400ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Not Downloaded</p>
              <p className="text-3xl font-bold text-gray-900">{outboxFiles.filter(f => f.downloads === 0).length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-300/50 rounded-lg flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-yellow-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className={`bg-white rounded-2xl p-6 border-2 border-gray-200/80 shadow-sm ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '500ms', animationFillMode: 'backwards' } : {}}>
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files or recipients..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#b2f7ef] transition-colors duration-200"
            />
          </div>

          {/* Filter Tags and Sort Options */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            {/* Filter Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <FiFilter className="text-gray-600 w-5 h-5" />
              <div className="flex gap-2 flex-wrap">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 capitalize ${
                      filterTag === tag
                        ? 'bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] text-[#084d45]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-semibold">Sort by:</span>
              <button
                onClick={() => toggleSort("date")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1 ${
                  sortBy === "date"
                    ? 'bg-[#f2b5d4]/30 text-[#480d2a]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Date {sortBy === "date" && (sortOrder === "asc" ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />)}
              </button>
              <button
                onClick={() => toggleSort("size")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1 ${
                  sortBy === "size"
                    ? 'bg-[#f2b5d4]/30 text-[#480d2a]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Size {sortBy === "size" && (sortOrder === "asc" ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />)}
              </button>
              <button
                onClick={() => toggleSort("downloads")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1 ${
                  sortBy === "downloads"
                    ? 'bg-[#f2b5d4]/30 text-[#480d2a]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Downloads {sortBy === "downloads" && (sortOrder === "asc" ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className={`bg-white rounded-2xl border-2 border-gray-200/80 shadow-sm overflow-hidden ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '600ms', animationFillMode: 'backwards' } : {}}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Sent Files</h2>
          
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <FiFile className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No files found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFiles.map((file, index) => {
                const daysUntilExpiry = getDaysUntilExpiry(file.expiryDate);
                const isExpiringSoon = daysUntilExpiry <= 3;
                const hasBeenDownloaded = file.downloads > 0;
                const isSelfDestructDownloaded = file.selfDestruct && file.downloads > 0;
                
                return (
                  <div
                    key={file.id}
                    className={`p-4 border-2 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer ${
                      hasBeenDownloaded
                        ? 'border-[#b2f7ef]/50 bg-gradient-to-r from-[#b2f7ef]/5 to-[#97eeff]/5'
                        : 'border-gray-200 bg-gray-50/50'
                    } ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom-2 duration-500' : ''}`}
                    style={!hasAnimated ? { animationDelay: `${700 + index * 50}ms`, animationFillMode: 'backwards' } : {}}
                    onClick={() => openDetailsModal(file)}
                  >
                    <div className="flex items-start gap-4">
                      {/* File Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        hasBeenDownloaded ? 'bg-gradient-to-br from-[#b2f7ef] to-[#97eeff]' : 'bg-gray-200'
                      }`}>
                        <FiFile className={`w-6 h-6 ${hasBeenDownloaded ? 'text-[#084d45]' : 'text-gray-500'}`} />
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate flex items-center gap-2">
                              {file.fileName}
                              {file.downloads === 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                  Not Downloaded
                                </span>
                              )}
                              {isSelfDestructDownloaded && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                  File Deleted from Cloud
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <FiUser className="w-3 h-3" />
                                {file.recipients.length} recipient{file.recipients.length > 1 ? 's' : ''}
                              </span>
                              <span>•</span>
                              <span>{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                {formatDate(file.sentDate)}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FiEye className="w-3 h-3" />
                                {file.downloads} download{file.downloads !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons - Hide extend button if self-destruct downloaded */}
                          <div className="flex items-center gap-2">
                            {!isSelfDestructDownloaded && (
                              <button
                                onClick={(e) => openExtendModal(file, e)}
                                className="p-2 hover:bg-green-100 rounded-lg transition-all duration-200 text-green-600"
                                title="Extend expiry"
                              >
                                <FiRefreshCw className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => openDeleteModal(file, e)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-all duration-200 text-red-600"
                              title="Delete file"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Tags and Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTagColor(file.tag)}`}>
                            <FiTag className="w-3 h-3 inline mr-1" />
                            {file.tag}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                            <HiOutlineLockClosed className="w-3 h-3 inline mr-1" />
                            {file.encryptionType}
                          </span>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300 capitalize">
                            {file.processingMode} Mode
                          </span>
                          {file.compressed && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                              <FiPackage className="w-3 h-3 inline mr-1" />
                              Compressed
                            </span>
                          )}
                          {file.selfDestruct && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              file.downloads > 0 
                                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                                : 'bg-red-100 text-red-700 border border-red-300'
                            }`}>
                              <FiAlertCircle className="w-3 h-3 inline mr-1" />
                              {file.downloads > 0 ? 'Downloaded & Deleted' : 'Self-Destruct'}
                            </span>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isExpiringSoon
                              ? 'bg-red-100 text-red-700 border border-red-300'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          }`}>
                            <FiClock className="w-3 h-3 inline mr-1" />
                            Expires in {daysUntilExpiry} days
                          </span>
                        </div>

                        {/* Message Preview */}
                        {file.message && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            "{file.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={closeDetailsModal}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">File Details</h3>
              <button
                onClick={closeDetailsModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <FiX className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">File Name</p>
                <p className="font-semibold text-gray-900">{selectedFile.fileName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">File Size</p>
                  <p className="font-semibold text-gray-900">{formatFileSize(selectedFile.size)}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Downloads</p>
                  <p className="font-semibold text-gray-900">
                    {selectedFile.downloads}
                    {selectedFile.maxDownloads && ` / ${selectedFile.maxDownloads}`}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Recipients ({selectedFile.recipients.length})</p>
                <div className="space-y-2">
                  {selectedFile.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{recipient}</p>
                        <p className="text-xs text-gray-600">{selectedFile.recipientEmails[index]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Sent Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedFile.sentDate)}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedFile.expiryDate)}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Security Details</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTagColor(selectedFile.tag)}`}>
                    {selectedFile.tag}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                    {selectedFile.encryptionType}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300 capitalize">
                    {selectedFile.processingMode} Mode
                  </span>
                  {selectedFile.compressed && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                      Compressed
                    </span>
                  )}
                  {selectedFile.selfDestruct && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                      Self-Destruct After Download
                    </span>
                  )}
                </div>
              </div>

              {selectedFile.message && (
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <p className="text-sm text-blue-600 mb-1 font-semibold">Message to Recipients</p>
                  <p className="text-gray-900">{selectedFile.message}</p>
                </div>
              )}

              {/* Show indicator if self-destruct file was already downloaded */}
              {selectedFile.selfDestruct && selectedFile.downloads > 0 && (
                <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <p className="text-sm text-orange-600 mb-1 font-semibold flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4" />
                    File Downloaded & Deleted from Cloud
                  </p>
                  <p className="text-gray-700 text-sm">This self-destruct file has been downloaded by a recipient and is no longer available in cloud storage. You can no longer extend its expiry.</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={(e) => {
                    closeDetailsModal();
                    openDeleteModal(selectedFile, e);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FiTrash2 className="w-5 h-5" />
                  Delete File
                </button>
                <button
                  onClick={closeDetailsModal}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] text-[#084d45] font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={closeDeleteModal}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete File?</h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete <span className="font-semibold">{fileToDelete.fileName}</span>? This action cannot be undone and recipients will no longer be able to download this file.
            </p>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Expiry Modal */}
      {showExtendModal && fileToExtend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={closeExtendModal}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <FiRefreshCw className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Extend Expiry Date</h3>
            <p className="text-gray-600 text-center mb-6">
              Extend the expiration date for <span className="font-semibold">{fileToExtend.fileName}</span>
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleExtendExpiry(3)}
                className="w-full px-4 py-3 border-2 border-[#b2f7ef] text-gray-900 font-semibold rounded-lg hover:bg-[#b2f7ef]/10 transition-all duration-200"
              >
                Extend by 3 days
              </button>
              <button
                onClick={() => handleExtendExpiry(7)}
                className="w-full px-4 py-3 border-2 border-[#b2f7ef] text-gray-900 font-semibold rounded-lg hover:bg-[#b2f7ef]/10 transition-all duration-200"
              >
                Extend by 7 days
              </button>
              <button
                onClick={() => handleExtendExpiry(14)}
                className="w-full px-4 py-3 border-2 border-[#b2f7ef] text-gray-900 font-semibold rounded-lg hover:bg-[#b2f7ef]/10 transition-all duration-200"
              >
                Extend by 14 days
              </button>
            </div>

            <button
              onClick={closeExtendModal}
              className="w-full px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
