import { google } from "googleapis";
import { convertData, defaultMetrics } from "./crux-convert.js";
import prependHttp from "prepend-http";

export async function runQuery(API_KEY, cruxQueryParams, history = false) {
  const crux = google.chromeuxreport({
    version: "v1",
    auth: API_KEY,
  });
  const res = history
    ? await crux.records.queryHistoryRecord(cruxQueryParams)
    : await crux.records.queryRecord(cruxQueryParams);
  return res.data;
}

export function buildQueryParams(params, url) {
  const { formFactor, history, origin, metrics, periods } = params;
  const queryParams = {};

  // the API rejects ALL_FORM_FACTORS as a request value, the aggregated
  // record is returned when formFactor is omitted
  if (formFactor && formFactor !== "ALL_FORM_FACTORS") {
    queryParams.formFactor = formFactor;
  }

  if (origin) {
    queryParams.origin = url;
  } else {
    queryParams.url = url;
  }

  queryParams.metrics = metrics && metrics.length ? metrics : defaultMetrics;

  if (history && periods) {
    queryParams.collectionPeriodCount = periods;
  }

  return queryParams;
}

function handleErrors(error) {
  delete error.config.params.key;
  console.log({ params: error.config.params, errors: error.errors });
}

export async function getReports(urls, API_KEY, params, groupByMetric = false) {
  const { history } = params;
  const tasks = urls
    .map((url) => prependHttp(url))
    .map((url) =>
      runQuery(API_KEY, buildQueryParams(params, url), history).catch(
        handleErrors,
      ),
    );
  const responses = await Promise.all(tasks);

  responses.forEach((response) => {
    const details = response && response.urlNormalizationDetails;

    if (details && details.normalizedUrl !== details.originalUrl) {
      console.warn(
        `URL normalized: ${details.originalUrl} -> ${details.normalizedUrl}`,
      );
    }
  });

  const data = responses
    .filter((response) => !!response)
    .map((response) => response.record);

  return !history ? convertData(data, groupByMetric) : data;
}
