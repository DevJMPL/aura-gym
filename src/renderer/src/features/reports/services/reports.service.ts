// ============================================================
// Reports Service — Supabase Queries
// All report data fetching lives here, separated from UI
// ============================================================

import { supabase } from '../../../lib/supabase/client'
import { differenceInDays, parseISO } from 'date-fns'
import {
  groupByDay,
  groupByWeek,
  groupByMonth,
  groupByHour,
  countByField,
  sumField,
  calculatePercentage,
  fillDateGaps,
} from '../utils/reportCalculations'
import type {
  DateRange,
  DashboardReportSummary,
  AttendanceReportData,
  FinancialReportData,
  MembershipReportData,
  MembersReportData,
  RevenueByPlan,
  RevenueByPaymentMethod,
  PaymentRow,
  ExpiringSoonRow,
  ExpiredMembershipRow,
  AtRiskMemberRow,
  NewMemberRow,
  CheckInMethodBreakdown,
} from '../types/reports.types'
import { PAYMENT_METHOD_LABELS, CHECK_IN_METHOD_LABELS } from '../utils/reportFormatters'

// ─────────────────────────────────────────────────────────────
// DASHBOARD SUMMARY
// ─────────────────────────────────────────────────────────────

export async function getDashboardSummary(
  tenantId: string,
  range: DateRange
): Promise<DashboardReportSummary> {
  const [paymentsRes, attendanceRes, membersRes, membershipsRes] = await Promise.all([
    // Revenue in range
    supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('tenant_id', tenantId)
      .gte('payment_date', range.from)
      .lte('payment_date', `${range.to}T23:59:59`),

    // Attendances in range (valid only)
    supabase
      .from('attendance_records')
      .select('check_in_date, check_in_at, access_result, status')
      .eq('tenant_id', tenantId)
      .gte('check_in_date', range.from)
      .lte('check_in_date', range.to),

    // Member counts (all)
    supabase.from('members').select('status').eq('tenant_id', tenantId),

    // Memberships expiring soon or denied access
    supabase.from('memberships').select('end_date, status').eq('tenant_id', tenantId),
  ])

  if (paymentsRes.error) throw paymentsRes.error
  if (attendanceRes.error) throw attendanceRes.error
  if (membersRes.error) throw membersRes.error
  if (membershipsRes.error) throw membershipsRes.error

  const payments = paymentsRes.data ?? []
  const attendances = attendanceRes.data ?? []
  const members = membersRes.data ?? []
  const memberships = membershipsRes.data ?? []

  const totalRevenue = sumField(payments, 'amount')
  const validAttendances = attendances.filter((a) => a.status === 'valid')
  const deniedAccesses = attendances.filter((a) => a.access_result === 'denied').length

  const activeMembers = members.filter((m) => m.status === 'active').length
  const expiredMembers = members.filter((m) => m.status === 'expired').length

  const today = new Date().toISOString().substring(0, 10)
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10)
  const expiringSoon = memberships.filter(
    (m) => m.status === 'active' && m.end_date >= today && m.end_date <= in7Days
  ).length

  const days = differenceInDays(parseISO(range.to), parseISO(range.from)) + 1
  const avgDailyAttendances = days > 0 ? Math.round((validAttendances.length / days) * 10) / 10 : 0

  // Top plan
  const plansRes = await supabase
    .from('memberships')
    .select('plan_id, plan:membership_plans(name)')
    .eq('tenant_id', tenantId)
    .gte('created_at', range.from)
    .lte('created_at', `${range.to}T23:59:59`)

  let topPlan: { name: string; count: number } | null = null
  if (!plansRes.error && plansRes.data) {
    const planCounts = new Map<string, { name: string; count: number }>()
    for (const m of plansRes.data) {
      const planData = Array.isArray(m.plan) ? m.plan[0] : m.plan
      const name = (planData as { name?: string })?.name ?? m.plan_id
      const existing = planCounts.get(m.plan_id) ?? { name, count: 0 }
      existing.count++
      planCounts.set(m.plan_id, existing)
    }
    if (planCounts.size > 0) {
      const sorted = Array.from(planCounts.values()).sort((a, b) => b.count - a.count)
      topPlan = sorted[0]
    }
  }

  // Sparkline series
  const revenueByDay = fillDateGaps(
    groupByDay(payments, 'payment_date', (items) => sumField(items, 'amount')),
    range.from,
    range.to
  )
  const attendancesByDay = fillDateGaps(
    groupByDay(validAttendances, 'check_in_date'),
    range.from,
    range.to
  )

  return {
    totalRevenue,
    totalAttendances: validAttendances.length,
    activeMembers,
    expiredMembers,
    expiringSoon,
    deniedAccesses,
    avgDailyAttendances,
    topPlan,
    revenueByDay,
    attendancesByDay,
  }
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE REPORT
// ─────────────────────────────────────────────────────────────

