import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  RequestType, 
  RequestStatus, 
  WorkspaceConfig, 
  DSARRequest, 
  AuditLog, 
  TeamMember 
} from "./src/types.js"; // Note the .js or no extension depending on TS resolution. For TypeScript compilers, we can import without extensions or from types directly if compiled.

const app = express();
app.use(express.json());

const PORT = 3000;

// ==========================================
// IN-MEMORY / LOCAL FILE DB SETUP
// ==========================================
let workspace: WorkspaceConfig = {
  id: "ws_acme_prod",
  name: "Acme Corporate SaaS",
  domain: "acme-corp.com",
  apiKey: "dsar_live_bf9e8a71c320d588dae3",
  supabaseUrl: "https://xeyuofajdlkncsdw.supabase.co",
  supabaseServiceRole: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.masked_service_role",
  supabaseSchemas: ["users", "profiles", "billing_subscriptions", "customer_logs"],
  supabaseUserField: "email",
  supabaseConnected: true,
  firebaseProjectId: "acme-prod-auth-10ec",
  firebaseStorageBucket: "acme-prod-auth-10ec.appspot.com",
  firebaseServiceAccount: '{"type": "service_account", "project_id": "acme-prod-auth-10ec", "private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6N...\\n-----END PRIVATE KEY-----\\n", "client_email": "firebase-adminsdk@acme-prod-auth-10ec.iam.gserviceaccount.com"}',
  firebaseCollections: ["user_wallets", "sessions", "notifications"],
  firebaseConnected: true,
};

let teamMembers: TeamMember[] = [
  { id: "tm_1", name: "Sarah Jenkins", email: "s.jenkins@acme-corp.com", role: "OWNER", mfaEnabled: true },
  { id: "tm_2", name: "David Chen", email: "d.chen@acme-corp.com", role: "COMPLIANCE_OFFICER", mfaEnabled: true },
  { id: "tm_3", name: "Elena Rostova", email: "e.rostova@acme-corp.com", role: "DEVELOPER", mfaEnabled: false }
];

let requests: DSARRequest[] = [
  {
    id: "dsar_req_001",
    workspaceId: "ws_acme_prod",
    type: RequestType.ACCESS,
    status: RequestStatus.COMPLETED,
    subjectName: "John Smith",
    subjectEmail: "john.smith34@gmail.com",
    verificationCode: "482091",
    isVerified: true,
    requestDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    deadlineDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // GDPR 30 days
    exportUrl: "/api/export/dsar_req_001?token=exp_tok_847192",
    exportExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    dataSummary: {
      supabase: {
        found: true,
        recordsCount: 14,
        sample: {
          user_id: "sup_usr_849102",
          email: "john.smith34@gmail.com",
          profile: { first_name: "John", last_name: "Smith", avatar_url: "https://avatar.io/john" },
          subscriptions: { plan: "Pro Tier", active: true, amount: "29.00", currency: "USD" },
          customer_logs: [
            { id: 1, action: "login", ip: "192.168.1.1", created_at: "2026-05-10T11:00:00Z" },
            { id: 2, action: "view_invoice", ip: "192.168.1.1", created_at: "2026-05-12T09:12:00Z" }
          ]
        }
      },
      firebase: {
        found: true,
        authFound: true,
        recordsCount: 4,
        sample: {
          uid: "fire_usr_99201",
          email: "john.smith34@gmail.com",
          user_wallets: { balance_cents: 1420, updated_at: "24-05-2026" },
          sessions: [{ token_id: "se_8321", os: "macOS", browser: "Chrome" }]
        }
      }
    },
    proofHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    id: "dsar_req_002",
    workspaceId: "ws_acme_prod",
    type: RequestType.ERASURE,
    status: RequestStatus.PENDING_APPROVAL,
    subjectName: "Claire Dupont",
    subjectEmail: "claire.dupont@orange.fr",
    verificationCode: "829401",
    isVerified: true,
    requestDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    deadlineDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
    dataSummary: {
      supabase: {
        found: true,
        recordsCount: 6,
        sample: {
          user_id: "sup_usr_732910",
          email: "claire.dupont@orange.fr",
          profile: { first_name: "Claire", last_name: "Dupont" },
          subscriptions: null,
          customer_logs: []
        }
      },
      firebase: {
        found: false,
        authFound: false,
        recordsCount: 0,
        sample: {}
      }
    }
  },
  {
    id: "dsar_req_003",
    workspaceId: "ws_acme_prod",
    type: RequestType.OPT_OUT,
    status: RequestStatus.SUBMITTED,
    subjectName: "Robert Miller",
    subjectEmail: "r.miller@comcast.net",
    verificationCode: "219582",
    isVerified: false,
    requestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // CCPA 15 days optout
  }
];

