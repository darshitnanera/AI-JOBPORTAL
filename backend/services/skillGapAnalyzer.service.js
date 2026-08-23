/**
 * Skill Gap Analysis Service
 * Provides detailed skill gap analysis and learning recommendations
 */

import { generateLearningRecommendations } from './jobMatcher.service.js';

/**
 * Analyze skill gaps between candidate and job requirements
 * @param {Object} matchResult - Result from calculateJobMatch
 * @param {Object} jobData - Job posting data
 * @returns {Object} Detailed skill gap analysis
 */
export function analyzeSkillGaps(matchResult, jobData) {
  if (!matchResult || !matchResult.skillMatch) {
    throw new Error('Invalid match result');
  }

  const {
    skillMatch,
    gapSeverity,
  } = matchResult;

  const {
    matchingSkills,
    missingSkills,
    matchPercentage,
  } = skillMatch;

  // Categorize skills by difficulty to learn
  const skillDifficulty = categorizeSkillDifficulty(missingSkills);

  // Group missing skills by category
  const groupedMissingSkills = groupSkillsByCategory(missingSkills);

  // Learning recommendations
  const recommendations = generateLearningRecommendations(missingSkills, gapSeverity);

  // Timeline for skill acquisition
  const learningTimeline = createLearningTimeline(missingSkills, gapSeverity);

  return {
    totalMatchPercentage: matchPercentage,
    totalSkills: {
      required: skillMatch.totalRequired,
      matched: skillMatch.totalMatched,
      missing: missingSkills.length,
    },
    matchingSkills: matchingSkills.map(skill => ({
      name: skill,
      status: 'matched',
      icon: '✓',
    })),
    missingSkills: missingSkills.map(skill => ({
      name: skill,
      status: 'missing',
      difficulty: skillDifficulty[skill] || 'medium',
      icon: '⚠',
    })),
    groupedMissingSkills,
    skillDifficulty,
    gapSeverity,
    recommendations,
    learningTimeline,
    actionItems: generateActionItems(missingSkills, gapSeverity),
  };
}

/**
 * Categorize skills by difficulty level
 */
function categorizeSkillDifficulty(skills) {
  const easySkills = ['javascript', 'html', 'css', 'sql', 'python', 'git', 'rest api'];
  const mediumSkills = ['react', 'nodejs', 'java', 'vue', 'angular', 'mongodb', 'postgres', 'graphql'];
  const hardSkills = ['kubernetes', 'aws', 'gcp', 'azure', 'machine learning', 'system design', 'rust', 'scala'];

  const difficulty = {};

  skills.forEach(skill => {
    const normalized = skill.toLowerCase();
    if (easySkills.some(s => normalized.includes(s))) {
      difficulty[skill] = 'easy';
    } else if (mediumSkills.some(s => normalized.includes(s))) {
      difficulty[skill] = 'medium';
    } else if (hardSkills.some(s => normalized.includes(s))) {
      difficulty[skill] = 'hard';
    } else {
      difficulty[skill] = 'medium'; // Default
    }
  });

  return difficulty;
}

/**
 * Group missing skills by category
 */
function groupSkillsByCategory(skills) {
  const categories = {
    'Frontend': ['react', 'vue', 'angular', 'svelte', 'javascript', 'typescript', 'html', 'css', 'webpack', 'babel', 'tailwind'],
    'Backend': ['nodejs', 'java', 'python', 'django', 'flask', 'spring', 'golang', 'rust', 'scala', '.net', 'express'],
    'Database': ['sql', 'mongodb', 'postgres', 'mysql', 'redis', 'cassandra', 'elasticsearch', 'firestore'],
    'DevOps': ['docker', 'kubernetes', 'aws', 'gcp', 'azure', 'ci/cd', 'jenkins', 'gitlab', 'terraform', 'ansible'],
    'Tools & Platforms': ['git', 'github', 'gitlab', 'jira', 'slack', 'figma', 'postman', 'vscode'],
    'Soft Skills': ['communication', 'leadership', 'project management', 'agile', 'scrum', 'collaboration'],
    'Other': [],
  };

  const grouped = {};
  Object.keys(categories).forEach(cat => {
    grouped[cat] = [];
  });

  skills.forEach(skill => {
    const normalized = skill.toLowerCase();
    let found = false;

    for (const [category, keywords] of Object.entries(categories)) {
      if (category === 'Other') continue;
      if (keywords.some(keyword => normalized.includes(keyword))) {
        grouped[category].push(skill);
        found = true;
        break;
      }
    }

    if (!found) {
      grouped['Other'].push(skill);
    }
  });

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(grouped).filter(([_, skills]) => skills.length > 0)
  );
}

