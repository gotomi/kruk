# Kruk - Chrome UX Report (CrUX) CLI Tool

Kruk is a command-line interface tool that helps you fetch and visualize Chrome User Experience Report (CrUX) data for websites. It provides easy access to real-world performance metrics collected from Chrome users.

## Installation

```bash
npm install -g kruk
```

## Usage

Basic syntax:

```bash
kruk --key YOUR_API_KEY --urls URL1,URL2 [options]
```

### Required Parameters

- `--key`: Your Google API key (Get it from [Google Cloud Console](https://developers.google.com/web/tools/chrome-user-experience-report/api/guides/getting-started#APIKey))
- `--urls`: Comma-separated list of URLs to analyze

### Optional Parameters

- `--formFactor`: Device type to filter results (default: 'PHONE')
  - Options: 'ALL_FORM_FACTORS', 'DESKTOP', 'TABLET', 'PHONE'
  - 'ALL_FORM_FACTORS' queries the aggregated record across all form factors (and additionally returns the `FORM_FACTORS` metric)
- `--checkOrigin`: Get data for the entire origin instead of specific URLs
- `--history`: Use CrUX history API to get historical data
- `--metrics`: Comma-separated metrics to request. Accepts abbreviations (e.g. `CLS`, `LCP-TTFB`, `NAV_TYPES`) or full CrUX API metric names. Default: `CLS,FCP,LCP,TTFB,INP,RTT`
- `--periods`: Number of collection periods for `--history` queries (1-40, default: 25)
- `--output`: Output format (default: 'table')
  - Options: 'distribution', 'json', 'csv', 'table'

### Examples

1. Basic usage with multiple URLs:

```bash
kruk --key YOUR_API_KEY --urls www.google.com,www.bing.com
```

3. Check desktop metrics:

```bash
kruk --key YOUR_API_KEY --urls www.google.com,www.bing.com --formFactor DESKTOP
```

4. Get origin-level data:

```bash
kruk --key YOUR_API_KEY --urls www.google.com --checkOrigin
```

5. Get LCP subparts and navigation types:

```bash
kruk --key YOUR_API_KEY --urls www.google.com,www.bing.com --metrics CLS,LCP,LCP-TTFB,LCP-LD,LCP-LDur,LCP-RD,NAV_TYPES
```

6. Get the last 12 collection periods from the history API:

```bash
kruk --key YOUR_API_KEY --urls www.google.com --history --periods 12
```

## Output Metrics

The tool provides data for the following metrics (matching the [CrUX API](https://developer.chrome.com/docs/crux/api)):

Core metrics (shown by default):

- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- TTFB (Time to First Byte)
- INP (Interaction to Next Paint)
- RTT (Round Trip Time)

Additional metrics (opt-in via `--metrics`):

- NAV_TYPES (Navigation Types) — fraction of navigations per type
- FORM_FACTORS (Form Factors) — fraction of users per device, only returned with `--formFactor ALL_FORM_FACTORS`
- LCP-RES (LCP Resource Type) — image vs text content
- LCP-TTFB (LCP Image Time to First Byte) — p75 only
- LCP-LD (LCP Image Resource Load Delay) — p75 only
- LCP-LDur (LCP Image Resource Load Duration) — p75 only
- LCP-RD (LCP Image Element Render Delay) — p75 only

The LCP subpart metrics report p75 only and have no good/average/poor ranking (no official thresholds are published for them).

## Output Formats

1. **Table** (default): Displays data in a formatted table
2. **Distribution**: Shows visual distribution of metrics using unicode characters
3. **CSV**: Outputs data in CSV format for further processing
4. **JSON**: Raw JSON output of the data

### Examples / Screenshots

Table output:

![Kruk table output](example/kruk-table.png)

Distribution output:

![Kruk distribution output](example/kruk-distribution.png)

## Programmatic Usage

Kruk can also be used as a module in your Node.js applications.

### Installation

```bash
npm install kruk
```

### Basic Usage

```javascript
import { getReports } from "kruk";

async function fetchCruxData() {
  const urls = ["www.google.com", "www.bing.com"];
  const API_KEY = "YOUR_API_KEY";

  const params = {
    formFactor: "PHONE", // optional
    origin: false, // optional, set true for origin-level data
    history: false, // optional, set true for historical data
    metrics: ["cumulative_layout_shift", "navigation_types"], // optional, full metric names
    periods: 12, // optional, collection periods for history queries (1-40)
  };

  try {
    const data = await getReports(urls, API_KEY, params);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
```

### Response Structure

The response will include metrics data in the following format:

```javascript
{
  params: {
    // Query parameters used
  },
  metrics: [
    {
      url: "https://www.example.com",
      CLS: {
        p75: number,
        rank: "good" | "average" | "poor",
        histogram: [number, number, number] // Distribution values
      },
      FCP: {
        // Similar structure as CLS
      },
      LCP: {
        // Similar structure as CLS
      },
      TTFB: {
        // Similar structure as CLS
      },
      INP: {
        // Similar structure as CLS
      },
      RTT: {
        // Similar structure as CLS
      },
      NAV_TYPES: {
        // Fraction metrics (NAV_TYPES, FORM_FACTORS, LCP-RES) have
        // fractions instead of p75/histogram
        p75: null,
        rank: "-",
        fractions: { Navigate: 92.21, Reload: 5.27, Prerender: 2.52 }
      }
    }
  ]
}
```

## Requirements

- Node.js
- Google API Key with access to Chrome UX Report API

## Note

The tool requires a valid Google API key with access to the Chrome UX Report API. Make sure to handle the API key securely and not share it in public repositories.
