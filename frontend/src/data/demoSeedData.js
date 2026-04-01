const now = new Date();

const minutesAgo = (m) => new Date(now.getTime() - m * 60 * 1000);
const hoursAgo = (h) => new Date(now.getTime() - h * 60 * 60 * 1000);
const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

export const demoUser = {
  id: 'demo-user-001',
  username: 'alex.morgan',
  full_name: 'Alex Morgan',
  name: 'Alex Morgan',
  email: 'demo@showcase.com',
  role: 'Guest',
  isDemo: true,
  joinedAt: '2024-01-15',
  created_at: '2024-01-15T09:30:00.000Z',
  bio: 'Security analyst exploring encrypted collaboration flows.',
  avatar_url: '',
};

// Exact Inbox component shape
export const demoInboxMessages = [
  {
    id: 'in-demo-001',
    fileName: 'Q1-security-audit-report.pdf',
    sender: 'maria.chen',
    senderEmail: 'maria.chen@vaultline.io',
    size: 2849134,
    encryptionType: 'AES-256',
    tag: 'active',
    receivedDate: minutesAgo(2),
    expiryDate: daysFromNow(6),
    downloaded: false,
    selfDestruct: true,
    message: 'Latest audit findings. Please review before tomorrow standup.',
  },
  {
    id: 'in-demo-002',
    fileName: 'vendor-access-list.csv',
    sender: 'nina.patel',
    senderEmail: 'nina.patel@vaultline.io',
    size: 168210,
    encryptionType: 'AES-128',
    tag: 'active',
    receivedDate: hoursAgo(1),
    expiryDate: daysFromNow(10),
    downloaded: true,
    selfDestruct: false,
    message: 'Contains approved vendors for this sprint deployment.',
  },
  {
    id: 'in-demo-003',
    fileName: 'handoff-notes.txt',
    sender: 'owen.kim',
    senderEmail: 'owen.kim@vaultline.io',
    size: 4210,
    encryptionType: 'AES-128',
    tag: 'active',
    receivedDate: daysAgo(1),
    expiryDate: daysFromNow(3),
    downloaded: false,
    selfDestruct: false,
    message: 'Night shift handoff notes for incident queue.',
  },
  {
    id: 'in-demo-004',
    fileName: 'customer-escalation-brief.docx',
    sender: 'sara.lopez',
    senderEmail: 'sara.lopez@vaultline.io',
    size: 892004,
    encryptionType: 'AES-256',
    tag: 'active',
    receivedDate: daysAgo(3),
    expiryDate: daysFromNow(4),
    downloaded: true,
    selfDestruct: true,
    message: 'Escalation details with sensitive customer metadata.',
  },
  {
    id: 'in-demo-005',
    fileName: 'oncall-rotation.png',
    sender: 'daniel.cho',
    senderEmail: 'daniel.cho@vaultline.io',
    size: 421002,
    encryptionType: 'AES-128',
    tag: 'active',
    receivedDate: daysAgo(7),
    expiryDate: daysFromNow(14),
    downloaded: false,
    selfDestruct: false,
    message: 'Updated on-call schedule for the security team.',
  },
  {
    id: 'in-demo-006',
    fileName: 'legacy-key-backup.zip',
    sender: 'priya.nair',
    senderEmail: 'priya.nair@vaultline.io',
    size: 8421204,
    encryptionType: 'AES-256',
    tag: 'active',
    receivedDate: hoursAgo(5),
    expiryDate: daysFromNow(2),
    downloaded: false,
    selfDestruct: true,
    message: 'Temporary backup archive. Delete after validation.',
  },
  {
    id: 'in-demo-007',
    fileName: 'release-checklist.md',
    sender: 'liam.brooks',
    senderEmail: 'liam.brooks@vaultline.io',
    size: 21045,
    encryptionType: 'AES-128',
    tag: 'expired',
    receivedDate: daysAgo(2),
    expiryDate: daysAgo(1),
    downloaded: true,
    selfDestruct: false,
    message: 'Release gate checklist from the last deployment window.',
  },
];

