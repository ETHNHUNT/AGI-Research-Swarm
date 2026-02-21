const fs = require('fs');
const path = require('path');

// Load configuration
const configPath = path.join(__dirname, 'data', 'missions.json');
const missionConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { databases: DBS, commonAngles, divisions, qcConfig, missionMeta } = missionConfig;

let taskCount = 0;

function t(divId, divName, qId, qName, desc, terms = [], depth = 'standard', topic = '') {
  taskCount++;
  return {
    id: `tnbc-${divId}-${qId}-${String(taskCount).padStart(5, '0')}`,
    missionId: missionMeta.id,
    divisionId: divId,
    divisionName: divName,
    queueId: qId,
    queueName: qName,
    description: desc,
    searchTerms: terms.length ? terms : desc.split(' ').slice(0, 5),
    databases: DBS.slice(0, 10),
    depth,
    topic
  };
}

function expand(divId, divName, section) {
  const { queueId, queueName, topics, angles, depth = 'standard' } = section;
  const tasks = [];

  let angleList = [];
  if (angles.ref) {
    angleList = commonAngles[angles.ref];
  } else if (angles.list) {
    angleList = angles.list;
  }

  topics.forEach(topic => {
    angleList.forEach(angle => {
      tasks.push(t(divId, divName, queueId, queueName, `${topic}: ${angle}`, [topic, ...angle.split(' ').slice(0, 3)], depth, topic));
    });
  });
  return tasks;
}

function generateQCTasks(totalNonQC) {
  const tasks = [];

  // Verification
  const verConfig = qcConfig.verification;
  const vb = Math.min(Math.ceil(totalNonQC * verConfig.percentage), verConfig.max);
  for (let i = 0; i < vb; i++) {
    const desc = verConfig.descriptionTemplate.replace('${i}', i + 1);
    tasks.push(t('qc', 'Quality Control', 'verification', 'Citation Verification', desc, verConfig.searchTerms));
  }

  // Contradictions
  const conConfig = qcConfig.contradictions;
  const cb = Math.min(Math.ceil(totalNonQC * conConfig.percentage), conConfig.max);
  for (let i = 0; i < cb; i++) {
    const desc = conConfig.descriptionTemplate.replace('${i}', i + 1);
    tasks.push(t('qc', 'Quality Control', 'contradictions', 'Contradiction Resolution', desc, conConfig.searchTerms, conConfig.depth));
  }

  // Synthesis
  const synConfig = qcConfig.synthesis;
  const sb = Math.min(Math.ceil(totalNonQC * synConfig.percentage), synConfig.max);
  for (let i = 0; i < sb; i++) {
    const desc = synConfig.descriptionTemplate.replace('${i}', i + 1);
    tasks.push(t('qc', 'Quality Control', 'synthesis', 'Cross-Division Synthesis', desc, synConfig.searchTerms, synConfig.depth));
  }

  return tasks;
}

function getAllMissions() {
  taskCount = 0;
  const allTasks = [];

  divisions.forEach(div => {
    div.sections.forEach(section => {
      allTasks.push(...expand(div.id, div.name, section));
    });
  });

  const nonQC = allTasks.length;
  allTasks.push(...generateQCTasks(nonQC));

  console.log(`   ${missionMeta.name} Mission: ${allTasks.length} tasks across ${divisions.length + 1} divisions`);

  return [{
    ...missionMeta,
    totalTasks: allTasks.length,
    tasks: allTasks,
  }];
}

module.exports = { getAllMissions };
