/**
 * Job Matching Service
 * Intelligent matching system that calculates match score between candidates and jobs
 * Uses weighted algorithm based on skills, experience, education, and certifications
 */

/**
 * Normalize skill names for comparison (lowercase, trim)
 */
function normalizeSkill(skill) {
  if (!skill) return '';
  return skill.toLowerCase().trim();
}

/**
 * Extract experience level in years from string
 * Examples: "2-3 years", "3+ years", "5 years", "Fresher"
 */
function parseExperienceYears(expString) {
  if (!expString) return 0;

  const exp = String(expString).toLowerCase();

  if (exp.includes('fresher') || exp.includes('0')) return 0;

  const match = exp.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }

  return 0;
}

/**
 * Calculate years of experience from candidate's work experience
 */
function calculateTotalExperience(experiences = []) {
  if (!experiences || experiences.length === 0) return 0;

  // Simple heuristic: count each experience as ~1-2 years
  return experiences.length;
}

/**
 * Match skills and calculate intersection
 * Returns: { matchingSkills, missingSkills, matchPercentage }
 */
function matchSkills(candidateSkills = [], requiredSkills = []) {
  const normalized = {
    candidate: (candidateSkills || []).map(normalizeSkill).filter(Boolean),
    required: (requiredSkills || []).map(normalizeSkill).filter(Boolean),
  };

  const matchingSkills = normalized.required.filter(reqSkill =>
    normalized.candidate.some(candSkill =>
      candSkill === reqSkill || candSkill.includes(reqSkill) || reqSkill.includes(candSkill)
    )
  );

  const missingSkills = normalized.required.filter(
    reqSkill => !matchingSkills.includes(reqSkill)
  );

  const matchPercentage = normalized.required.length > 0
    ? Math.round((matchingSkills.length / normalized.required.length) * 100)
    : 0;

  return {
    matchingSkills,
    missingSkills,
    matchPercentage,
    totalRequired: normalized.required.length,
    totalMatched: matchingSkills.length,
  };
}

/**
 * Calculate experience match score
 * Returns percentage (0-100) based on candidate vs required experience
 */
function calculateExperienceMatch(candidateExp, requiredExp) {
  const candYears = calculateTotalExperience(candidateExp);
  const reqYears = parseExperienceYears(requiredExp);

  // If candidate has more than required, it's a perfect match
  if (candYears >= reqYears) {
    return 100;
  }

  // Partial match based on what they have
  if (reqYears === 0) return 100;

  return Math.round((candYears / reqYears) * 100);
}

/**
 * Categorize skill gap severity
 */
function calculateGapSeverity(missingSkillsCount, totalRequired) {
  const percentage = totalRequired > 0 ? (missingSkillsCount / totalRequired) * 100 : 0;

  if (percentage === 0) return 'none';
  if (percentage <= 25) return 'easy';
  if (percentage <= 50) return 'medium';
  return 'hard';
}

/**
 * Main matching function
 * @param {Object} candidateData - Candidate's parsed resume data
 * @param {Object} jobData - Job posting data
 * @returns {Object} Match analysis with score and details
 */
