#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const target = path.resolve(process.argv[2] || path.join(__dirname, "..", "log", "alerts.json"));
const MAX_BYTES = 5 * 1024 * 1024;
const ALERT_FIELDS = new Set(["id", "ts_utc", "kind", "ref", "title", "body_x", "matched_slugs"]);
const PAPER_FIELDS = new Set([
  "id",
  "opened_utc",
  "slug",
  "side",
  "entry_price",
  "size_usd",
  "thesis",
  "closed_utc",
  "exit_price",
  "result",
]);
const FORBIDDEN_KEY = /(token|secret|password|private.?key|invite.?link|tg.?user|tg.?username|tx.?hash|email|phone|order)/i;

function fail(message) {
  console.error(`Public log rejected: ${message}`);
  process.exit(1);
}

function plainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
}

function exactFields(record, allowed, label) {
  plainObject(record, label);
  for (const key of Object.keys(record)) {
    if (FORBIDDEN_KEY.test(key)) fail(`${label} contains forbidden field ${key}`);
    if (!allowed.has(key)) fail(`${label} contains unapproved field ${key}`);
  }
}

function validTimestamp(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    fail(`${label} must contain an ISO timestamp`);
  }
}

const stat = fs.statSync(target);
if (!stat.isFile()) fail("input is not a regular file");
if (stat.size > MAX_BYTES) fail(`input exceeds ${MAX_BYTES} bytes`);

let payload;
try {
  payload = JSON.parse(fs.readFileSync(target, "utf8"));
} catch (error) {
  fail(`invalid JSON (${error.message})`);
}

plainObject(payload, "root");
const topKeys = Object.keys(payload).sort();
if (topKeys.join(",") !== "alerts,paper_book") {
  fail("top-level fields must be exactly alerts and paper_book");
}
if (!Array.isArray(payload.alerts) || !Array.isArray(payload.paper_book)) {
  fail("alerts and paper_book must be arrays");
}

payload.alerts.forEach((record, index) => {
  const label = `alerts[${index}]`;
  exactFields(record, ALERT_FIELDS, label);
  if (!Number.isSafeInteger(record.id) || record.id < 1) fail(`${label}.id must be a positive integer`);
  validTimestamp(record.ts_utc, `${label}.ts_utc`);
  for (const key of ["kind", "ref", "title", "body_x", "matched_slugs"]) {
    if (typeof record[key] !== "string") fail(`${label}.${key} must be a string`);
  }
});

payload.paper_book.forEach((record, index) => {
  const label = `paper_book[${index}]`;
  exactFields(record, PAPER_FIELDS, label);
  if (!Number.isSafeInteger(record.id) || record.id < 1) fail(`${label}.id must be a positive integer`);
  validTimestamp(record.opened_utc, `${label}.opened_utc`);
  if (record.closed_utc != null) validTimestamp(record.closed_utc, `${label}.closed_utc`);
});

console.log(`Public log valid: ${payload.alerts.length} alerts, ${payload.paper_book.length} simulated entries`);
