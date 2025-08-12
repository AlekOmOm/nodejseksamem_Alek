/**
 * UI State for Job Logs - Svelte 5 runes pattern
 * 
 * Provides reactive access to job logs following the same pattern as ui.state.svelte.js
 */
import { getLogStore } from './stores.state.svelte.js';

// ═══════════════════════════════════════════════════════════
// PRIVATE REACTIVE STATE
// ═══════════════════════════════════════════════════════════

let _currentJobLogs = $state([]);
let _currentJobId = $state(null);
let _logsLoading = $state(false);
let _logsError = $state(null);

// ═══════════════════════════════════════════════════════════  
// PUBLIC READ-ONLY ACCESSORS
// ═══════════════════════════════════════════════════════════

export function getCurrentJobLogs() {
  return _currentJobLogs;
}

export function getCurrentJobId() {
  return _currentJobId;
}

export function getLogsLoading() {
  return _logsLoading;
}

export function getLogsError() {
  return _logsError;
}

// ═══════════════════════════════════════════════════════════
// PUBLIC ACTIONS  
// ═══════════════════════════════════════════════════════════

export async function loadJobLogs(jobId) {
  if (!jobId) {
    _clearJobLogs();
    return;
  }

  // Don't reload if same job
  if (_currentJobId === jobId && _currentJobLogs.length > 0) {
    return _currentJobLogs;
  }

  _currentJobId = jobId;
  _logsLoading = true;
  _logsError = null;

  try {
    const logStore = getLogStore();
    const logs = await logStore.loadJobLogs(jobId, "ui.logs.state");
    
    _currentJobLogs = logs || [];
    _logsLoading = false;
    
    return logs;
  } catch (error) {
    console.error(`Failed to load logs for job ${jobId}:`, error);
    _logsError = error.message;
    _logsLoading = false;
    _currentJobLogs = [];
    return [];
  }
}

export function clearJobLogs() {
  _clearJobLogs();
}

// ═══════════════════════════════════════════════════════════
// PRIVATE HELPERS
// ═══════════════════════════════════════════════════════════

function _clearJobLogs() {
  _currentJobLogs = [];
  _currentJobId = null;
  _logsLoading = false;
  _logsError = null;
}