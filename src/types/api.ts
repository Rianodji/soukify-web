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

/**
 * `GET /users/:id/profile` (public seller/reviewer/reporter/owner profile) —
 * confirmed shape (cf. HANDOFF_INFRA.md, 2026-07-24): no `id` (it's `userId`),
 * no `isKycVerified`, no `phoneNumber`. Used everywhere a nested user
 * reference is needed, since none of the admin/marketplace endpoints embed
 * a richer user object.
 */
export interface PublicUserProfile {
  userId: string;
  displayName: string;
  memberSince: string;
  score: number;
  reviewCount: number;
  averageRating: number;
}

export type AccountStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "BANNED" | "ANONYMIZED";

/**
 * `GET /users/me` — confirmed field-by-field against the API source
 * (cf. HANDOFF_INFRA.md, 2026-07-24). Distinct from `UserProfile` above,
 * which is used for embedded seller/reporter/owner objects and for the
 * *different* shape of `GET /users/:id/profile` (public seller profile) —
 * those weren't part of this confirmation and may have their own mismatches.
 */
export interface MyProfile {
  id: string;
  /** Already masked (e.g. "+235••••••23") when present — display as-is, never re-format. */
  phoneNumber?: string;
  email?: string;
  displayName: string;
  roles: UserRole[];
  status: AccountStatus;
  kycStatus: string;
  trustScore: number;
  isKYCVerified: boolean;
  canSell: boolean;
  createdAt: string;
}

/* ── Annonce ────────────────────────────────────────────── */
export type AnnonceStatus = "DRAFT" | "ACTIVE" | "SOLD" | "EXPIRED" | "DELETED";
export type AnnonceType = "SALE" | "SERVICE";
export type AnnonceCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";

/**
 * Confirmed live against real seeded annonces (2026-07-24). Field names
 * differ between endpoints: `GET /search/annonces` & `GET /annonces/:id` use
 * `priceXAF`/`primaryImageUrl` (a full URL) and embed `seller` (added by the
 * API team 2026-07-24, cf. HANDOFF_INFRA.md); `GET /users/me/annonces` uses
 * `priceCents`/`primaryImage` (a storage key, not a URL), omits
 * `description`/`type`/`categoryId`, and has no `seller` (it's always the
 * caller's own annonce). Use `getAnnoncePriceXAF()`/`getAnnonceImageUrl()`
 * from `@/lib/annonce` rather than reading `priceXAF`/`priceCents`/
 * `primaryImage*` directly.
 */
export interface Annonce {
  id: string;
  sellerId?: string;
  /** Only on `GET /search/annonces` and `GET /annonces/:id`. Absent (not just undefined-if-deleted) elsewhere. */
  seller?: { id: string; displayName: string; isKYCVerified: boolean };
  title: string;
  description?: string;
  priceXAF?: number;
  priceCents?: number;
  negotiable?: boolean;
  type?: AnnonceType;
  condition: AnnonceCondition;
  status: AnnonceStatus;
  city: string;
  neighborhood?: string;
  categoryId?: string;
  viewCount?: number;
  favoriteCount?: number;
  imagesCount?: number;
  /** Full URL — only on `GET /search/annonces` and `GET /annonces/:id`. */
  primaryImageUrl?: string;
  /** Storage key (not a URL) — only on `GET /users/me/annonces`. */
  primaryImage?: string;
  createdAt: string;
  publishedAt?: string;
  expiresAt: string;
}

/* ── Category ───────────────────────────────────────────── */
/** `GET /categories` — raw array, no pagination envelope, no `parentId` (root categories only). */
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  subcategories: Array<{ id: string; name: string; slug: string }>;
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
export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

/**
 * `GET /admin/users` — confirmed against real seeded accounts (2026-07-24),
 * same `displayName`/`status`/`kycStatus`/`trustScore` shape as `MyProfile`.
 * No `isSuspended`/`isKycVerified` booleans — derive from `status`/`kycStatus`.
 */
export interface AdminUser {
  id: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  roles: UserRole[];
  status: AccountStatus;
  kycStatus: KycStatus;
  trustScore: number;
  createdAt: string;
}

