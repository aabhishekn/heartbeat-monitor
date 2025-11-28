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


/**
 * Detect alerts for services that miss `allowedMisses` consecutive heartbeats.
 *
 * For each service:
 *   - Heartbeats are expected every `expectedIntervalSeconds`.
 *   - Starting from the first heartbeat, we walk forward and see how many
 *     expected timestamps pass before the next real heartbeat arrives.
 *   - When the number of consecutive misses reaches `allowedMisses`,
 *     we record an alert at the time of that last missed heartbeat.
 *
 * We only record the first alert per service.
 */
function detectAlerts(groupedEvents, expectedIntervalSeconds, allowedMisses) {
  const alerts = [];
  const intervalMs = expectedIntervalSeconds * 1000;

  for (const [service, timestamps] of Object.entries(groupedEvents)) {
    if (!Array.isArray(timestamps) || timestamps.length === 0) {
      continue;
    }

    let missesInRow = 0;
    let expected = new Date(timestamps[0].getTime() + intervalMs);
    let alertSet = false;

    for (let i = 1; i < timestamps.length && !alertSet; i++) {
      const actual = timestamps[i];

      // Count all expected heartbeats that should have occurred
      // before this actual heartbeat.
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

      if (alertSet) {
        break;
      }

      // A heartbeat arrived on time or before the next expected slot,
      // so we reset the counter and move the expectation forward.
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
