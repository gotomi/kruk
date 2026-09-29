// metrics metadata

const metricsMeta = {
  cumulative_layout_shift: { range: [0.1, 0.25], abbr: "CLS" },
  first_contentful_paint: { range: [1800, 3000], abbr: "FCP" },
  largest_contentful_paint: { range: [2500, 4000], abbr: "LCP" },
  experimental_time_to_first_byte: { range: [800, 1800], abbr: "TTFB" },
  interaction_to_next_paint: { range: [200, 500], abbr: "INP" },
  round_trip_time: { range: [75, 275], abbr: "RTT" },
  navigation_types: { abbr: "NAV_TYPES", type: "fractions" },
  form_factors: { abbr: "FORM_FACTORS", type: "fractions" },
  largest_contentful_paint_resource_type: {
    abbr: "LCP-RES",
    type: "fractions",
  },
  largest_contentful_paint_image_time_to_first_byte: {
    abbr: "LCP-TTFB",
    rank: false,
  },
  largest_contentful_paint_image_resource_load_delay: {
    abbr: "LCP-LD",
    rank: false,
  },
  largest_contentful_paint_image_resource_load_duration: {
    abbr: "LCP-LDur",
    rank: false,
  },
  largest_contentful_paint_image_element_render_delay: {
    abbr: "LCP-RD",
    rank: false,
  },
};

// metrics requested and shown by default; the rest are opt-in via --metrics
const defaultMetrics = [
  "cumulative_layout_shift",
  "first_contentful_paint",
  "largest_contentful_paint",
  "experimental_time_to_first_byte",
  "interaction_to_next_paint",
  "round_trip_time",
];

const CoreWebVitals = [
  "cumulative_layout_shift",
  "largest_contentful_paint",
  "interaction_to_next_paint",
];

function abbr(metric) {
  return metricsMeta[metric] ? metricsMeta[metric].abbr : metric;
}

export function resolveMetrics(selection = []) {
  const byAbbr = Object.fromEntries(
    Object.entries(metricsMeta).map(([name, meta]) => [meta.abbr, name]),
  );

  const resolved = selection.map((metric) => {
    const name = metricsMeta[metric] ? metric : byAbbr[metric];

    if (!name) {
      throw new Error(
        `unknown metric "${metric}", valid metrics: ${Object.values(metricsMeta)
          .map((meta) => meta.abbr)
          .join(", ")}`,
      );
    }

    return name;
  });

  return [...new Set(resolved)];
}

function metricRank(value, metric) {
  if (value > metricsMeta[metric].range[1]) {
    return `poor`;
  } else if (value > metricsMeta[metric].range[0]) {
    return "average";
  } else {
    return `good`;
  }
}

function toPercent(value) {
  return Math.round(value * 10000) / 100;
}

function convertMetric(metric, record) {
  if (record.fractions) {
    return {
      fractions: Object.fromEntries(
        Object.entries(record.fractions).map(([label, fraction]) => [
          label,
          toPercent(fraction),
        ]),
      ),
      p75: null,
      rank: "-",
    };
  }

  const histogram = (record.histogram || []).map((bin) =>
    bin.density ? toPercent(bin.density) : 0,
  );
  const p75value = record.percentiles.p75;

  return {
    histogram,
    p75: p75value,
    rank:
      metricsMeta[metric].rank === false ? "-" : metricRank(p75value, metric),
  };
}

function groupByMetricAndSort(data, sortBy = "histogram") {
  const keys = new Set(defaultMetrics.map(abbr));
  data.forEach((site) => {
    Object.keys(site).forEach((key) => {
      if (key !== "url" && key !== "minimalGood") keys.add(key);
    });
  });

  const byMetric = {};
  keys.forEach((metric) => {
    byMetric[metric] = [];
  });

  data.forEach((site) => {
    keys.forEach((metric) => {
      byMetric[metric].push({ url: site.url, ...site[metric] });
    });
  });

  for (const metric in byMetric) {
    byMetric[metric].sort((a, b) => {
      if (!a.histogram || !b.histogram) return 0;

      const aValue =
        sortBy === "histogram" ? parseFloat(a.histogram[0]) : parseFloat(b.p75);
      const bValue =
        sortBy === "histogram" ? parseFloat(b.histogram[0]) : parseFloat(a.p75);

      return bValue - aValue;
    });
  }

  return byMetric;
}

export function convertData(data, groupByMetric = false) {
  if (!data.length)
    return {
      error: "data not found",
    };

  const params = JSON.parse(JSON.stringify(data[0].key));

  params.collectionPeriod = data[0].collectionPeriod;

  Object.keys(params).forEach((item) => {
    if (item === "url" || item === "origin") params[item] = true;
  });

  params.date = new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date());

  const metrics = data
    .map((el) => {
      const item = {
        url: (el.key.url || el.key.origin)
          .replaceAll("https://", "")
          .replaceAll("http://", ""),
      };

      let minimalGood = 100;
      const metricNames = [
        ...defaultMetrics,
        ...Object.keys(el.metrics).filter(
          (metric) => metricsMeta[metric] && !defaultMetrics.includes(metric),
        ),
      ];

      metricNames.forEach((metric) => {
        const m = abbr(metric);

        if (typeof el.metrics[metric] === "undefined") {
          item[m] = {
            histogram: [],
            p75: "-",
            rank: "-",
          };
          return;
        }

        item[m] = convertMetric(metric, el.metrics[metric]);

        if (
          CoreWebVitals.includes(metric) &&
          item[m].histogram &&
          item[m].histogram.length
        ) {
          minimalGood = Math.min(minimalGood, item[m].histogram[0]);
        }
      });
      item.minimalGood = minimalGood;

      return item;
    })
    .sort(function compareByMinimal(a, b) {
      const y = Number(a.minimalGood);
      const x = Number(b.minimalGood);

      if (y > x) return -1;

      if (x < y) return 1;

      return 0;
    });

  return {
    params,
    metrics: groupByMetric ? groupByMetricAndSort(metrics) : metrics,
  };
}

export { metricsMeta, defaultMetrics };
