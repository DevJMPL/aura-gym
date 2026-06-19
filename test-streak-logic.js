const { format, parseISO, differenceInDays, getDay, subDays } = require('date-fns')

function calculateStreak(uniqueDatesStr, trainingDays) {
  if (uniqueDatesStr.length === 0) return 0

  // If trainingDays is empty, maybe default to all days?
  const hasTrainingDays = trainingDays && trainingDays.length > 0
  const tDaysSet = hasTrainingDays ? new Set(trainingDays) : new Set([0, 1, 2, 3, 4, 5, 6])

  const uniqueDates = uniqueDatesStr.map((d) => parseISO(d))
  const today = parseISO('2026-06-18') // Mock today

  const firstDate = uniqueDates[0]

  // Check if the most recent checkin is valid for continuing the streak
  // The streak is active if the most recent check-in is today, or the most recent check-in is the *last scheduled training day* before today.
  let expectedDate = today
  // Find the last scheduled training day (which could be today)
  while (!tDaysSet.has(getDay(expectedDate))) {
    expectedDate = subDays(expectedDate, 1)
  }

  // If the most recent check-in is older than the last expected training day, streak is 0.
  // Wait, if today is NOT a training day, and they checked in yesterday (which IS a training day), that's fine.
  // If today is a training day, and they haven't checked in yet, maybe the streak is still alive until the day ends?
  // Usually, if they check in today, their latest checkin is today.
  // If they haven't checked in today, their latest checkin should be the previous training day.

  // Since we call this AFTER they check in today (or currently check in), their latest check in IS today.
  // So uniqueDates[0] is today!
  // But let's be robust.

  let streak = 0
  let expectedDateIter = firstDate // We start from the most recent checkin

  // If the first check-in is not the expected "today or last training day", streak broken?
  // Actually, if we just count backwards from the first checkin:
  let dateIdx = 0

  while (dateIdx < uniqueDates.length) {
    const checkInDate = uniqueDates[dateIdx]

    // If the checkInDate matches the expectedDateIter
    if (format(checkInDate, 'yyyy-MM-dd') === format(expectedDateIter, 'yyyy-MM-dd')) {
      streak++
      dateIdx++ // Move to next checkin
      // Find next expected date backwards
      expectedDateIter = subDays(expectedDateIter, 1)
      while (!tDaysSet.has(getDay(expectedDateIter))) {
        expectedDateIter = subDays(expectedDateIter, 1)
      }
    } else {
      // Did they check in on a non-training day?
      // If checkInDate is GREATER than expectedDateIter, they checked in on an off-day!
      // We should just ignore off-day checkins?
      if (checkInDate > expectedDateIter) {
        streak++ // Maybe bonus? Or just ignore it?
        dateIdx++ // Skip this off-day check-in
      } else {
        // checkInDate is LESS than expectedDateIter. This means they missed expectedDateIter!
        break
      }
    }
  }

  return streak
}

console.log('Test 1: Mon, Wed, Fri. Checkins: Wed, Mon, Fri (prev week)')
console.log(calculateStreak(['2026-06-17', '2026-06-15', '2026-06-12'], [1, 3, 5])) // Should be 3

console.log('Test 2: Mon, Wed, Fri. Checkins: Wed, Tue(off), Mon')
console.log(calculateStreak(['2026-06-17', '2026-06-16', '2026-06-15'], [1, 3, 5])) // Should be 2 or 3? Off day checkins shouldn't break streak, but do they add to it?
