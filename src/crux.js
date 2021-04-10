const { google } = require('googleapis');

async function runQuery(url, API_KEY, queryParams) {

    const params = JSON.parse(JSON.stringify(queryParams))

    if (params.checkOrigin) {
        params.origin = url;
    } else {
        params.url = url;
    }
    delete params.checkOrigin; // cleanup

    const crux = google.chromeuxreport({
        version: 'v1',
        auth: API_KEY
    });
    const res = await crux.records.queryRecord(params);
    return res.data.record;
}


function generateTasks(urls, API_KEY, queryParams) {
    let tasks = [];
    urls.forEach(url => tasks.push(runQuery(url, API_KEY, queryParams).catch(error => console.error('❌ ', url, error.errors))))
    return tasks;
}



async function getReports(urls, API_KEY, queryParams) {
    const tasks = generateTasks(urls, API_KEY, queryParams);
    const data = await Promise.all([...tasks]);
    return data.filter(item => !!item);
}

module.exports = { getReports }
