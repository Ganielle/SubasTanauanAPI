function getNextMonthPaymentDate() {
    const date = new Date(); // Convert input to Date object

    // Add one month to the current date
    const nextMonth = date.getMonth() + 1;
    date.setMonth(nextMonth);

    // Check if the adjusted month is correct (handles edge cases like February 30th)
    if (date.getMonth() !== nextMonth % 12) {
        date.setDate(0); // Set to the last day of the previous month
    }

    return date;
}

module.exports = {
    getNextMonthPaymentDate
}