const {
  loadEventsFromFile,
  groupAndSortEvents,
  detectAlerts,
} = require('./heartbeat');

const EVENTS_FILE = 'events.json';
const EXPECTED_INTERVAL_SECONDS = 60;
const ALLOWED_MISSES = 3;

function main() {
  try {
    const events = loadEventsFromFile(EVENTS_FILE);
    const grouped = groupAndSortEvents(events);
    const alerts = detectAlerts(grouped, EXPECTED_INTERVAL_SECONDS, ALLOWED_MISSES);
    console.log(JSON.stringify(alerts, null, 2));
  } catch (err) {
    console.error('Error while running heartbeat check:', err.message || err);
    process.exit(1);
  }
}

main();
