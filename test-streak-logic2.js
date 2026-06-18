const { format, parseISO, differenceInDays, getDay, subDays } = require('date-fns')

function calculateStreak(uniqueDatesStr, trainingDays) {
    if (uniqueDatesStr.length === 0) return 0;
    
    const hasTrainingDays = trainingDays && trainingDays.length > 0;
    const tDaysSet = hasTrainingDays ? new Set(trainingDays) : new Set([0,1,2,3,4,5,6]);

    const uniqueDates = uniqueDatesStr.map(d => parseISO(d));
    const today = parseISO('2026-06-18'); // 18th is Thursday (Day 4)

    const firstDate = uniqueDates[0];
    let expectedDateIter = firstDate; // We start from the most recent checkin
    let streak = 0;
    let dateIdx = 0;

    // First check if the firstDate is valid.
    // If the firstDate is today or yesterday, it's fine.
    // What if the most recent check-in is older than the last required training day?
    // We should check that.
    let lastRequiredDay = today;
    while (!tDaysSet.has(getDay(lastRequiredDay))) {
        lastRequiredDay = subDays(lastRequiredDay, 1);
    }
    
    // If their most recent checkin is older than the last required day, their streak is ALREADY BROKEN!
    // But wait, if they are checking in right now, `uniqueDates[0]` IS `today`.
    // So this check is mostly for when they haven't checked in today yet.
    if (format(firstDate, 'yyyy-MM-dd') < format(lastRequiredDay, 'yyyy-MM-dd')) {
        return 0; // Streak broken
    }
    
    while(dateIdx < uniqueDates.length) {
        const checkInDate = uniqueDates[dateIdx];
        
        if (format(checkInDate, 'yyyy-MM-dd') === format(expectedDateIter, 'yyyy-MM-dd')) {
            streak++;
            dateIdx++; 
            expectedDateIter = subDays(expectedDateIter, 1);
            while(!tDaysSet.has(getDay(expectedDateIter))) {
                expectedDateIter = subDays(expectedDateIter, 1);
            }
        } else {
            if (checkInDate > expectedDateIter) {
                streak++; // Extra day bonus!
                dateIdx++; 
            } else {
                break;
            }
        }
    }
    
    return streak;
}

console.log("Test 1: M W F, checked in W, M, prev F");
console.log(calculateStreak(['2026-06-17', '2026-06-15', '2026-06-12'], [1, 3, 5])); // 3

console.log("Test 2: M W F, checked in W, missed M, prev F");
console.log(calculateStreak(['2026-06-17', '2026-06-12'], [1, 3, 5])); // 1 (Streak breaks at M)

console.log("Test 3: M W F, checked in Th (today), W, M, F");
console.log(calculateStreak(['2026-06-18', '2026-06-17', '2026-06-15', '2026-06-12'], [1, 3, 5])); // 4