/**
 * Confirmed live against real seeded shops (2026-07-24) — three different
 * endpoints return three different subsets of these fields:
 * - `GET /pro/shops/me`: id/name/slug/city/description/plan/status/members/createdAt.
 * - `GET /shops/:shopId` (public): id/name/slug/city/description/plan/logoUrl/
 *   activeAnnonceCount/createdAt — no `status`, no `members`.
 * - `GET /admin/shops` (list + `:id` detail): clean DTO, same shape as
 *   `GET /pro/shops/me` above (fixed 2026-07-24, cf. HANDOFF_INFRA.md).
 */
export type ShopStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
export type ShopSubscription = "FREE" | "STANDARD" | "PREMIUM";
export type StaffRole = "OWNER" | "MANAGER" | "STAFF";

/** No embedded `user` object — just the id. Fetch the member's name separately if needed. */
export interface ShopMember {
  userId: string;
  role: StaffRole;
  permissions: string[];
  joinedAt: string;
}

/** `GET /pro/shops/:shopId/stats`. */
export interface ShopStats {
  totalAnnonces: number;
  publishedAnnonces: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenueCents: number;
  averageRating: number;
  reviewCount: number;
}

export interface Shop {
  id: string;
  name: string;
  slug?: string;
  city?: string;
  description?: string;
  logoUrl?: string | null;
  plan: ShopSubscription;
  /** Only present on `GET /pro/shops/me`, absent on the public `GET /shops/:shopId`. */
  status?: ShopStatus;
  /** Only present on `GET /pro/shops/me`. */
  members?: ShopMember[];
  /** Only present on the public `GET /shops/:shopId`. */
  activeAnnonceCount?: number;
  createdAt: string;
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
/**
 * The real domain enum is `NORMAL | URGENT` only — confirmed against
 * `ticket.entity.ts` (cf. HANDOFF_INFRA.md, 2026-07-24). `URGENT` is only
 * reached via automatic dispute escalation, never chosen manually. The
 * previously assumed `LOW|MEDIUM|HIGH|URGENT` enum didn't match anything
 * in the actual code.
 */
export type TicketPriority = "NORMAL" | "URGENT";

/**
 * `GET /admin/tickets` (list + `:id` detail) — clean DTO (fixed 2026-07-24,
 * cf. HANDOFF_INFRA.md). No embedded `user`/`assignee` object, just
 * `reporterId`/`assigneeId` — resolve display names separately via
 * `GET /users/:id/profile`.
 */
export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  reporterId?: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportStatus = "PENDING" | "APPROVED" | "DISMISSED";
export type ReportReason = "SPAM" | "FRAUD" | "INAPPROPRIATE" | "FAKE" | "OTHER";

/**
 * `GET /admin/reports` — clean DTO (fixed 2026-07-24, cf. HANDOFF_INFRA.md).
 * `targetType`/`targetId` at the root, not `annonceId` — `targetType` is
 * `"ANNONCE"` when a report is against an annonce.
 */
export interface Report {
  id: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reporterId?: string;
  targetType?: string;
  targetId?: string;
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
/**
 * `GET /users/:id/reviews` — confirmed against `review.controller.ts` (cf.
 * HANDOFF_INFRA.md, 2026-07-24): no embedded `reviewer` object, just
 * `reviewerId`. Envelope is `{ userId, total, items }`, matching
 * `PaginatedResponse`. Resolve the author's name separately via
 * `GET /users/:id/profile`, same pattern as `Ticket.reporterId`.
 */
export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

/** `GET /users/:id/score` — confirmed shape (cf. HANDOFF_INFRA.md, 2026-07-24): no `positiveCount`. */
export interface UserScore {
  userId?: string;
  score: number;
  reviewCount: number;
  averageRating: number;
}

/* ── Notifications ──────────────────────────────────────── */
export type NotificationType =
  | "ORDER_CREATED" | "ORDER_CONFIRMED" | "ORDER_COMPLETED" | "ORDER_CANCELLED"
  | "DISPUTE_OPENED" | "SHOP_APPROVED" | "SHOP_REJECTED" | "SHOP_SUSPENDED"
  | "KYC_APPROVED" | "KYC_REJECTED" | "TICKET_RESOLVED" | "ANNONCE_EXPIRED";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

/** `GET /notifications` — PaginatedResponse plus an `unreadCount` sibling field. */
export interface NotificationsResponse extends PaginatedResponse<AppNotification> {
  unreadCount: number;
}
