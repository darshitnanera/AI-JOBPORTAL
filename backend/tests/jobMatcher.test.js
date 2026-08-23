/**
 * Job Matcher Service - Test Suite
 * Examples demonstrating the matching algorithm
 */

import { calculateJobMatch, generateLearningRecommendations } from '../services/jobMatcher.service.js';

// ─── TEST DATA ──────────────────────────────────────────────────────────────

const testCandidates = {
  juniorDeveloper: {
    skills: ['JavaScript', 'React', 'CSS', 'HTML', 'Git'],
    experience: [
      { company: 'Startup A', role: 'Frontend Developer', duration: '1 year' },
    ],
    education: [
      { school: 'University A', degree: 'Bachelor', field: 'Computer Science', year: '2023' },
    ],
  },

  midLevelDeveloper: {
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'PostgreSQL', 'Docker', 'Git', 'Python'],
    experience: [
      { company: 'Company A', role: 'Frontend Developer', duration: '2 years' },
      { company: 'Company B', role: 'Full Stack Developer', duration: '2 years' },
    ],
    education: [
      { school: 'University B', degree: 'Bachelor', field: 'Computer Science', year: '2020' },
    ],
  },

  seniorDeveloper: {
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'AWS', 'Kubernetes', 'Docker', 'CI/CD', 'MongoDB', 'PostgreSQL', 'GraphQL', 'REST API'],
    experience: [
      { company: 'Company A', role: 'Developer', duration: '2 years' },
      { company: 'Company B', role: 'Senior Developer', duration: '3 years' },
      { company: 'Company C', role: 'Tech Lead', duration: '2 years' },
    ],
    education: [
      { school: 'University C', degree: 'Bachelor', field: 'Computer Science', year: '2017' },
      { school: 'University D', degree: 'Master', field: 'Software Engineering', year: '2019' },
    ],
  },
};

const testJobs = {
  juniorFrontend: {
    roleName: 'Junior Frontend Developer',
    techStack: ['JavaScript', 'React', 'CSS', 'HTML'],
    experience: 'Fresher to 1 year',
    jobCriteria: ['JavaScript', 'React', 'CSS', 'HTML'],
    education: ['High School', 'Bachelor'],
    overview: 'Looking for a junior frontend developer to join our team.',
  },

  midLevelFullStack: {
    roleName: 'Full Stack Developer',
    techStack: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Docker'],
    experience: '2-4 years',
    jobCriteria: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Docker'],
    education: ['Bachelor'],
    overview: 'We are looking for a full stack developer with experience in MERN stack.',
  },

  seniorDevOps: {
    roleName: 'Senior DevOps Engineer',
    techStack: ['Kubernetes', 'Docker', 'AWS', 'CI/CD', 'Python'],
    experience: '5+ years',
    jobCriteria: ['Kubernetes', 'Docker', 'AWS', 'CI/CD', 'Python'],
    education: ['Bachelor'],
    overview: 'Senior DevOps Engineer role with leadership responsibilities.',
  },
};

// ─── TEST CASES ──────────────────────────────────────────────────────────────

export function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          JOB MATCHER SERVICE - TEST SUITE                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Test 1: Junior Developer vs Junior Frontend Job
  console.log('────────────────────────────────────────────────────────────────');
  console.log('TEST 1: Junior Developer vs Junior Frontend Developer Job');
  console.log('────────────────────────────────────────────────────────────────');
  testMatch(testCandidates.juniorDeveloper, testJobs.juniorFrontend);

  // Test 2: Junior Developer vs Mid-Level Full Stack Job
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('TEST 2: Junior Developer vs Mid-Level Full Stack Developer Job');
  console.log('────────────────────────────────────────────────────────────────');
  testMatch(testCandidates.juniorDeveloper, testJobs.midLevelFullStack);

  // Test 3: Mid-Level Developer vs Mid-Level Full Stack Job
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('TEST 3: Mid-Level Developer vs Mid-Level Full Stack Developer Job');
  console.log('────────────────────────────────────────────────────────────────');
  testMatch(testCandidates.midLevelDeveloper, testJobs.midLevelFullStack);

  // Test 4: Senior Developer vs Senior DevOps Job
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('TEST 4: Senior Developer vs Senior DevOps Engineer Job');
  console.log('────────────────────────────────────────────────────────────────');
  testMatch(testCandidates.seniorDeveloper, testJobs.seniorDevOps);

  // Test 5: Senior Developer vs Junior Frontend Job
  console.log('\n────────────────────────────────────────────────────────────────');
  console.log('TEST 5: Senior Developer vs Junior Frontend Developer Job');
  console.log('────────────────────────────────────────────────────────────────');
  testMatch(testCandidates.seniorDeveloper, testJobs.juniorFrontend);
}

