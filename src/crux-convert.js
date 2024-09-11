// metrics metadata

const metricsMeta = {
  cumulative_layout_shift: { range: [0.1, 0.25], abbr: 'CLS' },
  first_contentful_paint: { range: [1800, 3000], abbr: 'FCP' },
  largest_contentful_paint: { range: [2500, 4000], abbr: 'LCP' },
  experimental_time_to_first_byte: { range: [800, 1800], abbr: 'TTFB' },
  interaction_to_next_paint: { range: [200, 500], abbr: 'INP' },
};

function abbr(metric) {
  return metricsMeta[metric] ? metricsMeta[metric].abbr : metric;
}

function metricRank(value, metric) {
  if (value > metricsMeta[metric].range[1]) {
    return `poor`;
  } else if (value > metricsMeta[metric].range[0]) {
    return 'average';
  } else {
    return `good`;
  }
}

function groupByMetricAndSort(data, sortBy = 'histogram') {
  const byMetric = { CLS: [], FCP: [], LCP: [],  INP: [], TTFB: [] };

  data.forEach((site) => {
    for (const metric in byMetric) {
      byMetric[metric].push({ url: site.url, ...site[metric] });
    }
  });

  for (const metric in byMetric) {
    byMetric[metric].sort((a, b) => {
      const aValue = sortBy === 'histogram' ? parseFloat(a.histogram[0]) : parseFloat(b.p75);
      const bValue = sortBy === 'histogram' ? parseFloat(b.histogram[0]) : parseFloat(a.p75);

      return bValue - aValue;
    });
  }

  return byMetric;
}

export function convertData(data, groupByMetric = false) {
  if (!data.length)
    return {
      error: 'data not found',
    };

  const allMetrics = Object.keys(metricsMeta);
  const params = JSON.parse(JSON.stringify(data[0].key));

  params.collectionPeriod = data[0].collectionPeriod;

  Object.keys(params).forEach((item) => {
    if (item === 'url' || item === 'origin') params[item] = true;
  });

  params.date = new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date());

  const metrics = data
    .map((el) => {
      const item = {
        url: (el.key.url || el.key.origin).replaceAll('https://', '').replaceAll('http://', ''),
      };

      let minimalGood = 100;
      allMetrics.forEach((metric) => {
        const m = abbr(metric);

        if (typeof el.metrics[metric] !== 'undefined') {
          const p75value = el.metrics[metric].percentiles.p75;
          const histogram = el.metrics[metric].histogram.map((item) => {
            if (item.density) {
              return Math.round(item.density * 10000) / 100;
            } else {
              return 0;
            }
          });
          const rank = metricRank(p75value, metric);

          minimalGood = Math.min(minimalGood, histogram[0]);
          item[m] = {
            histogram: histogram,
            p75: p75value,
            rank: rank,
          };
        } else {
          item[m] = {
            histogram: [],
            p75: '-',
            rank: '-',
          };
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