export async function getAttendanceReport(
  tenantId: string,
  range: DateRange
): Promise<AttendanceReportData> {
  const [attendanceRes, topMembersRes] = await Promise.all([
    supabase
      .from('attendance_records')
      .select('*, member:members(id, full_name, member_code, photo_url)')
      .eq('tenant_id', tenantId)
      .gte('check_in_date', range.from)
      .lte('check_in_date', range.to)
      .order('check_in_at', { ascending: true }),

    // Top members subquery: count valid attendances by member
    supabase
      .from('attendance_records')
      .select('member_id, member:members(id, full_name, member_code, photo_url)')
      .eq('tenant_id', tenantId)
      .gte('check_in_date', range.from)
      .lte('check_in_date', range.to)
      .eq('status', 'valid')
      .not('member_id', 'is', null),
  ])

  if (attendanceRes.error) throw attendanceRes.error
  if (topMembersRes.error) throw topMembersRes.error

  const records = attendanceRes.data ?? []
  const validRecords = records.filter((r) => r.status === 'valid')
  const days = differenceInDays(parseISO(range.to), parseISO(range.from)) + 1

  // Summary
  const summary = {
    total: records.length,
    validCount: validRecords.length,
    deniedCount: records.filter((r) => r.access_result === 'denied').length,
    duplicateCount: records.filter((r) => r.status === 'duplicate').length,
    manualCount: records.filter((r) => r.check_in_method === 'manual').length,
    avgPerDay: days > 0 ? Math.round((validRecords.length / days) * 10) / 10 : 0,
    peakHour: null as string | null,
  }

  // Peak hour
  const hourData = groupByHour(validRecords, 'check_in_at')
  const peakHourEntry = hourData.reduce((max, h) => (h.value > max.value ? h : max), {
    label: '00:00',
    value: 0,
  })
  if (peakHourEntry.value > 0) {
    summary.peakHour = peakHourEntry.label
  }

  // Time series
  const byDay = fillDateGaps(groupByDay(validRecords, 'check_in_date'), range.from, range.to)
  const byWeek = groupByWeek(validRecords, 'check_in_date')
  const byMonth = groupByMonth(validRecords, 'check_in_date')

  // Check-in methods breakdown
  const methodCounts = countByField(validRecords, 'check_in_method')
  const checkInMethods: CheckInMethodBreakdown[] = methodCounts.map((m) => ({
    method: CHECK_IN_METHOD_LABELS[m.key] ?? m.key,
    count: m.count,
    percentage: m.percentage,
  }))

  // Top members
  const topMembersMap = new Map<
    string,
    { member: { full_name: string; member_code: string; photo_url: string | null }; count: number }
  >()
  for (const r of topMembersRes.data ?? []) {
    if (!r.member_id) continue
    const memberData = Array.isArray(r.member) ? r.member[0] : r.member
    const existing = topMembersMap.get(r.member_id)
    if (existing) {
      existing.count++
    } else {
      topMembersMap.set(r.member_id, {
        member: memberData as { full_name: string; member_code: string; photo_url: string | null },
        count: 1,
      })
    }
  }

  const topMembers = Array.from(topMembersMap.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([memberId, { member, count }]) => ({
      memberId,
      memberName: member?.full_name ?? 'Desconocido',
      memberCode: member?.member_code ?? '-',
      photoUrl: member?.photo_url ?? null,
      count,
    }))

  return {
    summary,
    byDay,
    byWeek,
    byMonth,
    byHour: hourData,
    checkInMethods,
    topMembers,
  }
}

// ─────────────────────────────────────────────────────────────
// FINANCIAL REPORT
// ─────────────────────────────────────────────────────────────

