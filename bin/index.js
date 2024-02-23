#!/usr/bin/env node
import { getReports } from '../src/crux.js';
import { printTable, printDistribution, printCSV, printHeading } from '../src/crux-output.js';
import process from 'node:process';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

function prepareQueryParams(argv) {
  const effectiveConnectionType = !argv.history
    ? {
        effectiveConnectionType: argv.effectiveConnectionType || argv.ect || '',
      }
    : {};

  return {
    ...effectiveConnectionType,
    formFactor: argv.formFactor || 'PHONE',
  };
}

const queryParams = prepareQueryParams(argv);
const config = {
  origin: argv.checkOrigin,
  history: argv.history,
};
// input data validation
const API_KEY = argv.key;
const formFactorValues = ['ALL_FORM_FACTORS', 'PHONE', 'DESKTOP', 'TABLET'];
const ectValues = ['offline', 'slow-2G', '2G', '3G', '4G'];

if (queryParams.effectiveConnectionType && !ectValues.includes(queryParams.effectiveConnectionType)) {
  console.log(
    `parameter effectiveConnectionType should be one of allowed values:  ${ectValues.join(',')} or it can be skipped`,
  );
  process.exit();
}

if (!formFactorValues.includes(queryParams.formFactor)) {
  console.log(`parameter formFactor should be one of allowed values:  ${formFactorValues.join(',')}`);
  process.exit();
}
// validation end

if (argv.help) {
  console.log(`
  ${'--key'.padEnd(
    25,
  )} CrUX API key (required) (https://developers.google.com/web/tools/chrome-user-experience-report/api/guides/getting-started#APIKey)
  ${'--urls'.padEnd(25)} one or more comma seperated urls  (required)
  ${'--formFactor'.padEnd(25)} allowed values: ALL_FORM_FACTORS, DESKTOP, TABLET, PHONE (default)
  ${'--ect'.padEnd(25)} allowed values: offline, slow-2G, 2G, 3G, 4G
  ${'--checkOrigin'.padEnd(25)} get CrUX data for origin instead of given url
  ${'--output'.padEnd(25)} posible values: distribution, json, csv, table (default) 

Usage: 
  kruk --key [YOUR_API_KEY] --urls www.google.com,www.bing.com --ect 4G
  kruk --key [YOUR_API_KEY] --urls www.google.com,www.bing.com 
  kruk --key [YOUR_API_KEY] --urls www.google.com
  kruk --key [YOUR_API_KEY] --urls www.google.com --checkOrigin
  kruk --key [YOUR_API_KEY] --urls www.google.com,www.bing.com --formFactor DESKTOP
  kruk --key [YOUR_API_KEY] --urls www.google.com,www.bing.com --formFactor TABLET --ect 3G
  `);
  process.exit();
}

if (!argv.key) {
  console.log(`Provide an API key to make CrUX Rest API request  '--key=[YOUR_API_KEY]'}`);
  process.exit();
}

if (!argv.urls) {
  console.error(
    `Provide either urls or file argument \n${'--urls www.google.com,www.bing.com'}\n or JSON file \n${'--file path_to_json_file'}`,
  );
  process.exit();
}

const urls = argv.urls;
//output
const cruxData = await getReports(urls, API_KEY, queryParams, config);

if (cruxData.error) {
  console.log(cruxData);
  process.exit();
}

const data = cruxData;

if (argv.output === 'json' || argv.history) {
  //todo - other view for history data
  console.log(JSON.stringify(data));
} else if (argv.output === 'csv') {
  printHeading(data.params);
  printCSV(data.metrics);
} else if (argv.output === 'distribution') {
  printHeading(data.params);
  printDistribution(data.metrics);
} else {
  printHeading(data.params);
  printTable(data.metrics);
}
