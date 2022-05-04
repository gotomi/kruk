const { green, red, yellow, bold } = require('./utils/format')
const { table } = require('table');

function drawDistribution(histogram) {
    function colorize(index, value) {
        if (index === 0) { return green(value); }
        if (index === 1) { return yellow(value); }
        if (index === 2) { return red(value); }
    }

    function draw(value) {
        let line = '';
        for (let i = 0; i < value; i++) {
            line += '\u25AA'
        }
        return line;
    }
    const distributionLine = histogram.map((value, index) => { return colorize(index, draw(Math.round(value))) }).join('').padEnd(128, '\u25AA');
    const distributionValue = histogram.map((value, index) => colorize(index, (value + '').padStart(5))).join(' ');

    return distributionLine + ' ' + distributionValue + '\n';
}


function colorizeValue(value, rank, pad = 0) {
    const v = (value + '').padEnd(pad);
    if (rank === 'poor') {
        return red(v)
    } else if (rank === 'average') {
        return yellow(v)
    } else {
        return green(v)
    }
}


function printTable(data) {
    const headings = Object.keys(data[0]);
    const values = data.map(item => Object.values(item).map(it => typeof it === 'object' ? colorizeValue(it.p75, it.rank) : it))
    const tableData = [headings].concat(values);
    const output = table(tableData);
    console.log(output);
}


function printDistribution(data) {
    const headings = Object.keys(data[0]);
    const values = data.map(
        item => Object.values(item)
        .map((it, i) => {
            if (typeof it === 'object') {
                return bold(headings[i].padStart(4)) + '' + colorizeValue(it.p75, it.rank, 6) + drawDistribution(it.histogram)
            } else { return '\n' + bold(it) + '\n' }
        }).join('')
    ).join('')

    console.log(values);
}

function printCSV(data) {
    const titleRow = ["url", "metric", "p75", "good", "average", "poor"].join(";");
    const headings = Object.keys(data[0]);

    const values = data.map(
        item => {
            const url = item.url;
            return Object.values(item)
                .map((it, i) => {
                    if (typeof it === 'object') {
                        return [url, headings[i], it.p75, it.histogram.join(";")].join(";")
                    }
                }).join('\n')
        }).join('\n');
    console.log(titleRow + values);
}

//output

function printHeading(params) {
    const heading = `\u001b[32m\nChrome UX Report \u001b[0m ${JSON.stringify(params)}`;
    console.log(heading)
}



module.exports = { printTable, printDistribution, printCSV, printHeading }