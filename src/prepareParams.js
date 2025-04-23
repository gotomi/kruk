export function prepareParams(argv) {
  const params = {
    formFactor: argv.formFactor,
    origin: argv.checkOrigin || false,
    history: argv.history || false,
  };

  return params;
}