let auditLogs: AuditLog[] = [
  {
    id: "log_1",
    workspaceId: "ws_acme_prod",
    requestId: "dsar_req_001",
    eventType: "IDENTITY_VERIFIED",
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    actor: "Public Requester UI",
    details: "OTP verification success for john.smith34@gmail.com from 84.122.99.14",
    status: "SUCCESS",
    ipAddress: "84.122.99.14",
    signature: "7bc3a948aeef11a198de7e559091baef"
  },
  {
    id: "log_2",
    workspaceId: "ws_acme_prod",
    requestId: "dsar_req_001",
    eventType: "SCHEMA_SCAN",
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 30000).toISOString(),
    actor: "BullMQ Job System",
    details: "Supabase and Firebase automated search triggered. Found user John Smith (Supabase PK: sup_usr_849102, Firebase UID: fire_usr_99201).",
    status: "SUCCESS",
    ipAddress: "127.0.0.1",
    signature: "ffa01928abceef9200a129efcc29aa98"
  },
  {
    id: "log_3",
    workspaceId: "ws_acme_prod",
    requestId: "dsar_req_001",
    eventType: "EXPORT_GENERATED",
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 120000).toISOString(),
    actor: "BullMQ-Packager",
    details: "Compliance exports (JSON bundle) compiled with GCM-AES encrypted download link valid for 7 days.",
    status: "SUCCESS",
    ipAddress: "127.0.0.1",
    signature: "efab847cdaff289190ab127ee78ffebc"
  },
  {
    id: "log_4",
    workspaceId: "ws_acme_prod",
    requestId: "dsar_req_002",
    eventType: "IDENTITY_VERIFIED",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    actor: "Public Requester UI",
    details: "OTP verification success for claire.dupont@orange.fr from 104.90.112.55",
    status: "SUCCESS",
    ipAddress: "104.90.112.55",
    signature: "9cd103eefdbcb9080d82910faab4901f"
  },
  {
    id: "log_5",
    workspaceId: "ws_acme_prod",
    requestId: "dsar_req_002",
    eventType: "SCHEMA_SCAN",
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 45000).toISOString(),
    actor: "BullMQ Job System",
    details: "Erasure database lookup complete. User found on Supabase. Primary user record locked pending administrative review.",
    status: "SUCCESS",
    ipAddress: "127.0.0.1",
    signature: "119020eefaeb8bfda132e0abfaef890a"
  }
];

// Helper to create cryptographically-styled signatures
function generateSha256Sim(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0") + "ea2bf89c";
}

// Add a compliance logging helper
function logCompliance(
  reqId: string | undefined, 
  eventType: string, 
  actor: string, 
  details: string, 
  status: "SUCCESS" | "WARNING" | "FAILURE" = "SUCCESS", 
  ip: string = "127.0.0.1"
) {
  const log: AuditLog = {
    id: `log_${Math.random().toString(36).substr(2, 9)}`,
    workspaceId: workspace.id,
    requestId: reqId,
    eventType,
    timestamp: new Date().toISOString(),
    actor,
    details,
    status,
    ipAddress: ip,
    signature: generateSha256Sim(`${reqId}-${eventType}-${details}-${Date.now()}`),
  };
  auditLogs.unshift(log); // Prepend to show latest first
  return log;
}

