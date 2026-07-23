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

export interface Order {
  id: string;
  annonce: Annonce;
  buyer: UserProfile;
  seller: UserProfile;
  amount: number;
  commission: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

/* ── Pagination ─────────────────────────────────────────── */
/**
 * Real shape confirmed against prod (`curl .../search/annonces`,
 * `.../categories`) : `{ data: T[], total, page, limit }` — the array field
 * is `data`, not `items` (previously wrong, silently returned undefined
 * everywhere and crashed every list screen that read `.items.length`).
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
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
export interface Message {
  id: string;
  conversationId: string;
  sender: UserProfile;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: UserProfile[];
  annonce?: Annonce;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
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
