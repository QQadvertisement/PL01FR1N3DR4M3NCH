const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('cleaned_data.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log('=== FRIENDS RAMEN CHICAGO - DATA ANALYSIS ===\n');
    
    // Basic counts
    const totalRecords = results.length;
    const uniqueSessions = new Set(results.map(d => d.session_id)).size;
    const uniquePhones = new Set(results.map(d => d.anon_phone)).size;
    
    console.log(`📊 BASIC METRICS:`);
    console.log(`Total records: ${totalRecords}`);
    console.log(`Unique sessions: ${uniqueSessions}`);
    console.log(`Unique players (by phone): ${uniquePhones}`);
    
    // Score analysis
    const scores = results.map(d => parseInt(d.score)).filter(s => !isNaN(s));
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const avgScore = Math.round(totalScore / scores.length);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    console.log(`\n🎯 SCORE ANALYSIS:`);
    console.log(`Total score: ${totalScore.toLocaleString()}`);
    console.log(`Average score: ${avgScore}`);
    console.log(`Highest score: ${maxScore}`);
    console.log(`Lowest score: ${minScore}`);
    
    // Score distribution
    const scoreRanges = {
      '0-100': 0, '101-300': 0, '301-500': 0, '501-700': 0, 
      '701-900': 0, '901-1100': 0, '1100+': 0
    };
    
    scores.forEach(score => {
      if (score <= 100) scoreRanges['0-100']++;
      else if (score <= 300) scoreRanges['101-300']++;
      else if (score <= 500) scoreRanges['301-500']++;
      else if (score <= 700) scoreRanges['501-700']++;
      else if (score <= 900) scoreRanges['701-900']++;
      else if (score <= 1100) scoreRanges['901-1100']++;
      else scoreRanges['1100+']++;
    });
    
    console.log(`\n📊 SCORE DISTRIBUTION:`);
    Object.entries(scoreRanges).forEach(([range, count]) => {
      console.log(`${range}: ${count} players`);
    });
    
    // Rating analysis
    const ratings = results.map(d => parseInt(d.rating)).filter(r => !isNaN(r));
    const avgRating = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
    const rating5 = ratings.filter(r => r === 5).length;
    const rating4 = ratings.filter(r => r === 4).length;
    const rating3 = ratings.filter(r => r === 3).length;
    const rating2 = ratings.filter(r => r === 2).length;
    const rating1 = ratings.filter(r => r === 1).length;
    
    console.log(`\n⭐ RATING ANALYSIS:`);
    console.log(`Average rating: ${avgRating}/5`);
    console.log(`5 stars: ${rating5} (${Math.round(rating5/ratings.length*100)}%)`);
    console.log(`4 stars: ${rating4} (${Math.round(rating4/ratings.length*100)}%)`);
    console.log(`3 stars: ${rating3} (${Math.round(rating3/ratings.length*100)}%)`);
    console.log(`2 stars: ${rating2} (${Math.round(rating2/ratings.length*100)}%)`);
    console.log(`1 star: ${rating1} (${Math.round(rating1/ratings.length*100)}%)`);
    
    // Recommend analysis
    const recommends = results.map(d => parseInt(d.recommend)).filter(r => !isNaN(r));
    const avgRecommend = (recommends.reduce((a, b) => a + b, 0) / recommends.length).toFixed(1);
    
    console.log(`\n👍 RECOMMEND ANALYSIS:`);
    console.log(`Average recommend: ${avgRecommend}/5`);
    
    // Sources analysis (parse JSON-like strings)
    const allSources = [];
    results.forEach(d => {
      if (d.sources && d.sources !== '[]') {
        try {
          const sources = JSON.parse(d.sources.replace(/'/g, '"'));
          if (Array.isArray(sources)) {
            sources.forEach(s => allSources.push(s));
          }
        } catch (e) {
          // Handle parsing errors
        }
      }
    });
    
    const sourceCounts = {};
    allSources.forEach(source => {
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    
    console.log(`\n📱 SOURCES ANALYSIS:`);
    const totalSources = allSources.length;
    Object.entries(sourceCounts).forEach(([source, count]) => {
      const percentage = Math.round(count / totalSources * 100);
      console.log(`${source}: ${count} (${percentage}%)`);
    });
    
    // Languages analysis
    const allLanguages = [];
    results.forEach(d => {
      if (d.languages && d.languages !== '[]') {
        try {
          const languages = JSON.parse(d.languages.replace(/'/g, '"'));
          if (Array.isArray(languages)) {
            languages.forEach(l => allLanguages.push(l));
          }
        } catch (e) {
          // Handle parsing errors
        }
      }
    });
    
    const languageCounts = {};
    allLanguages.forEach(lang => {
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });
    
    console.log(`\n🌍 LANGUAGES ANALYSIS:`);
    const totalLanguages = allLanguages.length;
    Object.entries(languageCounts).forEach(([lang, count]) => {
      const percentage = Math.round(count / totalLanguages * 100);
      console.log(`${lang}: ${count} (${percentage}%)`);
    });
    
    // Repeat players analysis
    const phoneCounts = {};
    results.forEach(d => {
      phoneCounts[d.anon_phone] = (phoneCounts[d.anon_phone] || 0) + 1;
    });
    
    const repeatPlayers = Object.values(phoneCounts).filter(count => count > 1).length;
    const singlePlayers = Object.values(phoneCounts).filter(count => count === 1).length;
    
    console.log(`\n🔄 REPEAT PLAYER ANALYSIS:`);
    console.log(`Single-time players: ${singlePlayers}`);
    console.log(`Repeat players: ${repeatPlayers}`);
    console.log(`Retention rate: ${Math.round(repeatPlayers / uniquePhones * 100)}%`);
    
    // Date analysis
    const dates = results.map(d => d.score_created_at?.split(' ')[0]).filter(d => d);
    const uniqueDates = new Set(dates).size;
    
    console.log(`\n📅 DATE ANALYSIS:`);
    console.log(`Data spans: ${uniqueDates} days`);
    console.log(`Average daily sessions: ${Math.round(totalRecords / uniqueDates)}`);
    
    console.log(`\n=== END OF ANALYSIS ===`);
  }); 