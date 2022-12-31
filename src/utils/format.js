function green(value) {
  return `\u001b[32m${value}\u001b[0m`;
}
function yellow(value) {
  return `\u001b[33m${value}\u001b[0m`;
}
function red(value) {
  return `\u001b[31m${value}\u001b[0m`;
}

function bold(value) {
  return `\u001b[1m${value} \u001b[0m`;
}

export { green, red, yellow, bold };
