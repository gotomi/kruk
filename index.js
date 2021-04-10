#!/usr/bin/env node

const { getReports } = require('./src/crux');
const { convertData } = require('./src/crux-convert');
const { printTable, printDistribution, printCSV, printHeading } = require('./src/crux-output');

const path = require('path');
const prependHttp = require('prepend-http');
const argv = require('minimist')(process.argv.slice(2));


function getDataFromUrls(file) {
  try {
    const urls = require(path.join(process.cwd(), file));
    if (!Array.isArray(urls)) throw new Error("Not an array");
    return urls
  } catch (e) {
    throw new Error(e.code);
  }
}


const queryParams = {
  effectiveConnectionType: argv.effectiveConnectionType || argv.ect || '',
  formFactor: argv.formFactor || 'PHONE',
  checkOrigin: argv.checkOrigin || false
}

// input data validation

const API_KEY = argv.key;


const formFactorValues = ['ALL_FORM_FACTORS', 'PHONE', 'DESKTOP', 'TABLET'];
const ectValues = ["offline", "slow-2G", "2G", "3G", "4G"];


if (queryParams.effectiveConnectionType !== '' && !ectValues.includes(queryParams.effectiveConnectionType)) {
  console.log(`parameter effectiveConnectionType should be one of allowed values:  ${ectValues.join(',')} or it can be skipped`);
  return
}

if (!formFactorValues.includes(queryParams.formFactor)) {
  console.log(`parameter formFactor should be one of allowed values:  ${formFactorValues.join(',')}`);
  return
}


if (argv.help) {
  console.log(`
  ${'--key'.padEnd(25)} CrUX API key (required) (https://developers.google.com/web/tools/chrome-user-experience-report/api/guides/getting-started#APIKey)
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
  `)
  return;
}

if (!argv.key) {
  console.log(`Provide an API key to make CrUX Rest API request \n '--key=[YOUR_API_KEY]'}`);
  return;
}

if (!argv.urls && !argv.file) {
  console.error(`Provide either urls or file argument \n${'--urls www.google.com,www.bing.com'}\n or JSON file \n${'--file path_to_json_file'}`);
  return;
}

let urls;
if (argv.urls) {
  urls = argv.urls.split(',').map(url => prependHttp(url));
} else {
  urls = getDataFromUrls(argv.file)
}


//output

getReports(urls, API_KEY, queryParams).then(cruxData => {
  if (cruxData.length === 0) {
    console.log(`There's no valid data`);
    return
  }
  const data = convertData(cruxData);

  if (argv.output === 'json') {
    console.log(JSON.stringify(data))
  } else if (argv.output === 'csv') {
    printHeading(data.params)
    printCSV(data.metrics)
  } else if (argv.output === 'distribution') {
    printHeading(data.params)
    printDistribution(data.metrics)
  } else {
    printHeading(data.params)
    printTable(data.metrics)
  }
})


