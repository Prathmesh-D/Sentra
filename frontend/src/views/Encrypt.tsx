import { useState, useEffect, useMemo, useRef } from "react";
import toast from 'react-hot-toast';
import { FiUpload, FiUploadCloud, FiX, FiShield, FiClock, FiUser, FiFile, FiTag, FiMail, FiMessageSquare, FiUserPlus, FiUsers } from "react-icons/fi";
import { HiOutlineLockClosed } from "react-icons/hi";
import { encryptionService, contactsService, type Contact } from '@/api';
import { clearDashboardCache } from './Dashboard';
import { clearOutboxCache } from './Outbox';
import { requestTabCountsRefresh } from '@/hooks/use-tab-counts';

interface Recipient {
  name: string;
  nickname: string;
  email: string;
  publicKey?: string; // Optional since it's auto-managed
}

const AUTO_AES_128_MAX_BYTES = 5 * 1024 * 1024;
const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

const debugError = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

const getFileExtension = (filename: string) => {
  const idx = filename.lastIndexOf('.');
  if (idx === -1 || idx === filename.length - 1) return "";
  return filename.slice(idx + 1).toLowerCase();
};

const getTagForExtension = (ext: string) => {
  switch (ext) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
      return "image";
    case "mp4":
    case "mkv":
    case "avi":
    case "mov":
      return "video";
    case "mp3":
    case "wav":
    case "flac":
      return "audio";
    case "pdf":
      return "pdf";
    case "doc":
    case "docx":
      return "word";
    case "xls":
    case "xlsx":
      return "excel";
    case "zip":
    case "rar":
    case "7z":
      return "archive";
    default:
      return "file";
  }
};

const getAutoExpiryDays = (files: File[]) => {
  if (files.length === 0) return 3;
  const perFileExpiry = files.map((file) => {
    const tag = getTagForExtension(getFileExtension(file.name));
    switch (tag) {
      case "image":
      case "video":
        return 7;
      case "pdf":
      case "word":
      case "excel":
        return 14;
      case "archive":
        return 5;
      default:
        return 3;
    }
  });
  return Math.min(...perFileExpiry);
};


const getAutoEncryptionType = (files: File[]) => {
  if (files.some((file) => file.size >= AUTO_AES_128_MAX_BYTES)) {
    return "AES-256";
  }
  return "AES-128";
};

const getSecurityLabel = (aesType: "AES-128" | "AES-256", selfDestruct: boolean, expiryDays: number) => {
  let score = aesType === "AES-256" ? 2 : 1;
  if (selfDestruct) score += 1;
  if (expiryDays <= 7) score += 1;
  return score >= 3 ? "High Protection" : "Standard Protection";
};