/**
 * Create a learning timeline
 */
function createLearningTimeline(missingSkills, severity) {
  const timelineMap = {
    easy: {
      phase1: { weeks: 1, skills: Math.ceil(missingSkills.length * 0.5) },
      phase2: { weeks: 1, skills: missingSkills.length - Math.ceil(missingSkills.length * 0.5) },
    },
    medium: {
      phase1: { weeks: 2, skills: Math.ceil(missingSkills.length * 0.4) },
      phase2: { weeks: 2, skills: Math.ceil(missingSkills.length * 0.4) },
      phase3: { weeks: 1, skills: missingSkills.length - Math.ceil(missingSkills.length * 0.8) },
    },
    hard: {
      phase1: { weeks: 4, skills: Math.ceil(missingSkills.length * 0.3) },
      phase2: { weeks: 3, skills: Math.ceil(missingSkills.length * 0.4) },
      phase3: { weeks: 2, skills: missingSkills.length - Math.ceil(missingSkills.length * 0.7) },
    },
  };

  const timeline = timelineMap[severity] || timelineMap.medium;
  const phases = [];

  Object.entries(timeline).forEach(([phase, data], index) => {
    phases.push({
      phase: phase.replace('phase', 'Phase '),
      duration: `${data.weeks} weeks`,
      skillCount: data.skills,
      focus: getFocusAreas(missingSkills, index, Object.keys(timeline).length),
    });
  });

  return {
    phases,
    totalDuration: Object.values(timeline).reduce((sum, p) => sum + p.weeks, 0),
    estimatedCompletion: calculateCompletionDate(
      Object.values(timeline).reduce((sum, p) => sum + p.weeks, 0)
    ),
  };
}

/**
 * Get focus areas for each phase
 */
function getFocusAreas(skills, phaseIndex, totalPhases) {
  const prioritized = prioritizeSkills(skills);
  const skillsPerPhase = Math.ceil(prioritized.length / totalPhases);
  const start = phaseIndex * skillsPerPhase;
  const end = Math.min(start + skillsPerPhase, prioritized.length);

  return prioritized.slice(start, end);
}

/**
 * Prioritize skills by importance
 */
function prioritizeSkills(skills) {
  const priorities = {
    'javascript': 10,
    'python': 10,
    'react': 9,
    'nodejs': 9,
    'java': 8,
    'sql': 8,
    'git': 8,
    'docker': 7,
    'aws': 7,
    'kubernetes': 6,
    'typescript': 8,
  };

  return [...skills].sort((a, b) => {
    const priorityA = priorities[a.toLowerCase()] || 5;
    const priorityB = priorities[b.toLowerCase()] || 5;
    return priorityB - priorityA;
  });
}

/**
 * Calculate estimated completion date
 */
function calculateCompletionDate(weeks) {
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().split('T')[0];
}

/**
 * Generate action items for closing skill gaps
 */
function generateActionItems(missingSkills, severity) {
  const actions = [];

  // Priority 1: Essential skills
  const essentialSkills = missingSkills.slice(0, Math.ceil(missingSkills.length * 0.3));
  if (essentialSkills.length > 0) {
    actions.push({
      priority: 'High',
      action: `Learn essential skills: ${essentialSkills.join(', ')}`,
      timeline: getTimelineForSeverity(severity, 'high'),
      resources: 'Online courses, official docs',
    });
  }

  // Priority 2: Secondary skills
  const secondarySkills = missingSkills.slice(
    Math.ceil(missingSkills.length * 0.3),
    Math.ceil(missingSkills.length * 0.7)
  );
  if (secondarySkills.length > 0) {
    actions.push({
      priority: 'Medium',
      action: `Practice secondary skills: ${secondarySkills.join(', ')}`,
      timeline: getTimelineForSeverity(severity, 'medium'),
      resources: 'Projects, practice problems',
    });
  }

  // Priority 3: Advanced skills
  const advancedSkills = missingSkills.slice(Math.ceil(missingSkills.length * 0.7));
  if (advancedSkills.length > 0) {
    actions.push({
      priority: 'Low',
      action: `Explore advanced skills: ${advancedSkills.join(', ')}`,
      timeline: getTimelineForSeverity(severity, 'low'),
      resources: 'Advanced courses, blogs',
    });
  }

  // Add general action items
  actions.push({
    priority: 'High',
    action: 'Build projects using the required tech stack',
    timeline: 'Ongoing',
    resources: 'GitHub, personal portfolio',
  });

  actions.push({
    priority: 'Medium',
    action: 'Join communities and contribute to open source',
    timeline: 'Ongoing',
    resources: 'GitHub, Stack Overflow',
  });

  return actions;
}

