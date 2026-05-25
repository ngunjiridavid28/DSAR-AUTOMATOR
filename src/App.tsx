import React, { useState, useEffect } from "react";
import { 
  Database, 
  Flame, 
  Shield, 
  Users, 
  Key, 
  FolderLock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Layers, 
  ClipboardList, 
  ArrowRight, 
  Search, 
  ExternalLink, 
  Trash2, 
  Clock, 
  FileText, 
  TrendingUp, 
  Bell, 
  Terminal, 
  Copy, 
  Plus, 
  HelpCircle,
  Code2, 
  Settings, 
  LayoutDashboard,
  Check,
  UserCheck,
  LogOut,
  Sparkles,
  Lock
} from "lucide-react";
import { 
  RequestType, 
  RequestStatus, 
  WorkspaceConfig, 
  DSARRequest, 
  AuditLog, 
  TeamMember, 
  ComplianceMetrics 
} from "./types";
import Onboarding from "./components/Onboarding";
import Auth from "./components/Auth";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "public_portal" | "audit" | "integrations" | "analytics" | "settings">("overview");
  
  // User Authentication state
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; avatarUrl?: string; isGoogle?: boolean } | null>(() => {
    const saved = localStorage.getItem("dsar_current_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("dsar_current_user");
  };

  const handleLoginSuccess = (user: { email: string; name: string; avatarUrl?: string; isGoogle?: boolean }) => {
    setCurrentUser(user);
    localStorage.setItem("dsar_current_user", JSON.stringify(user));
    // Dispatch a beautiful audit log for secure access mapping
    addClientAuditLog("ACCESS_GRANTED", user.name, "Compliance session authenticated securely via credentials engine.");
  };

  // App States
  const [workspace, setWorkspace] = useState<WorkspaceConfig | null>(null);
  const [requests, setRequests] = useState<DSARRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  
  // UI states
  const [selectedRequest, setSelectedRequest] = useState<DSARRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [isOnboarded, setIsOnboarded] = useState(true);
  
  // Public Portal state (Sandbox testing)
  const [portalName, setPortalName] = useState("");
  const [portalEmail, setPortalEmail] = useState("");
  const [portalType, setPortalType] = useState<RequestType>(RequestType.ACCESS);
  const [portalCreatedRequest, setPortalCreatedRequest] = useState<DSARRequest | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [portalStatusMessage, setPortalStatusMessage] = useState("");
  const [portalVerifySuccess, setPortalVerifySuccess] = useState(false);
  
  // New Team Member Form
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamEmail, setNewTeamEmail] = useState("");
  const [newTeamRole, setNewTeamRole] = useState<"OWNER" | "COMPLIANCE_OFFICER" | "DEVELOPER">("COMPLIANCE_OFFICER");
  
  // Dev Code view
  const [devFiles, setDevFiles] = useState<{ prisma?: string; docker?: string; bullmq?: string }>({});
  const [copiedCodeSec, setCopiedCodeSec] = useState<string | null>(null);

  // Poll intervals & state update triggers
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load Initial API Data
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [wsRes, reqRes, auditRes, teamRes, metricsRes, devFilesRes] = await Promise.all([
        fetch("/api/workspace"),
        fetch("/api/requests"),
        fetch("/api/audit-logs"),
        fetch("/api/team"),
        fetch("/api/metrics"),
        fetch("/api/dev/files")
      ]);

      if (wsRes.ok) {
        const wsObj = await wsRes.json();
        setWorkspace(wsObj);
        // If not connected to anything or default unconfigured, we can show onboarding
        if (!wsObj.supabaseConnected && !wsObj.firebaseConnected) {
          setIsOnboarded(false);
        }
      }
      
      if (reqRes.ok) setRequests(await reqRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (teamRes.ok) setTeamMembers(await teamRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (devFilesRes.ok) setDevFiles(await devFilesRes.json());
      
      setErrorText("");
    } catch (e: any) {
      console.error("API error, falling back to rich interactive state variables", e);
      // Failures are gracefully bypassed using initial server mock states in-page
      setErrorText("API Server offline. Utilizing mock client state visualization.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto refresh every 5 seconds to simulate reactive background workers (BullMQ)
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleOnboardingComplete = async (updatedWs: WorkspaceConfig) => {
    try {
      const res = await fetch("/api/workspace/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedWs)
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.workspace);
        setIsOnboarded(true);
        loadData();
      }
    } catch (e) {
      // Fallback
      setWorkspace(updatedWs);
      setIsOnboarded(true);
    }
  };

  const addClientAuditLog = (eventType: string, actor: string, details: string) => {
    const newLog: AuditLog = {
      id: `log_cl_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: workspace?.id || "ws_acme_prod",
      eventType,
      timestamp: new Date().toISOString(),
      actor,
      details,
      status: "SUCCESS",
      ipAddress: "127.0.0.1",
      signature: "cl_sig_" + Math.random().toString(36).substring(4, 12)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Submit Public request (Simulation of Client API endpoint)
  const submitPublicRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalName || !portalEmail) return;

    setPortalStatusMessage("");
    try {
      const response = await fetch("/api/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectName: portalName, subjectEmail: portalEmail, type: portalType })
      });
      if (response.ok) {
        const data = await response.json();
        // Automatically fetch entire list again
        await loadData(true);
        const addedReq = requests.find(r => r.id === data.requestId) || {
          id: data.requestId,
          workspaceId: "ws_acme_prod",
          type: portalType,
          status: RequestStatus.VERIFYING,
          subjectName: portalName,
          subjectEmail: portalEmail,
          verificationCode: data.verificationCode,
          isVerified: false,
          requestDate: new Date().toISOString(),
          deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } as DSARRequest;

        setPortalCreatedRequest(addedReq);
        setOtpInput("");
        setPortalStatusMessage(`Verification OTP Code dispatched successfully to ${portalEmail}`);
      }
    } catch (e) {
      setPortalStatusMessage("Failed to submit request to node background.");
    }
  };

  // Verify Identity (Simulating double-factor customer click)
  const handleVerifyOtp = async () => {
    if (!portalCreatedRequest || !otpInput) return;
    try {
      const response = await fetch("/api/requests/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: portalCreatedRequest.id, code: otpInput })
      });
      if (response.ok) {
        const data = await response.json();
        setPortalVerifySuccess(true);
        setPortalStatusMessage("Identity Verified. Background workers (BullMQ) have been triggered to sweep databases!");
        // Update request context
        setPortalCreatedRequest(data.request);
        loadData(true);
      } else {
        const error = await response.json();
        setPortalStatusMessage(error.error || "Incorrect security credentials");
      }
    } catch (e) {
      setPortalStatusMessage("Verification interface timed out.");
    }
  };

  // Admin Actions (approve deletion, trigger scan, retry failed jobs in queue)
  const triggerBackendAction = async (requestId: string, action: "RE_SCAN" | "APPROVE_ERASURE" | "RETRY_JOB") => {
    try {
      const response = await fetch("/api/requests/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action })
      });
      if (response.ok) {
        const data = await response.json();
        if (selectedRequest && selectedRequest.id === requestId) {
          setSelectedRequest(data.request);
        }
        loadData(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add new Team Member
  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName || !newTeamEmail) return;
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName, email: newTeamEmail, role: newTeamRole })
      });
      if (res.ok) {
        setNewTeamName("");
        setNewTeamEmail("");
        loadData(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeSec(label);
    setTimeout(() => setCopiedCodeSec(null), 2000);
  };

  // Calculated variables
  const activeJobsCount = requests.filter(r => 
    r.status === RequestStatus.SCANNING || 
    r.status === RequestStatus.DELETING || 
    r.status === RequestStatus.GENERATING
  ).length;

  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} userEmailMetadata="ngunjiridavid28@gmail.com" />;
  }

  if (loading && !workspace) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
            <Shield className="w-6 h-6 text-blue-500 absolute top-5 left-5" />
          </div>
          <p className="text-sm font-mono text-slate-400 tracking-wider">LOADING SECURE PRIVACY ROUTER...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500/20 flex flex-col selection:text-blue-200">
      
      {/* GLOBAL SYSTEM BAR */}
      <div className="bg-slate-950 border-b border-slate-900 px-6 py-2.5 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-blue-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            DSAR AUTOMATOR SECURE CORE v2.4
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="hidden sm:inline">Workspace ID: <strong className="text-slate-300">{workspace?.id || "ws_offline_mock"}</strong></span>
        </div>
        <div className="flex items-center gap-3">
          {isRefreshing ? (
            <span className="animate-spin text-slate-500"><RefreshCw className="w-3.5 h-3.5" /></span>
          ) : (
            <button 
              id="refresh-data-btn"
              onClick={handleManualRefresh} 
              className="hover:text-white transition flex items-center gap-1.5 focus:outline-none cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 hover:text-blue-400" />
              <span>Poll Status</span>
            </button>
          )}
          <span className="text-slate-700">|</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-blue-400 font-medium">
            256-bit AES DB Cryptography
          </span>
        </div>
      </div>

      {/* RE-ONBOARDING ALERTER */}
      {!isOnboarded && workspace && (
        <div className="bg-slate-950 flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-2xl py-8">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">DSAR Automator</h1>
              <p className="text-slate-400 text-sm mt-2">Connecting Supabase & Firebase multi-tenant privacy automated operations</p>
            </div>
            <Onboarding 
              config={workspace} 
              onComplete={handleOnboardingComplete} 
            />
          </div>
        </div>
      )}

      {isOnboarded && (
        <>
          {/* TOP PRIMARY COMPLIANCE BRANDING HEADER */}
          <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 p-2.5 rounded-2xl shadow-lg border border-violet-400/20 shadow-violet-600/10">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-white font-display">DSAR Automator</h1>
                  <span className="bg-violet-500/15 text-[10px] px-2.5 py-0.5 rounded-full text-violet-400 border border-violet-500/20 font-semibold font-mono uppercase tracking-wider">Enterprise Pro</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Privacy compliance gateway for {workspace?.name || "Acme SaaS"}</p>
              </div>
            </div>

            {/* STAGES METRIC, BULLMQ MONITOR + PROFILE DROPDOWN */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* BullMQ status pill */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold font-mono text-slate-350">
                  <span className={`w-2 h-2 rounded-full ${activeJobsCount > 0 ? "bg-amber-500 animate-pulse" : "bg-violet-500"}`}></span>
                  <span>{activeJobsCount} Active Jobs</span>
                </div>
                {activeJobsCount > 0 && (
                  <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                )}
              </div>

              {/* Secure User Credentials Profile Widget */}
              <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
                <div className="relative">
                  <img 
                    src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser?.name || "admin")}`} 
                    alt={currentUser?.name || "User Profile"} 
                    className="w-7 h-7 rounded-full border border-violet-500/20"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
                </div>
                <div className="text-left hidden sm:block max-w-[120px] truncate">
                  <div className="text-[11px] font-bold text-slate-100 flex items-center gap-1">
                    <span className="truncate">{currentUser?.name}</span>
                    {currentUser?.isGoogle && <Sparkles className="w-2.5 h-2.5 text-yellow-500 shrink-0" />}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono leading-none truncate mt-0.5">{currentUser?.email}</div>
                </div>
                <button 
                  id="header-logout-btn"
                  onClick={handleLogout}
                  title="Secure logout session"
                  className="ml-1 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer focus:outline-none"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              <button 
                id="header-goto-portal-btn"
                onClick={() => setActiveTab("public_portal")}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-violet-600/15"
              >
                <span>Consumer Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* HORIZONTAL COMPLIANCE TAB NAVIGATION BAR */}
          <nav className="bg-slate-900 border-b border-slate-800/80 sticky top-[69px] z-30 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between overflow-x-auto gap-4 py-2.5 scrollbar-none">
              <div className="flex items-center gap-1.5 shrink-0 py-0.5">
                {[
                  { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
                  { id: "requests", label: "Privacy Pipeline", icon: ClipboardList, badge: requests.filter(r => r.status !== RequestStatus.COMPLETED).length },
                  { id: "integrations", label: "Database Connectors", icon: Database, showStatus: true },
                  { id: "audit", label: "Verifiable Audit Logs", icon: FolderLock },
                  { id: "analytics", label: "Compliance Analytics", icon: TrendingUp },
                  { id: "settings", label: "Developer & Team", icon: Settings },
                  { id: "public_portal", label: "Public Intake Portal", icon: ExternalLink, accent: true }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-btn-${tab.id}`}
                      onClick={() => { setActiveTab(tab.id as any); setSelectedRequest(null); }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-sans transition-all duration-200 cursor-pointer border relative select-none shrink-0 ${
                        isActive 
                          ? "bg-linear-to-r from-violet-600 to-indigo-600 text-white border-violet-500/80 shadow-md shadow-violet-600/10" 
                          : tab.accent
                            ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/10"
                            : "bg-slate-950/40 hover:bg-slate-950/90 text-slate-400 hover:text-slate-100 border-slate-850"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-violet-400"}`} />
                      <span>{tab.label}</span>
                      
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-4 text-center">
                          {tab.badge}
                        </span>
                      )}

                      {tab.showStatus && (
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Status / Help */}
              <div className="hidden lg:flex items-center gap-3.5 text-xs text-slate-400 border-l border-slate-800 pl-4 shrink-0">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>Compliance Engine Active</span>
                </div>
              </div>
            </div>
          </nav>

          {/* MAIN CONTAINER LAYOUT */}
          <div className="flex flex-1 flex-col relative">

            {/* MAIN COMPLIANCE DASHBOARD BODY CONTENT */}
            <main className="flex-1 p-8 overflow-y-auto">
              
              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-8 animate-fadeIn">
                  
                  {/* METRIC BOXES SUMMARY GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Received Requests</span>
                        <ClipboardList className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-3xl font-bold text-white tracking-tight">{metrics?.totalRequests ?? requests.length}</div>
                      <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                        <span className="text-emerald-400 font-bold">&#8593; 12%</span>
                        <span>increase this month</span>
                      </p>
                      <div className="absolute bottom-0 left-0 h-1 bg-blue-500/40 w-full"></div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider">Completed Compliance</span>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-3xl font-bold text-white tracking-tight">
                        {metrics?.completedRequests ?? requests.filter(r => r.status === RequestStatus.COMPLETED).length}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        {Math.round(((metrics?.completedRequests ?? requests.filter(r => r.status === RequestStatus.COMPLETED).length) / (requests.length || 1)) * 100)}% of total processed safely
                      </p>
                      <div className="absolute bottom-0 left-0 h-1 bg-emerald-500/40 w-full"></div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider">Pending Execution</span>
                        <Clock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-3xl font-bold text-white tracking-tight text-amber-300">
                        {metrics?.pendingRequests ?? requests.filter(r => r.status !== RequestStatus.COMPLETED && r.status !== RequestStatus.FAILED).length}
                      </div>
                      <p className="text-[11px] text-amber-500 mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                        <span>Action required by compliance lead</span>
                      </p>
                      <div className="absolute bottom-0 left-0 h-1 bg-amber-500/40 w-full"></div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition">
                      <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider">Avg Resolution Performance</span>
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-3xl font-bold text-white tracking-tight">3.4 <span className="text-xs font-normal text-slate-500">Days</span></div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        SLA ceiling: 30 days GDPR limit
                      </p>
                      <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/40 w-full"></div>
                    </div>

                  </div>

                  {/* ACTIVE COMPLIANCE RUNNING WORKERS WARNING */}
                  {requests.filter(r => r.status === RequestStatus.SCANNING || r.status === RequestStatus.DELETING || r.status === RequestStatus.GENERATING).map(req => (
                    <div key={req.id} className="bg-slate-900 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping shrink-0" />
                        <div>
                          <p className="font-semibold text-white">BullMQ Asynchronous Job Processing: {req.id}</p>
                          <p className="text-slate-400 text-[11px]">Executing target index sweep on active collections for: <span className="font-mono text-slate-200">{req.subjectEmail}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                        <span className="font-mono text-[11px] text-slate-400 uppercase tracking-widest">{req.status}</span>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-500 border-t-transparent animate-spin"></span>
                      </div>
                    </div>
                  ))}

                  {/* DOUBLE COLUMN - REQUESTS QUEUE & QUICK DISPATCH PORTAL */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* DSAR REQUEST QUEUING */}
                    <div className="xl:col-span-2 bg-slate-900 border border-slate-800/95 rounded-xl block p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-white tracking-tight">Consumer Privacy Requests Queue</h3>
                          <p className="text-xs text-slate-400">Chronological incoming GDPR erasure & data access queues</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            placeholder="Filter by email..." 
                            className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1 text-xs text-white placeholder-slate-600 focus:outline-none" 
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-400">
                          <thead className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-850 bg-slate-950/45">
                            <tr>
                              <th className="py-3 px-4">Subject</th>
                              <th className="py-3 px-4">Type</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">SLA Deadline Calendar</th>
                              <th className="py-3 px-4 text-right">Task Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {requests.map(req => {
                              const isCompleted = req.status === RequestStatus.COMPLETED;
                              const isPendingApproval = req.status === RequestStatus.PENDING_APPROVAL;
                              const daysRemaining = Math.ceil((new Date(req.deadlineDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                              
                              return (
                                <tr key={req.id} className="hover:bg-slate-850/40 transition group">
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-white">{req.subjectName}</div>
                                    <div className="text-[11px] text-slate-500 font-mono">{req.subjectEmail}</div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-block px-2 text-[10px] uppercase font-bold font-mono py-0.5 rounded border ${
                                      req.type === RequestType.ACCESS 
                                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                                        : req.type === RequestType.ERASURE 
                                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                        : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                    }`}>
                                      {req.type}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest ${
                                      req.status === RequestStatus.COMPLETED 
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : req.status === RequestStatus.FAILED
                                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}>
                                      <span className={`w-1 h-1 rounded-full ${isCompleted ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}></span>
                                      {req.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      {isCompleted ? (
                                        <span className="text-[11px] text-emerald-400 font-medium">Completed Instantly</span>
                                      ) : daysRemaining <= 0 ? (
                                        <span className="text-[11px] text-rose-400 font-bold">&#9888; OVERDUE Breach</span>
                                      ) : (
                                        <div className="space-y-1">
                                          <div className="text-[11px] text-slate-300 font-medium"><strong>{daysRemaining} days</strong> remaining</div>
                                          <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full ${daysRemaining < 10 ? "bg-rose-500" : "bg-blue-500"}`} 
                                              style={{ width: `${Math.min(100, (daysRemaining / 30) * 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      id={`expand-request-details-btn-${req.id}`}
                                      onClick={() => setSelectedRequest(req)}
                                      className="text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 font-medium py-1.5 px-3 rounded-lg text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <span>Examine Records</span>
                                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* LIVE DEV BOX */}
                    <div className="bg-slate-900 border border-slate-800/95 rounded-xl p-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Terminal className="w-5 h-5" />
                          <h3 className="font-mono text-sm uppercase tracking-wide font-bold">Secure Core API Key</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-normal">
                          Below is your tenant-isolated workspace API bearer token. Use this to post authenticated privacy events directly from your SaaS API routes.
                        </p>
                        
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-xs text-slate-300 break-all space-y-2">
                          <div className="text-[10px] text-slate-500">AUTHORIZATION BEARER KEY:</div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-blue-300 font-bold tracking-tight">{workspace?.apiKey || "dsar_live_offline_mock_b981ca"}</span>
                            <button 
                              id="copy-api-token-mini-btn"
                              onClick={() => copyToClipboard(workspace?.apiKey || "", "api")}
                              className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-900 transition focus:outline-none cursor-pointer"
                            >
                              {copiedCodeSec === "api" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 space-y-3">
                          <span className="block text-xs font-mono text-slate-500 uppercase tracking-widest">Connected Target Stats</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                              <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">SUPABASE</span>
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                <span>{workspace?.supabaseSchemas.length || 4} SCHEMAS</span>
                              </div>
                            </div>
                            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg">
                              <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">FIREBASE</span>
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                <span>{workspace?.firebaseCollections.length || 3} COLS</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-800 space-y-3">
                        <div className="bg-gradient-to-r from-blue-950/40 text-[11px] text-slate-300 p-3 rounded-lg border border-blue-900/35">
                          <strong>Simulate Compliance</strong>: Go to the public port menu or send an access query to see the automatic data compile process.
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}


              {/* SELECTED REQUEST DRAWERS / DETAILED INSPECTOR VIEW */}
              {selectedRequest && (
                <div className="fixed inset-0 min-h-screen bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-end animate-fadeIn">
                  <div className="w-full max-w-3xl bg-slate-900 border-l border-slate-800 min-h-screen p-8 flex flex-col justify-between shadow-2xl overflow-y-auto">
                    
                    <div className="space-y-6">
                      
                      {/* Detailed Drawer Close */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-slate-400">EXAMINING PRIVACY CASE: {selectedRequest.id}</span>
                        <button 
                          id="close-request-drawer-btn"
                          onClick={() => setSelectedRequest(null)}
                          className="bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 font-mono text-xs font-semibold py-1.5 px-3 rounded-md transition cursor-pointer"
                        >
                          [x] Close Drawer
                        </button>
                      </div>

                      {/* Header */}
                      <div className="border-b border-slate-800 pb-5">
                        <div className="text-2xl font-bold tracking-tight text-white mb-2">{selectedRequest.subjectName}</div>
                        <div className="font-mono text-xs text-slate-400 flex items-center gap-4">
                          <span>User Identity: <strong>{selectedRequest.subjectEmail}</strong></span>
                          <span>&bull;</span>
                          <span>Verified Status: 
                            {selectedRequest.isVerified ? (
                              <strong className="text-emerald-400"> YES (Identity Secure)</strong>
                            ) : (
                              <strong className="text-slate-500"> Code Dispatched</strong>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Request details info block */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <span className="block text-[9px] text-slate-500 font-mono uppercase tracking-widest">COMPLIANCE SCHEMA</span>
                          <span className="block text-sm font-bold text-white mt-1">{selectedRequest.type}</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <span className="block text-[9px] text-slate-500 font-mono uppercase tracking-widest">SLA DEADLINE</span>
                          <span className="block text-sm font-bold text-slate-300 mt-1">{new Date(selectedRequest.deadlineDate).toLocaleDateString()}</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <span className="block text-[9px] text-slate-500 font-mono uppercase tracking-widest">STATE VERIFIER</span>
                          <span className="block text-sm font-bold text-blue-400 uppercase mt-1">{selectedRequest.status}</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <span className="block text-[9px] text-slate-500 font-mono uppercase tracking-widest">VERIFIED KEY</span>
                          <span className="block text-sm font-bold font-mono text-indigo-400 mt-1">{selectedRequest.verificationCode}</span>
                        </div>
                      </div>

                      {/* Supabase & Firebase scans summaries */}
                      <div className="space-y-4">
                        <span className="block text-xs font-mono text-slate-500 uppercase tracking-widest pt-2">TARGET INTEGRATION RECORDS SWEEP</span>
                        
                        {/* Supabase Box */}
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[#3ECF8E]">
                              <Database className="w-4 h-4" />
                              <span className="text-xs font-bold font-sans">Supabase DB Scan Findings</span>
                            </div>
                            <span className="text-xs font-mono text-slate-500">[Schema sweep matching USER fields]</span>
                          </div>

                          {selectedRequest.dataSummary?.supabase?.found ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="bg-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] font-bold font-mono px-2 py-0.5 rounded">MATCH FOUND</span>
                                <span className="text-slate-300">Target UUID: <strong>{selectedRequest.dataSummary.supabase.sample.user_id}</strong></span>
                                <span className="text-slate-500">&bull;</span>
                                <span className="text-slate-300"><strong>{selectedRequest.dataSummary.supabase.recordsCount} Relational Rows</strong> mapped</span>
                              </div>
                              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg font-mono text-xs text-slate-400 max-h-40 overflow-y-auto leading-relaxed">
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">EXTRACTED PROFILE OBJECT:</div>
                                {JSON.stringify(selectedRequest.dataSummary.supabase.sample, null, 2)}
                              </div>
                            </div>
                          ) : (
                            <span className="block text-xs text-slate-500 italic">No corresponding target references identified in Supabase schemas.</span>
                          )}
                        </div>

                        {/* Firebase Box */}
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[#FFCA28]">
                              <Flame className="w-4 h-4" />
                              <span className="text-xs font-bold font-sans">Firebase Admin SDK sweep</span>
                            </div>
                            <span className="text-xs font-mono text-slate-500">[Firestore recursively combed + Auth UID]</span>
                          </div>

                          {selectedRequest.dataSummary?.firebase?.found ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="bg-[#FFCA28]/20 text-[#FFCA28] text-[10px] font-bold font-mono px-2 py-0.5 rounded">IAM DISCOVERED</span>
                                <span className="text-slate-300">Firebase UID: <strong>{selectedRequest.dataSummary.firebase.sample.uid}</strong></span>
                                <span className="text-slate-500">&bull;</span>
                                <span className="text-slate-300"><strong>{selectedRequest.dataSummary.firebase.recordsCount} Documents</strong> compiled</span>
                              </div>
                              <div className="bg-slate-900 border border-slate-850 p-3 rounded-lg font-mono text-xs text-slate-400 max-h-40 overflow-y-auto leading-relaxed">
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">FIRESTORE RECORD EXTRACTION:</div>
                                {JSON.stringify(selectedRequest.dataSummary.firebase.sample, null, 2)}
                              </div>
                            </div>
                          ) : (
                            <span className="block text-xs text-slate-500 italic">No documents matched on Firestore paths matching metadata constraints.</span>
                          )}
                        </div>

                      </div>

                      {/* Deletion logs or rollback proofs */}
                      {selectedRequest.status === RequestStatus.COMPLETED && selectedRequest.deletionLog && (
                        <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-2">
                          <span className="block text-xs font-mono text-blue-400 font-semibold tracking-wider uppercase">VERIFIABLE PROOF OF ERASURE</span>
                          <div className="font-mono text-xs text-slate-400 space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-850">
                            {selectedRequest.deletionLog.map((logLine, idx) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-emerald-500 font-bold">[OK]</span>
                                <span>{logLine}</span>
                              </div>
                            ))}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                            <span>CRYPTOGRAPHIC HASH:</span>
                            <span className="text-slate-300 tracking-tight font-bold">{selectedRequest.proofHash}</span>
                          </div>
                        </div>
                      )}

                    </div>

                    <div className="pt-6 border-t border-slate-800 space-y-4">
                      
                      {/* Active Status Actions */}
                      <div className="flex flex-col md:flex-row gap-3">
                        {selectedRequest.status === RequestStatus.PENDING_APPROVAL && selectedRequest.type === RequestType.ERASURE && (
                          <button
                            id="drawer-approve-erasure-btn"
                            type="button"
                            onClick={() => triggerBackendAction(selectedRequest.id, "APPROVE_ERASURE")}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition flex-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Authorize & Hard Delete from All Databases</span>
                          </button>
                        )}

                        {selectedRequest.status === RequestStatus.COMPLETED && selectedRequest.exportUrl && (
                          <a
                            id="drawer-download-export-btn"
                            href={selectedRequest.exportUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-950 hover:bg-slate-900 text-emerald-400 border border-slate-800 hover:border-emerald-500/30 text-center font-semibold text-xs px-5 py-3 rounded-lg flex items-center justify-center gap-2 transition flex-1 cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
                            <span>Download Secure JSON Compliance Package</span>
                          </a>
                        )}

                        <button
                          id="drawer-rescan-btn"
                          type="button"
                          onClick={() => triggerBackendAction(selectedRequest.id, "RE_SCAN")}
                          className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 font-semibold text-xs px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Queue Re-scan Scan</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 leading-relaxed text-center">
                        This administrative panel maintains secure sandbox connection keys. Database deletion actions cascade automatically inside your environment.
                      </div>

                    </div>

                  </div>
                </div>
              )}


              {/* TAB 2: ALL COMPLIANCE PRIVACY REQUESTS LIST */}
              {activeTab === "requests" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Compliance Requests Pipeline</h2>
                      <p className="text-sm text-slate-400">Examine details, search target databases, trigger manual code re-scans, and configure downloadable packages.</p>
                    </div>
                  </div>

                  {/* ACTIVE REQUESTS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {requests.map(req => {
                      const daysRemaining = Math.ceil((new Date(req.deadlineDate).getTime() - Date.now()) / (1000 * 3600 * 24));
                      const isCompleted = req.status === RequestStatus.COMPLETED;
                      
                      return (
                        <div key={req.id} className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition">
                          
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-slate-500">{req.id}</span>
                              <span className={`inline-block px-2 py-0.5 text-[10px] uppercase font-bold font-mono rounded border ${
                                req.type === RequestType.ACCESS 
                                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400" 
                                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              }`}>
                                {req.type}
                              </span>
                            </div>

                            <div>
                              <div className="text-lg font-bold text-white tracking-tight">{req.subjectName}</div>
                              <div className="text-xs text-slate-400 font-mono mt-0.5">{req.subjectEmail}</div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-850/80">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Pipeline State:</span>
                                <span className="text-blue-400 font-bold uppercase tracking-wider">{req.status}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Verification OTP Code Dispatch:</span>
                                <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">{req.verificationCode}</span>
                              </div>
                            </div>

                            {/* SCAN HIGHLIGHT INFO */}
                            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-850">
                              <span className="block text-[10px] uppercase font-mono text-slate-500 tracking-wider mb-2">TARGET INTEGRATION SNAPSHOT</span>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-slate-400">
                                  Supabase: <strong className={req.dataSummary?.supabase?.found ? "text-emerald-400" : "text-slate-500"}>
                                    {req.dataSummary?.supabase?.found ? `${req.dataSummary.supabase.recordsCount} Rows` : "NotFound"}
                                  </strong>
                                </div>
                                <div className="text-slate-400">
                                  Firebase: <strong className={req.dataSummary?.firebase?.found ? "text-emerald-400" : "text-slate-500"}>
                                    {req.dataSummary?.firebase?.found ? `${req.dataSummary.firebase.recordsCount} Documents` : "NotFound"}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* SLA PROGRESS BAR */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-500">Compliance Countdown SLA:</span>
                                {isCompleted ? (
                                  <strong className="text-emerald-400">COMPLETED ON-TIME</strong>
                                ) : (
                                  <span className="text-slate-300"><strong>{daysRemaining} Days Left</strong></span>
                                )}
                              </div>
                              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${isCompleted ? "bg-emerald-500" : daysRemaining < 10 ? "bg-rose-500" : "bg-blue-500"}`}
                                  style={{ width: `${isCompleted ? 100 : Math.min(100, (daysRemaining / 30) * 100)}%` }}
                                />
                              </div>
                            </div>

                          </div>

                          <div className="pt-6 border-t border-slate-850 mt-6 flex gap-2">
                            <button
                              id={`examine-inspect-btn-${req.id}`}
                              onClick={() => setSelectedRequest(req)}
                              className="text-white hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 font-semibold py-2 px-4 rounded-lg text-xs transition flex-1 cursor-pointer"
                            >
                              Examine Records Sweep
                            </button>
                            {req.status === RequestStatus.COMPLETED && req.exportUrl && (
                              <a
                                id={`quick-export-download-${req.id}`}
                                href={req.exportUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 p-2 rounded-lg text-xs flex items-center justify-center transition"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              )}


              {/* TAB 3: PUBLIC CONSUMER PORTAL SANDBOX */}
              {activeTab === "public_portal" && (
                <div className="space-y-8 animate-fadeIn">
                  
                  <div className="border-b border-slate-900 pb-5">
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Public Portal Testing Arena</h2>
                    <p className="text-sm text-slate-400">
                      SaaS startups using DSAR Automator provide a customized, embeddable portal link to their users. You can immediately test how a customer submits and double-factor validates their digital presence below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* PORTAL FORM BODY */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                      <div className="flex items-center gap-2 text-blue-400">
                        <UserCheck className="w-5 h-5 animate-pulse" />
                        <h3 className="font-bold text-white">Create Sandbox Request</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-normal">
                        Submit a trial request simulating end-user actions. The platform automatically dispatches an OTP authentication key immediately viewable on the console/verification panel below.
                      </p>

                      <form onSubmit={submitPublicRequest} className="space-y-4">
                        <div>
                          <label htmlFor="portal-name-input" className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">End-User Full Name</label>
                          <input
                            id="portal-name-input"
                            type="text"
                            placeholder="e.g. Liam Neeson"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={portalName}
                            onChange={(e) => setPortalName(e.target.value)}
                          />
                        </div>

                        <div>
                          <label htmlFor="portal-email-input" className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Owner Access Email Address</label>
                          <input
                            id="portal-email-input"
                            type="email"
                            placeholder="e.g. liam.neeson@gmail.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={portalEmail}
                            onChange={(e) => setPortalEmail(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Applicable Right Selection</label>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <button
                              id="btn-public-select-access"
                              type="button"
                              onClick={() => setPortalType(RequestType.ACCESS)}
                              className={`p-3.5 rounded-lg border text-left transition ${
                                portalType === RequestType.ACCESS 
                                  ? "bg-slate-950/80 border-blue-500 text-white" 
                                  : "bg-slate-950/30 border-slate-850 text-slate-500"
                              }`}
                            >
                              <span className="block font-bold">Data Access / Portability</span>
                              <span className="block text-[10px] text-slate-500 mt-1">Export JSON packet with full record tree</span>
                            </button>
                            <button
                              id="btn-public-select-erasure"
                              type="button"
                              onClick={() => setPortalType(RequestType.ERASURE)}
                              className={`p-3.5 rounded-lg border text-left transition ${
                                portalType === RequestType.ERASURE 
                                  ? "bg-slate-950/80 border-rose-500 text-white" 
                                  : "bg-slate-950/30 border-slate-850 text-slate-500"
                              }`}
                            >
                              <span className="block font-bold">Right to be Forgotten</span>
                              <span className="block text-[10px] text-slate-500 mt-1">Simulate cascading deletion workflows</span>
                            </button>
                          </div>
                        </div>

                        <button
                          id="submit-public-request-btn"
                          type="submit"
                          disabled={!portalName || !portalEmail}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition"
                        >
                          <span>Dispatch Encrypted Security OTP Code</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </form>

                    </div>

                    {/* DISPATCH SCREEN & VERIFY SIMULATION */}
                    <div className="space-y-6">
                      
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                        <div className="flex items-center gap-2 text-[#FFCA28]">
                          <Shield className="w-5 h-5" />
                          <h3 className="font-bold text-white">Consensual Security Verification Screen</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-normal">
                          For high safety confidence, GDPR mandates verifiable authentication. We dispatched a dummy 6-digit cryptographic security code. Match it below to trigger scanning workers:
                        </p>

                        {portalCreatedRequest ? (
                          <div className="space-y-4">
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 border-emerald-500/20 text-xs">
                              <span className="block text-slate-400 font-semibold mb-2 flex items-center gap-1.5 text-emerald-400">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Simulated Verification code for the Sandbox:</span>
                              </span>
                              <div className="text-3xl font-bold font-mono tracking-wider text-slate-100 mb-1">{portalCreatedRequest.verificationCode}</div>
                              <p className="text-[11px] text-slate-500">
                                Usually, this code gets delivered via transactional email services (SendGrid/Resend) securely. Copy/enter this code directly inside the inputs below:
                              </p>
                            </div>

                            <div className="space-y-3">
                              <label htmlFor="otp-input-box" className="block text-xs font-mono text-slate-500 uppercase tracking-widest">ENTER SECURE 6-DIGIT OTP</label>
                              <div className="flex gap-2.5">
                                <input
                                  id="otp-input-box"
                                  type="text"
                                  placeholder="------"
                                  maxLength={6}
                                  className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 font-mono text-lg font-bold text-center text-white tracking-widest w-40 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  value={otpInput}
                                  onChange={(e) => setOtpInput(e.target.value)}
                                />
                                <button
                                  id="verify-otp-btn"
                                  type="button"
                                  onClick={handleVerifyOtp}
                                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 rounded-lg transition"
                                >
                                  Verify Access Consents
                                </button>
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div className="bg-slate-950 p-6 rounded-lg border border-slate-850 text-center text-xs text-slate-500 italic">
                            Waiting for a privacy request initiation event...
                          </div>
                        )}

                        {portalStatusMessage && (
                          <div className={`p-4 rounded-lg text-xs leading-normal border ${
                            portalVerifySuccess 
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                              : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          }`}>
                            {portalStatusMessage}
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6.5 text-xs text-slate-400 leading-normal space-y-1">
                        <strong className="text-white block">Production Implementation Tip:</strong>
                        <span>When embedded, this portal can be customized with CSS variables to align with your platform UI. The portal manages request workflows securely inside an iframe on customer client pages.</span>
                      </div>

                    </div>

                  </div>

                </div>
              )}


              {/* TAB 4: COMPLIANCE AUDIT TRAILS */}
              {activeTab === "audit" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  <div className="flex items-center justify-between border-b border-slate-900 pb-5">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Audit Trail & Compliance Logs</h2>
                      <p className="text-sm text-slate-400">Verifiable logging of all integration queries, consumer identity validations, and administrative file purging actions.</p>
                    </div>
                  </div>

                  {/* LOGS TABLE LIST */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-400">
                        <thead className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-850 bg-slate-950/45">
                          <tr>
                            <th className="py-3.5 px-4">TIMESTAMP UTC</th>
                            <th className="py-3.5 px-4">ACTOR / DRIVER</th>
                            <th className="py-3.5 px-4">EVENT TYPE</th>
                            <th className="py-3.5 px-4">SECURE EVENT DETAILS</th>
                            <th className="py-3.5 px-4">IP ORIGIN</th>
                            <th className="py-3.5 px-4 text-right">SHA-256 SIGNATURE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-slate-300 font-sans">
                          {auditLogs.map(log => {
                            const isWarning = log.status === "WARNING";
                            return (
                              <tr key={log.id} className="hover:bg-slate-850/30 transition">
                                <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString("en-US", { timeZone: "UTC" })}
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-200">{log.actor}</td>
                                <td className="py-3 px-4">
                                  <span className={`inline-block px-2 text-[10px] font-mono font-bold py-0.5 rounded border ${
                                    isWarning 
                                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  }`}>
                                    {log.eventType}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-400 text-[11px] max-w-sm">{log.details}</td>
                                <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-500 text-[10px] select-all group">
                                  <span className="hover:text-blue-400 transition cursor-pointer" title="Certified Log Integrity Signature">
                                    {log.signature.substring(0, 16)}...
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}


              {/* TAB 5: INTEGRATION ENGINE */}
              {activeTab === "integrations" && (
                <div className="space-y-8 animate-fadeIn">
                  
                  <div className="border-b border-slate-900 pb-5">
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Target Database Connectors</h2>
                    <p className="text-sm text-slate-400">
                      Configure connection schemas for your database clusters. We securely retain connections on isolated tenant profiles for rapid indexing.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* SUPABASE CONNECTION CARD */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#3ECF8E]">
                          <Database className="w-5 h-5 animate-pulse" />
                          <h3 className="font-bold text-white">Supabase PostgreSQL integration</h3>
                        </div>
                        <span className="bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 text-[#3ECF8E] text-[10px] px-2 py-0.5 rounded-full font-bold">
                          CONNECTED
                        </span>
                      </div>
                      
                      <div className="space-y-3.5 pt-2">
                        <div>
                          <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">API URL:</label>
                          <div className="bg-slate-950 px-3.5 py-2 rounded-lg text-slate-300 font-mono text-xs border border-slate-850">
                            {workspace?.supabaseUrl || "https://xeyuofajdlkncsdw.supabase.co"}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">SERVICE ROLE SECRET:</label>
                          <div className="bg-slate-950 px-3.5 py-2 rounded-lg text-slate-500 font-mono text-xs border border-slate-850">
                            ************************************************************8abcef
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">SCHEMAS COMED FOR EMAIL REFERENCES:</label>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {workspace?.supabaseSchemas.map(schema => (
                              <span key={schema} className="bg-slate-950 px-2.5 py-1 rounded text-xs text-slate-300 font-mono border border-slate-850 inline-block">
                                {schema}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-850 flex gap-2">
                        <button
                          id="btn-trigger-schema-rescan-supabase"
                          onClick={() => {
                            if (workspace) {
                              setIsRefreshing(true);
                              setTimeout(() => {
                                setIsRefreshing(false);
                                addClientAuditLog("SCHEMA_SCAN", "Supabase Integration Engine", "Explicit metadata reload successful. Map updated.");
                                alert("Supabase index map successfully rebuilt.");
                              }, 1000);
                            }
                          }}
                          className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-705 font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Re-scan Relational Mapping</span>
                        </button>
                      </div>

                    </div>


                    {/* FIREBASE CONNECTION CARD */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#FFCA28]">
                          <Flame className="w-5 h-5 animate-pulse" />
                          <h3 className="font-bold text-white">Firebase Admin Node IAM</h3>
                        </div>
                        <span className="bg-[#FFCA28]/10 border border-[#FFCA28]/20 text-[#FFCA28] text-[10px] px-2 py-0.5 rounded-full font-bold">
                          CONNECTED
                        </span>
                      </div>

                      <div className="space-y-3.5 pt-2">
                        <div>
                          <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">PROJECT CREDENTIALS ID:</label>
                          <div className="bg-slate-950 px-3.5 py-2 rounded-lg text-slate-300 font-mono text-xs border border-slate-850">
                            {workspace?.firebaseProjectId || "acme-prod-auth-10ec"}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">STORAGE COMPLIANCE BUCKET LINK:</label>
                          <div className="bg-slate-950 px-3.5 py-2 rounded-lg text-slate-300 font-mono text-xs border border-slate-850">
                            {workspace?.firebaseStorageBucket || "acme-prod-auth-10ec.appspot.com"}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">CONNECTED FIRESTORE TARGET PATHS:</label>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {workspace?.firebaseCollections.map(col => (
                              <span key={col} className="bg-slate-950 px-2.5 py-1 rounded text-xs text-slate-300 font-mono border border-slate-850 inline-block">
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-850 flex gap-2">
                        <button
                          id="btn-trigger-schema-rescan-firebase"
                          onClick={() => {
                            setIsRefreshing(true);
                            setTimeout(() => {
                              setIsRefreshing(false);
                              addClientAuditLog("SCHEMA_SCAN", "Firebase Admin SDK", "Explicit schema sweep successful, 3 collections updated.");
                              alert("Firebase Firestore schemas successfully updated.");
                            }, 1000);
                          }}
                          className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-705 font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Re-scan Firestore Collection Index Map</span>
                        </button>
                      </div>

                    </div>

                  </div>

                </div>
              )}


              {/* TAB 6: COMPLIANCE ANALYTICS */}
              {activeTab === "analytics" && (
                <div className="space-y-8 animate-fadeIn">
                  
                  <div className="border-b border-slate-900 pb-5">
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Compliance Analytics & SLA KPI Monitor</h2>
                    <p className="text-sm text-slate-400">Track incoming GDPR/CCPA request metrics and performance resolve ratios.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* STAT CARD */}
                    <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 text-center space-y-2">
                      <span className="block text-2xl font-bold text-emerald-400">100%</span>
                      <span className="block text-xs font-mono uppercase text-slate-500">SLA Response Resolution Ratio</span>
                      <p className="text-[11px] text-slate-400">0 requests have breached target GDPR 30-day deadlines.</p>
                    </div>

                    {/* STAT CARD */}
                    <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 text-center space-y-2">
                      <span className="block text-2xl font-bold text-white">4.2 hours</span>
                      <span className="block text-xs font-mono uppercase text-slate-500">Avg Job Execution Time</span>
                      <p className="text-[11px] text-slate-400">BullMQ automated workflow scan compilation latency.</p>
                    </div>

                    {/* STAT CARD */}
                    <div className="bg-slate-900 border border-slate-850 rounded-xl p-6 text-center space-y-2">
                      <span className="block text-2xl font-bold text-blue-400">0</span>
                      <span className="block text-xs font-mono uppercase text-slate-500">Active Errors in DLQ queue</span>
                      <p className="text-[11px] text-slate-400">Zero dead-letter-queue compliance failures reported.</p>
                    </div>

                  </div>

                  {/* HIGH CONTRAST SVG COMPLIANCE CHART AND STATS GROUP */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Compliance Processing Volume Trend (Last 7 Days)</h3>
                      <p className="text-xs text-slate-400">Daily processed requests categorized by type (Data Access vs Erasure)</p>
                    </div>

                    {/* Crisp customized SVG Area / Line Chart with legends */}
                    <div className="w-full h-64 bg-slate-950 rounded-lg p-4 border border-slate-900 relative">
                      
                      {/* Grid Guide Lines */}
                      <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none select-none">
                        <div className="border-b border-slate-900/40 w-full h-0"></div>
                        <div className="border-b border-slate-900/40 w-full h-0"></div>
                        <div className="border-b border-slate-900/40 w-full h-0"></div>
                        <div className="border-b border-slate-900/40 w-full h-0"></div>
                      </div>

                      {/* SVG Line Canvas */}
                      <svg className="w-full h-full relative z-10" viewBox="0 0 700 200" preserveAspectRatio="none">
                        {/* Gradient Fill for Access (Blue) */}
                        <defs>
                          <linearGradient id="blueG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
                          </linearGradient>
                          <linearGradient id="roseG" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0"/>
                          </linearGradient>
                        </defs>

                        {/* ACCESS DATA AREA & LINE */}
                        <path 
                          d="M 50 160 Q 150 120 250 140 T 450 60 T 650 40 L 650 190 L 50 190 Z" 
                          fill="url(#blueG)" 
                        />
                        <path 
                          d="M 50 160 Q 150 120 250 140 T 450 60 T 650 40" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="3.5" 
                        />

                        {/* ERASURE DATA AREA & LINE */}
                        <path 
                          d="M 50 180 Q 150 170 250 130 T 450 110 T 650 90 L 650 190 L 50 190 Z" 
                          fill="url(#roseG)" 
                        />
                        <path 
                          d="M 50 180 Q 150 170 250 130 T 450 110 T 650 90" 
                          fill="none" 
                          stroke="#f43f5e" 
                          strokeWidth="2.5" 
                          strokeDasharray="4 2"
                        />

                        {/* Data Point Dots */}
                        <circle cx="250" cy="140" r="4" fill="#3b82f6" />
                        <circle cx="450" cy="60" r="4" fill="#3b82f6" />
                        <circle cx="650" cy="40" r="5" fill="#3b82f6" />
                        <circle cx="250" cy="130" r="4" fill="#f43f5e" />
                        <circle cx="650" cy="90" r="5" fill="#f43f5e" />
                      </svg>

                      {/* Legends */}
                      <div className="absolute bottom-2 left-6 right-6 flex justify-between text-[10px] font-mono text-slate-500">
                        <span>MAY 19</span>
                        <span>MAY 20</span>
                        <span>MAY 21</span>
                        <span>MAY 22</span>
                        <span>MAY 23</span>
                        <span>MAY 24</span>
                        <span>MAY 25 (TODAY)</span>
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs font-mono justify-center">
                      <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span>
                        <span>Data Access / Portability Requests (ACCESS)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></span>
                        <span>Data Erasure / Deletion (ERASURE)</span>
                      </div>
                    </div>

                  </div>

                </div>
              )}


              {/* TAB 7: INFRASTRUCTURE & SETTINGS */}
              {activeTab === "settings" && (
                <div className="space-y-8 animate-fadeIn">
                  
                  <div className="border-b border-slate-900 pb-5">
                    <h2 className="text-2xl font-bold tracking-tight text-white mb-1 font-sans">Infrastructure & Team Credentials</h2>
                    <p className="text-sm text-slate-400">Manage compliance team members, review Docker configurations, tRPC routes validation, and export multi-tenant deployment blueprints.</p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* LEFT TWO-COLUMN: TEAM AND CREDENTIALS */}
                    <div className="xl:col-span-2 space-y-6">
                      
                      {/* TEAM MEMBER ROLES PANEL */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Users className="w-5 h-5" />
                          <h3 className="font-bold text-white">Compliance Operations Team</h3>
                        </div>
                        <p className="text-xs text-slate-400">
                          Authorized compliance officers, developers, and team owners loaded on this tenant:
                        </p>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-400">
                            <thead className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-slate-850">
                              <tr>
                                <th className="py-2.5">Name</th>
                                <th className="py-2.5">Email</th>
                                <th className="py-2.5">Role</th>
                                <th className="py-2.5 text-right">MFA Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {teamMembers.map(member => (
                                <tr key={member.id}>
                                  <td className="py-3 font-semibold text-white">{member.name}</td>
                                  <td className="py-3 font-mono text-slate-400">{member.email}</td>
                                  <td className="py-3 text-[11px]">
                                    <span className="bg-slate-950 px-2 py-0.5 rounded text-blue-300 border border-slate-850">
                                      {member.role}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right">
                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${member.mfaEnabled ? "bg-emerald-500" : "bg-slate-600"}`} title={member.mfaEnabled ? "MFA SECURED" : "MFA DISABLED"} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* ADD NEW MEMBER FORM */}
                        <form onSubmit={handleAddTeamMember} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5">
                          <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Invite Compliance Operator</span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                              type="text"
                              placeholder="Full Name"
                              className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                              value={newTeamName}
                              onChange={(e) => setNewTeamName(e.target.value)}
                            />
                            <input
                              type="email"
                              placeholder="operator@acme-corp.com"
                              className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-white"
                              value={newTeamEmail}
                              onChange={(e) => setNewTeamEmail(e.target.value)}
                            />
                            <select
                              className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-300"
                              value={newTeamRole}
                              onChange={(eObj) => setNewTeamRole(eObj.target.value as any)}
                            >
                              <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                              <option value="DEVELOPER">Developer Admin</option>
                              <option value="OWNER">Full Owner</option>
                            </select>
                          </div>
                          <button
                            id="btn-submit-invite-team"
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-4 rounded transition cursor-pointer"
                          >
                            Send Secure MFA Invite Link
                          </button>
                        </form>
                      </div>

                      {/* COPYABLE DEPLOYMENT GUIDES / PRISMA CODE BLOCK VIEW */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-400">
                            <Code2 className="w-5 h-5" />
                            <h3 className="font-bold text-white">Prisma schema relational blueprint</h3>
                          </div>
                          <button
                            id="btn-copy-prisma-schema"
                            onClick={() => copyToClipboard(devFiles.prisma || "", "prisma")}
                            className="bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 border border-slate-850 p-1.5 rounded transition text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedCodeSec === "prisma" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Prisma Code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 leading-normal">
                          This schema defines our isolated target architecture. Prisma maps relationships perfectly, locking audit logs index boundaries strictly within PostgreSQL boundaries.
                        </p>
                        <pre className="bg-slate-950 p-4 rounded-lg font-mono text-[11px] text-slate-400 border border-slate-850 max-h-56 overflow-y-auto leading-relaxed select-all">
                          {devFiles.prisma || "// Loading database migrations schema..."}
                        </pre>
                      </div>

                    </div>


                    {/* DOCKER & COMPOSE PRODUCTION FILES RENDER COLUMN */}
                    <div className="space-y-6">
                      
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#FFCA28]">
                            <Terminal className="w-5 h-5" />
                            <h3 className="font-bold text-white">Docker Multi-Container Compose</h3>
                          </div>
                          <button
                            id="btn-copy-docker-compose"
                            onClick={() => copyToClipboard(devFiles.docker || "", "docker")}
                            className="bg-slate-950 text-slate-400 hover:text-white hover:border-slate-705 border border-slate-850 p-1 rounded transition"
                          >
                            {copiedCodeSec === "docker" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 leading-normal">
                          Spins up production databases and isolated Redis queues (for BullMQ queues) mapping ports correctly:
                        </p>
                        <pre className="bg-slate-950 p-4 rounded-lg font-mono text-[10px] text-slate-400 border border-slate-850 max-h-56 overflow-y-auto leading-relaxed select-all">
                          {devFiles.docker || "# Loading compose configs..."}
                        </pre>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-400">
                            <Clock className="w-5 h-5" />
                            <h3 className="font-bold text-white">BullMQ Worker daemon code</h3>
                          </div>
                          <button
                            id="btn-copy-bullmq-worker"
                            onClick={() => copyToClipboard(devFiles.bullmq || "", "bullmq")}
                            className="bg-slate-950 text-slate-400 hover:text-white hover:border-slate-705 border border-slate-850 p-1 rounded transition"
                          >
                            {copiedCodeSec === "bullmq" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="bg-slate-950 p-4 rounded-lg font-mono text-[10px] text-slate-400 border border-slate-850 max-h-56 overflow-y-auto leading-relaxed select-all">
                          {devFiles.bullmq || "// Loading background process scripts..."}
                        </pre>
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </main>

          </div>
        </>
      )}

    </div>
  );
}
