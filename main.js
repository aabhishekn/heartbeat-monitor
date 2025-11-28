const {
  loadEventsFromFile,
  groupAndSortEvents,
  detectAlerts,
} = require('./heartbeat');

const EVENTS_FILE = 'events.json';
const EXPECTED_INTERVAL_SECONDS = 60;
const ALLOWED_MISSES = 3;

function main() {
  const events = loadEventsFromFile(EVENTS_FILE);
  console.log(`Loaded ${events.length} valid events from ${EVENTS_FILE}`);

  const grouped = groupAndSortEvents(events);
  const services = Object.keys(grouped);
  console.log('Services found:', services);

  const alerts = detectAlerts(grouped, EXPECTED_INTERVAL_SECONDS, ALLOWED_MISSES);

  console.log('\nAlerts:');
  console.log(JSON.stringify(alerts, null, 2));
}

main();
