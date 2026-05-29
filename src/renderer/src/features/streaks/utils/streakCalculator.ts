import type { AttendanceRecord, MemberTrainingDay, StreakInfo } from '../../../types/database'
import {
  startOfMonth,
  endOfMonth,
  parseISO,
  getDay,
  differenceInCalendarDays,
  subDays,
  format,
  isBefore,
  isAfter,
} from 'date-fns'

/**
 * Calculate streak information for a member based on their attendance
 * and expected training days.
 *
 * Rules:
 * - Only expected training days count toward the streak
 * - Attending on an expected day maintains/increases the streak
 * - Missing an expected day breaks the streak
 * - Non-expected days don't affect the streak
 * - Attending on a non-expected day is counted as "extra" attendance
 */
export function calculateStreaks(
  attendanceRecords: AttendanceRecord[],
  trainingDays: MemberTrainingDay[],
  today: Date = new Date()
): StreakInfo {
  const expectedDaysSet = new Set(trainingDays.map((td) => td.day_of_week))
  const attendanceDateSet = new Set(
    attendanceRecords.map((a) => format(parseISO(a.check_in_at), 'yyyy-MM-dd'))
  )

  // Calculate current streak
  let currentStreak = 0
  let checkDate = today

  // Walk backwards day by day
  for (let i = 0; i < 365; i++) {
    const dateStr = format(checkDate, 'yyyy-MM-dd')
    const dayOfWeek = getDay(checkDate)
    const isExpectedDay = expectedDaysSet.has(dayOfWeek)
    const attended = attendanceDateSet.has(dateStr)

    if (isExpectedDay) {
      // Skip today if it's still early (don't break streak for today)
      if (i === 0 && !attended) {
        checkDate = subDays(checkDate, 1)
        continue
      }

      if (attended) {
        currentStreak++
      } else {
        break // Missed an expected day, streak broken
      }
    }

    checkDate = subDays(checkDate, 1)
  }

  // Calculate best streak
  let bestStreak = 0
  let tempStreak = 0

  // Sort records by date ascending
  const sortedDates = [...attendanceDateSet].sort()

  if (sortedDates.length > 0) {
    const firstDate = parseISO(sortedDates[0])
    const lastDate = parseISO(sortedDates[sortedDates.length - 1])
    const totalDays = differenceInCalendarDays(lastDate, firstDate) + 1

    let scanDate = firstDate
    for (let i = 0; i < totalDays; i++) {
      const dateStr = format(scanDate, 'yyyy-MM-dd')
      const dayOfWeek = getDay(scanDate)
      const isExpectedDay = expectedDaysSet.has(dayOfWeek)

      if (isExpectedDay) {
        if (attendanceDateSet.has(dateStr)) {
          tempStreak++
          bestStreak = Math.max(bestStreak, tempStreak)
        } else {
          tempStreak = 0
        }
      }

      scanDate = subDays(scanDate, -1) // add 1 day
    }
  }

  bestStreak = Math.max(bestStreak, currentStreak)

  // Total attendances
  const totalAttendances = attendanceRecords.length

  // Monthly attendances
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const monthlyAttendances = attendanceRecords.filter((a) => {
    const date = parseISO(a.check_in_at)
    return !isBefore(date, monthStart) && !isAfter(date, monthEnd)
  }).length

  // Weekly frequency (average over last 4 weeks)
  const fourWeeksAgo = subDays(today, 28)
  const recentAttendances = attendanceRecords.filter((a) => {
    const date = parseISO(a.check_in_at)
    return !isBefore(date, fourWeeksAgo) && !isAfter(date, today)
  }).length
  const weeklyFrequency = Math.round((recentAttendances / 4) * 10) / 10

  return {
    currentStreak,
    bestStreak,
    totalAttendances,
    monthlyAttendances,
    weeklyFrequency,
  }
}
