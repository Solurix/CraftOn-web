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
  DocumentOut,
  Job,
  JobCreate,
  Matching,
  Me,
  Message,
  Notification,
  Review,
  ReviewCreate,
  SessionCreate,
  SessionResult,
  UploadUrl,
  VettingQueue,
  WorkerOnboarding,
  WorkerProfile,
  WorkerPublic,
  WorkerUpdate,
} from "./models";

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
  jobs(query?: { trade?: string; prefecture?: string; work_date?: string }) {
    return request<Job[]>("/jobs", { token: this.token, query });
  }
  job(id: string) {
    return request<Job>(`/jobs/${id}`, { token: this.token });
  }
  myJobs() {
    return request<Job[]>("/jobs/mine", { token: this.token });
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