// Exact Outbox component shape
export const demoOutboxMessages = [
  {
    id: 'out-demo-001',
    fileName: 'incident-postmortem.pdf',
    recipients: ['maria.chen', 'nina.patel'],
    recipientEmails: ['maria.chen@vaultline.io', 'nina.patel@vaultline.io'],
    size: 1943221,
    encryptionType: 'AES-256',
    tag: 'active',
    sentDate: minutesAgo(25),
    expiryDate: daysFromNow(5),
    downloads: 1,
    maxDownloads: undefined,
    selfDestruct: true,
    message: 'Postmortem summary with remediation tasks.',
    processingMode: 'manual',
  },
  {
    id: 'out-demo-002',
    fileName: 'soc-shift-template.xlsx',
    recipients: ['owen.kim'],
    recipientEmails: ['owen.kim@vaultline.io'],
    size: 532110,
    encryptionType: 'AES-128',
    tag: 'active',
    sentDate: hoursAgo(4),
    expiryDate: daysFromNow(8),
    downloads: 0,
    maxDownloads: undefined,
    selfDestruct: false,
    message: 'SOC template for tonight coverage.',
    processingMode: 'auto',
  },
  {
    id: 'out-demo-003',
    fileName: 'partner-due-diligence.docx',
    recipients: ['sara.lopez', 'daniel.cho'],
    recipientEmails: ['sara.lopez@vaultline.io', 'daniel.cho@vaultline.io'],
    size: 1132010,
    encryptionType: 'AES-256',
    tag: 'active',
    sentDate: daysAgo(1),
    expiryDate: daysFromNow(6),
    downloads: 2,
    maxDownloads: undefined,
    selfDestruct: false,
    message: 'Due diligence notes for new partner onboarding.',
    processingMode: 'manual',
  },
  {
    id: 'out-demo-004',
    fileName: 'deployment-runbook.txt',
    recipients: ['liam.brooks'],
    recipientEmails: ['liam.brooks@vaultline.io'],
    size: 9200,
    encryptionType: 'AES-128',
    tag: 'active',
    sentDate: daysAgo(3),
    expiryDate: daysFromNow(1),
    downloads: 0,
    maxDownloads: undefined,
    selfDestruct: false,
    message: 'Runbook updates for canary release.',
    processingMode: 'auto',
  },
  {
    id: 'out-demo-005',
    fileName: 'temporary-api-keys.json',
    recipients: ['priya.nair'],
    recipientEmails: ['priya.nair@vaultline.io'],
    size: 6510,
    encryptionType: 'AES-256',
    tag: 'expired',
    sentDate: daysAgo(7),
    expiryDate: daysAgo(1),
    downloads: 1,
    maxDownloads: undefined,
    selfDestruct: true,
    message: 'Temporary keys for migration window.',
    processingMode: 'manual',
  },
];

export const demoContacts = [
  {
    _id: 'contact-demo-001',
    owner_username: 'alex.morgan',
    contact_username: 'maria.chen',
    contact_email: 'maria.chen@vaultline.io',
    contact_full_name: 'Maria Chen',
    nickname: 'maria.chen',
    notes: 'Security operations lead',
    tags: ['security', 'priority'],
    is_favorite: true,
    shared_files_count: 5,
    last_shared_at: hoursAgo(5).toISOString(),
    added_at: daysAgo(30).toISOString(),
    updated_at: daysAgo(2).toISOString(),
  },
  {
    _id: 'contact-demo-002',
    owner_username: 'alex.morgan',
    contact_username: 'nina.patel',
    contact_email: 'nina.patel@vaultline.io',
    contact_full_name: 'Nina Patel',
    nickname: 'nina.patel',
    notes: 'Compliance reviewer',
    tags: ['compliance'],
    is_favorite: false,
    shared_files_count: 3,
    last_shared_at: daysAgo(1).toISOString(),
    added_at: daysAgo(14).toISOString(),
    updated_at: daysAgo(1).toISOString(),
  },
  {
    _id: 'contact-demo-003',
    owner_username: 'alex.morgan',
    contact_username: 'owen.kim',
    contact_email: 'owen.kim@vaultline.io',
    contact_full_name: 'Owen Kim',
    nickname: 'owen.kim',
    notes: 'Incident commander',
    tags: ['incident'],
    is_favorite: false,
    shared_files_count: 2,
    last_shared_at: daysAgo(3).toISOString(),
    added_at: daysAgo(45).toISOString(),
    updated_at: daysAgo(5).toISOString(),
  },
];

const toApiInboxFile = (m) => ({
  id: m.id,
  original_filename: m.fileName,
  encrypted_filename: `${m.fileName}.enc`,
  sender: m.sender,
  recipients: [demoUser.username],
  encryption_type: m.encryptionType,
  file_size: m.size,
  created_at: m.receivedDate.toISOString(),
  expires_at: m.expiryDate.toISOString(),
  download_count: m.downloaded ? 1 : 0,
  self_destruct: m.selfDestruct,
  message: m.message,
  status: m.tag,
});

