const fs = require('fs');
const csv = require('csv-parser');

console.log('=== RECOMMENDATION ANALYSIS ===\n');

const results = [];
const recommendationCounts = {
    '5': 0,
    '4': 0,
    '3': 0,
    '2': 0,
    '1': 0
};

let totalRecommendations = 0;

fs.createReadStream('cleaned_data.csv')
    .pipe(csv())
    .on('data', (data) => {
        results.push(data);
        
        // Check if recommend field exists and has a value
        if (data.recommend && data.recommend.trim() !== '') {
            const recommendValue = data.recommend.trim();
            if (recommendationCounts.hasOwnProperty(recommendValue)) {
                recommendationCounts[recommendValue]++;
                totalRecommendations++;
            }
        }
    })
    .on('end', () => {
        console.log(`📊 TOTAL RECORDS: ${results.length}`);
        console.log(`📝 TOTAL RECOMMENDATIONS: ${totalRecommendations}\n`);
        
        console.log('👍 RECOMMENDATION DISTRIBUTION:');
        Object.entries(recommendationCounts).forEach(([rating, count]) => {
            const percentage = totalRecommendations > 0 ? ((count / totalRecommendations) * 100).toFixed(1) : 0;
            console.log(`${rating} Stars: ${count} customers (${percentage}%)`);
        });
        
        // Calculate average recommendation
        let totalScore = 0;
        Object.entries(recommendationCounts).forEach(([rating, count]) => {
            totalScore += parseInt(rating) * count;
        });
        const averageRecommendation = totalRecommendations > 0 ? (totalScore / totalRecommendations).toFixed(1) : 0;
        
        console.log(`\n📈 AVERAGE RECOMMENDATION: ${averageRecommendation}/5`);
        
        // Find most common recommendation
        const mostCommon = Object.entries(recommendationCounts).reduce((a, b) => a[1] > b[1] ? a : b);
        console.log(`🏆 MOST COMMON: ${mostCommon[0]} Stars (${mostCommon[1]} customers)`);
        
        console.log('\n=== END OF RECOMMENDATION ANALYSIS ===');
    }); 