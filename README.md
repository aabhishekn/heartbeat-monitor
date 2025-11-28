# Heartbeat Monitor

This project provides a small Node.js utility for detecting when individual services stop sending expected heartbeat signals.
It processes a stream of timestamped heartbeat events, identifies gaps in expected intervals, and reports when a service appears to have gone silent.

The logic is implemented with straightforward JavaScript using only built-in Node modules, making the tool easy to run, understand, or extend.

---

## Overview

A heartbeat event is defined as an object containing a service name and an ISO timestamp.
The monitor performs the following steps:

1. Load all events from a JSON file
2. Discard malformed or incomplete records
3. Group events by service
4. Sort each group chronologically
5. Traverse each service's heartbeat timeline
6. Detect when the service misses a configurable number of consecutive expected intervals
7. Output an alert for each affected service

The default configuration assumes:

* Heartbeats are expected every **60 seconds**
* An alert is raised after **3 consecutive misses**

These defaults can be adjusted easily inside `main.js`.

---

## File Structure

```
heartbeat-monitor/
  ├── main.js
  ├── heartbeat.js
  ├── tests.js
  ├── events.json
  └── README.md
```

* **main.js** — CLI entry point and configuration
* **heartbeat.js** — all processing logic: validation, grouping, sorting, alert detection
* **tests.js** — small set of functional tests
* **events.json** — example data file containing heartbeat events

---

## Running the Monitor

To execute the script with the bundled example data:

```
npm start
```

Or run the entry file directly:

```
node main.js
```

The output is printed as a JSON array. Example:

```json
[
  {
    "service": "email",
    "alert_at": "2025-08-04T10:05:00.000Z"
  }
]
```

Each alert entry contains:

* the affected service
* the timestamp where the required number of consecutive misses occurred

---

## Configuration

Two values control the detection behavior:

```js
const EXPECTED_INTERVAL_SECONDS = 60;
const ALLOWED_MISSES = 3;
```

These can be modified inside `main.js` depending on the expected update frequency of the monitored services.

---

## Event Data Format

Input events follow the structure:

```json
{
  "service": "service-name",
  "timestamp": "2025-08-04T10:00:00Z"
}
```

Events missing a service name or containing an invalid timestamp are ignored.
Handling malformed data gracefully ensures that the monitor remains robust even when the input stream is not perfectly clean.

---

## Tests

A lightweight set of tests is included to verify:

* Proper handling of out-of-order events
* Detection of consecutive missed intervals
* Non-triggering of alerts when the number of misses is below the threshold
* Correct ignoring of malformed events

Run them using:

```
npm test
```

or:

```
node tests.js
```

---

## Extending the Monitor

Possible enhancements include:

* Reading events from a live stream instead of a static file
* Writing alerts to a log file or database
* Adding parameter support through CLI arguments
* Supporting multiple expected intervals per service
---