function testMatch(candidateData, jobData) {
  try {
    const match = calculateJobMatch(candidateData, jobData);

    // Display candidate info
    console.log('\nCandidate Profile:');
    console.log(`  Skills: ${candidateData.skills.join(', ')}`);
    console.log(`  Experience: ${candidateData.experience.length} positions`);
    console.log(`  Education: ${candidateData.education.map(e => e.degree).join(', ')}`);

    // Display job info
    console.log('\nJob Requirements:');
    console.log(`  Role: ${jobData.roleName}`);
    console.log(`  Tech Stack: ${jobData.techStack.join(', ')}`);
    console.log(`  Experience Required: ${jobData.experience}`);

    // Display match results
    console.log('\n✓ MATCH RESULTS:');
    console.log(`  Overall Score: ${match.matchScore}%`);
    console.log(`  Skill Match: ${match.skillMatch.matchPercentage}% (${match.skillMatch.totalMatched}/${match.skillMatch.totalRequired})`);
    console.log(`  Experience Match: ${match.experienceMatch.score}%`);
    console.log(`  Education Match: ${match.educationMatch.score}%`);
    console.log(`  Gap Severity: ${match.gapSeverity}`);

    // Display matching skills
    if (match.skillMatch.matchingSkills.length > 0) {
      console.log('\n✓ Matching Skills:');
      match.skillMatch.matchingSkills.forEach(skill => {
        console.log(`    ✓ ${skill}`);
      });
    }

    // Display missing skills
    if (match.skillMatch.missingSkills.length > 0) {
      console.log('\n⚠ Missing Skills:');
      match.skillMatch.missingSkills.forEach(skill => {
        console.log(`    ✗ ${skill}`);
      });
    }

    // Display explanation
    console.log('\nExplanation:');
    console.log(`  ${match.explanation}`);

    // Display score breakdown
    console.log('\nScore Breakdown:');
    console.log(`  Skills (40%):     ${match.scoreBreakdown.skills.toFixed(1)}`);
    console.log(`  Experience (30%): ${match.scoreBreakdown.experience.toFixed(1)}`);
    console.log(`  Education (20%):  ${match.scoreBreakdown.education.toFixed(1)}`);
    console.log(`  Additional (10%): ${match.scoreBreakdown.additional.toFixed(1)}`);
    console.log(`  Total:            ${match.matchScore.toFixed(1)}`);

    // Display learning recommendations for missing skills
    if (match.skillMatch.missingSkills.length > 0) {
      const recommendations = generateLearningRecommendations(
        match.skillMatch.missingSkills,
        match.gapSeverity
      );
      console.log('\n📚 Learning Path:');
      console.log(`  Overall Time Estimate: ${recommendations.overallTimeEstimate}`);
      console.log(`  Total Skills to Learn: ${recommendations.totalSkillsToLearn}`);
      if (recommendations.recommendations.length > 0) {
        console.log('\n  Top Recommendations:');
        recommendations.recommendations.slice(0, 3).forEach((rec, idx) => {
          console.log(`    ${idx + 1}. ${rec.skill} (${rec.estimatedTime})`);
          console.log(`       Resources: ${rec.resources.join(', ')}`);
        });
      }
    }

    return match;
  } catch (error) {
    console.error('Error running test:', error);
    return null;
  }
}

// ─── VERDICT CHECKER ────────────────────────────────────────────────────────

export function getMatchVerdict(score) {
  if (score >= 80) return '⭐⭐⭐⭐⭐ Excellent - Highly Recommended';
  if (score >= 60) return '⭐⭐⭐⭐ Good - Well Matched';
  if (score >= 40) return '⭐⭐⭐ Fair - Could Apply';
  if (score >= 20) return '⭐⭐ Poor - Significant Gap';
  return '⭐ Very Poor - Not Recommended';
}

// ─── PERFORMANCE METRICS ────────────────────────────────────────────────────

export function analyzePerformance(matches) {
  const scores = matches.map(m => m.matchScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const excellent = scores.filter(s => s >= 80).length;
  const good = scores.filter(s => s >= 60 && s < 80).length;
  const fair = scores.filter(s => s >= 40 && s < 60).length;
  const poor = scores.filter(s => s < 40).length;

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              PERFORMANCE METRICS                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Total Matches Tested: ${matches.length}`);
  console.log(`Average Score: ${avg.toFixed(1)}%`);
  console.log(`Highest Score: ${max}%`);
  console.log(`Lowest Score: ${min}%`);
  console.log('\nDistribution:');
  console.log(`  Excellent (80-100): ${excellent} matches`);
  console.log(`  Good (60-79):       ${good} matches`);
  console.log(`  Fair (40-59):       ${fair} matches`);
  console.log(`  Poor (0-39):        ${poor} matches`);
}

// ─── EXPORT FOR TESTING ─────────────────────────────────────────────────────

export {
  testCandidates,
  testJobs,
  testMatch,
  getMatchVerdict,
};

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
