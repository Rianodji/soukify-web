/* ── Generic API envelope ───────────────────────────────── */
export interface ApiSuccess<T> {
  data: T;
  success: true;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/* ── Auth ───────────────────────────────────────────────── */
export type UserRole =
  | "BUYER"
  | "SELLER"
  | "PRO_SELLER"
  | "SHOP_STAFF"
  | "MODERATOR"
  | "SUPPORT"
  | "FINANCE"
  | "ACCOUNT_MANAGER"
  | "ADMIN"
  | "SUPER_ADMIN";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse extends AuthTokens {
  tokenType: string;
  expiresIn: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
}

export interface RegisterResponse {
  userId: string;
  message: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phoneNumber?: string;
  roles: UserRole[];
  avatarUrl?: string;
  isKycVerified: boolean;
  createdAt: string;
}

/* ── Annonce ────────────────────────────────────────────── */
export type AnnonceStatus = "DRAFT" | "ACTIVE" | "SOLD" | "EXPIRED" | "DELETED";
export type AnnonceType = "SALE" | "SERVICE";
export type AnnonceCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

export interface Annonce {
  id: string;
  title: string;
  description: string;
  price: number;
  type: AnnonceType;
  condition: AnnonceCondition;
  status: AnnonceStatus;
  city: string;
  images: string[];
  categoryId: string;
  seller: UserProfile;
  createdAt: string;
  expiresAt: string;
}

/* ── Category ───────────────────────────────────────────── */
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string;
}

/* ── Order ──────────────────────────────────────────────── */
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "IN_DELIVERY"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

/**
 * Flat shape confirmed against the API source (transaction.controller.ts) —
 * no nested `annonce`/`buyer`/`seller` objects, just ids. `annonceTitle` is
 * only present on the list endpoint (`GET /orders`), not the detail one
 * (`GET /orders/:id`). All money fields are in cents (XAF has no smaller
 * unit — the API still stores amountInFCFA * 100 internally, cf. Money VO).
 */
export interface Order {
  id: string;
  annonceId: string;
  annonceTitle?: string;
  buyerId: string;
  sellerId: string;
  annoncePriceCents: number;
  deliveryFeeCents: number;
  commissionCents: number;
  totalAmountCents: number;
  status: OrderStatus;
  disputeReason?: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Pagination ─────────────────────────────────────────── */
/** Standardized shape across every paginated list endpoint (cf. HANDOFF_INFRA.md, v1.0.5). */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

/* ── Admin ──────────────────────────────────────────────── */
export type KycStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export interface AdminUser {
  id: string;
  name: string;
  phoneNumber?: string;
  roles: UserRole[];
  isKycVerified: boolean;
  kycStatus: KycStatus;
  isSuspended: boolean;
  createdAt: string;
}

export type ShopStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type ShopSubscription = "FREE" | "STANDARD" | "PREMIUM";
export type StaffRole = "OWNER" | "MANAGER" | "STAFF";

export interface ShopMember {
  user: UserProfile;
  role: StaffRole;
  joinedAt: string;
}

export interface ShopStats {
  totalAnnonces: number;
  activeAnnonces: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface Shop {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  status: ShopStatus;
  subscription: ShopSubscription;
  owner: UserProfile;
  staff?: ShopMember[];
  stats?: ShopStats;
  createdAt: string;
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  user: UserProfile;
  assignee?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export type ReportStatus = "PENDING" | "APPROVED" | "DISMISSED";
export type ReportReason = "SPAM" | "FRAUD" | "INAPPROPRIATE" | "FAKE" | "OTHER";

export interface Report {
  id: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reporter: UserProfile;
  annonceId?: string;
  annonce?: Annonce;
  createdAt: string;
}

export interface PlatformConfig {
  commissionRatePct: number;
  freeMaxAnnonces: number;
  standardMaxAnnonces: number;
  premiumMaxAnnonces: number;
}

export interface FinanceDashboard {
  totalRevenue: number;
  totalCommissions: number;
  monthlyRevenue: number;
  monthlyCommissions: number;
  pendingPayouts: number;
  completedOrders: number;
  revenueByMonth?: Array<{ month: string; revenue: number; commission: number }>;
}

/* ── Messaging ──────────────────────────────────────────── */
/** GET /conversations/:id/messages — array field is `messages`, not `data`/`items`. */
export interface Message {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

/** GET /conversations/:id — no embedded participants/annonce, just ids. */
export interface Conversation {
  id: string;
  annonceId: string;
  buyerId: string;
  sellerId: string;
  status: string;
  lastMessageAt: string | null;
  messageCount: number;
}

/* ── Audit ──────────────────────────────────────────────── */
export interface AuditEntry {
  id: string;
  action: string;
  adminId: string;
  adminName?: string;
  targetId?: string;
  targetType?: string;
  details?: string;
  createdAt: string;
}

/* ── Reviews & Trust ────────────────────────────────────── */
export interface Review {
  id: string;
  rating: number;
  comment?: string;
  reviewer: UserProfile;
  createdAt: string;
}

export interface UserScore {
  score: number;
  reviewCount: number;
  positiveCount: number;
}
