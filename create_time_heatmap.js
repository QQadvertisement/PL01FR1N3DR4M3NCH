const fs = require('fs');
const csv = require('csv-parser');

console.log('=== TIME HEATMAP DATA GENERATION ===\n');

const results = [];
const heatmapData = {};

// Initialize heatmap data structure
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hours = Array.from({length: 24}, (_, i) => i);

days.forEach(day => {
    heatmapData[day] = {};
    hours.forEach(hour => {
        heatmapData[day][hour] = 0;
    });
});

fs.createReadStream('cleaned_data.csv')
    .pipe(csv())
    .on('data', (data) => {
        results.push(data);
        
        // Parse the session_created_at timestamp (UTC)
        const utcTime = new Date(data.session_created_at);
        
        // Convert to CST (UTC-4)
        const cstTime = new Date(utcTime.getTime() - (4 * 60 * 60 * 1000));
        
        const hour = cstTime.getHours();
        const day = cstTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayName = days[day];
        
        // Count activity for this day and hour
        heatmapData[dayName][hour]++;
    })
    .on('end', () => {
        console.log(`📊 TOTAL RECORDS: ${results.length}\n`);
        
        // Find the maximum value for color scaling
        let maxValue = 0;
        days.forEach(day => {
            hours.forEach(hour => {
                if (heatmapData[day][hour] > maxValue) {
                    maxValue = heatmapData[day][hour];
                }
            });
        });
        
        console.log(`🏆 MAXIMUM ACTIVITY: ${maxValue} players per hour\n`);
        
        // Generate heatmap data for chart
        const chartData = [];
        const labels = [];
        
        days.forEach(day => {
            hours.forEach(hour => {
                const hourLabel = hour < 12 ? `${hour === 0 ? 12 : hour}AM` : `${hour === 12 ? 12 : hour-12}PM`;
                labels.push(`${day} ${hourLabel}`);
                chartData.push(heatmapData[day][hour]);
            });
        });
        
        console.log('📈 HEATMAP DATA STRUCTURE:');
        console.log('Days:', days);
        console.log('Hours:', hours);
        console.log('Max Value:', maxValue);
        console.log('Data Points:', chartData.length);
        
        // Show sample data
        console.log('\n🔍 SAMPLE DATA (first 10 entries):');
        for (let i = 0; i < 10; i++) {
            console.log(`${labels[i]}: ${chartData[i]} players`);
        }
        
        console.log('\n=== END OF TIME HEATMAP DATA GENERATION ===');
    }); 