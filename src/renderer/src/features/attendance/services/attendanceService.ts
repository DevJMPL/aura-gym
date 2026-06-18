import { supabase } from '../../../lib/supabase/client'
import { memberService } from '../../members/services/memberService'
import { membershipService } from '../../memberships/services/membershipService'
import type {
  AttendanceRecord,
  AttendanceStatus,
  AccessResult,
  DenialReason,
} from '../../../types/database'
import { format, parseISO, getDay, subDays } from 'date-fns'

export interface ProcessCheckInResult {
  success: boolean
  status: AttendanceStatus
  accessResult: AccessResult
  denialReason: DenialReason | null
  memberId?: string
  memberName?: string
  memberPhoto?: string | null
  message: string
  streak?: number
}

export const attendanceService = {
  async processCheckIn(tenantId: string, memberCode: string): Promise<ProcessCheckInResult> {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const nowIso = new Date().toISOString()

    // 1. Find the member by code or username
    const member = await memberService.getByIdentifier(tenantId, memberCode)

    if (!member) {
      // Record "not found"
      await supabase.from('attendance_records').insert({
        tenant_id: tenantId,
        check_in_at: nowIso,
        check_in_date: todayStr,
        check_in_method: 'member_code',
        status: 'denied',
        access_result: 'denied',
        denial_reason: 'not_found',
      })

      return {
        success: false,
        status: 'denied',
        accessResult: 'denied',
        denialReason: 'not_found',
        message: 'Miembro no encontrado',
      }
    }

    // 2. Check if member is inactive or suspended
    if (member.status === 'inactive' || member.status === 'suspended') {
      await supabase.from('attendance_records').insert({
        tenant_id: tenantId,
        member_id: member.id,
        check_in_at: nowIso,
        check_in_date: todayStr,
        check_in_method: 'member_code',
        status: 'denied',
        access_result: 'denied',
        denial_reason: member.status === 'inactive' ? 'inactive_member' : 'suspended_member',
      })

      return {
        success: false,
        status: 'denied',
        accessResult: 'denied',
        denialReason: member.status === 'inactive' ? 'inactive_member' : 'suspended_member',
        memberId: member.id,
        memberName: member.full_name,
        memberPhoto: member.photo_url,
        message: `Miembro ${member.status === 'inactive' ? 'inactivo' : 'suspendido'}`,
      }
    }

    // 3. Get active membership
    const activeMembership = await membershipService.getActiveMembership(tenantId, member.id)

    if (!activeMembership) {
      await supabase.from('attendance_records').insert({
        tenant_id: tenantId,
        member_id: member.id,
        check_in_at: nowIso,
        check_in_date: todayStr,
        check_in_method: 'member_code',
        status: 'denied',
        access_result: 'denied',
        denial_reason: 'expired_membership',
      })

      return {
        success: false,
        status: 'denied',
        accessResult: 'denied',
        denialReason: 'expired_membership',
        memberId: member.id,
        memberName: member.full_name,
        memberPhoto: member.photo_url,
        message: 'Membresía vencida o inexistente',
      }
    }

    // 4. Check for duplicates
    const { count } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('member_id', member.id)
      .eq('check_in_date', todayStr)
      .eq('status', 'valid')

    if (count && count > 0) {
      // Record as duplicate
      await supabase.from('attendance_records').insert({
        tenant_id: tenantId,
        member_id: member.id,
        membership_id: activeMembership.id,
        check_in_at: nowIso,
        check_in_date: todayStr,
        check_in_method: 'member_code',
        status: 'duplicate',
        access_result: 'denied',
        denial_reason: null,
      })

      return {
        success: false,
        status: 'duplicate',
        accessResult: 'denied',
        denialReason: null,
        memberId: member.id,
        memberName: member.full_name,
        memberPhoto: member.photo_url,
        message: 'Ya registró asistencia hoy',
      }
    }

    // 5. Success
    await supabase.from('attendance_records').insert({
      tenant_id: tenantId,
      member_id: member.id,
      membership_id: activeMembership.id,
      check_in_at: nowIso,
      check_in_date: todayStr,
      check_in_method: 'member_code',
      status: 'valid',
      access_result: 'allowed',
      denial_reason: null,
    })

    const streak = await this.calculateStreak(tenantId, member.id)

    return {
      success: true,
      status: 'valid',
      accessResult: 'allowed',
      denialReason: null,
      memberId: member.id,
      memberName: member.full_name,
      memberPhoto: member.photo_url,
      message: 'Acceso permitido',
      streak,
    }
  },

  async calculateStreak(tenantId: string, memberId: string): Promise<number> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('check_in_date')
      .eq('tenant_id', tenantId)
      .eq('member_id', memberId)
      .eq('status', 'valid')
      .order('check_in_date', { ascending: false })

    if (error || !data || data.length === 0) return 0

    // Fetch member training days
    const { data: trainingDaysData } = await supabase
      .from('member_training_days')
      .select('day_of_week')
      .eq('tenant_id', tenantId)
      .eq('member_id', memberId)

    const trainingDays = trainingDaysData?.map((d) => d.day_of_week) || []
    const hasTrainingDays = trainingDays.length > 0
    const tDaysSet = hasTrainingDays ? new Set(trainingDays) : new Set([0, 1, 2, 3, 4, 5, 6])

    const uniqueDatesStr = Array.from(new Set(data.map((d) => d.check_in_date)))
    if (uniqueDatesStr.length === 0) return 0

    const uniqueDates = uniqueDatesStr.map((d) => parseISO(d))
    const today = parseISO(format(new Date(), 'yyyy-MM-dd'))

    const firstDate = uniqueDates[0]

    // Find the last required training day
    let lastRequiredDay = today
    while (!tDaysSet.has(getDay(lastRequiredDay))) {
      lastRequiredDay = subDays(lastRequiredDay, 1)
    }

    // If the most recent checkin is older than the last required day, the streak is broken
    if (format(firstDate, 'yyyy-MM-dd') < format(lastRequiredDay, 'yyyy-MM-dd')) {
      return 0
    }

    let expectedDateIter = firstDate
    let streak = 0
    let dateIdx = 0

    while (dateIdx < uniqueDates.length) {
      const checkInDate = uniqueDates[dateIdx]

      if (format(checkInDate, 'yyyy-MM-dd') === format(expectedDateIter, 'yyyy-MM-dd')) {
        streak++
        dateIdx++
        expectedDateIter = subDays(expectedDateIter, 1)
        while (!tDaysSet.has(getDay(expectedDateIter))) {
          expectedDateIter = subDays(expectedDateIter, 1)
        }
      } else {
        if (checkInDate > expectedDateIter) {
          streak++ // Bonus: Checked in on an off-day
          dateIdx++
        } else {
          break
        }
      }
    }

    return streak
  },

  async getHistory(
    tenantId: string,
    filters?: { date?: string; status?: AttendanceStatus; limit?: number }
  ): Promise<AttendanceRecord[]> {
    let query = supabase
      .from('attendance_records')
      .select('*, member:members(*)')
      .eq('tenant_id', tenantId)
      .order('check_in_at', { ascending: false })

    if (filters?.date) {
      query = query.eq('check_in_date', filters.date)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data as AttendanceRecord[]
  },

  async getMemberHistory(tenantId: string, memberId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('member_id', memberId)
      .order('check_in_at', { ascending: false })

    if (error) throw error
    return data as AttendanceRecord[]
  },

  async getTodayRecords(tenantId: string): Promise<AttendanceRecord[]> {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    return this.getHistory(tenantId, { date: todayStr, limit: 50 })
  },

  async getTodayCount(tenantId: string): Promise<number> {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const { count, error } = await supabase
      .from('attendance_records')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('check_in_date', todayStr)
      .eq('status', 'valid')

    if (error) throw error
    return count || 0
  },
}
