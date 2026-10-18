import {
  convertData,
  defaultMetrics,
  experimentalMetrics,
} from "./crux-convert.js";
import prependHttp from "prepend-http";

const CRUX_API_URL = "https://chromeuxreport.googleapis.com/v1";

export async function runQuery(API_KEY, cruxQueryParams, history = false) {
  const endpoint = history
    ? "records:queryHistoryRecord"
    : "records:queryRecord";
  const url = `${CRUX_API_URL}/${endpoint}?key=${encodeURIComponent(API_KEY)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cruxQueryParams),
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ?? `CrUX API request failed (${response.status})`,
    );
    error.params = cruxQueryParams;
    error.errors = data?.error?.errors;
    throw error;
  }

  return data;
}

export function buildQueryParams(params, url) {
  const { formFactor, history, origin, metrics, periods, experimental } =
    params;
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

  const selected = metrics && metrics.length ? metrics : defaultMetrics;
  queryParams.metrics = experimental
    ? [...new Set([...selected, ...experimentalMetrics])]
    : selected;

  if (history && periods) {
    queryParams.collectionPeriodCount = periods;
  }

  return queryParams;
}

function handleErrors(error) {
  // the API key travels in the URL only and never in error.params
  console.log({ params: error.params, errors: error.errors ?? error.message });
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