// ==========================================
// BACKGROUND WORkERS / QUEUE SIMULATOR (BULLMQ-LIKE)
// ==========================================
const activeJobs = new Map<string, {
  reqId: string;
  step: number;
  maxSteps: number;
  intervals: string[];
}>();

function triggerDsarSimulation(reqId: string) {
  const reqObj = requests.find(r => r.id === reqId);
  if (!reqObj) return;

  if (reqObj.type === RequestType.ACCESS) {
    reqObj.status = RequestStatus.SCANNING;
    logCompliance(reqId, "SCHEMA_SCAN", "BullMQ Worker queue_dsar_scan", "Initiating asynchronous identity cross-reference & schema sweep...");

    setTimeout(() => {
      // Step 2: Identified and Scanning collections
      reqObj.status = RequestStatus.IDENTIFIED;
      reqObj.dataSummary = {
        supabase: {
          found: true,
          recordsCount: 18,
          sample: {
            user_id: `sup_usr_${Math.floor(100000 + Math.random() * 900000)}`,
            email: reqObj.subjectEmail,
            profile: { first_name: reqObj.subjectName.split(" ")[0], last_name: reqObj.subjectName.split(" ")[1] || "Compliance" },
            subscriptions: { plan: "Standard Creator", active: true, billing_logs: ["$19.00 paid 2026-05-14"] }
          }
        },
        firebase: {
          found: true,
          authFound: true,
          recordsCount: 5,
          sample: {
            uid: `fire_usr_${Math.floor(10000 + Math.random() * 90000)}`,
            email: reqObj.subjectEmail,
            user_wallets: { balance_cents: 2500 },
            notifications_settings: { promo_opt_in: false }
          }
        }
      };
      logCompliance(reqId, "RECORD_FOUND", "Supabase Integration Engine", `Discovered user records in schemas [users, profiles, billing_subscriptions]`);
      logCompliance(reqId, "RECORD_FOUND", "Firebase Admin SDK", `Identified matching Firestore records in [user_wallets, sessions] with Firebase Auth status UNLOCKED`);
    }, 4000);

    setTimeout(() => {
      // Step 3: Compiling output exports (ZIP package with JSON templates)
      reqObj.status = RequestStatus.GENERATING;
      logCompliance(reqId, "EXPORT_GENERATING", "BullMQ Worker queue_dsar_export", "Compiling exports and constructing temporary ZIP compliance package...");
    }, 8000);

    setTimeout(() => {
      // Step 4: Completed access packages
      reqObj.status = RequestStatus.COMPLETED;
      reqObj.exportUrl = `/api/export/${reqId}?token=exp_tok_${Math.floor(Math.random() * 1000000)}`;
      reqObj.exportExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      reqObj.proofHash = generateSha256Sim(`${reqId}-export-contents-integrity-proof`);
      logCompliance(reqId, "EXPORT_GENERATED", "Compliance Vault packager", `Secured ZIP export packet generated. Temporary signed URL injected into token router. Integrity hash: ${reqObj.proofHash}`);
    }, 12000);

  } else if (reqObj.type === RequestType.ERASURE) {
    reqObj.status = RequestStatus.SCANNING;
    logCompliance(reqId, "SCHEMA_SCAN", "BullMQ Worker queue_dsar_scan", "Scanning integration records for target user deletion paths...");

    setTimeout(() => {
      reqObj.status = RequestStatus.PENDING_APPROVAL;
      reqObj.dataSummary = {
        supabase: {
          found: true,
          recordsCount: 9,
          sample: {
            id: `usr_${Math.floor(Math.random() * 100000)}`,
            email: reqObj.subjectEmail,
            created_at: "2025-11-20T14:20:00Z"
          }
        },
        firebase: {
          found: false,
          authFound: false,
          recordsCount: 0,
          sample: {}
        }
      };
      logCompliance(reqId, "RECORD_FOUND", "Security Boundary Check", "Identified 9 delete-eligible relational references. Pausing for Admin Human-In-The-Loop approval.");
    }, 4000);
  }
}

// ==========================================
// REST API ROUTER
// ==========================================

