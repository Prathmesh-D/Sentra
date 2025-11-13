import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { FiDownload, FiClock, FiUser, FiFile, FiTag, FiSearch, FiFilter, FiX, FiPackage, FiAlertCircle, FiCheckCircle, FiArrowDown, FiArrowUp, FiRefreshCw } from "react-icons/fi";
import { HiOutlineLockClosed } from "react-icons/hi";
import { filesService, encryptionService } from '@/api';
import type { EncryptedFile } from '@/api';
import { clearDashboardCache } from './Dashboard';
import { clearOutboxCache } from './Outbox';

// Utility function to clear inbox cache
export const clearInboxCache = () => {
  sessionStorage.removeItem('inboxData');
  sessionStorage.removeItem('inboxCacheTime');
};

// UI-friendly interface
interface InboxFile {
  id: string;
  fileName: string;
  sender: string;
  senderEmail: string;
  size: number;
  encryptionType: "AES-128" | "AES-256";
  tag: string;
  receivedDate: Date;
  expiryDate: Date;
  downloaded: boolean;
  compressed: boolean;
  selfDestruct: boolean;
  message?: string;
}

// Map API response to UI format
const mapApiFileToInboxFile = (apiFile: EncryptedFile): InboxFile => ({
  id: apiFile.id,
  fileName: apiFile.original_filename,
  sender: apiFile.sender,
  senderEmail: apiFile.sender, // API doesn't separate email, using username
  size: apiFile.file_size,
  encryptionType: apiFile.encryption_type as "AES-128" | "AES-256",
  tag: apiFile.status, // Using status as tag for now
  receivedDate: new Date(apiFile.created_at),
  expiryDate: new Date(apiFile.expires_at),
  downloaded: apiFile.download_count > 0,
  compressed: false, // API doesn't return this yet
  selfDestruct: apiFile.self_destruct,
  message: apiFile.message,
});

