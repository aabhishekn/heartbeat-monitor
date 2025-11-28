const { loadEventsFromFile } = require('./heartbeat');

function main() {
  const EVENTS_FILE = 'events.json';

  const events = loadEventsFromFile(EVENTS_FILE);

  console.log(`Loaded ${events.length} valid events from ${EVENTS_FILE}`);

  console.log('Sample events:', events.slice(0, 3));
}

main();
