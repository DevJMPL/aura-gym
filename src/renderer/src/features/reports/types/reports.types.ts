// ============================================================
// Reports Module — TypeScript Types
// ============================================================

// ── Date Range ──────────────────────────────────────────────

export type DateRangePreset = 'today' | 'week' | 'month' | 'prev_month' | 'custom'

export interface DateRange {
  from: string // ISO date string YYYY-MM-DD
  to: string // ISO date string YYYY-MM-DD
}

// ── Generic chart helpers ────────────────────────────────────

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface TimeSeriesPoint {
  date: string
  value: number
  secondary?: number // For multi-line charts
}

// ── Dashboard Summary ────────────────────────────────────────

export interface DashboardReportSummary {
  totalRevenue: number
  totalAttendances: number
  activeMembers: number
  expiredMembers: number
  expiringSoon: number // Memberships expiring in <=7 days
  deniedAccesses: number
  avgDailyAttendances: number
  topPlan: { name: string; count: number } | null
  // Sparkline data
  revenueByDay: TimeSeriesPoint[]
  attendancesByDay: TimeSeriesPoint[]
}

// ── Attendance Report ─────────────────────────────────────────

export interface AttendanceSummary {
  total: number
  validCount: number
  deniedCount: number
  duplicateCount: number
  manualCount: number
  avgPerDay: number
  peakHour: string | null
}

export interface TopAttendanceMember {
  memberId: string
  memberName: string
  memberCode: string
  photoUrl: string | null
  count: number
}

export interface CheckInMethodBreakdown {
  method: string
  count: number
  percentage: number
}

export interface AttendanceReportData {
  summary: AttendanceSummary
  byDay: TimeSeriesPoint[]
  byWeek: TimeSeriesPoint[]
  byMonth: TimeSeriesPoint[]
  byHour: ChartDataPoint[]
  checkInMethods: CheckInMethodBreakdown[]
  topMembers: TopAttendanceMember[]
}

// ── Financial Report ──────────────────────────────────────────

export interface FinancialSummary {
  totalRevenue: number
  avgTicket: number
  totalDiscounts: number
  totalPayments: number
  pendingPayments: number
}

export interface RevenueByPlan {
  planId: string
  planName: string
  revenue: number
  count: number
  percentage: number
}

export interface RevenueByPaymentMethod {
  method: string
  amount: number
  count: number
  percentage: number
}

export interface PaymentRow {
  id: string
  date: string
  memberName: string
  memberCode: string
  concept: string
  paymentMethod: string | null
  amount: number
}

export interface FinancialReportData {
  summary: FinancialSummary
  byDay: TimeSeriesPoint[]
  byWeek: TimeSeriesPoint[]
  byMonth: TimeSeriesPoint[]
  byPlan: RevenueByPlan[]
  byPaymentMethod: RevenueByPaymentMethod[]
  payments: PaymentRow[]
}

// ── Membership Report ─────────────────────────────────────────

export interface MembershipSummary {
  active: number
  expired: number
  cancelled: number
  expiringSoon: number // <= 7 days
  newThisPeriod: number
  renewalsThisPeriod: number
}

export interface MembershipByPlan {
  planId: string
  planName: string
  count: number
  percentage: number
}

export interface ExpiringSoonRow {
  membershipId: string
  memberName: string
  memberCode: string
  planName: string
  endDate: string
  daysRemaining: number
}

export interface ExpiredMembershipRow {
  membershipId: string
  memberName: string
  memberCode: string
  planName: string
  endDate: string
  daysSinceExpiry: number
}

export interface MembershipReportData {
  summary: MembershipSummary
  byStatus: ChartDataPoint[]
  byPlan: MembershipByPlan[]
  newByPeriod: TimeSeriesPoint[]
  expiringSoon: ExpiringSoonRow[]
  recentlyExpired: ExpiredMembershipRow[]
}

// ── Members Report ────────────────────────────────────────────

export interface MembersSummary {
  active: number
  expired: number
  suspended: number
  inactive: number
  newThisPeriod: number
  atRisk: number // Active membership but no attendance in 14+ days
}

export interface AtRiskMemberRow {
  memberId: string
  memberName: string
  memberCode: string
  planName: string | null
  membershipEndDate: string | null
  daysSinceLastAttendance: number
  totalAttendances: number
}

export interface NewMemberRow {
  memberId: string
  memberName: string
  memberCode: string
  status: string
  createdAt: string
  planName: string | null
}

export interface MembersReportData {
  summary: MembersSummary
  byStatus: ChartDataPoint[]
  newByPeriod: TimeSeriesPoint[]
  atRiskMembers: AtRiskMemberRow[]
  newMembers: NewMemberRow[]
}

// ── PDF Export ────────────────────────────────────────────────

export type ReportType = 'dashboard' | 'financial' | 'attendance' | 'memberships' | 'members'

export interface ReportPDFMeta {
  reportType: ReportType
  gymName: string
  logoUrl: string | null
  generatedAt: string
  dateRange: DateRange
  preset: DateRangePreset
}

// ── Table Column Config ───────────────────────────────────────

export interface TableColumn<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string
}
