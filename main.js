const {
  loadEventsFromFile,
  groupAndSortEvents,
} = require('./heartbeat');

function main() {
  const EVENTS_FILE = 'events.json';

  const events = loadEventsFromFile(EVENTS_FILE);
  console.log(`Loaded ${events.length} valid events from ${EVENTS_FILE}`);

  const grouped = groupAndSortEvents(events);
  const services = Object.keys(grouped);

  console.log('Services found:', services);

  for (const service of services) {
    const timestamps = grouped[service];
    const first = timestamps[0];
    const last = timestamps[timestamps.length - 1];

    console.log(
      `- ${service}: ${timestamps.length} events ` +
      `(from ${first.toISOString()} to ${last.toISOString()})`
    );
  }
}

main();
