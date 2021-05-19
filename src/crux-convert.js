// metrics metadata 

const metricsMeta = {
    'cumulative_layout_shift': { range: [0.1, 0.25], abbr: "CLS" },
    'first_contentful_paint': { range: [1000, 3000], abbr: "FCP" },
    'first_input_delay': { range: [100, 300], abbr: "FID" },
    'largest_contentful_paint': { range: [2500, 4000], abbr: "LCP" }
}

function abbr(metric) {
    return metricsMeta[metric] ? metricsMeta[metric].abbr : metric;
}

function metricRank(value, metric) {
    if (value > metricsMeta[metric].range[1]) {
        return `poor`;
    } else if (value > metricsMeta[metric].range[0]) {
        return 'average'
    } else {
        return `good`
    }
}

function convertData(data) {
    const allMetrics = Object.keys(data[0].metrics);

    const params = JSON.parse(JSON.stringify(data[0].key));
    Object.keys(params).forEach(item => {
        if (item === 'url' || item === 'origin') params[item] = true;
    })

    params.date = new Intl.DateTimeFormat('pl-PL', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date());

    const metrics = data.map(el => {

        const item = {
            url: el.key.url || el.key.origin
        }

        allMetrics.forEach(metric => {
            const m = abbr(metric);
            if (typeof el.metrics[metric] !== 'undefined') {
                const p75value = el.metrics[metric].percentiles.p75;
                const histogram = el.metrics[metric].histogram.map(item => {
                    if (item.density) {
                        return Math.round(item.density * 10000) / 100
                    } else {
                        return 0
                    }
                });

                const rank = metricRank(p75value, metric);
                item[m] = {
                    histogram: histogram,   
                    p75: p75value,
                    rank: rank
                }
            } else {
                item[m] = '-';
            }
        })
        return item
    })
    return { params, metrics };
}


module.exports = { convertData }