export enum RequestType {
  ACCESS = "ACCESS", // GDPR Access / CCPA Know
  ERASURE = "ERASURE", // GDPR Erasure / CCPA Delete
  OPT_OUT = "OPT_OUT", // CCPA Do Not Sell/Share
}

export enum RequestStatus {
  SUBMITTED = "SUBMITTED",
  VERIFYING = "VERIFYING",
  IDENTIFIED = "IDENTIFIED",
  SCANNING = "SCANNING",
  GENERATING = "GENERATING",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  DELETING = "DELETING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface WorkspaceConfig {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  
  // Supabase Configuration
  supabaseUrl: string;
  supabaseServiceRole: string; // Write-only dummy / masked on UI
  supabaseSchemas: string[]; // e.g., ["users", "profiles", "orders"]
  supabaseUserField: string; // e.g., "email" or "id"
  supabaseConnected: boolean;

  // Firebase Configuration
  firebaseProjectId: string;
  firebaseStorageBucket: string;
  firebaseServiceAccount: string; // Write-only JSON string / masked on UI
  firebaseCollections: string[]; // e.g., ["users", "profiles", "documents"]
  firebaseConnected: boolean;
}

export interface DSARRequest {
  id: string;
  workspaceId: string;
  type: RequestType;
  status: RequestStatus;
  subjectName: string;
  subjectEmail: string;
  verificationCode: string; // 6-digit OTP
  isVerified: boolean;
  requestDate: string; // ISO date
  deadlineDate: string; // Compliance timeframe (30 days GDPR)
  exportUrl?: string; // Token-based link
  exportExpiresAt?: string;
  dataSummary?: {
    supabase?: {
      found: boolean;
      recordsCount: number;
      sample: Record<string, any>;
    };
    firebase?: {
      found: boolean;
      authFound: boolean;
      recordsCount: number;
      sample: Record<string, any>;
    };
  };
  deletionLog?: string[];
  proofHash?: string; // Encrypted completion signature
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  requestId?: string;
  eventType: string; // "IDENTITY_VERIFIED", "SCHEMA_SCAN", "RECORD_FOUND", "EXPORT_GENERATED", "DELETION_COMPLETE", "WEBHOOK"
  timestamp: string;
  actor: string; // "System", compliance admin email, or public client
  details: string;
  status: "SUCCESS" | "WARNING" | "FAILURE";
  ipAddress: string;
  signature: string; // Encrypted or SHA-256 integrity hash
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "COMPLIANCE_OFFICER" | "DEVELOPER";
  mfaEnabled: boolean;
}

export interface ComplianceMetrics {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  averageResolveTimeDays: number; // e.g., 4.2 days
  approachingDeadlineCount: number;
  byType: {
    [key in RequestType]: number;
  };
}