export async function getFinancialReport(
  tenantId: string,
  range: DateRange
): Promise<FinancialReportData> {
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      amount,
      payment_method,
      concept,
      payment_date,
      member:members(full_name, member_code),
      membership:memberships(plan_id, plan:membership_plans(name), discount_type, discount_value)
    `
    )
    .eq('tenant_id', tenantId)
    .gte('payment_date', range.from)
    .lte('payment_date', `${range.to}T23:59:59`)
    .order('payment_date', { ascending: true })

  if (error) throw error
  const payments = data ?? []

  const totalRevenue = sumField(payments, 'amount')
  const avgTicket = payments.length > 0 ? totalRevenue / payments.length : 0

  // Discount calculation
  let totalDiscounts = 0
  for (const p of payments) {
    const mem = Array.isArray(p.membership) ? p.membership[0] : p.membership
    if (mem?.discount_type && mem.discount_value) {
      if (mem.discount_type === 'percentage') {
        totalDiscounts += (totalRevenue * mem.discount_value) / 100
      } else {
        totalDiscounts += mem.discount_value
      }
    }
  }

  // By day / week / month
  const byDay = fillDateGaps(
    groupByDay(payments, 'payment_date', (items) => sumField(items, 'amount')),
    range.from,
    range.to
  )
  const byWeek = groupByWeek(payments, 'payment_date', (items) => sumField(items, 'amount'))
  const byMonth = groupByMonth(payments, 'payment_date', (items) => sumField(items, 'amount'))

  // By plan
  const planMap = new Map<string, { name: string; revenue: number; count: number }>()
  for (const p of payments) {
    const mem = Array.isArray(p.membership) ? p.membership[0] : p.membership
    const planData = Array.isArray(mem?.plan) ? mem?.plan[0] : mem?.plan
    const planName = (planData as { name?: string })?.name ?? 'Sin plan'
    const planId = mem?.plan_id ?? 'no_plan'
    const existing = planMap.get(planId) ?? { name: planName, revenue: 0, count: 0 }
    existing.revenue += Number(p.amount) || 0
    existing.count++
    planMap.set(planId, existing)
  }

  const byPlan: RevenueByPlan[] = Array.from(planMap.entries())
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .map(([planId, { name, revenue, count }]) => ({
      planId,
      planName: name,
      revenue,
      count,
      percentage: calculatePercentage(revenue, totalRevenue),
    }))

  // By payment method
  const methodMap = new Map<string, { amount: number; count: number }>()
  for (const p of payments) {
    const method = p.payment_method ?? 'other'
    const existing = methodMap.get(method) ?? { amount: 0, count: 0 }
    existing.amount += Number(p.amount) || 0
    existing.count++
    methodMap.set(method, existing)
  }

  const byPaymentMethod: RevenueByPaymentMethod[] = Array.from(methodMap.entries())
    .sort(([, a], [, b]) => b.amount - a.amount)
    .map(([method, { amount, count }]) => ({
      method: PAYMENT_METHOD_LABELS[method] ?? method,
      amount,
      count,
      percentage: calculatePercentage(amount, totalRevenue),
    }))

  // Payment rows
  const paymentRows: PaymentRow[] = payments.map((p) => {
    const memberData = Array.isArray(p.member) ? p.member[0] : p.member
    return {
      id: p.id,
      date: p.payment_date,
      memberName: (memberData as { full_name?: string })?.full_name ?? '—',
      memberCode: (memberData as { member_code?: string })?.member_code ?? '—',
      concept: p.concept,
      paymentMethod: p.payment_method,
      amount: Number(p.amount),
    }
  })

  return {
    summary: {
      totalRevenue,
      avgTicket,
      totalDiscounts,
      totalPayments: payments.length,
      pendingPayments: 0, // No pending concept in current schema
    },
    byDay,
    byWeek,
    byMonth,
    byPlan,
    byPaymentMethod,
    payments: paymentRows,
  }
}

// ─────────────────────────────────────────────────────────────
// MEMBERSHIP REPORT
// ─────────────────────────────────────────────────────────────

export async function getMembershipReport(
  tenantId: string,
  range: DateRange
): Promise<MembershipReportData> {
  const today = new Date().toISOString().substring(0, 10)
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10)

  const [allMemberships, newMemberships, expiringSoonRes, recentlyExpiredRes] = await Promise.all([
    // All active/expired memberships
    supabase
      .from('memberships')
      .select(
        'id, status, start_date, end_date, plan_id, plan:membership_plans(name), member:members(full_name, member_code)'
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false }),

    // New memberships in range
    supabase
      .from('memberships')
      .select('id, created_at, plan_id')
      .eq('tenant_id', tenantId)
      .gte('created_at', range.from)
      .lte('created_at', `${range.to}T23:59:59`),

    // Expiring in next 7 days
    supabase
      .from('memberships')
      .select('id, end_date, member:members(full_name, member_code), plan:membership_plans(name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .gte('end_date', today)
      .lte('end_date', in7Days)
      .order('end_date', { ascending: true }),

    // Recently expired (within range)
    supabase
      .from('memberships')
      .select('id, end_date, member:members(full_name, member_code), plan:membership_plans(name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'expired')
      .gte('end_date', range.from)
      .lte('end_date', range.to)
      .order('end_date', { ascending: false })
      .limit(50),
  ])

  if (allMemberships.error) throw allMemberships.error

  const all = allMemberships.data ?? []
  const active = all.filter((m) => m.status === 'active')
  const expired = all.filter((m) => m.status === 'expired')
  const cancelled = all.filter((m) => m.status === 'cancelled')

  // By plan breakdown
  const planMap = new Map<string, { name: string; count: number }>()
  for (const m of all) {
    const planData = Array.isArray(m.plan) ? m.plan[0] : m.plan
    const name = (planData as { name?: string })?.name ?? 'Sin plan'
    const existing = planMap.get(m.plan_id) ?? { name, count: 0 }
    existing.count++
    planMap.set(m.plan_id, existing)
  }

  const byPlan = Array.from(planMap.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([planId, { name, count }]) => ({
      planId,
      planName: name,
      count,
      percentage: calculatePercentage(count, all.length),
    }))

  // New memberships over time
  const newByPeriod = groupByDay(newMemberships.data ?? [], 'created_at')

  // Status breakdown for donut
  const byStatus = [
    { label: 'Activas', value: active.length, color: '#10b981' },
    { label: 'Vencidas', value: expired.length, color: '#f43f5e' },
    { label: 'Canceladas', value: cancelled.length, color: '#94a3b8' },
  ].filter((s) => s.value > 0)

  // Expiring soon rows
  const expiringSoonRows: ExpiringSoonRow[] = (expiringSoonRes.data ?? []).map((m) => {
    const memberData = Array.isArray(m.member) ? m.member[0] : m.member
    const planData = Array.isArray(m.plan) ? m.plan[0] : m.plan
    return {
      membershipId: m.id,
      memberName: (memberData as { full_name?: string })?.full_name ?? '—',
      memberCode: (memberData as { member_code?: string })?.member_code ?? '—',
      planName: (planData as { name?: string })?.name ?? '—',
      endDate: m.end_date,
      daysRemaining: differenceInDays(parseISO(m.end_date), new Date()),
    }
  })

  // Recently expired rows
  const recentlyExpiredRows: ExpiredMembershipRow[] = (recentlyExpiredRes.data ?? []).map((m) => {
    const memberData = Array.isArray(m.member) ? m.member[0] : m.member
    const planData = Array.isArray(m.plan) ? m.plan[0] : m.plan
    return {
      membershipId: m.id,
      memberName: (memberData as { full_name?: string })?.full_name ?? '—',
      memberCode: (memberData as { member_code?: string })?.member_code ?? '—',
      planName: (planData as { name?: string })?.name ?? '—',
      endDate: m.end_date,
      daysSinceExpiry: Math.abs(differenceInDays(parseISO(m.end_date), new Date())),
    }
  })

  return {
    summary: {
      active: active.length,
      expired: expired.length,
      cancelled: cancelled.length,
      expiringSoon: expiringSoonRes.data?.length ?? 0,
      newThisPeriod: newMemberships.data?.length ?? 0,
      renewalsThisPeriod: 0, // Would need a renewals flag in schema
    },
    byStatus,
    byPlan,
    newByPeriod,
    expiringSoon: expiringSoonRows,
    recentlyExpired: recentlyExpiredRows,
  }
}

// ─────────────────────────────────────────────────────────────
// MEMBERS REPORT
// ─────────────────────────────────────────────────────────────

export async function getMembersReport(
  tenantId: string,
  range: DateRange
): Promise<MembersReportData> {
  const [membersRes, newMembersRes, atRiskRes] = await Promise.all([
    // All members with counts by status
    supabase
      .from('members')
      .select('id, status, full_name, member_code, created_at')
      .eq('tenant_id', tenantId),

    // New members in range
    supabase
      .from('members')
      .select(
        `
        id,
        full_name,
        member_code,
        status,
        created_at,
        memberships(plan_id, plan:membership_plans(name), end_date, status)
      `
      )
      .eq('tenant_id', tenantId)
      .gte('created_at', range.from)
      .lte('created_at', `${range.to}T23:59:59`)
      .order('created_at', { ascending: false }),

    // Members with active membership but no attendance in 14+ days
    supabase
      .from('memberships')
      .select(
        `
        member_id,
        end_date,
        plan:membership_plans(name),
        member:members(id, full_name, member_code, status)
      `
      )
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .limit(200),
  ])

  if (membersRes.error) throw membersRes.error

  const allMembers = membersRes.data ?? []
  const active = allMembers.filter((m) => m.status === 'active').length
  const expired = allMembers.filter((m) => m.status === 'expired').length
  const suspended = allMembers.filter((m) => m.status === 'suspended').length
  const inactive = allMembers.filter((m) => m.status === 'inactive').length

  // Status donut
  const byStatus = [
    { label: 'Activos', value: active, color: '#10b981' },
    { label: 'Vencidos', value: expired, color: '#f43f5e' },
    { label: 'Suspendidos', value: suspended, color: '#f59e0b' },
    { label: 'Inactivos', value: inactive, color: '#94a3b8' },
  ].filter((s) => s.value > 0)

  // New members over time
  const newByPeriod = groupByDay(newMembersRes.data ?? [], 'created_at')

  // New member rows
  const newMembers: NewMemberRow[] = (newMembersRes.data ?? []).map((m) => {
    const memberships = Array.isArray(m.memberships) ? m.memberships : []
    const activeMembership = memberships.find((ms: { status: string }) => ms.status === 'active')
    const planData = Array.isArray(activeMembership?.plan)
      ? activeMembership?.plan[0]
      : activeMembership?.plan
    return {
      memberId: m.id,
      memberName: m.full_name,
      memberCode: m.member_code,
      status: m.status,
      createdAt: m.created_at,
      planName: (planData as { name?: string })?.name ?? null,
    }
  })

  // At-risk members: active membership but low recent attendance
  const atRiskMembers: AtRiskMemberRow[] = []

  if (!atRiskRes.error && atRiskRes.data) {
    for (const membership of atRiskRes.data) {
      const memberData = Array.isArray(membership.member) ? membership.member[0] : membership.member
      const planData = Array.isArray(membership.plan) ? membership.plan[0] : membership.plan
      if (!membership.member_id || !memberData) continue

      // Check last attendance
      const { data: lastAtt } = await supabase
        .from('attendance_records')
        .select('check_in_date')
        .eq('tenant_id', tenantId)
        .eq('member_id', membership.member_id)
        .eq('status', 'valid')
        .order('check_in_date', { ascending: false })
        .limit(1)

      const lastDate = lastAtt?.[0]?.check_in_date ?? null
      const daysSince = lastDate ? differenceInDays(new Date(), parseISO(lastDate)) : 999

      if (daysSince >= 14) {
        const { count: totalAtt } = await supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('member_id', membership.member_id)
          .eq('status', 'valid')

        atRiskMembers.push({
          memberId: membership.member_id,
          memberName: (memberData as { full_name?: string })?.full_name ?? '—',
          memberCode: (memberData as { member_code?: string })?.member_code ?? '—',
          planName: (planData as { name?: string })?.name ?? null,
          membershipEndDate: membership.end_date,
          daysSinceLastAttendance: daysSince === 999 ? -1 : daysSince,
          totalAttendances: totalAtt ?? 0,
        })
      }

      if (atRiskMembers.length >= 20) break
    }

    // Sort by most days since attendance
    atRiskMembers.sort((a, b) => b.daysSinceLastAttendance - a.daysSinceLastAttendance)
    // Mark "never attended" as highest priority
    const neverAttended = atRiskMembers.filter((m) => m.daysSinceLastAttendance === -1)
    const attended = atRiskMembers.filter((m) => m.daysSinceLastAttendance !== -1)
    atRiskMembers.length = 0
    atRiskMembers.push(...neverAttended, ...attended)

    // Fix display for never attended
    for (const m of atRiskMembers) {
      if (m.daysSinceLastAttendance === -1) {
        m.daysSinceLastAttendance = -1 // Keep as is, UI will handle display
      }
    }
  }

  return {
    summary: {
      active,
      expired,
      suspended,
      inactive,
      newThisPeriod: newMembersRes.data?.length ?? 0,
      atRisk: atRiskMembers.length,
    },
    byStatus,
    newByPeriod,
    atRiskMembers,
    newMembers,
  }
}
