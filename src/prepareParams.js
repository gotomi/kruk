export function prepareParams(argv) {
  const effectiveConnectionType = !argv.history
    ? {
        effectiveConnectionType: argv.effectiveConnectionType || argv.ect || "",
      }
    : {};
  const params = {
    ...effectiveConnectionType,
    formFactor: argv.formFactor,
    origin: argv.checkOrigin || false,
    history: argv.history || false,
  };

  return params;
}
