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

## Publishing production records

From an isolated clone that contains no application secrets or SQLite database:

```bash
./scripts/publish-public-log.sh /var/lib/regodds/public_log/alerts.json
```

The script validates an exact public schema before copying, stages only
`log/alerts.json`, and refuses to publish from a dirty checkout. It still requires a
repository-scoped deploy key configured outside this repository. Never give the worker a
personal GitHub token and never reuse the VPS login key as a GitHub deploy key.