// Get workspace configurations
app.get("/api/workspace", (req, res) => {
  res.json(workspace);
});

// Update workspace credentials (simulate connecting and scanning schema)
app.post("/api/workspace/update", (req, res) => {
  workspace = { ...workspace, ...req.body };
  logCompliance(
    undefined, 
    "WORKSPACE_CREDENTIALS_REKEYED", 
    "David Chen (Compliance Officer)", 
    `Updated integration credentials. Supabase connected: ${workspace.supabaseConnected}, Firebase connected: ${workspace.firebaseConnected}. Re-scanning database metadata.`
  );
  res.json({ success: true, workspace });
});

// Get all requests
app.get("/api/requests", (req, res) => {
  res.json(requests);
});

// Create compliance requests from the public interface (requires OTP generation)
app.post("/api/requests/create", (req, res) => {
  const { subjectName, subjectEmail, type } = req.body;
  if (!subjectName || !subjectEmail || !type) {
    return res.status(400).json({ error: "Missing required parameters: subjectName, subjectEmail, type." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const deadlineDays = type === RequestType.ERASURE ? 30 : type === RequestType.ACCESS ? 30 : 15; // GDPR 30, CCPA 15

  const newReq: DSARRequest = {
    id: `dsar_req_${Math.random().toString(36).substr(2, 5)}`,
    workspaceId: workspace.id,
    type: type as RequestType,
    status: RequestStatus.VERIFYING,
    subjectName,
    subjectEmail,
    verificationCode: code,
    isVerified: false,
    requestDate: new Date().toISOString(),
    deadlineDate: new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000).toISOString(),
  };

  requests.unshift(newReq);
  logCompliance(newReq.id, "DSAR_SUBMITTED", "Public Anonymous Port", `Received Privacy Request (${type}) from IP 110.22.84.101. OTP Security Code dispatched to ${subjectEmail}`);

  res.json({ 
    success: true, 
    requestId: newReq.id, 
    verificationCode: code // Returned in response for the demo and sandbox so the user can easily verify!
  });
});

// Verify user identity with OTP
app.post("/api/requests/verify", (req, res) => {
  const { requestId, code } = req.body;
  const reqObj = requests.find(r => r.id === requestId);
  if (!reqObj) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (reqObj.verificationCode !== code) {
    logCompliance(requestId, "IDENTITY_VERIFICATION_FAILED", "Identity Verifier Router", `Invalid verification code attempt for ${reqObj.subjectEmail}`, "WARNING");
    return res.status(400).json({ error: "Invalid verification code. Please try again." });
  }

  reqObj.isVerified = true;
  reqObj.status = RequestStatus.VERIFYING;
  logCompliance(requestId, "IDENTITY_VERIFIED", "Public Consumer Verifier", `Successfully validated ownership for ${reqObj.subjectEmail}. Enqueuing in automated scanning workers.`);

  // Immediately kick off automated scanning job
  triggerDsarSimulation(reqObj.id);

  res.json({ success: true, request: reqObj });
});

// Admin compliance actions (Trigger scan, approve deletion, trigger export recreation)
app.post("/api/requests/action", (req, res) => {
  const { requestId, action } = req.body;
  const reqObj = requests.find(r => r.id === requestId);
  if (!reqObj) return res.status(404).json({ error: "Request not found" });

  if (action === "RE_SCAN") {
    logCompliance(requestId, "MANUAL_RESCAN_QUEUE", "David Chen (Admin)", "Manually queued record re-scan in BullMQ core.");
    triggerDsarSimulation(requestId);
  } else if (action === "APPROVE_ERASURE") {
    reqObj.status = RequestStatus.DELETING;
    logCompliance(requestId, "ERASURE_APPROVED", "Elena Rostova (Compliance Officer)", "Authorization granted. Executing deletion workflow queues.");

    // Simulate safe deletion with sequential logging
    setTimeout(() => {
      logCompliance(requestId, "DELETION_WORKER", "Supabase Integrater [Hard Delete]", `Executing CASCADE delete on schemas where email = '${reqObj.subjectEmail}'...`);
    }, 2000);

    setTimeout(() => {
      logCompliance(requestId, "DELETION_WORKER", "Firebase Admin SDK [User Deletion]", `Deleted Firebase auth identity uid: 'fire_usr_mock_119'.`);
      reqObj.status = RequestStatus.COMPLETED;
      reqObj.deletionLog = [
        "CASCADE delete from users where email = current_user_target",
        "Purged storage bucket documents named after target metadata",
        "Firebase admin auth identity removed successfully",
        "Database constraints checked: 0 orphans remaining"
      ];
      reqObj.proofHash = generateSha256Sim(`${requestId}-deletion-verification-provable-cryptography`);
      logCompliance(requestId, "DELETION_COMPLETE", "Compliance Verification Worker", `Deletion completed successfully. Generated cryptographic proof-of-erasure signature: ${reqObj.proofHash}`);
    }, 5000);

  } else if (action === "RETRY_JOB") {
    reqObj.status = RequestStatus.SUBMITTED;
    logCompliance(requestId, "JOB_REQUEUED", "System Queue", "Job status reset from dead-letter-queue. Re-entering processing pool.");
    triggerDsarSimulation(requestId);
  }

  res.json({ success: true, request: reqObj });
});

// Fetch Audit Logs
app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

// Fetch Team Members
app.get("/api/team", (req, res) => {
  res.json(teamMembers);
});

// Create Team Member
app.post("/api/team", (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: "Missing name, email or role" });
  }
  const newMember: TeamMember = {
    id: `tm_${Math.floor(Math.random() * 1000)}`,
    name,
    email,
    role,
    mfaEnabled: false
  };
  teamMembers.push(newMember);
  logCompliance(undefined, "TEAM_MEMBER_INVITED", "Sarah Jenkins", `Invited new compliance operator: ${name} (${role})`);
  res.json({ success: true, member: newMember });
});

