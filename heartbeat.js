const fs = require('fs');
const path = require('path');

/**
 * Parse an ISO timestamp into a Date.
 * Returns null if invalid.
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
 * - Expects an array of objects
 * - Keeps only records with a non-empty service and a valid timestamp
 *
 * Returns: { service: string, timestamp: Date }[]
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
      // skip records without a usable service name
      continue;
    }

    const parsedTs = parseTimestamp(ts);
    if (!parsedTs) {
      // skip records with missing or bad timestamps
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
 * Group events by service and sort each service's timestamps.
 *
 * Input:  [{ service, timestamp: Date }, ...]
 * Output: { [service: string]: Date[] }
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

  for (const service of Object.keys(groups)) {
    groups[service].sort((a, b) => a - b);
  }

  return groups;
}

/**
 * Detect alerts for services that miss `allowedMisses`
 * consecutive heartbeats.
 *
 * For each service:
 *  - Heartbeats are expected every `expectedIntervalSeconds`.
 *  - Starting from the first heartbeat, we walk forward in time.
 *  - For each gap between actual heartbeats we count how many
 *    expected timestamps fall into that gap.
 *  - When the counter reaches `allowedMisses`, we record an alert
 *    at the timestamp of the last missed heartbeat.
 *
 * Only the first alert per service is returned.
 */
function detectAlerts(groupedEvents, expectedIntervalSeconds, allowedMisses) {
  const alerts = [];
  const intervalMs = expectedIntervalSeconds * 1000;

  for (const [service, timestamps] of Object.entries(groupedEvents)) {
    if (!Array.isArray(timestamps) || timestamps.length === 0) {
      continue;
    }

    let missesInRow = 0;
    let alertSet = false;

    // first expected heartbeat after the first actual one
    let expected = new Date(timestamps[0].getTime() + intervalMs);

    for (let i = 1; i < timestamps.length && !alertSet; i++) {
      const actual = timestamps[i];

      // check how many expected heartbeats we skipped before this actual one
      while (expected < actual && !alertSet) {
        missesInRow += 1;

        if (missesInRow === allowedMisses) {
          alerts.push({
            service,
            alert_at: expected.toISOString(),
          });
          alertSet = true;
          break;
        }

        expected = new Date(expected.getTime() + intervalMs);
      }

      if (alertSet) break;

      // actual heartbeat arrived in time to break the streak
      missesInRow = 0;
      expected = new Date(actual.getTime() + intervalMs);
    }
  }

  return alerts;
}

module.exports = {
  parseTimestamp,
  loadEventsFromFile,
  groupAndSortEvents,
  detectAlerts,
};
