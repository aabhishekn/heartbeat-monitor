# Heartbeat Monitor

This is a small Node.js program that processes heartbeat events for multiple services and reports when a service has missed a certain number of consecutive heartbeats.

The implementation follows the requirements from the assignment:

* Load events from `events.json`
* Ignore malformed events (missing fields or invalid timestamps)
* Group events by service
* Sort each service's events chronologically
* Assume heartbeats are expected every fixed interval (60 seconds)
* Trigger an alert when a service misses 3 consecutive heartbeats
* Return output in the required JSON format

---

## Requirements

* Node.js (v16 or higher recommended)
* No external npm packages are required

---

## Project Structure

```
heartbeat-monitor/
  ├── main.js
  ├── heartbeat.js
  ├── tests.js
  ├── events.json
  └── README.md
```

* `main.js` – entry point
* `heartbeat.js` – core logic
* `tests.js` – required test cases
* `events.json` – input file provided in assignment

---

## Running the Program

From the project root:

```bash
npm start
```

or

```bash
node main.js
```

This will print an array of alerts, for example:

```json
[
  {
    "service": "email",
    "alert_at": "2025-08-04T10:05:00.000Z"
  }
]
```

---

## Running Tests

The assignment requires four scenarios:

* A working alert case
* A near-miss case (2 missed heartbeats → no alert)
* Unordered input
* At least one malformed event

Run the tests with:

```bash
npm test
```

or

```bash
node tests.js
```

You should see:

```
All tests passed.
```

---

## Notes

* Malformed events are skipped silently to avoid crashing the program.
* Only the first alert per service is reported, as described in the assignment.
* All time calculations use JavaScript's built-in `Date` object.

---

