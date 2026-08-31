const list = document.getElementById("alert-list");
const paperList = document.getElementById("paper-list");
const recordCount = document.getElementById("record-count");
const latestRecord = document.getElementById("latest-record");
const filterButtons = [...document.querySelectorAll("[data-kind]")];

let alerts = [];

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value || "Unknown time")
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
}

function renderAlerts(kind = "all") {
  const visible = kind === "all" ? alerts : alerts.filter((alert) => alert.kind === kind);
  list.replaceChildren();

  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No records in this category yet.";
    list.append(empty);
    return;
  }

  [...visible].reverse().forEach((alert) => {
    const article = document.createElement("article");
    article.className = "alert-card";

    const meta = document.createElement("div");
    const id = document.createElement("div");
    id.className = "alert-id";
    id.textContent = `Record #${alert.id}`;
    const time = document.createElement("time");
    time.className = "alert-time";
    time.dateTime = alert.ts_utc || "";
    time.textContent = safeDate(alert.ts_utc);
    const badge = document.createElement("span");
    badge.className = "alert-kind";
    badge.textContent = alert.kind || "alert";
    meta.append(id, document.createElement("br"), time, document.createElement("br"), badge);

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = alert.title || "Untitled alert";
    const body = document.createElement("pre");
    body.className = "alert-body";
    body.textContent = alert.body_x || "";
    content.append(title, body);

    article.append(meta, content);
    list.append(article);
  });
}

function renderPaper(entries) {
  paperList.replaceChildren();
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No simulated positions have been published.";
    paperList.append(empty);
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "paper-card";
    const text = document.createElement("p");
    text.textContent = `${entry.side || ""} ${entry.slug || ""} · opened ${safeDate(entry.opened_utc)} · ${entry.result || "open"}`;
    card.append(text);
    paperList.append(card);
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
    renderAlerts(button.dataset.kind);
  });
});

fetch("/log/alerts.json", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    alerts = Array.isArray(data.alerts) ? data.alerts : [];
    const paper = Array.isArray(data.paper_book) ? data.paper_book : [];
    recordCount.textContent = `${alerts.length} published alert${alerts.length === 1 ? "" : "s"}`;
    latestRecord.textContent = alerts.length ? `Latest: ${safeDate(alerts.at(-1).ts_utc)}` : "No alerts yet";
    renderAlerts();
    renderPaper(paper);
  })
  .catch(() => {
    list.innerHTML = '<p class="empty-state">The visual log could not load. Use the raw JSON link above or try again later.</p>';
    paperList.innerHTML = '<p class="empty-state">Unavailable.</p>';
    recordCount.textContent = "Record unavailable";
  });
