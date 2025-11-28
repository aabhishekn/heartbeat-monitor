const assert = require('assert');
const {
  parseTimestamp,
  groupAndSortEvents,
  detectAlerts,
} = require('./heartbeat');

function event(service, iso) {
  const ts = parseTimestamp(iso);
  if (!ts) throw new Error('Invalid test timestamp: ' + iso);
  return { service, timestamp: ts };
}

function testWorkingAlert() {
  // email at 10:00 and 10:04, with 60s interval -> 3 misses -> alert at 10:03
  const events = [
    event('email', '2025-08-04T10:00:00.000Z'),
    event('email', '2025-08-04T10:04:00.000Z'),
  ];

  const grouped = groupAndSortEvents(events);
  const alerts = detectAlerts(grouped, 60, 3);

  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0].service, 'email');
  assert.strictEqual(alerts[0].alert_at, '2025-08-04T10:03:00.000Z');
}

function testNearMiss() {
  // sms at 10:00 and 10:03 -> only 2 misses -> no alert
  const events = [
    event('sms', '2025-08-04T10:00:00.000Z'),
    event('sms', '2025-08-04T10:03:00.000Z'),
  ];

  const grouped = groupAndSortEvents(events);
  const alerts = detectAlerts(grouped, 60, 3);

  assert.strictEqual(alerts.length, 0);
}

function testUnorderedInput() {
  const events = [
    event('push', '2025-08-04T10:03:00.000Z'),
    event('push', '2025-08-04T10:01:00.000Z'),
    event('push', '2025-08-04T10:00:00.000Z'),
  ];

  const grouped = groupAndSortEvents(events);
  const list = grouped.push;

  assert.strictEqual(list[0].toISOString(), '2025-08-04T10:00:00.000Z');
  assert.strictEqual(list[1].toISOString(), '2025-08-04T10:01:00.000Z');
  assert.strictEqual(list[2].toISOString(), '2025-08-04T10:03:00.000Z');
}

function testMalformedEvents() {
  const raw = [
    { service: 'ok', timestamp: '2025-08-04T10:00:00.000Z' },
    { service: 'ok', timestamp: '2025-08-04T10:01:00.000Z' },
    { service: 'missingTimestamp' },
    { timestamp: '2025-08-04T10:02:00.000Z' },
    { service: 'bad', timestamp: 'not-a-real-timestamp' },
  ];

  const valid = raw
    .map(r => {
      if (!r || typeof r !== 'object') return null;
      if (typeof r.service !== 'string' || !r.service.trim()) return null;
      const ts = parseTimestamp(r.timestamp);
      if (!ts) return null;
      return { service: r.service, timestamp: ts };
    })
    .filter(Boolean);

  const grouped = groupAndSortEvents(valid);

  assert.deepStrictEqual(Object.keys(grouped), ['ok']);
  assert.strictEqual(grouped.ok.length, 2);
}

function run() {
  testWorkingAlert();
  testNearMiss();
  testUnorderedInput();
  testMalformedEvents();
  console.log('All tests passed.');
}

if (require.main === module) {
  run();
}

module.exports = { run };
