const fs = require('fs');
const csv = require('csv-parser');

console.log('=== TIME PATTERN ANALYSIS ===\n');

const results = [];
const timeSlots = {
    '6AM-9AM': 0,
    '9AM-12PM': 0,
    '12PM-3PM': 0,
    '3PM-6PM': 0,
    '6PM-9PM': 0,
    '9PM-12AM': 0,
    '12AM-3AM': 0,
    '3AM-6AM': 0
};

const dayOfWeek = {
    'Sunday': 0,
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0
};

const hourlyData = {};
for (let i = 0; i < 24; i++) {
    hourlyData[i] = 0;
}

fs.createReadStream('cleaned_data.csv')
    .pipe(csv())
    .on('data', (data) => {
        results.push(data);
        
        // Parse the session_created_at timestamp (UTC)
        const utcTime = new Date(data.session_created_at);
        
        // Convert to CST (UTC-4) - FIXED: was UTC-6, now UTC-4
        const cstTime = new Date(utcTime.getTime() - (4 * 60 * 60 * 1000));
        
        const hour = cstTime.getHours();
        const day = cstTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Count by hour
        hourlyData[hour]++;
        
        // Count by day of week
        dayOfWeek[dayNames[day]]++;
        
        // Count by time slots
        if (hour >= 6 && hour < 9) timeSlots['6AM-9AM']++;
        else if (hour >= 9 && hour < 12) timeSlots['9AM-12PM']++;
        else if (hour >= 12 && hour < 15) timeSlots['12PM-3PM']++;
        else if (hour >= 15 && hour < 18) timeSlots['3PM-6PM']++;
        else if (hour >= 18 && hour < 21) timeSlots['6PM-9PM']++;
        else if (hour >= 21 && hour < 24) timeSlots['9PM-12AM']++;
        else if (hour >= 0 && hour < 3) timeSlots['12AM-3AM']++;
        else if (hour >= 3 && hour < 6) timeSlots['3AM-6AM']++;
    })
    .on('end', () => {
        console.log(`📊 TOTAL RECORDS: ${results.length}\n`);
        
        console.log('🕐 HOURLY DISTRIBUTION (CST):');
        for (let i = 0; i < 24; i++) {
            const timeLabel = i < 12 ? `${i === 0 ? 12 : i}AM` : `${i === 12 ? 12 : i-12}PM`;
            console.log(`${timeLabel.padStart(4)}: ${hourlyData[i]} players`);
        }
        
        console.log('\n📅 DAY OF WEEK DISTRIBUTION:');
        Object.entries(dayOfWeek).forEach(([day, count]) => {
            console.log(`${day.padEnd(10)}: ${count} players`);
        });
        
        console.log('\n⏰ TIME SLOT ANALYSIS:');
        Object.entries(timeSlots).forEach(([slot, count]) => {
            const percentage = ((count / results.length) * 100).toFixed(1);
            console.log(`${slot.padEnd(10)}: ${count} players (${percentage}%)`);
        });
        
        // Find peak hours
        const peakHour = Object.keys(hourlyData).reduce((a, b) => hourlyData[a] > hourlyData[b] ? a : b);
        const peakDay = Object.keys(dayOfWeek).reduce((a, b) => dayOfWeek[a] > dayOfWeek[b] ? a : b);
        const peakSlot = Object.keys(timeSlots).reduce((a, b) => timeSlots[a] > timeSlots[b] ? a : b);
        
        console.log('\n🏆 PEAK TIMES:');
        const peakHourLabel = peakHour < 12 ? `${peakHour === 0 ? 12 : peakHour}AM` : `${peakHour === 12 ? 12 : peakHour-12}PM`;
        console.log(`Peak Hour: ${peakHourLabel} (${hourlyData[peakHour]} players)`);
        console.log(`Peak Day: ${peakDay} (${dayOfWeek[peakDay]} players)`);
        console.log(`Peak Slot: ${peakSlot} (${timeSlots[peakSlot]} players)`);
        
        // Restaurant hours analysis
        const businessHours = {
            'Sunday-Thursday': { open: 11.5, close: 24 }, // 11:30 AM - 12:00 AM
            'Friday-Saturday': { open: 11.5, close: 26 }  // 11:30 AM - 2:00 AM (next day)
        };
        
        console.log('\n🍜 RESTAURANT HOURS ANALYSIS:');
        console.log('Sunday-Thursday: 11:30 AM - 12:00 AM');
        console.log('Friday-Saturday: 11:30 AM - 2:00 AM');
        
        // Calculate activity during business hours vs after hours
        let businessHoursActivity = 0;
        let afterHoursActivity = 0;
        
        Object.entries(hourlyData).forEach(([hour, count]) => {
            const hourNum = parseInt(hour);
            if (hourNum >= 11.5 || hourNum < 24) {
                businessHoursActivity += count;
            } else {
                afterHoursActivity += count;
            }
        });
        
        console.log(`\n📈 BUSINESS HOURS ACTIVITY: ${businessHoursActivity} players (${((businessHoursActivity/results.length)*100).toFixed(1)}%)`);
        console.log(`🌙 AFTER HOURS ACTIVITY: ${afterHoursActivity} players (${((afterHoursActivity/results.length)*100).toFixed(1)}%)`);
        
        console.log('\n=== END OF TIME PATTERN ANALYSIS ===');
    }); 