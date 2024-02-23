import { google } from 'googleapis';
import { convertData } from './crux-convert.js';
import prependHttp from 'prepend-http';

export async function runQuery(url, API_KEY, params) {
  const { queryParams, config } = params;
  const urlOrOrigin = config.origin ? { origin: url } : { url: url };
  const cruxQueryParams = { ...queryParams, ...urlOrOrigin };
  const crux = google.chromeuxreport({
    version: 'v1',
    auth: API_KEY,
  });
  const res = config.history
    ? await crux.records.queryHistoryRecord(cruxQueryParams)
    : await crux.records.queryRecord(cruxQueryParams);

  return res.data.record;
}

function handleErrors(error) {
  delete error.config.params.key;
  console.log({ params: error.config.params, errors: error.errors });
}

export async function getReports(urls, API_KEY, params) {
  const urlsPrepared = urls.split(',').map((url) => prependHttp(url));
  const tasks = urlsPrepared.map((url) => runQuery(url, API_KEY, params).catch(handleErrors));
  const data = (await Promise.all([...tasks])).filter((item) => !!item);

  return !params.config.history ? convertData(data) : data;
}
