// ============================================
// Supabase Database Types
// Generated from migration schema
// ============================================

export type MemberStatus = 'active' | 'expired' | 'suspended' | 'inactive'
export type MembershipStatus = 'active' | 'expired' | 'cancelled'
export type UserRole = 'admin' | 'staff'
export type PlanType =
  | 'inscription'
  | 'visit'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'annual'
  | 'custom'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other'
export type PosCustomerType = 'member' | 'guest'
export type PosSaleStatus = 'completed' | 'partial' | 'cancelled'
export type CheckInMethod = 'kiosk' | 'manual' | 'member_code'
export type AccessResult = 'allowed' | 'denied'
export type AttendanceStatus = 'valid' | 'duplicate' | 'denied' | 'manual'
export type DenialReason =
  | 'expired_membership'
  | 'inactive_member'
  | 'suspended_member'
  | 'not_found'

export interface AppUser {
  id: string
  auth_id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  photo_url?: string | null
  created_at: string
  updated_at: string
}

export interface GymSettings {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  currency: string
  timezone: string
  opening_time: string | null
  closing_time: string | null
  business_days: string[]
  is_configured: boolean
  // New expanded fields
  legal_name: string | null
  website: string | null
  social_links: Record<string, string>
  report_name: string | null
  report_logo_url: string | null
  report_footer_text: string | null
  locale: string
  date_format: string
  currency_format: string
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  member_code: string
  username?: string | null
  full_name: string
  phone: string | null
  email: string | null
  date_of_birth: string | null
  photo_url: string | null
  status: MemberStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MembershipPlan {
  id: string
  name: string
  base_price: number
  duration_days: number
  type: PlanType
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  member_id: string
  plan_id: string
  start_date: string
  end_date: string
  base_price: number
  discount_type: 'percentage' | 'fixed' | null
  discount_value: number | null
  price_paid: number
  status: MembershipStatus
  payment_method: PaymentMethod | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  member?: Member
  plan?: MembershipPlan
}

export interface AttendanceRecord {
  id: string
  member_id: string | null
  membership_id: string | null
  check_in_at: string
  check_in_date: string
  check_in_method: CheckInMethod
  status: AttendanceStatus
  access_result: AccessResult
  denial_reason: DenialReason | null
  registered_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  member?: Member
}

export interface MemberTrainingDay {
  id: string
  member_id: string
  day_of_week: number // 0=Sunday, 6=Saturday
  created_at: string
}

export interface Payment {
  id: string
  member_id: string
  membership_id: string | null
  amount: number
  payment_method: PaymentMethod | null
  concept: string
  payment_date: string
  received_by: string | null
  notes: string | null
  created_at: string
  // Joined fields
  member?: Member
  membership?: Membership
}

export interface UserLoginHistory {
  id: string
  user_id: string | null
  user_name: string | null
  login_at: string
  logout_at: string | null
  device_name: string | null
  operating_system: string | null
  app_version: string | null
  ip_address: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  description: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
  // Joined fields
  user?: AppUser
}

export interface PosProduct {
  id: string
  sku: string | null
  barcode: string | null
  name: string
  description: string | null
  category: string | null
  image_url: string | null
  cost_price: number
  sale_price: number
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PosProductCategory {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PosSale {
  id: string
  sale_number: string
  member_id: string | null
  customer_name: string | null
  customer_type: PosCustomerType
  status: PosSaleStatus
  total_amount: number
  paid_amount: number
  balance_due: number
  tendered_amount?: number
  change_amount?: number
  payment_method: PaymentMethod | null
  notes: string | null
  sold_by: string | null
  sold_at: string
  created_at: string
  updated_at: string
  member?: Member | null
  seller?: AppUser | null
  items?: PosSaleItem[]
  payments?: PosSalePayment[]
}

export interface PosSaleItem {
  id: string
  sale_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
  product?: PosProduct | null
}

export interface PosSalePayment {
  id: string
  sale_id: string
  amount: number
  payment_method: PaymentMethod
  received_by: string | null
  notes: string | null
  paid_at: string
  created_at: string
}

// Dashboard stats returned by the get_dashboard_stats() function
export interface DashboardStats {
  total_active_members: number
  total_expired_members: number
  expiring_soon: number
  today_attendance: number
  month_revenue: number
  new_members_month: number
}

// Membership check result from check_active_membership()
export interface MembershipCheckResult {
  has_active: boolean
  membership_id: string | null
  plan_name: string | null
  end_date: string | null
  days_remaining: number | null
}

// Streak calculation result
export interface StreakInfo {
  currentStreak: number
  bestStreak: number
  totalAttendances: number
  monthlyAttendances: number
  weeklyFrequency: number
}

// Form input types
export interface MemberFormData {
  full_name: string
  username?: string
  phone?: string
  email?: string
  date_of_birth?: string
  notes?: string
  status: MemberStatus
}

export interface PlanFormData {
  name: string
  base_price: number
  duration_days: number
  type: PlanType
  is_active: boolean
  description?: string
}

export interface MembershipFormData {
  member_id: string
  plan_id: string
  start_date: string
  payment_method: PaymentMethod
  notes?: string
}

export interface GymSettingsFormData {
  name: string
  address?: string
  phone?: string
  email?: string
  currency: string
  timezone: string
  opening_time?: string
  closing_time?: string
  business_days: string[]
}

export interface LoginFormData {
  email: string
  password: string
}

export interface PosProductFormData {
  sku?: string
  barcode?: string
  name: string
  description?: string
  category?: string
  image_url?: string
  cost_price: number
  sale_price: number
  stock_quantity: number
  low_stock_threshold: number
  track_inventory: boolean
  is_active: boolean
}

export interface PosCartItem {
  product: PosProduct
  quantity: number
}

export interface PosCreateSaleData {
  member_id?: string | null
  customer_name?: string | null
  customer_type: PosCustomerType
  paid_amount: number
  payment_method: PaymentMethod
  notes?: string
  items: PosCartItem[]
  sold_by?: string | null
}
