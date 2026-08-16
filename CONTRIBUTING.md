# Contributing

Thanks for taking a look. This is a small project, so the process is short.

## Getting set up

```bash
npm install
(cd server && npm install)
cp .env.example server/.env      # point it at a database you own
npm run dev
```

You need a PostgreSQL instance to exercise anything real. A local container is
fine, and `pg_stat_statements` is worth loading — without it the slow-query
panel is empty by design.

## Before you open a pull request

```bash
bash tools/local_gate.sh
```

Lint, tests, and a production build. CI runs the same script, so a green gate
locally means a green gate on GitHub. If it is red, fix the code — never loosen
a check to make it pass.

## Two rules specific to this project

**1. It holds database credentials, so treat the server as a credential store.**

The defaults exist for a reason and changing them needs a deliberate argument in
the PR:

- `HOST` binds `127.0.0.1`. It used to bind `0.0.0.0`, which put an
  unauthenticated tool holding database passwords on every interface of the
  machine.
- CORS is restricted to the local dev origin. Bare `cors()` let any page open in
  your browser drive this server and read whatever it can read.
- Error responses must not include the server's own connection settings. The
  caller may know nothing about that database; telling them its hostname and
  username is a disclosure, not a diagnostic.

If you add a route, ask what it returns to someone who should not have it.

**2. A wrong query is worse than a missing panel.**

Everything here reports on somebody's production database, and the output gets
acted on — indexes dropped, queries rewritten, sessions killed. A query with a
wrong join or a missing filter produces confident nonsense that looks
authoritative.

The blocking-lock query is the cautionary example. The widely copied version of
it omits `AND blocking_locks.GRANTED`, so two sessions both *waiting* on the
same lock match each other and each is reported as blocking the other: two
invented blockers, and the real one missing.

So: if you change a query, say in the PR what it returns on an idle database,
and what it returns when the interesting condition is genuinely present.

## What not to send

No real connection strings, internal hostnames, database or schema names,
bastion hosts, or credentials — in code, issues, or screenshots. A screenshot of
this tool against a real instance shows query text, usernames and client
addresses.

`pg_stat_statements` output is itself sensitive: query text often contains
literal values from your data.

## Reporting bugs

Open an issue with the PostgreSQL version, whether `pg_stat_statements` is
loaded, what the panel showed, and what you expected. Redact hostnames and
query text.