export default function Inbox() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<InboxFile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "size" | "sender">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inboxFiles, setInboxFiles] = useState<InboxFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached inbox data
  const loadCachedInbox = () => {
    try {
      const cached = sessionStorage.getItem('inboxData');
      if (cached) {
        const data = JSON.parse(cached);
        setInboxFiles(data);
      }
    } catch (error) {
      console.error('Failed to load cached inbox:', error);
    }
  };

  // Fetch inbox files from API
  const fetchInboxFiles = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await filesService.getInbox();
      // Map API response to UI format
      const mappedFiles = response.files.map(mapApiFileToInboxFile);
      setInboxFiles(mappedFiles);
      
      // Cache the data
      sessionStorage.setItem('inboxData', JSON.stringify(mappedFiles));
      sessionStorage.setItem('inboxCacheTime', Date.now().toString());
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load inbox';
      if (!silent) toast.error(errorMessage);
      console.error('Fetch inbox error:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInboxFiles(false);
    setIsRefreshing(false);
    toast.success('Inbox refreshed!');
  };

  useEffect(() => {
    const scrollableParent = document.querySelector('.overflow-y-auto');
    if (scrollableParent) {
      scrollableParent.scrollTop = 0;
    }
    const animated = sessionStorage.getItem('inboxAnimated');
    if (animated) {
      setHasAnimated(true);
    } else {
      sessionStorage.setItem('inboxAnimated', 'true');
    }
    
  // Load cached data instantly (but keep loading spinner)
  loadCachedInbox();
  // Fetch fresh data and stop loading when done
  fetchInboxFiles(false);
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

  const filteredFiles = inboxFiles.filter(file => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.sender.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === "all" || file.tag === filterTag;
    return matchesSearch && matchesTag;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "date":
        comparison = a.receivedDate.getTime() - b.receivedDate.getTime();
        break;
      case "size":
        comparison = a.size - b.size;
        break;
      case "sender":
        comparison = a.sender.localeCompare(b.sender);
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const toggleSort = (newSortBy: "date" | "size" | "sender") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const handleDownload = async (file: InboxFile) => {
    const toastId = toast.loading('Decrypting and downloading file...');
    try {
      await encryptionService.downloadDecryptedFile(file.id, file.fileName);
      toast.success(`${file.fileName} downloaded successfully!`, { id: toastId });
      
      // Clear all caches (outbox too, in case of self-destruct affecting sender's view)
      clearDashboardCache();
      clearOutboxCache();
      
      // Silently refresh inbox to update download status
      await fetchInboxFiles(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Download failed';
      toast.error(errorMessage, { id: toastId });
      console.error('Download error:', error);
    }
  };

  const openDetailsModal = (file: InboxFile) => {
    setSelectedFile(file);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedFile(null);
  };

  const tags = ["all", ...Array.from(new Set(inboxFiles.map(f => f.tag)))];

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
              <FiDownload className="w-12 h-12 text-[#084d45] animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#084d45] via-[#0a6d5f] to-[#084d45] bg-clip-text text-transparent animate-pulse mb-2">
            Loading Inbox
          </h2>
          <p className="text-gray-500 text-sm">
            Fetching your received files...
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

  // Fallback: If not loading and no files, show empty inbox UI
  if (!isLoading && inboxFiles.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Your Inbox is Empty</h2>
          <p className="text-gray-500 text-sm mb-4">Received files will appear here once someone sends you a file.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inbox</h1>
          <p className="text-gray-600">Manage and download your encrypted files</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2.5 bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] text-[#084d45] rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-click-animation"
          title="Refresh inbox"
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
              <p className="text-sm text-gray-600 mb-1">Total Files</p>
              <p className="text-3xl font-bold text-gray-900">{inboxFiles.length}</p>
            </div>
            <div className="w-12 h-12 bg-[#b2f7ef]/50 rounded-lg flex items-center justify-center">
              <FiFile className="w-6 h-6 text-[#084d45]" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-[#f2b5d4]/30 to-[#f7d6e0]/30 rounded-2xl p-6 border-2 border-[#f2b5d4]/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '200ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">New Files</p>
              <p className="text-3xl font-bold text-gray-900">{inboxFiles.filter(f => !f.downloaded).length}</p>
            </div>
            <div className="w-12 h-12 bg-[#f2b5d4]/50 rounded-lg flex items-center justify-center">
              <FiDownload className="w-6 h-6 text-[#480d2a]" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-[#97eeff]/20 to-[#b2f7ef]/20 rounded-2xl p-6 border-2 border-[#97eeff]/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '300ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Downloaded</p>
              <p className="text-3xl font-bold text-gray-900">{inboxFiles.filter(f => f.downloaded).length}</p>
            </div>
            <div className="w-12 h-12 bg-[#97eeff]/50 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-[#084d45]" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-red-100/50 to-red-200/50 rounded-2xl p-6 border-2 border-red-300/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '400ms', animationFillMode: 'backwards' } : {}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expiring Soon</p>
              <p className="text-3xl font-bold text-gray-900">{inboxFiles.filter(f => getDaysUntilExpiry(f.expiryDate) <= 3).length}</p>
            </div>
            <div className="w-12 h-12 bg-red-300/50 rounded-lg flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-red-700" />
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
              placeholder="Search files or senders..."
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
                onClick={() => toggleSort("sender")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-1 ${
                  sortBy === "sender"
                    ? 'bg-[#f2b5d4]/30 text-[#480d2a]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sender {sortBy === "sender" && (sortOrder === "asc" ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className={`bg-white rounded-2xl border-2 border-gray-200/80 shadow-sm overflow-hidden ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '600ms', animationFillMode: 'backwards' } : {}}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Received Files</h2>
          
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
                const isSelfDestructDownloaded = file.selfDestruct && file.downloaded;
                
                return (
                  <div
                    key={file.id}
                    className={`p-4 border-2 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer ${
                      file.downloaded
                        ? 'border-gray-200 bg-gray-50/50'
                        : 'border-[#b2f7ef]/50 bg-gradient-to-r from-[#b2f7ef]/5 to-[#97eeff]/5'
                    } ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom-2 duration-500' : ''}`}
                    style={!hasAnimated ? { animationDelay: `${700 + index * 50}ms`, animationFillMode: 'backwards' } : {}}
                    onClick={() => openDetailsModal(file)}
                  >
                    <div className="flex items-start gap-4">
                      {/* File Icon */}
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        file.downloaded ? 'bg-gray-200' : 'bg-gradient-to-br from-[#b2f7ef] to-[#97eeff]'
                      }`}>
                        <FiFile className={`w-6 h-6 ${file.downloaded ? 'text-gray-500' : 'text-[#084d45]'}`} />
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate flex items-center gap-2">
                              {file.fileName}
                              {!file.downloaded && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#f2b5d4]/30 text-[#480d2a]">
                                  New
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
                                {file.sender}
                              </span>
                              <span>•</span>
                              <span>{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                {formatDate(file.receivedDate)}
                              </span>
                            </div>
                          </div>

                          {/* Download Button - Hidden if self-destruct downloaded */}
                          {!isSelfDestructDownloaded && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(file);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] text-[#084d45] font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center gap-2"
                            >
                              <FiDownload className="w-4 h-4" />
                              Download
                            </button>
                          )}
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
                          {file.compressed && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-300">
                              <FiPackage className="w-3 h-3 inline mr-1" />
                              Compressed
                            </span>
                          )}
                          {file.selfDestruct && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                              <FiAlertCircle className="w-3 h-3 inline mr-1" />
                              Self-Destruct
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
                  <p className="text-sm text-gray-600 mb-1">Sender</p>
                  <p className="font-semibold text-gray-900">{selectedFile.sender}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedFile.senderEmail}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">File Size</p>
                  <p className="font-semibold text-gray-900">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Received Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedFile.receivedDate)}</p>
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
                  <p className="text-sm text-blue-600 mb-1 font-semibold">Message from Sender</p>
                  <p className="text-gray-900">{selectedFile.message}</p>
                </div>
              )}

              {/* Show indicator if self-destruct file was already downloaded */}
              {selectedFile.selfDestruct && selectedFile.downloaded && (
                <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                  <p className="text-sm text-orange-600 mb-1 font-semibold flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4" />
                    File Deleted from Cloud
                  </p>
                  <p className="text-gray-700 text-sm">This self-destruct file has already been downloaded and is no longer available in cloud storage.</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeDetailsModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  Close
                </button>
                {/* Hide download button if self-destruct file was already downloaded */}
                {!(selectedFile.selfDestruct && selectedFile.downloaded) && (
                  <button
                    onClick={() => handleDownload(selectedFile)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] text-[#084d45] font-semibold rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <FiDownload className="w-5 h-5" />
                    Download File
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
