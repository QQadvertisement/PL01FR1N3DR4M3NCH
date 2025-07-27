const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('cleaned_data.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log('=== SURVEY ABANDONMENT ANALYSIS ===\n');
    
    // Total records
    const totalRecords = results.length;
    console.log(`📊 TOTAL RECORDS: ${totalRecords}`);
    
    // Survey completion analysis
    const completedSurveys = results.filter(d => d.survey_created_at && d.survey_created_at.trim() !== '');
    const abandonedSurveys = results.filter(d => !d.survey_created_at || d.survey_created_at.trim() === '');
    
    console.log(`\n📝 SURVEY COMPLETION:`);
    console.log(`Completed surveys: ${completedSurveys.length} (${Math.round(completedSurveys.length/totalRecords*100)}%)`);
    console.log(`Abandoned surveys: ${abandonedSurveys.length} (${Math.round(abandonedSurveys.length/totalRecords*100)}%)`);
    
    // Feedback completion analysis
    const completedFeedback = results.filter(d => d.feedback_created_at && d.feedback_created_at.trim() !== '');
    const abandonedFeedback = results.filter(d => !d.feedback_created_at || d.feedback_created_at.trim() === '');
    
    console.log(`\n💬 FEEDBACK COMPLETION:`);
    console.log(`Completed feedback: ${completedFeedback.length} (${Math.round(completedFeedback.length/totalRecords*100)}%)`);
    console.log(`Abandoned feedback: ${abandonedFeedback.length} (${Math.round(abandonedFeedback.length/totalRecords*100)}%)`);
    
    // Score analysis for abandoned vs completed
    const abandonedScores = abandonedSurveys.map(d => parseInt(d.score)).filter(s => !isNaN(s));
    const completedScores = completedSurveys.map(d => parseInt(d.score)).filter(s => !isNaN(s));
    
    if (abandonedScores.length > 0) {
      const avgAbandonedScore = Math.round(abandonedScores.reduce((a, b) => a + b, 0) / abandonedScores.length);
      const maxAbandonedScore = Math.max(...abandonedScores);
      const minAbandonedScore = Math.min(...abandonedScores);
      
      console.log(`\n🎯 ABANDONED SURVEYS - SCORE ANALYSIS:`);
      console.log(`Average score: ${avgAbandonedScore}`);
      console.log(`Highest score: ${maxAbandonedScore}`);
      console.log(`Lowest score: ${minAbandonedScore}`);
    }
    
    if (completedScores.length > 0) {
      const avgCompletedScore = Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length);
      const maxCompletedScore = Math.max(...completedScores);
      const minCompletedScore = Math.min(...completedScores);
      
      console.log(`\n✅ COMPLETED SURVEYS - SCORE ANALYSIS:`);
      console.log(`Average score: ${avgCompletedScore}`);
      console.log(`Highest score: ${maxCompletedScore}`);
      console.log(`Lowest score: ${minCompletedScore}`);
    }
    
    // Score distribution for abandoned surveys
    const abandonedScoreRanges = {
      '0-100': 0, '101-300': 0, '301-500': 0, '501-700': 0, 
      '701-900': 0, '901-1100': 0, '1100+': 0
    };
    
    abandonedScores.forEach(score => {
      if (score <= 100) abandonedScoreRanges['0-100']++;
      else if (score <= 300) abandonedScoreRanges['101-300']++;
      else if (score <= 500) abandonedScoreRanges['301-500']++;
      else if (score <= 700) abandonedScoreRanges['501-700']++;
      else if (score <= 900) abandonedScoreRanges['701-900']++;
      else if (score <= 1100) abandonedScoreRanges['901-1100']++;
      else abandonedScoreRanges['1100+']++;
    });
    
    console.log(`\n📊 ABANDONED SURVEYS - SCORE DISTRIBUTION:`);
    Object.entries(abandonedScoreRanges).forEach(([range, count]) => {
      if (count > 0) {
        console.log(`${range}: ${count} players (${Math.round(count/abandonedScores.length*100)}%)`);
      }
    });
    
    // Session analysis
    const abandonedSessions = new Set(abandonedSurveys.map(d => d.session_id)).size;
    const completedSessions = new Set(completedSurveys.map(d => d.session_id)).size;
    
    console.log(`\n🔄 SESSION ANALYSIS:`);
    console.log(`Sessions with abandoned surveys: ${abandonedSessions}`);
    console.log(`Sessions with completed surveys: ${completedSessions}`);
    
    // Player analysis
    const abandonedPlayers = new Set(abandonedSurveys.map(d => d.anon_phone)).size;
    const completedPlayers = new Set(completedSurveys.map(d => d.anon_phone)).size;
    
    console.log(`\n👥 PLAYER ANALYSIS:`);
    console.log(`Players who abandoned surveys: ${abandonedPlayers}`);
    console.log(`Players who completed surveys: ${completedPlayers}`);
    
    // Date analysis for abandoned surveys
    const abandonedDates = abandonedSurveys.map(d => d.score_created_at?.split(' ')[0]).filter(d => d);
    const uniqueAbandonedDates = new Set(abandonedDates).size;
    
    console.log(`\n📅 ABANDONMENT TIMELINE:`);
    console.log(`Abandoned surveys span: ${uniqueAbandonedDates} days`);
    console.log(`Average daily abandonments: ${Math.round(abandonedSurveys.length / uniqueAbandonedDates)}`);
    
    // Conversion rate analysis
    const totalUniquePlayers = new Set(results.map(d => d.anon_phone)).size;
    const surveyConversionRate = Math.round(completedPlayers / totalUniquePlayers * 100);
    const feedbackConversionRate = Math.round(completedFeedback.length / totalUniquePlayers * 100);
    
    console.log(`\n📈 CONVERSION RATES:`);
    console.log(`Survey completion rate: ${surveyConversionRate}% (${completedPlayers}/${totalUniquePlayers} players)`);
    console.log(`Feedback completion rate: ${feedbackConversionRate}% (${completedFeedback.length}/${totalUniquePlayers} players)`);
    
    // High-score abandonment analysis
    const highScoreAbandoned = abandonedScores.filter(score => score >= 500).length;
    const highScoreCompleted = completedScores.filter(score => score >= 500).length;
    
    console.log(`\n🏆 HIGH-SCORE ANALYSIS (500+ slurps):`);
    console.log(`High-score abandoned: ${highScoreAbandoned} (${Math.round(highScoreAbandoned/(highScoreAbandoned+highScoreCompleted)*100)}%)`);
    console.log(`High-score completed: ${highScoreCompleted} (${Math.round(highScoreCompleted/(highScoreAbandoned+highScoreCompleted)*100)}%)`);
    
    console.log(`\n=== END OF SURVEY ABANDONMENT ANALYSIS ===`);
  }); 