const toApiOutboxFile = (m) => ({
  id: m.id,
  original_filename: m.fileName,
  encrypted_filename: `${m.fileName}.enc`,
  sender: demoUser.username,
  recipients: m.recipients,
  encryption_type: m.encryptionType,
  file_size: m.size,
  created_at: m.sentDate.toISOString(),
  expires_at: m.expiryDate.toISOString(),
  download_count: m.downloads,
  self_destruct: m.selfDestruct,
  message: m.message,
  status: m.tag,
});

export const demoInboxApiFiles = demoInboxMessages.map(toApiInboxFile);
export const demoOutboxApiFiles = demoOutboxMessages.map(toApiOutboxFile);

const fileTypeFromName = (name) => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (!ext) return 'Other';
  if (['pdf'].includes(ext)) return 'PDF';
  if (['doc', 'docx'].includes(ext)) return 'DOCX';
  if (['xlsx', 'xls', 'csv'].includes(ext)) return 'Spreadsheet';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'Image';
  if (['zip', 'rar', '7z'].includes(ext)) return 'Archive';
  if (['txt', 'md', 'json'].includes(ext)) return 'Text';
  return ext.toUpperCase();
};

const percentage = (count, total) => (total === 0 ? 0 : Math.round((count / total) * 100));

export const buildDemoDashboardData = () => {
  const files = [...demoInboxApiFiles, ...demoOutboxApiFiles];
  const total = files.length;
  const sent = demoOutboxApiFiles.length;
  const received = demoInboxApiFiles.length;
  const active = files.filter((f) => f.status === 'active').length;
  const expired = files.filter((f) => f.status === 'expired').length;
  const sensitive = files.filter((f) => f.encryption_type === 'AES-256' || f.self_destruct).length;
  const storageUsedMb = Number((files.reduce((sum, f) => sum + f.file_size, 0) / (1024 * 1024)).toFixed(2));

  const aes128Count = files.filter((f) => f.encryption_type === 'AES-128').length;
  const aes256Count = files.filter((f) => f.encryption_type === 'AES-256').length;

  const byFileType = files.reduce((acc, f) => {
    const t = fileTypeFromName(f.original_filename);
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const fileTypeDistribution = Object.entries(byFileType)
    .map(([type, count]) => ({ type, count, percentage: percentage(count, total) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    stats: {
      files_sent: sent,
      files_received: received,
      sensitive_files: sensitive,
      storage_used_mb: storageUsedMb,
      storage_limit_mb: 10240,
      total_files: total,
      active_files: active,
      expired_files: expired,
      expiring_soon_files: files.filter((f) => new Date(f.expires_at).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000 && new Date(f.expires_at) > now).length,
    },
    recent_activity: [
      {
        id: 'activity-demo-001',
        action: 'encrypted',
        file_name: 'incident-postmortem.pdf',
        timestamp: minutesAgo(25).toISOString(),
        user: demoUser.username,
        status: 'success',
      },
      {
        id: 'activity-demo-002',
        action: 'downloaded',
        file_name: 'vendor-access-list.csv',
        timestamp: hoursAgo(1).toISOString(),
        user: 'nina.patel',
        status: 'success',
      },
      {
        id: 'activity-demo-003',
        action: 'shared',
        file_name: 'partner-due-diligence.docx',
        timestamp: hoursAgo(5).toISOString(),
        user: demoUser.username,
        status: 'success',
      },
      {
        id: 'activity-demo-004',
        action: 'deleted',
        file_name: 'temporary-api-keys.json',
        timestamp: daysAgo(1).toISOString(),
        user: demoUser.username,
        status: 'warning',
      },
      {
        id: 'activity-demo-005',
        action: 'decrypted',
        file_name: 'customer-escalation-brief.docx',
        timestamp: daysAgo(1).toISOString(),
        user: demoUser.username,
        status: 'success',
      },
    ],
    encryption_breakdown: [
      { type: 'AES-128', count: aes128Count, percentage: percentage(aes128Count, total) },
      { type: 'AES-256', count: aes256Count, percentage: percentage(aes256Count, total) },
    ],
    file_type_distribution: fileTypeDistribution,
  };
};

export const createInitialDemoSession = () => ({
  isDemo: true,
  user: { ...demoUser },
  inboxFiles: demoInboxApiFiles.map((f) => ({ ...f })),
  outboxFiles: demoOutboxApiFiles.map((f) => ({ ...f })),
  contacts: demoContacts.map((c) => ({ ...c })),
  dashboard: buildDemoDashboardData(),
  createdAt: new Date().toISOString(),
});
