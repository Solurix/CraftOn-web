// Typed API client. A thin wrapper over fetch that injects the bearer token and
// surfaces the backend's `{error:{code,message}}` envelope as ApiError.
import type {
  Applicant,
  Application,
  ConfigSnapshot,
  ContractorOnboarding,
  ContractorProfile,
  ContractorPublic,
  ContractorUpdate,
  Device,
  DocumentOut,
  Job,
  JobCreate,
  Matching,
  Me,
  Message,
  Notification,
  PasswordLogin,
  Review,
  ReviewCreate,
  SessionCreate,
  SessionResult,
  UploadUrl,
  User,
  VettingQueue,
  WorkerOnboarding,
  WorkerProfile,
  WorkerPublic,
  WorkerUpdate,
  WorkHistory,
} from "./models";
import { getDeviceId, getDeviceName, rotateDeviceId } from "../device";

// Dispatched on a 401 to an authenticated request so AuthProvider can drop the
// session immediately (revoked device / invalid token).
export const AUTH_EXPIRED_EVENT = "crafton:auth-expired";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = { method?: string; body?: unknown; token?: string | null; query?: Record<string, string | undefined> };

async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const url = new URL(`${API_BASE}/api/v1${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v != null && v !== "") url.searchParams.set(k, v);
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  // Identify the device so the API can list/revoke it.
  const deviceId = getDeviceId();
  if (deviceId) {
    headers["X-Device-Id"] = deviceId;
    const deviceName = getDeviceName();
    if (deviceName) headers["X-Device-Name"] = deviceName;
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError(0, "network_error", "network");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } }).error;
    // This device was revoked → drop auth state app-wide and rotate the device id
    // so a later legitimate login enrolls a fresh (non-revoked) device. Scoped to
    // this exact code so ordinary 401s (e.g. needs-signup on /me) don't log out.
    if (
      res.status === 401 &&
      err?.code === "device_revoked" &&
      typeof window !== "undefined"
    ) {
      rotateDeviceId();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(res.status, err?.code ?? "error", err?.message ?? "error");
  }
  return data as T;
}

export class ApiClient {
  constructor(private token: string | null = null) {}

  withToken(token: string | null): ApiClient {
    return new ApiClient(token);
  }

  // auth / session
  createSession(body: SessionCreate) {
    return request<SessionResult>("/auth/session", { method: "POST", body, token: this.token });
  }
  me() {
    return request<Me>("/me", { token: this.token });
  }
  setPassword(password: string) {
    return request<void>("/auth/password", { method: "POST", body: { password }, token: this.token });
  }
  passwordLogin(phone: string, password: string) {
    return request<PasswordLogin>("/auth/password-login", {
      method: "POST",
      body: { phone_number: phone, password },
    });
  }

  // devices
  myDevices() {
    return request<Device[]>("/me/devices", { token: this.token });
  }
  revokeDevice(id: string) {
    return request<Device>(`/me/devices/${id}/revoke`, { method: "POST", token: this.token });
  }
  adminDevices() {
    return request<Device[]>("/admin/devices", { token: this.token });
  }

  // onboarding / profiles
  onboardWorker(body: WorkerOnboarding) {
    return request<WorkerProfile>("/onboarding/worker", { method: "POST", body, token: this.token });
  }
  onboardContractor(body: ContractorOnboarding) {
    return request<ContractorProfile>("/onboarding/contractor", { method: "POST", body, token: this.token });
  }
  updateWorker(body: WorkerUpdate) {
    return request<WorkerProfile>("/workers/me", { method: "PATCH", body, token: this.token });
  }
  updateContractor(body: ContractorUpdate) {
    return request<ContractorProfile>("/contractors/me", { method: "PATCH", body, token: this.token });
  }
  worker(id: string) {
    return request<WorkerPublic>(`/workers/${id}`, { token: this.token });
  }
  contractor(id: string) {
    return request<ContractorPublic>(`/contractors/${id}`, { token: this.token });
  }

  // documents
  uploadUrl(docType: string, contentType = "image/jpeg") {
    return request<UploadUrl>("/documents/upload-url", {
      method: "POST", body: { doc_type: docType, content_type: contentType }, token: this.token,
    });
  }
  registerDocument(docType: string, storagePath: string) {
    return request<DocumentOut>("/documents", {
      method: "POST", body: { doc_type: docType, storage_path: storagePath }, token: this.token,
    });
  }

  // jobs
  jobs(query?: {
    trade?: string;
    prefecture?: string;
    work_date?: string;
    wage_min?: string;
    wage_max?: string;
    date_from?: string;
    date_to?: string;
    sort?: string;
  }) {
    return request<Job[]>("/jobs", { token: this.token, query });
  }
  job(id: string) {
    return request<Job>(`/jobs/${id}`, { token: this.token });
  }
  myJobs() {
    return request<Job[]>("/jobs/mine", { token: this.token });
  }
  savedJobs() {
    return request<Job[]>("/jobs/saved", { token: this.token });
  }
  savedJobIds() {
    return request<string[]>("/jobs/saved-ids", { token: this.token });
  }
  saveJob(id: string) {
    return request<void>(`/jobs/${id}/save`, { method: "PUT", token: this.token });
  }
  unsaveJob(id: string) {
    return request<void>(`/jobs/${id}/save`, { method: "DELETE", token: this.token });
  }
  createJob(body: JobCreate) {
    return request<Job>("/jobs", { method: "POST", body, token: this.token });
  }
  cancelJob(id: string) {
    return request<Job>(`/jobs/${id}/cancel`, { method: "POST", token: this.token });
  }

  // applications
  apply(jobId: string) {
    return request<Application>(`/jobs/${jobId}/apply`, { method: "POST", token: this.token });
  }
  applicants(jobId: string) {
    return request<Applicant[]>(`/jobs/${jobId}/applications`, { token: this.token });
  }
  myApplications() {
    return request<Application[]>("/applications/mine", { token: this.token });
  }
  confirm(applicationId: string) {
    return request<Matching>(`/applications/${applicationId}/confirm`, { method: "POST", token: this.token });
  }
  rejectApplication(applicationId: string) {
    return request<Application>(`/applications/${applicationId}/reject`, { method: "POST", token: this.token });
  }
  withdraw(applicationId: string) {
    return request<Application>(`/applications/${applicationId}/withdraw`, { method: "POST", token: this.token });
  }

  // matchings
  myMatchings() {
    return request<Matching[]>("/matchings/mine", { token: this.token });
  }
  workHistory() {
    return request<WorkHistory>("/matchings/history", { token: this.token });
  }
  matching(id: string) {
    return request<Matching>(`/matchings/${id}`, { token: this.token });
  }
  checkIn(id: string) {
    return request<Matching>(`/matchings/${id}/check-in`, { method: "POST", token: this.token });
  }
  completeRequest(id: string) {
    return request<Matching>(`/matchings/${id}/complete-request`, { method: "POST", token: this.token });
  }
  approveCompletion(id: string) {
    return request<Matching>(`/matchings/${id}/approve-completion`, { method: "POST", token: this.token });
  }
  cancelMatching(id: string) {
    return request<Matching>(`/matchings/${id}/cancel`, { method: "POST", token: this.token });
  }

  // chat
  messages(matchingId: string) {
    return request<Message[]>(`/matchings/${matchingId}/messages`, { token: this.token });
  }
  sendMessage(matchingId: string, body: string) {
    return request<Message>(`/matchings/${matchingId}/messages`, { method: "POST", body: { body }, token: this.token });
  }

  // reviews
  leaveReview(matchingId: string, body: ReviewCreate) {
    return request<Review>(`/matchings/${matchingId}/reviews`, { method: "POST", body, token: this.token });
  }
  workerReviews(id: string) {
    return request<Review[]>(`/workers/${id}/reviews`, { token: this.token });
  }
  contractorReviews(id: string) {
    return request<Review[]>(`/contractors/${id}/reviews`, { token: this.token });
  }

  // notifications
  notifications(query?: { unread_only?: string }) {
    return request<Notification[]>("/notifications", { token: this.token, query });
  }
  unreadCount() {
    return request<{ count: number }>("/notifications/unread-count", { token: this.token });
  }
  markNotificationRead(id: string) {
    return request<Notification>(`/notifications/${id}/read`, { method: "POST", token: this.token });
  }
  markAllNotificationsRead() {
    return request<{ updated: number }>("/notifications/read-all", { method: "POST", token: this.token });
  }

  // admin
  vettingQueue() {
    return request<VettingQueue>("/admin/vetting/queue", { token: this.token });
  }
  adminUsers(query?: { user_type?: string; status?: string }) {
    return request<VettingQueue>("/admin/users", { token: this.token, query });
  }
  adminJobs(query?: { status?: string }) {
    return request<Job[]>("/admin/jobs", { token: this.token, query });
  }
  adminMatchings(query?: { status?: string; fee_status?: string }) {
    return request<Matching[]>("/admin/matchings", { token: this.token, query });
  }
  markFeePaid(matchingId: string) {
    return request<Matching>(`/admin/matchings/${matchingId}/mark-fee-paid`, { method: "POST", token: this.token });
  }
  adminAdmins() {
    return request<User[]>("/admin/admins", { token: this.token });
  }
  createAdmin(body: { phone_number: string; display_name: string }) {
    return request<User>("/admin/admins", { method: "POST", body, token: this.token });
  }
  debugSeed(body: { workers: number; contractors: number; jobs: number }) {
    return request<{ workers: number; contractors: number; jobs: number }>(
      "/admin/debug/seed",
      { method: "POST", body, token: this.token },
    );
  }
  approveUser(id: string) {
    return request<unknown>(`/admin/users/${id}/approve`, { method: "POST", token: this.token });
  }
  rejectUser(id: string, reason?: string) {
    return request<unknown>(`/admin/users/${id}/reject`, { method: "POST", body: { reason }, token: this.token });
  }
  suspendUser(id: string, suspend: boolean) {
    return request<unknown>(`/admin/users/${id}/suspend`, { method: "POST", body: { suspend }, token: this.token });
  }
  readConfig() {
    return request<ConfigSnapshot>("/admin/config", { token: this.token });
  }
  updateConfig(updates: Record<string, unknown>) {
    return request<ConfigSnapshot>("/admin/config", { method: "PATCH", body: { updates }, token: this.token });
  }
}
