const { format, parseISO, differenceInDays } = require('date-fns')

const uniqueDates = ['2026-06-18', '2026-06-17', '2026-06-15']
let streak = 1
let previousDate = parseISO(uniqueDates[0])

for (let i = 1; i < uniqueDates.length; i++) {
    const date = parseISO(uniqueDates[i])
    console.log(previousDate, date, differenceInDays(previousDate, date))
    if (differenceInDays(previousDate, date) === 1) {
        streak++
        previousDate = date
    } else {
        break
    }
}
console.log('streak', streak)
