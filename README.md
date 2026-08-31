# RegOdds Desk

Public GitHub Pages site for `regodds.com`.

Routes:

- `/` — product and risk disclosure;
- `/seat/` — one-time USDC purchase instructions for 30 days of access;
- `/log/` — public, timestamped alert record and raw JSON download.

`log/alerts.json` is generated from the production SQLite database by the worker's
`publog.py`. Publishing that file is a separate operation from running the worker: it must
never copy the database, Telegram identifiers, invite links, environment files, or payment
orders into this public repository.

GitHub Pages publishes the root of `main`; `CNAME` binds the site to `regodds.com`.
