// Core heartbeat processing logic.

const fs = require('fs');
const path = require('path');

/**
 * Parse an ISO timestamp into a Date.
 * Returns null if the value is missing or invalid.
 */
function parseTimestamp(value) {
  if (typeof value !== 'string') return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Load events from a JSON file.
 * - Expects a JSON array
 * - Each item should have: { service: string, timestamp: string }
 * - Malformed records are skipped quietly.
 *
 * Returns an array of:
 *   { service: string, timestamp: Date }
 */
function loadEventsFromFile(filePath) {
  const fullPath = path.resolve(filePath);
  const raw = fs.readFileSync(fullPath, 'utf8');

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error('events file is not valid JSON');
  }

  if (!Array.isArray(data)) {
    throw new Error('events file must contain a JSON array');
  }

  const cleaned = [];

  for (const item of data) {
    if (!item || typeof item !== 'object') continue;

    const service = item.service;
    const ts = item.timestamp;

    if (typeof service !== 'string' || !service.trim()) {
      // missing or bad service → skip
      continue;
    }

    const parsedTs = parseTimestamp(ts);
    if (!parsedTs) {
      // missing or invalid timestamp → skip
      continue;
    }

    cleaned.push({
      service: service.trim(),
      timestamp: parsedTs,
    });
  }

  return cleaned;
}

/**
 * Group events by service and sort each service's events by time.
 *
 * Input:
 *   [ { service, timestamp: Date }, ... ]
 *
 * Output:
 *   {
 *     email: [Date, Date, ...],
 *     sms:   [Date, Date, ...],
 *     ...
 *   }
 */
function groupAndSortEvents(events) {
  const groups = {};

  for (const event of events) {
    const service = event.service;
    const ts = event.timestamp;

    if (!groups[service]) {
      groups[service] = [];
    }
    groups[service].push(ts);
  }

  // Sort timestamps for each service
  for (const service of Object.keys(groups)) {
    groups[service].sort((a, b) => a - b);
  }

  return groups;
}


function detectAlerts(groupedEvents, expectedIntervalSeconds, allowedMisses) {
  return [];
}

module.exports = {
  parseTimestamp,
  loadEventsFromFile,
  groupAndSortEvents,
  detectAlerts,
};
