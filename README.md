# parrotube

YouTube Analytics CLI for AI agents and humans. Pull channel demographics, geography, traffic sources, device stats, and more.

**Works with:** Claude Code, Cursor, and any agent that can run shell commands.

## Installation

```bash
npm install -g parrotube
```

Or run directly:

```bash
npx parrotube --help
```

## Setup (one-time)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable **YouTube Analytics API** + **YouTube Data API v3**
3. Create an **OAuth 2.0 Client ID** (Desktop App type)
4. Download `client_secret.json`

```bash
mkdir -p ~/.config/parrotube
mv ~/Downloads/client_secret*.json ~/.config/parrotube/client_secret.json
npx parrotube auth
```

## Commands

All commands output JSON by default. Use `--format table` for human-readable output.

### auth

Authenticate with YouTube (opens browser, one-time).

```bash
parrotube auth
```

### overview

Channel summary stats.

```bash
parrotube overview --period 28d
```

### demographics

Age group and gender breakdown.

```bash
parrotube demographics --period 90d
```

### geography

Country-level viewing data.

```bash
parrotube geography --period 28d
```

### traffic

Traffic source breakdown.

```bash
parrotube traffic --period 28d
```

### devices

Device type and OS breakdown.

```bash
parrotube devices --period 28d
```

### top-videos

Top N videos by watch time.

```bash
parrotube top-videos --period 28d --max 10
```

### report

**Full report** -- runs all of the above and outputs a single combined JSON.

```bash
parrotube report --period 28d
```

## Common Options

| Option | Description | Default |
|--------|-------------|---------|
| `--period <value>` | Shorthand period: `7d`, `28d`, `90d`, `1y` | `28d` |
| `--start-date <YYYY-MM-DD>` | Custom start date | - |
| `--end-date <YYYY-MM-DD>` | Custom end date | - |
| `--format <json\|table>` | Output format | `json` |

## For AI Agents

Every command writes structured JSON to stdout. Errors go to stderr as `{"error": "..."}`.

```bash
# Agent usage example
npx parrotube report --period 28d
```

## License

MIT
