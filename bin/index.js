#!/usr/bin/env node
import {
  printTable,
  printDistribution,
  printCSV,
  printHeading,
} from "../src/crux-output.js";
import { getReports } from "../src/crux.js";
import { prepareParams } from "../src/prepareParams.js";
import { Command, Option } from "commander";
import { readFile } from "fs/promises";

const info = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url)),
);
const program = new Command();

function commaSeparatedList(value) {
  return value.split(",");
}

program
  .name("kruk")
  .version(info.version)
  .requiredOption(
    "--urls <url>",
    "one or more comma seperated urls",
    commaSeparatedList,
  )
  .addOption(
    new Option(
      "--key <string>",
      "get API key from https://developers.google.com/web/tools/chrome-user-experience-report/api/guides/getting-started#APIKey",
    ).makeOptionMandatory(),
  )
  .addOption(
    new Option("--formFactor <string>", "form factor")
      .choices(["ALL_FORM_FACTORS", "DESKTOP", "TABLET", "PHONE"])
      .default("PHONE"),
  )
  .addOption(new Option("--checkOrigin", "get data for origin"))
  .addOption(new Option("--history", "use CrUX history API"))
  .addOption(
    new Option("--output <string>", "output format")
      .choices(["distribution", "json", "csv", "table"])
      .default("table"),
  ).description(`Usage:
  kruk --key [YOUR_API_KEY] --urls www.google.com,www.bing.com
  kruk --key [YOUR_API_KEY] --urls www.google.com
  kruk --key [YOUR_API_KEY] --urls www.google.com --checkOrigin
  kruk --key [YOUR_API_KEY] --urls www.google.com,www.bing.com --formFactor DESKTOP
  kruk --key [YOUR_API_KEY] --urls www.google.com,www.bing.com --formFactor TABLET`);

program.parse();

const argv = program.opts();
const params = prepareParams(argv);
const data = await getReports(argv.urls, argv.key, params);

if (data.error) {
  console.log(data);
  process.exit();
}

if (argv.output === "json" || argv.history) {
  //todo - other view for history data
  console.log(JSON.stringify(data));
} else if (argv.output === "csv") {
  printHeading(data.params);
  printCSV(data.metrics);
} else if (argv.output === "distribution") {
  printHeading(data.params);
  printDistribution(data.metrics);
} else {
  printHeading(data.params);
  printTable(data.metrics);
}