/**
 * Get timeline based on severity
 */
function getTimelineForSeverity(severity, priority) {
  const timelines = {
    easy: { high: '1 week', medium: '1 week', low: 'Ongoing' },
    medium: { high: '2 weeks', medium: '2 weeks', low: '1 week' },
    hard: { high: '4 weeks', medium: '3 weeks', low: '2 weeks' },
  };

  return (timelines[severity] || timelines.medium)[priority] || 'Ongoing';
}

/**
 * Create a detailed learning path
 */
export function createLearningPath(missingSkills, jobDescription) {
  const prioritized = prioritizeSkills(missingSkills);

  const path = prioritized.map((skill, index) => {
    const stepNumber = index + 1;
    const duration = getSkillLearningDuration(skill);

    return {
      step: stepNumber,
      skill,
      duration,
      activities: [
        `Study official ${skill} documentation (${duration / 3} days)`,
        `Complete online course or tutorial (${duration / 3} days)`,
        `Build a project using ${skill} (${duration / 3} days)`,
      ],
      projectIdea: generateProjectIdea(skill, jobDescription),
      resources: getSkillResources(skill),
    };
  });

  return {
    title: 'Personalized Learning Path',
    description: 'Step-by-step guide to master the missing skills',
    skills: prioritized,
    steps: path,
    estimatedTotalDuration: prioritized.reduce((sum, skill) => sum + getSkillLearningDuration(skill), 0),
    successCriteria: [
      'Complete all recommended courses',
      'Build at least 2 projects using each skill',
      'Contribute to open source projects',
      'Practice on LeetCode or similar platforms',
    ],
  };
}

/**
 * Get learning duration for a skill in days
 */
function getSkillLearningDuration(skill) {
  const durations = {
    'javascript': 10,
    'python': 10,
    'java': 14,
    'react': 14,
    'nodejs': 14,
    'typescript': 7,
    'sql': 7,
    'git': 3,
    'docker': 7,
    'aws': 14,
    'kubernetes': 21,
    'graphql': 7,
  };

  return durations[skill.toLowerCase()] || 10;
}

/**
 * Generate project idea for learning
 */
function generateProjectIdea(skill, jobDescription) {
  const projectIdeas = {
    'react': 'Build a job search dashboard component',
    'nodejs': 'Create a REST API for job recommendations',
    'python': 'Develop a data analysis tool for job trends',
    'docker': 'Containerize a full-stack job portal application',
    'aws': 'Deploy a job matching system on AWS',
    'sql': 'Design and optimize a job database schema',
    'graphql': 'Build a GraphQL API for job queries',
    'kubernetes': 'Deploy a microservices-based job platform',
    'javascript': 'Create an interactive job filter interface',
    'typescript': 'Build a type-safe job matching service',
  };

  return projectIdeas[skill.toLowerCase()] || `Build a project using ${skill}`;
}

/**
 * Get resources for learning a skill
 */
function getSkillResources(skill) {
  const resourceMap = {
    'javascript': [
      'MDN Web Docs',
      'JavaScript.info',
      'freeCodeCamp JavaScript Course',
    ],
    'python': [
      'Python.org Official Docs',
      'Real Python',
      'Codecademy Python Course',
    ],
    'react': [
      'React Official Docs',
      'Scrimba React Course',
      'freeCodeCamp React Projects',
    ],
    'nodejs': [
      'Node.js Official Docs',
      'Express.js Guide',
      'Udemy Node.js Course',
    ],
    'java': [
      'Oracle Java Documentation',
      'Java Design Patterns',
      'LeetCode Java Problems',
    ],
    'sql': [
      'Mode Analytics SQL Tutorial',
      'SQLZoo',
      'LeetCode SQL',
    ],
    'git': [
      'Pro Git Book',
      'GitHub Learning Lab',
      'Atlassian Git Tutorials',
    ],
    'docker': [
      'Docker Official Docs',
      'Docker Curriculum',
      'Play with Docker',
    ],
    'aws': [
      'AWS Training and Certification',
      'A Cloud Guru',
      'AWS Documentation',
    ],
    'kubernetes': [
      'Kubernetes Official Docs',
      'Kubernetes in Action',
      'Linux Academy Kubernetes',
    ],
  };

  return resourceMap[skill.toLowerCase()] || [
    `${skill} Official Documentation`,
    `${skill} Online Courses`,
    'YouTube Tutorials',
  ];
}
