# parrotube

<p align="center">
  <img src="./assets/parrotube-logo.png" alt="parrotube logo" width="220">
</p>

YouTube Analytics CLI for AI agents and humans. Pull channel demographics, geography, traffic sources, device stats, revenue, time-series, search terms, and more, or query YouTube Data API resources from the same CLI.

**Works with:** Claude Code, Cursor, and any agent that can run shell commands.

CLI data commands keep stdout reserved for structured JSON/Table output. The welcome banner is written to stderr only for top-level help entry points.

## Prerequisites

- **Node.js** >= 18
- **yt-dlp** — required for `data:transcript` command. [Install guide](https://github.com/yt-dlp/yt-dlp#installation)

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
2. Create a project and enable **YouTube Analytics API** and **YouTube Data API v3**
3. Create an **OAuth 2.0 Client ID** (Desktop App type)
4. Download `client_secret.json`

```bash
mkdir -p ~/.config/parrotube
mv ~/Downloads/client_secret*.json ~/.config/parrotube/client_secret.json
npx parrotube auth
```

## Authentication Requirements

| Category | Commands | Auth Required |
|----------|----------|:---:|
| **Analytics** | overview, demographics, geography, traffic, devices, revenue, sharing, top-videos, time-series, search-terms, video, query, report | Yes |
| **Data API** | data:comments, data:channel, data:videos, data:playlists, data:playlist-items, data:search, data:subscriptions, data:activities, data:captions, data:categories, data:i18n | Yes |
| **No Auth** | data:transcript | **No** |

`data:transcript` uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) to fetch subtitles and works without any authentication. All other commands require OAuth2 setup (see [Setup](#setup-one-time)).

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

### time-series

Daily or monthly time-series data.

```bash
parrotube time-series --period 90d
parrotube time-series --period 1y --by month
```

### revenue

Revenue and ad performance metrics (CPM, ad impressions, monetized playbacks, etc.).

```bash
parrotube revenue --period 28d
```

### search-terms

Top search terms driving traffic from YouTube Search.

```bash
parrotube search-terms --period 28d --max 25
```

### sharing

Sharing service breakdown (WhatsApp, Twitter, LINE, etc.).

```bash
parrotube sharing --period 28d
```

### video

Stats for a specific video.

```bash
parrotube video --video-id dQw4w9WgXcQ --period 90d
```

### query

Raw API query — specify your own metrics, dimensions, sort, and filters.

```bash
parrotube query --metrics views,likes --dimensions country --sort -views --period 28d
parrotube query --metrics estimatedMinutesWatched --filters "video==abc123" --period 7d
```

### report

**Full report** -- runs overview, demographics, geography, traffic, devices, and top-videos, then outputs a single combined JSON.

```bash
parrotube report --period 28d
```

## YouTube Data API Commands

These commands use YouTube Data API v3 and do not require `--period`.

### data:comments

Fetch comment threads for a video.

```bash
parrotube data:comments --video-id dQw4w9WgXcQ --max 50
parrotube data:comments --video-id dQw4w9WgXcQ --all --order relevance
```

### data:channel

Fetch channel info for the authenticated channel or a specific channel ID.

```bash
parrotube data:channel
parrotube data:channel --channel-id UC_x5XG1OV2P6uZZ5FSM9Ttw
```

### data:videos

Fetch metadata for one or more videos.

```bash
parrotube data:videos --video-id dQw4w9WgXcQ
parrotube data:videos --video-id dQw4w9WgXcQ,9bZkp7q19f0
```

### data:playlists

List playlists for the authenticated channel or a specific channel.

```bash
parrotube data:playlists
parrotube data:playlists --channel-id UC_x5XG1OV2P6uZZ5FSM9Ttw --max 10
```

### data:playlist-items

List videos inside a playlist.

```bash
parrotube data:playlist-items --playlist-id PL590L5WQmH8fJ54F5Kxv7xQ3RjQ4Xr8vL --max 20
```

### data:search

Search videos, channels, or playlists.

```bash
parrotube data:search --query "agentic engineering" --type video --max 10
parrotube data:search --query "devbrothers" --type channel
```

### data:subscriptions

List the authenticated channel's subscriptions.

```bash
parrotube data:subscriptions --max 25
```

### data:activities

Fetch channel activity feed.

```bash
parrotube data:activities --max 20
parrotube data:activities --channel-id UC_x5XG1OV2P6uZZ5FSM9Ttw
```

### data:captions

List captions for a video.

```bash
parrotube data:captions --video-id dQw4w9WgXcQ
```

### data:transcript (no auth required)

Extract transcript (subtitles/captions text) from any public video, including auto-generated captions. **No authentication required** — works without OAuth setup.

```bash
# JSON output with timestamps
parrotube data:transcript --video-id dQw4w9WgXcQ

# Specific language
parrotube data:transcript --video-id dQw4w9WgXcQ --lang ko

# Plain text only (no timestamps)
parrotube data:transcript --video-id dQw4w9WgXcQ --format text
```

### data:categories

Fetch video categories for a region.

```bash
parrotube data:categories
parrotube data:categories --region-code US
```

### data:i18n

List supported i18n regions or languages.

```bash
parrotube data:i18n --type regions
parrotube data:i18n --type languages
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
# Full channel snapshot
npx parrotube report --period 28d

# Composable primitives — agents can mix & match
npx parrotube time-series --period 90d --by day --format json
npx parrotube query --metrics views,estimatedRevenue --dimensions country --sort -views
npx parrotube video --video-id VIDEO_ID --period 28d
npx parrotube data:videos --video-id VIDEO_ID --format json
npx parrotube data:comments --video-id VIDEO_ID --max 100 --format json
```

## License

MIT