export function calculateJobMatch(candidateData, jobData) {
  if (!candidateData || !jobData) {
    throw new Error('Candidate and job data are required');
  }

  // Extract data from candidate
  const candidateSkills = candidateData.skills || [];
  const candidateExperience = candidateData.experience || [];
  const candidateEducation = candidateData.education || [];

  // Extract data from job
  const requiredSkills = jobData.techStack || jobData.jobCriteria || [];
  const requiredExp = jobData.experience || '0 years';
  const requiredEducation = jobData.education || [];

  // ─── SKILL MATCHING (40% weight) ───────────────────────────────────────────
  const skillMatch = matchSkills(candidateSkills, requiredSkills);

  // ─── EXPERIENCE MATCHING (30% weight) ──────────────────────────────────────
  const experienceScore = calculateExperienceMatch(candidateExperience, requiredExp);

  // ─── EDUCATION MATCHING (20% weight) ──────────────────────────────────────
  // Check if candidate has any of the required education levels
  let educationScore = 0;
  if (requiredEducation.length > 0 && candidateEducation.length > 0) {
    const normalizedRequired = requiredEducation.map(e => e.toLowerCase());
    const normalizedCandidate = candidateEducation.map(e =>
      (e.degree || e).toLowerCase()
    );

    const matchedEducation = normalizedCandidate.some(candEd =>
      normalizedRequired.some(reqEd =>
        candEd.includes(reqEd) || reqEd.includes(candEd)
      )
    );

    educationScore = matchedEducation ? 100 : 50;
  } else if (candidateEducation.length > 0) {
    educationScore = 80; // Candidate has education but no specific requirement
  } else {
    educationScore = 50; // No education info
  }

  // ─── ADDITIONAL SKILLS BONUS (10% weight) ─────────────────────────────────
  // Bonus for having additional relevant skills beyond requirements
  const additionalSkills = candidateSkills.filter(
    candSkill => !requiredSkills.some(
      reqSkill => normalizeSkill(candSkill).includes(normalizeSkill(reqSkill))
    )
  );

  // Check if additional skills are tech-related (heuristic)
  const relevantAdditional = additionalSkills.filter(skill => {
    const techKeywords = ['java', 'python', 'js', 'react', 'node', 'sql', 'api', 'rest', 'cloud', 'aws', 'docker', 'git', 'agile', 'scrum', 'ci', 'cd'];
    return techKeywords.some(keyword => skill.toLowerCase().includes(keyword));
  });

  const additionalBonus = Math.min(relevantAdditional.length * 5, 10); // Max 10% bonus

  // ─── FINAL CALCULATION ─────────────────────────────────────────────────────
  const finalScore = Math.round(
    (skillMatch.matchPercentage * 0.40) +
    (experienceScore * 0.30) +
    (educationScore * 0.20) +
    additionalBonus
  );

  // ─── GAP SEVERITY ───────────────────────────────────────────────────────────
  const gapSeverity = calculateGapSeverity(
    skillMatch.missingSkills.length,
    skillMatch.totalRequired
  );

  // ─── GENERATE EXPLANATION ───────────────────────────────────────────────────
  const explanation = generateExplanation(
    skillMatch,
    experienceScore,
    educationScore,
    requiredExp,
    candidateExperience
  );

  return {
    matchScore: Math.max(0, Math.min(100, finalScore)), // Ensure 0-100
    skillMatch: {
      matchingSkills: skillMatch.matchingSkills,
      missingSkills: skillMatch.missingSkills,
      matchPercentage: skillMatch.matchPercentage,
      totalRequired: skillMatch.totalRequired,
      totalMatched: skillMatch.totalMatched,
    },
    experienceMatch: {
      score: experienceScore,
      candidateExp: calculateTotalExperience(candidateExperience),
      requiredExp: parseExperienceYears(requiredExp),
    },
    educationMatch: {
      score: educationScore,
      candidate: candidateEducation.map(e => e.degree || e),
      required: requiredEducation,
    },
    additionalBonus,
    gapSeverity,
    explanation,
    scoreBreakdown: {
      skills: skillMatch.matchPercentage * 0.40,
      experience: experienceScore * 0.30,
      education: educationScore * 0.20,
      additional: additionalBonus,
    },
  };
}

/**
 * Generate human-readable explanation of match
 */
