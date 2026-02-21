function formatResearchAssignment(agentId, task) {
  return {
    type: 'research',
    taskId: task.id,
    division: task.division_name,
    queue: task.queue_name,
    description: task.description,
    searchTerms: task.search_terms,
    databases: task.databases,
    depth: task.depth,
    submitTo: `/api/v1/agents/${agentId}/findings`,
  };
}

function formatQCAssignment(agentId, finding) {
  return {
    type: 'qc_review',
    findingId: finding.id,
    findingTitle: finding.title,
    findingSummary: finding.summary,
    findingCitations: finding.citations,
    findingConfidence: finding.confidence,
    findingContradictions: finding.contradictions,
    findingGaps: finding.gaps,
    findingDivision: finding.division_id,
    findingQueue: finding.queue_id,
    originalAgentId: finding.agent_id,
    agentQuality: finding.agent_quality,
    agentFlagged: finding.agent_flagged,
    previousQCStatus: finding.qc_status,
    qcCycle: (finding.qc_cycle || 0),
    originalTaskDescription: finding.task_description || '',
    originalSearchTerms: finding.task_search_terms || [],
    submitTo: `/api/v1/agents/${agentId}/qc-submit`,
    instructions: [
      'Re-search the cited sources to verify they exist and support the claims made',
      'Check: Do the cited papers actually exist? Are DOIs/URLs valid?',
      'Check: Does the finding summary accurately reflect what the papers say?',
      'Check: Is the confidence rating appropriate for the evidence quality?',
      'Check: Are there obvious contradictions or gaps the agent missed?',
      'Submit verdict: passed (accurate), flagged (concerns), or rejected (unreliable)',
    ],
  };
}

module.exports = {
  formatResearchAssignment,
  formatQCAssignment,
};
