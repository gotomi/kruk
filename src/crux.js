import { google } from "googleapis";
import { convertData } from "./crux-convert.js";
import prependHttp from "prepend-http";

export async function runQuery(API_KEY, cruxQueryParams, history = false) {
  const crux = google.chromeuxreport({
    version: "v1",
    auth: API_KEY,
  });
  const res = history
    ? await crux.records.queryHistoryRecord(cruxQueryParams)
    : await crux.records.queryRecord(cruxQueryParams);
  return res.data.record;
}

function handleErrors(error) {
  delete error.config.params.key;
  console.log({ params: error.config.params, errors: error.errors });
}

export async function getReports(urls, API_KEY, params, groupByMetric = false) {
  const urlsPrepared = urls.map((url) => prependHttp(url));
  const { formFactor, history, origin } = params;
  const cruxQueryParams = {
    formFactor,
  };
  const tasks = urlsPrepared.map((url) => {
    const urlOrOrigin = origin ? { origin: url } : { url: url };

    return runQuery(
      API_KEY,
      { ...cruxQueryParams, ...urlOrOrigin },
      history,
    ).catch(handleErrors);
  });
  const data = (await Promise.all([...tasks])).filter((item) => !!item);

  return !history ? convertData(data, groupByMetric) : data;
}