function generateExplanation(skillMatch, expScore, eduScore, reqExp, candidateExp) {
  const parts = [];

  // Skill summary
  if (skillMatch.totalRequired > 0) {
    parts.push(
      `You have ${skillMatch.totalMatched}/${skillMatch.totalRequired} required skills.`
    );
  }

  // Experience summary
  const candExp = calculateTotalExperience(candidateExp);
  const reqYears = parseExperienceYears(reqExp);
  if (reqYears > 0) {
    if (candExp >= reqYears) {
      parts.push(`Your experience (${candExp} years) meets the requirement (${reqYears} years).`);
    } else {
      parts.push(`You have ${candExp} years of experience, but ${reqYears} years is required.`);
    }
  }

  // Missing skills
  if (skillMatch.missingSkills.length > 0) {
    const missingList = skillMatch.missingSkills.slice(0, 3).join(', ');
    const extra = skillMatch.missingSkills.length > 3
      ? ` and ${skillMatch.missingSkills.length - 3} more`
      : '';
    parts.push(`Missing skills: ${missingList}${extra}.`);
  }

  return parts.join(' ');
}

/**
 * Generate learning recommendations for missing skills
 */
export function generateLearningRecommendations(missingSkills, severity) {
  const recommendations = [];

  const skillResources = {
    // Programming languages
    'python': ['Python.org tutorials', 'Codecademy Python course', 'DataCamp Python'],
    'java': ['Oracle Java tutorials', 'Udemy Java courses', 'HackerRank'],
    'javascript': ['MDN Web Docs', 'freeCodeCamp', 'JavaScript.info'],
    'typescript': ['TypeScript Handbook', 'Udemy TypeScript course', 'Scrimba'],
    'golang': ['Go official docs', 'Tour of Go', 'Golang tutorial'],
    'rust': ['Rust Programming Language Book', 'Rustlings', 'Exercism'],

    // Frontend
    'react': ['React official docs', 'Scrimba React course', 'Udemy React'],
    'vue': ['Vue official docs', 'Vue school', 'Udemy Vue'],
    'angular': ['Angular official docs', 'Angular University', 'Udemy Angular'],

    // Backend
    'nodejs': ['Node.js official docs', 'The Node Beginner Book', 'Udemy Node'],
    'django': ['Django official docs', 'Real Python Django', 'Udemy Django'],
    'flask': ['Flask official docs', 'Miguel Grinberg tutorial', 'Udemy Flask'],

    // Databases
    'sql': ['Mode Analytics SQL', 'LeetCode SQL', 'Codecademy SQL'],
    'mongodb': ['MongoDB university', 'MongoDB docs', 'FreeCodeCamp MongoDB'],
    'postgres': ['PostgreSQL docs', 'PgExercises', 'Udemy PostgreSQL'],

    // DevOps
    'docker': ['Docker docs', 'Udemy Docker', 'Linux Academy'],
    'kubernetes': ['Kubernetes docs', 'Udemy Kubernetes', 'Linux Academy'],
    'aws': ['AWS training', 'A Cloud Guru', 'Linux Academy AWS'],
    'ci/cd': ['GitHub Actions docs', 'Jenkins docs', 'CircleCI docs'],
    'git': ['Git official book', 'GitHub Learning Lab', 'Atlassian tutorials'],

    // Other
    'rest api': ['REST API best practices', 'Udemy REST API', 'PluralSight'],
    'graphql': ['GraphQL official docs', 'HowToGraphQL', 'Udemy GraphQL'],
  };

  const timeEstimates = {
    easy: '1-2 weeks',
    medium: '2-4 weeks',
    hard: '4-8 weeks',
  };

  missingSkills.forEach(skill => {
    const resources = skillResources[normalizeSkill(skill)] || [
      `${skill} official documentation`,
      `Udemy ${skill} course`,
      'YouTube tutorials',
    ];

    recommendations.push({
      skill,
      resources: resources.slice(0, 3),
      estimatedTime: timeEstimates[severity] || '2-4 weeks',
      priority: 'high',
    });
  });

  return {
    recommendations,
    overallTimeEstimate: timeEstimates[severity],
    difficulty: severity,
    totalSkillsToLearn: missingSkills.length,
  };
}
