# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use GitHub's private vulnerability reporting on this repository:
**Security → Report a vulnerability**. That opens a private thread with the
maintainer.

Include what you found, how to reproduce it, and what an attacker gets. Expect a
first reply within a week. This is a personal project maintained in spare time.

## Supported versions

The latest commit on the default branch. There are no maintained release
branches.

## What this tool is

Be clear about it before deciding where to run it: **a server that holds
database credentials, connects to whatever database it is told to, and returns
what it finds to an HTTP caller.** That is the whole design. It is a developer
tool for a machine you control, not a service.

## Defaults, and what they do not cover

| Setting | Default | Protects against |
|---|---|---|
| `HOST` | `127.0.0.1` | Reachability from the rest of the network |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | A page in your browser driving the API |
| `API_TOKEN` | unset | Nothing until you set it |
| `DEBUG_CONNECTION_DETAILS` | off | Error responses disclosing the server's own DB host and user |

**If you change `HOST`, set `API_TOKEN`.** Every route is unauthenticated
otherwise, and the server warns at startup rather than refusing, because
refusing would break the legitimate case of running it behind your own
authenticating proxy.

## In scope

- SQL injection through any parameter that reaches a query.
- Anything that lets a caller reach a host other than the one configured.
- Credentials appearing in responses, logs, or on disk.
- A route that returns database contents without the caller having supplied the
  connection details for it.
- CORS or origin handling that lets an untrusted page drive the API.

## Out of scope

- Running it on `0.0.0.0` without `API_TOKEN` and finding it unauthenticated.
  That is documented above.
- `rejectUnauthorized: false` on SSL connections. It accepts self-signed
  certificates on purpose, which is right for a managed instance behind a
  bastion and wrong on the open internet. Change it if your threat model
  differs.

## Handling the output

The analysis output is sensitive even though it is "just metrics":

- `pg_stat_statements` **query text frequently contains literal values** from
  your data, including values that identify people.
- Blocking-lock output names connected users, application names, and client IP
  addresses.
- Table and index names describe your schema.

Do not paste raw output into a public issue or a screenshot. Redact it, or
reproduce the problem against a scratch database.

## If you leak a credential

Rotating is the fix. Deleting the password from a file, or rewriting git
history, does not revoke anything: assume any credential that was ever
committed is compromised and change it.