export default function Encrypt() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [recipientForm, setRecipientForm] = useState({
    name: "",
    nickname: "",
    email: "",
    publicKey: "",
  });
  const [encryptionType, setEncryptionType] = useState<"AES-128" | "AES-256">("AES-256");
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [processingMode, setProcessingMode] = useState<"manual" | "auto">("auto");
  const [manualTag, setManualTag] = useState("");
  const [message, setMessage] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [autoExpiryOverride, setAutoExpiryOverride] = useState(false);
  const [autoSelfDestructOverride, setAutoSelfDestructOverride] = useState(false);
  const [showAutoInfo, setShowAutoInfo] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successFading, setSuccessFading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoDefaults = useMemo(() => {
    const expiry = getAutoExpiryDays(selectedFiles);
    const autoSelfDestruct = recipients.length >= 2;
    const autoAes = getAutoEncryptionType(selectedFiles);
    return {
      expiryDays: expiry,
      selfDestruct: autoSelfDestruct,
      aesType: autoAes,
      securityLabel: getSecurityLabel(autoAes, autoSelfDestruct, expiry),
    };
  }, [selectedFiles, recipients.length]);

  useEffect(() => {
    if (processingMode !== "auto") {
      return;
    }
    setAutoExpiryOverride(false);
    setAutoSelfDestructOverride(false);
  }, [processingMode]);

  useEffect(() => {
    if (processingMode !== "auto") {
      return;
    }
    if (!autoExpiryOverride) {
      setExpiryDays(autoDefaults.expiryDays);
    }
    if (!autoSelfDestructOverride) {
      setSelfDestruct(autoDefaults.selfDestruct);
    }
  }, [processingMode, autoDefaults, autoExpiryOverride, autoSelfDestructOverride]);

  useEffect(() => {
    // Scroll to top when component mounts - target the scrollable parent
    const scrollableParent = document.querySelector('.overflow-y-auto');
    if (scrollableParent) {
      scrollableParent.scrollTop = 0;
    }
    
    // Check if animations have already played in this session
    const animated = sessionStorage.getItem('encryptAnimated');
    if (animated) {
      setHasAnimated(true);
    } else {
      sessionStorage.setItem('encryptAnimated', 'true');
    }

    // Load saved contacts
    loadSavedContacts();
  }, []);

  const loadSavedContacts = async () => {
    setLoadingContacts(true);
    try {
      const response = await contactsService.getContacts();
      setSavedContacts(response.contacts || []);
    } catch (error: any) {
      debugError('Failed to load contacts:', error);
      // Don't show error toast - contacts might not be implemented yet
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (window.confirm(`Remove ${contact.contact_full_name || contact.contact_username} from contacts?`)) {
      try {
        await contactsService.deleteContact(contact._id);
        toast.success('Contact removed successfully');
        // Reload contacts
        await loadSavedContacts();
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Failed to delete contact';
        toast.error(errorMessage);
        debugError('Delete contact error:', error);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const openRecipientDialog = () => {
    setShowRecipientDialog(true);
  };

  const closeRecipientDialog = () => {
    setShowRecipientDialog(false);
    setRecipientForm({
      name: "",
      nickname: "",
      email: "",
      publicKey: "",
    });
  };

  const handleRecipientFormChange = (field: string, value: string) => {
    setRecipientForm({ ...recipientForm, [field]: value });
  };

  const addRecipient = async () => {
    debugLog("addRecipient called", { recipientForm, saveRecipient });
    // Only require name, nickname (username), and email
    if (recipientForm.name && recipientForm.nickname && recipientForm.email) {
      setRecipients([...recipients, { ...recipientForm }]);

      if (saveRecipient) {
        try {
          await contactsService.addContact({
            name: recipientForm.name,
            email: recipientForm.email,
            nickname: recipientForm.nickname,
            public_key: recipientForm.publicKey || '',
          });
          await loadSavedContacts();
          toast.success('Recipient added and saved to contacts!');
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || error.message || 'Failed to save recipient';
          toast.error(errorMessage);
        }
      } else {
        toast.success('Recipient added successfully!');
      }

      closeRecipientDialog();
    } else {
      debugLog("Validation failed - showing error toast");
      toast.error('Please fill in all required fields (Name, Username, Email)');
    }
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const addContactAsRecipient = (contact: Contact) => {
    // Check if already added
    if (recipients.some(r => r.nickname === contact.contact_username)) {
      toast.error('Recipient already added');
      return;
    }

    const newRecipient: Recipient = {
      name: contact.contact_full_name || contact.contact_username,
      nickname: contact.contact_username,
      email: contact.contact_email,
    };

    setRecipients([...recipients, newRecipient]);
    toast.success(`Added ${contact.contact_full_name || contact.contact_username}`);
  };

  const handleEncrypt = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to encrypt');
      return;
    }
    
    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    
    // Start encryption process
    const toastId = toast.loading('Encrypting files...');
    setIsEncrypting(true);
    setCurrentFileIndex(0);
    setCurrentFileName("");
    
    try {
      // Encrypt each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentFileIndex(i + 1);
        setCurrentFileName(file.name);
        
        // Prepare recipient usernames - use nickname field which stores the actual username
        const recipientUsernames = recipients
          .map(r => (r.nickname || '').trim())
          .filter(Boolean);

        debugLog('[encrypt] payload', {
          fileName: file.name,
          recipients: recipientUsernames,
          recipientsCount: recipientUsernames.length,
          encryption_type: encryptionType,
          expiry_days: expiryDays,
          self_destruct: selfDestruct,
          processing_mode: processingMode,
          tag: processingMode === 'manual' ? manualTag : undefined,
        });

        if (recipientUsernames.length === 0) {
          throw new Error('Recipients are required');
        }
        
        // Call encryption API
        await encryptionService.encryptFile({
          file,
          recipients: recipientUsernames,
          encryption_type: encryptionType,
          expiry_days: expiryDays,
          self_destruct: selfDestruct,
          message: message || undefined,
          processing_mode: processingMode,
          tag: processingMode === 'manual' ? manualTag : undefined,
        });
        
        // keep UI responsive during batch uploads
      }
      
      // Success!
      setIsEncrypting(false);
      toast.success(`${selectedFiles.length} file(s) encrypted successfully!`, { id: toastId });
      
      // Clear all caches so they refresh on next visit
      clearDashboardCache();
      clearOutboxCache();
      requestTabCountsRefresh();
      
      // Show success animation for 1 second, then fade out and reset
      setShowSuccess(true);
      setSuccessFading(false);
      setTimeout(() => {
        setSuccessFading(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSuccessFading(false);
          // Reset form after animation completes
          setSelectedFiles([]);
          setRecipients([]);
          setMessage('');
          setManualTag('');
          setCurrentFileIndex(0);
          setCurrentFileName("");
        }, 400); // matches fade-out duration
      }, 1000);
      
    } catch (error: any) {
      setIsEncrypting(false);
      setCurrentFileIndex(0);
      setCurrentFileName("");
      const errorMessage = error.response?.data?.error || error.message || 'Encryption failed';
      toast.error(errorMessage, { id: toastId });
      debugError('Encryption error:', error);
    }
  };

  const getTotalFileSize = () => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-y-auto">
      {/* Header */}
      <div className={`${!hasAnimated ? 'animate-in fade-in slide-in-from-top-4 duration-700' : ''}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Encrypt Files</h1>
            <p className="text-gray-600">Secure your files with military-grade encryption before sharing</p>
          </div>
        </div>
      </div>

      {showSuccess ? (
        <div className={`bg-white rounded-2xl p-10 border-3 border-gray-200/80 shadow-sm animate-in fade-in duration-300 ${successFading ? 'encrypt-success-fade-out' : ''}`}>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="encrypt-success-icon">
              <svg className="w-24 h-24" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="encrypt-success-circle" cx="28" cy="28" r="26" stroke="#22c55e" strokeWidth="3" fill="none" />
                <path className="encrypt-success-check" d="M17 28l7 7 15-15" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Encrypted & Sent!</h2>
              <p className="text-gray-600 mt-1">Your files have been securely encrypted and delivered to recipients.</p>
            </div>
          </div>
        </div>
      ) : isEncrypting ? (
        <div className="bg-white rounded-2xl p-10 border-3 border-gray-200/80 shadow-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#b2f7ef] to-[#97eeff] rounded-full animate-pulse">
                <HiOutlineLockClosed className="w-10 h-10 text-[#084d45]" />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#97eeff] encrypt-dot" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#b2f7ef] encrypt-dot" style={{ animationDelay: '160ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#f2b5d4] encrypt-dot" style={{ animationDelay: '320ms' }} />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">Encrypting & Sending</h2>
              <p className="text-gray-600 mt-1">Securing your files and delivering them to recipients.</p>
            </div>

            <div className="w-full max-w-xl">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full w-[45%] bg-gradient-to-r from-[#b2f7ef] via-[#97eeff] to-[#f2b5d4] encrypt-progress" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 mt-2 gap-1">
                <span>
                  {currentFileIndex > 0
                    ? `File ${currentFileIndex} of ${selectedFiles.length}`
                    : `Preparing ${selectedFiles.length} file(s)`}
                </span>
                {currentFileName && (
                  <span className="max-w-[240px] truncate">{currentFileName}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 w-full max-w-2xl text-left text-sm text-gray-700">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="font-semibold text-gray-900">Encrypting</p>
                <p className="text-xs text-gray-500 mt-1">AES protection in progress</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="font-semibold text-gray-900">Key Wrapping</p>
                <p className="text-xs text-gray-500 mt-1">Securing recipient keys</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="font-semibold text-gray-900">Uploading</p>
                <p className="text-xs text-gray-500 mt-1">Sending to secure storage</p>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              {selectedFiles.length} file(s) • {formatFileSize(getTotalFileSize())} total
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Section - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Area */}
          <div className={`bg-white rounded-2xl p-6 border-3 border-gray-200/80 shadow-sm ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '200ms', animationFillMode: 'backwards' } : {}}>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiUploadCloud className="w-6 h-6 text-[#b2f7ef]" />
              Upload Files
            </h2>
            
            {/* Drag and Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-3 border-dashed rounded-xl p-8 transition-all duration-300 ${
                isDragging
                  ? 'border-[#b2f7ef] bg-[#b2f7ef]/10'
                  : 'border-gray-300 hover:border-[#b2f7ef] hover:bg-[#b2f7ef]/5'
              }`}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#b2f7ef]/30 to-[#97eeff]/30 rounded-full flex items-center justify-center mb-4">
                  <FiUpload className="w-8 h-8 text-[#084d45]" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Drag and drop files here
                </p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-gradient-to-r from-[#b2f7ef] to-[#97eeff] text-[#084d45] font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 btn-click-animation"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-4">
                  Supported formats: All file types • Max size: 100MB per file
                </p>
              </div>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiFile className="w-4 h-4" />
                  Selected Files ({selectedFiles.length})
                </h3>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#b2f7ef]/50 to-[#97eeff]/50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiFile className="w-5 h-5 text-[#084d45]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                      >
                        <FiX className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Total File Size */}
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Size:</span>
                  <span className="text-sm font-bold text-gray-900">{formatFileSize(getTotalFileSize())}</span>
                </div>
              </div>
            )}

            {/* Optional Message */}
            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FiMessageSquare className="w-4 h-4" />
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message to send with your files..."
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#b2f7ef] transition-colors duration-200 resize-none"
                />
              </div>
            )}

          </div>

          {/* Recipients Section */}
          <div className={`bg-white rounded-2xl p-6 border-3 border-gray-200/80 shadow-sm ${!hasAnimated ? 'animate-in fade-in slide-in-from-left-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '400ms', animationFillMode: 'backwards' } : {}}>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiUser className="w-6 h-6 text-[#97eeff]" />
              Recipients
            </h2>
            
            <div className="space-y-4">
              {/* Saved Contacts Section */}
              {savedContacts.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FiUsers className="w-4 h-4 text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-700">Saved Contacts</h3>
                    <span className="text-xs text-gray-500">({savedContacts.length})</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                    {savedContacts.map((contact) => (
                      <div
                        key={contact._id}
                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-[#b2f7ef]/10 border-2 border-transparent hover:border-[#b2f7ef]/30 rounded-lg transition-all duration-200 group"
                      >
                        <button
                          onClick={() => addContactAsRecipient(contact)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="font-semibold text-gray-900 truncate">
                            {contact.contact_full_name || contact.contact_username}
                          </p>
                          <p className="text-xs text-gray-500 truncate">@{contact.contact_username}</p>
                          {contact.shared_files_count > 0 && (
                            <p className="text-xs text-[#084d45] mt-1">
                              📁 {contact.shared_files_count} files shared
                            </p>
                          )}
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <button
                            onClick={() => addContactAsRecipient(contact)}
                            className="p-2 hover:bg-[#b2f7ef]/20 rounded-lg transition-colors duration-200"
                            title="Add to recipients"
                          >
                            <FiUserPlus className="w-4 h-4 text-gray-400 group-hover:text-[#084d45]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContact(contact);
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
                            title="Remove contact"
                          >
                            <FiX className="w-4 h-4 text-gray-400 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200"></div>
                </div>
              )}

              {/* Loading Contacts */}
              {loadingContacts && savedContacts.length === 0 && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Loading saved contacts...</p>
                </div>
              )}

              {/* Add New Recipient Button */}
              <button
                onClick={openRecipientDialog}
                className="w-full px-4 py-3 bg-gradient-to-r from-[#97eeff] to-[#b2f7ef] text-[#084d45] font-semibold rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 btn-click-animation"
              >
                <FiUser className="w-5 h-5 icon-bounce-hover" />
                Add New Recipient
              </button>

              {recipients.length > 0 && (
                <div className="space-y-3">
                  {recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-[#97eeff]/10 to-[#b2f7ef]/10 border-2 border-[#97eeff]/50 rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900">{recipient.name}</p>
                            {recipient.nickname && (
                              <span className="text-xs px-2 py-1 bg-[#b2f7ef]/30 text-[#084d45] rounded-full font-medium">
                                @{recipient.nickname}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiMail className="w-4 h-4" />
                            <span className="truncate">{recipient.email}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeRecipient(index)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                        >
                          <FiX className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {recipients.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                  No recipients added yet
                </p>
              )}
            </div>

            {/* Recipient Dialog */}
            {showRecipientDialog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-overlay-enter" onClick={closeRecipientDialog}>
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl modal-panel-enter" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">Add Recipient</h3>
                    <button
                      onClick={closeRecipientDialog}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <FiX className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={recipientForm.name}
                        onChange={(e) => handleRecipientFormChange('name', e.target.value)}
                        placeholder="Enter recipient's full name"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#97eeff] transition-colors duration-200"
                      />
                    </div>

                    {/* Nickname */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={recipientForm.nickname}
                        onChange={(e) => handleRecipientFormChange('nickname', e.target.value)}
                        placeholder="Enter recipient's username (e.g., test1)"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#97eeff] transition-colors duration-200"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={recipientForm.email}
                        onChange={(e) => handleRecipientFormChange('email', e.target.value)}
                        placeholder="recipient@example.com"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#97eeff] transition-colors duration-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">📧 Primary identifier for the recipient</p>
                    </div>

                    {/* Save to Contacts Checkbox */}
                    <div>
                      <label className="flex items-start p-3 bg-[#b2f7ef]/10 border-2 border-[#b2f7ef]/30 rounded-lg cursor-pointer hover:bg-[#b2f7ef]/20 transition-all duration-200">
                        <input
                          type="checkbox"
                          checked={saveRecipient}
                          onChange={(e) => setSaveRecipient(e.target.checked)}
                          className="mr-3 mt-1 w-5 h-5 text-[#b2f7ef] border-gray-300 rounded focus:ring-[#b2f7ef]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <FiUserPlus className="w-4 h-4 text-[#084d45]" />
                            <p className="font-semibold text-gray-900">Save to Contacts</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Save this recipient for future use
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={closeRecipientDialog}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addRecipient}
                        disabled={!recipientForm.name || !recipientForm.nickname || !recipientForm.email}
                        className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-all duration-200 btn-click-animation ${
                          !recipientForm.name || !recipientForm.nickname || !recipientForm.email
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#97eeff] to-[#b2f7ef] text-[#084d45] hover:shadow-lg'
                        }`}
                      >
                        Add Recipient
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {/* Summary Card with Encrypt Button - Sticky */}
          <div className="lg:sticky lg:top-6 space-y-6">
            <div className={`bg-gradient-to-br from-[#f2b5d4]/30 to-[#f7d6e0]/30 rounded-2xl p-6 border-3 border-[#f2b5d4]/50 ${!hasAnimated ? 'animate-in fade-in slide-in-from-right-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '200ms', animationFillMode: 'backwards' } : {}}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Files:</span>
                  <span className="font-semibold text-gray-900">{selectedFiles.length}</span>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Size:</span>
                    <span className="font-semibold text-gray-900">{formatFileSize(getTotalFileSize())}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipients:</span>
                  <span className="font-semibold text-gray-900">{recipients.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode:</span>
                  <span className="font-semibold text-gray-900">{processingMode === 'auto' ? 'Auto' : 'Manual'}</span>
                </div>
                {processingMode === 'auto' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Auto Encryption:</span>
                      <span className="font-semibold text-gray-900">{autoDefaults.aesType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Security Level:</span>
                      <span className="font-semibold text-gray-900">{autoDefaults.securityLabel}</span>
                    </div>
                  </>
                )}
                {processingMode === 'manual' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Encryption:</span>
                      <span className="font-semibold text-gray-900">{encryptionType}</span>
                    </div>
                    {manualTag && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tag:</span>
                        <span className="font-semibold text-gray-900">{manualTag}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Removal:</span>
                  <span className="font-semibold text-gray-900">{expiryDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Self-Destruct:</span>
                  <span className={`font-semibold ${selfDestruct ? 'text-red-600' : 'text-gray-700'}`}>
                    {selfDestruct ? 'On Download' : 'Off'}
                  </span>
                </div>
              </div>

              {/* Encrypt Button - Inside Summary Card */}
              <button
                onClick={handleEncrypt}
                disabled={selectedFiles.length === 0 || recipients.length === 0 || isEncrypting}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                  selectedFiles.length === 0 || recipients.length === 0 || isEncrypting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#b2f7ef] via-[#97eeff] to-[#f2b5d4] text-[#084d45] hover:shadow-xl hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {isEncrypting ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : (
                    <HiOutlineLockClosed className="w-6 h-6" />
                  )}
                  {isEncrypting ? 'Encrypting...' : 'Encrypt & Send'}
                </div>
              </button>
            </div>
          </div>

          {/* Encryption Settings */}
          <div className={`bg-white rounded-2xl p-6 border-3 border-gray-200/80 shadow-sm ${!hasAnimated ? 'animate-in fade-in slide-in-from-right-4 duration-700' : ''}`} style={!hasAnimated ? { animationDelay: '400ms', animationFillMode: 'backwards' } : {}}>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FiShield className="w-6 h-6 text-[#f7d6e0]" />
              Settings
            </h2>

            {/* Processing Mode Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Mode
              </label>
              <div className="space-y-2">
                <label className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  processingMode === 'auto'
                    ? 'border-[#f2b5d4] bg-[#f2b5d4]/10'
                    : 'border-gray-200 hover:border-[#f2b5d4]/50'
                }`}>
                  <input
                    type="radio"
                    name="mode"
                    value="auto"
                    checked={processingMode === 'auto'}
                    onChange={() => setProcessingMode('auto')}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <FiTag className="w-5 h-5 text-[#480d2a]" />
                      <p className="font-semibold text-gray-900">Auto</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically tags by file type and selects AES-256 by default (AES-128 for files under 5 MB)
                    </p>
                  </div>
                </label>
                
                <label className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  processingMode === 'manual'
                    ? 'border-[#b2f7ef] bg-[#b2f7ef]/10'
                    : 'border-gray-200 hover:border-[#b2f7ef]/50'
                }`}>
                  <input
                    type="radio"
                    name="mode"
                    value="manual"
                    checked={processingMode === 'manual'}
                    onChange={() => setProcessingMode('manual')}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <FiTag className="w-5 h-5 text-[#084d45]" />
                      <p className="font-semibold text-gray-900">Manual</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Manually select AES encryption type and add custom tags
                    </p>
                  </div>
                </label>
              </div>
              {processingMode === 'auto' && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <button
                    type="button"
                    onClick={() => setShowAutoInfo((prev) => !prev)}
                    className="w-full text-left font-semibold text-gray-700 hover:text-gray-900"
                  >
                    Auto Mode details {showAutoInfo ? '▴' : '▾'}
                  </button>
                  {showAutoInfo && (
                    <div className="mt-2 space-y-1">
                      <p>Auto Mode automatically:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Selects encryption strength</li>
                        <li>Sets a reasonable expiry (shortest rule across selected files)</li>
                        <li>Applies file tags</li>
                        <li>Improves safety for multiple recipients</li>
                      </ul>
                      <p className="mt-2">All decisions are rule-based and transparent.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual Options - Only show when manual mode is selected */}
            {processingMode === 'manual' && (
              <>
                {/* Encryption Type */}
                <div className="mb-8 pl-4 border-l-4 border-[#b2f7ef]">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Encryption Type
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      encryptionType === 'AES-128'
                        ? 'border-[#b2f7ef] bg-[#b2f7ef]/10'
                        : 'border-gray-200 hover:border-[#b2f7ef]/50'
                    }`}>
                      <input
                        type="radio"
                        name="encryption"
                        value="AES-128"
                        checked={encryptionType === 'AES-128'}
                        onChange={() => setEncryptionType('AES-128')}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">AES-128</p>
                        <p className="text-xs text-gray-500">Fast & Secure</p>
                      </div>
                    </label>
                    
                    <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      encryptionType === 'AES-256'
                        ? 'border-[#b2f7ef] bg-[#b2f7ef]/10'
                        : 'border-gray-200 hover:border-[#b2f7ef]/50'
                    }`}>
                      <input
                        type="radio"
                        name="encryption"
                        value="AES-256"
                        checked={encryptionType === 'AES-256'}
                        onChange={() => setEncryptionType('AES-256')}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">AES-256</p>
                        <p className="text-xs text-gray-500">Maximum Security</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Manual Tag Input */}
                <div className="mb-8 pl-4 border-l-4 border-[#b2f7ef]">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FiTag className="w-4 h-4" />
                    Custom Tag
                  </label>
                  <input
                    type="text"
                    value={manualTag}
                    onChange={(e) => setManualTag(e.target.value)}
                    placeholder="e.g., Financial, HR, Legal, General"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#b2f7ef] transition-colors duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Add a custom tag to categorize and organize your files
                  </p>
                </div>
              </>
            )}

            {/* Expiry Time */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                File Removal
                {processingMode === 'auto' && !autoExpiryOverride && (
                  <span className="text-[10px] uppercase tracking-wide bg-[#f2b5d4]/20 text-[#480d2a] px-2 py-0.5 rounded-full">
                    Auto
                  </span>
                )}
              </label>
              <select
                value={expiryDays}
                onChange={(e) => {
                  setExpiryDays(Number(e.target.value));
                  if (processingMode === 'auto') {
                    setAutoExpiryOverride(true);
                  }
                }}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#b2f7ef] transition-colors duration-200"
              >
                <option value={1}>1 Day</option>
                <option value={3}>3 Days</option>
                <option value={5}>5 Days</option>
                <option value={7}>7 Days</option>
                <option value={10}>10 Days</option>
                <option value={14}>14 Days</option>
              </select>
              <p className="text-xs text-gray-500 mt-4">
                File will be removed from cloud after this period
              </p>
              {processingMode === 'auto' && !autoExpiryOverride && (
                <p className="text-[11px] text-gray-500 mt-2">
                  Auto default based on file type: {autoDefaults.expiryDays} days
                </p>
              )}
            </div>

            {/* Self-Destruct After Download */}
            <div className="mb-8">
              <label className="flex items-start p-3 bg-red-50 border-2 border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-all duration-200">
                <input
                  type="checkbox"
                  checked={selfDestruct}
                  onChange={(e) => {
                    setSelfDestruct(e.target.checked);
                    if (processingMode === 'auto') {
                      setAutoSelfDestructOverride(true);
                    }
                  }}
                  className="mr-3 mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <FiShield className="w-4 h-4 text-red-600" />
                    <p className="font-semibold text-gray-900">Self-Destruct After Download</p>
                    {processingMode === 'auto' && !autoSelfDestructOverride && (
                      <span className="text-[10px] uppercase tracking-wide bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Auto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    File will be automatically deleted after recipient downloads it
                  </p>
                  {processingMode === 'auto' && !autoSelfDestructOverride && (
                    <p className="text-[11px] text-gray-500 mt-2">
                      Auto default based on recipient count: {autoDefaults.selfDestruct ? 'On' : 'Off'}
                    </p>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
