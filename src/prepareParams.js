import { resolveMetrics } from "./crux-convert.js";

export function prepareParams(argv) {
  const params = {
    formFactor: argv.formFactor,
    origin: argv.checkOrigin || false,
    history: argv.history || false,
  };

  if (argv.metrics) {
    params.metrics = resolveMetrics(argv.metrics);
  }

  if (argv.periods) {
    const periods = Number(argv.periods);

    if (!Number.isInteger(periods) || periods < 1 || periods > 40) {
      throw new Error("--periods must be an integer between 1 and 40");
    }

    params.periods = periods;
  }

  return params;
}
