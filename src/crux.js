import { google } from 'googleapis';
import { convertData } from './crux-convert.js';
import prependHttp from 'prepend-http';

export async function runQuery(url, API_KEY, queryParams, config) {
  const urlOrOrigin = config.origin ? { origin: url } : { url: url };
  const params = { ...queryParams, ...urlOrOrigin };
  const crux = google.chromeuxreport({
    version: 'v1',
    auth: API_KEY,
  });
  const res = config.history ? await crux.records.queryHistoryRecord(params) : await crux.records.queryRecord(params);

  return res.data.record;
}

function generateTasks(urls, API_KEY, queryParams, config) {
  const urlsPrepared = urls.split(',').map((url) => prependHttp(url));

  let tasks = [];
  urlsPrepared.forEach((url) =>
    tasks.push(runQuery(url, API_KEY, queryParams, config).catch((error) => console.error('❌ ', url, error.errors))),
  );

  return tasks;
}

export async function getReports(urls, API_KEY, queryParams, config) {
  const tasks = generateTasks(urls, API_KEY, queryParams, config);
  const data = (await Promise.all([...tasks])).filter((item) => !!item);

  return data.length && !config.history ? convertData(data) : data;
}
