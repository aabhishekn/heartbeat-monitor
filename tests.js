const assert = require("assert");
const {
  parseTimestamp,
  groupAndSortEvents,
  detectAlerts,
} = require("./heartbeat");

// Helper to build valid test events
function makeEvent(service, isoTs) {
  const ts = parseTimestamp(isoTs);
  if (!ts) throw new Error(`Invalid test timestamp: ${isoTs}`);
  return { service, timestamp: ts };
}

function runTests() {
  // 1) Working alert case: should trigger exactly one alert
  (function testWorkingAlert() {
    // Service "email" at:
    // 10:00 and then at 10:04 (with 60s interval)
    //
    // Expected heartbeats after 10:00:
    // 10:01 ❌
    // 10:02 ❌
    // 10:03 ❌  -> 3 misses => alert at 10:03
    const events = [
      makeEvent("email", "2025-08-04T10:00:00.000Z"),
      makeEvent("email", "2025-08-04T10:04:00.000Z"),
    ];

    const grouped = groupAndSortEvents(events);
    const alerts = detectAlerts(grouped, 60, 3);

    assert.strictEqual(alerts.length, 1, "Expected one alert");
    assert.strictEqual(alerts[0].service, "email");
    assert.strictEqual(
      alerts[0].alert_at,
      "2025-08-04T10:03:00.000Z",
      "Alert should be at the 3rd missed heartbeat"
    );
  })();

  // 2) Near-miss case: only 2 misses -> no alert
  (function testNearMiss() {
    // Service "sms" at:
    // 10:00 and then at 10:03
    //
    // Expected after 10:00:
    // 10:01 ❌
    // 10:02 ❌
    // 10:03 ✅ (heartbeat comes before the 3rd miss)
    const events = [
      makeEvent("sms", "2025-08-04T10:00:00.000Z"),
      makeEvent("sms", "2025-08-04T10:03:00.000Z"),
    ];

    const grouped = groupAndSortEvents(events);
    const alerts = detectAlerts(grouped, 60, 3);

    assert.strictEqual(
      alerts.length,
      0,
      "No alert should be triggered for only 2 misses"
    );
  })();

  // 3) Unordered input: groupAndSortEvents should sort them
  (function testUnorderedInput() {
    const events = [
      makeEvent("push", "2025-08-04T10:03:00.000Z"),
      makeEvent("push", "2025-08-04T10:01:00.000Z"),
      makeEvent("push", "2025-08-04T10:00:00.000Z"),
    ];

    const grouped = groupAndSortEvents(events);
    const list = grouped["push"];

    assert.ok(Array.isArray(list), "push group should exist");
    assert.strictEqual(list.length, 3);
    assert.strictEqual(list[0].toISOString(), "2025-08-04T10:00:00.000Z");
    assert.strictEqual(list[1].toISOString(), "2025-08-04T10:01:00.000Z");
    assert.strictEqual(list[2].toISOString(), "2025-08-04T10:03:00.000Z");
  })();

  // 4) Malformed events: bad or missing fields should be skipped
  (function testMalformedEvents() {
    const rawEvents = [
      { service: "ok", timestamp: "2025-08-04T10:00:00.000Z" }, // valid
      { service: "ok", timestamp: "2025-08-04T10:01:00.000Z" }, // valid
      { service: "missingTimestamp" }, // missing timestamp
      { timestamp: "2025-08-04T10:02:00.000Z" }, // missing service
      { service: "bad", timestamp: "not-a-real-timestamp" }, // invalid timestamp
    ];

    // Inline validation (same as loadEventsFromFile)
    const validEvents = rawEvents
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        if (typeof item.service !== "string" || !item.service.trim())
          return null;
        const ts = parseTimestamp(item.timestamp);
        if (!ts) return null;
        return { service: item.service.trim(), timestamp: ts };
      })
      .filter(Boolean);

    const grouped = groupAndSortEvents(validEvents);

    // Only "ok" should remain with 2 events
    const services = Object.keys(grouped);
    assert.deepStrictEqual(services, ["ok"]);
    assert.strictEqual(grouped.ok.length, 2);
  })();

  console.log("✅ All tests passed.");
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