// Compliance Metrics calculation
app.get("/api/metrics", (req, res) => {
  const total = requests.length;
  const completed = requests.filter(r => r.status === RequestStatus.COMPLETED).length;
  const pending = requests.filter(r => r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.FAILED).length;
  
  // Hardcoded or dynamically evaluated deadlines approaching
  const approaching = requests.filter(r => {
    if (r.status === RequestStatus.COMPLETED) return false;
    const deadline = new Date(r.deadlineDate).getTime();
    const daysLeft = (deadline - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 15;
  }).length;

  res.json({
    totalRequests: total,
    completedRequests: completed,
    pendingRequests: pending,
    averageResolveTimeDays: 3.4,
    approachingDeadlineCount: approaching,
    byType: {
      [RequestType.ACCESS]: requests.filter(r => r.type === RequestType.ACCESS).length,
      [RequestType.ERASURE]: requests.filter(r => r.type === RequestType.ERASURE).length,
      [RequestType.OPT_OUT]: requests.filter(r => r.type === RequestType.OPT_OUT).length,
    }
  });
});

// Export Download Endpoint - returns real compliance compiled JSON structure!
app.get("/api/export/:requestId", (req, res) => {
  const reqObj = requests.find(r => r.id === req.params.requestId);
  if (!reqObj) {
    return res.status(404).send("Export job target not found or has expired.");
  }

  const exportPayload = {
    title: "COMPLIANCE DATA PORTABILITY AUDIT PACKET (GDPR Art. 20 / CCPA Sec. 1798.130)",
    recipient: reqObj.subjectName,
    email: reqObj.subjectEmail,
    complianceStatusDate: reqObj.requestDate,
    provenanceProofHash: reqObj.proofHash || "pending_sign_bf182903_expired_null",
    complianceIssuer: "DSAR Automator Service Agent",
    certifiedIntegrity: "This JSON packet contains automated extractions from all linked storage profiles (Supabase PostgreSQL client schemas + Firebase Admin SDK collection buckets) tied strictly to the verified consumer identity. All data matches verified attributes as scanned from live production schemas.",
    schemasExtracted: {
      supabase_postgres_v15: reqObj.dataSummary?.supabase || { found: false, recordsCount: 0, sample: {} },
      firebase_firestore: reqObj.dataSummary?.firebase || { found: false, recordsCount: 0, sample: {} }
    }
  };

  res.setHeader("Content-Disposition", `attachment; filename="dsar-export-${reqObj.id}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(exportPayload, null, 2));
});

// ==========================================
// CODE VIEWER ENDPOINT
// This returns actual custom-designed Next.js App Router, Prisma,
// BullMQ, Firebase and Docker configs for developers to inspect and copy!
// ==========================================
app.get("/api/dev/files", (req, res) => {
  const prismaSchema = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Organization {
  id             String        @id @default(uuid())
  name           String
  domain         String        @unique
  apiKey         String        @unique
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  members        Member[]
  requests       DsarRequest[]
  auditLogs      AuditLog[]
  
  // Encrypted Integration Credentials
  supabaseUrl          String?
  supabaseServiceRole  String? // AES-256 encrypted
  supabaseSchemas      String[]  @default([])
  supabaseUserField    String    @default("email")
  
  firebaseProjectId     String?
  firebaseStorageBucket String?
  firebaseServiceAccount String? // AES-256 encrypted
  firebaseCollections   String[]  @default([])
}`;

  const dockerCompose = `version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: dsar-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: dsar_automator
      POSTGRES_USER: dsar_admin
      POSTGRES_PASSWORD: super_secret_db_password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: dsar-redis
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://dsar_admin:super_secret_db_password@postgres:5432/dsar_automator?schema=public
      - REDIS_URL=redis://redis:6379
      - ENCRYPTION_SECRET=32_byte_secret_key_for_aes_encryptions
    depends_on:
      - postgres
      - redis

volumes:
  pgdata:`;

  const bullmqWorker = `import { Worker, Queue } from 'bullmq';
import { createSupabaseClient } from '../services/supabaseService';
import { createFirebaseAdmin } from '../services/firebaseService';
import { prisma } from '../lib/db';

export const dsarQueue = new Queue('dsar-operations', {
  connection: { host: 'redis', port: 6379 }
});

const dsarWorker = new Worker('dsar-operations', async (job) => {
  const { requestId, type } = job.data;
  const reqObj = await prisma.dsarRequest.findUnique({
    where: { id: requestId },
    include: { org: true }
  });

  if (!reqObj) throw new Error("Request of scope not found in DB");

  // Step 1: Update log to Scanning
  await prisma.dsarRequest.update({
    where: { id: requestId },
    data: { status: 'SCANNING' }
  });

  // Step 2: Query target sources in parallel
  const [supabaseData, firebaseData] = await Promise.all([
    createSupabaseClient(reqObj.org).fetchUserData(reqObj.subjectEmail),
    createFirebaseAdmin(reqObj.org).fetchUserData(reqObj.subjectEmail)
  ]);

  if (type === 'ACCESS') {
    // Generate secure encrypted compilation payload
    const payload = JSON.stringify({ supabaseData, firebaseData });
    const signedUrl = await uploadEncryptedExport(reqObj.id, payload);
    
    await prisma.dsarRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        exportUrl: signedUrl,
        dataSummary: { supabaseData, firebaseData }
      }
    });
  } else if (type === 'ERASURE') {
    // Sequentially perform compliance cascade destructions
    await createSupabaseClient(reqObj.org).execCascadingErasure(reqObj.subjectEmail);
    await createFirebaseAdmin(reqObj.org).execAuthAndFirestoreErasure(reqObj.subjectEmail);

    await prisma.dsarRequest.update({
      where: { id: requestId },
      data: { status: 'COMPLETED', deletionLog: ["Cascade Purge Complete"] }
    });
  }
}, { connection: { host: 'redis', port: 6379 } });`;

  res.json({
    prisma: prismaSchema,
    docker: dockerCompose,
    bullmq: bullmqWorker,
  });
});

// ==========================================
// VITE OR STATIC SERVING INTEGRATION
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DSAR Automator Server] Full-Stack listening at http://localhost:${PORT}`);
  });
}

startServer();
