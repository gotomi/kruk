import { green, red, yellow, bold } from "./utils/format.js";
import { table } from "table";

function drawDistribution(histogram) {
  function colorize(index, value) {
    if (index === 0) {
      return green(value);
    }

    if (index === 1) {
      return yellow(value);
    }

    if (index === 2) {
      return red(value);
    }
  }

  function draw(value) {
    let line = "";
    for (let i = 0; i < value; i++) {
      line += "\u25AA";
    }

    return line;
  }

  const distributionLine = histogram
    .map((value, index) => {
      return colorize(index, draw(Math.round(value)));
    })
    .join("")
    .padEnd(128, "\u25AA");
  const distributionValue = histogram
    .map((value, index) => colorize(index, (value + "").padStart(5)))
    .join(" ");

  return distributionLine + " " + distributionValue + "\n";
}

function colorizeValue(value, rank, pad = 0) {
  const v = (value + "").padEnd(pad);

  if (rank === "poor") {
    return red(v);
  } else if (rank === "average") {
    return yellow(v);
  } else {
    return green(v);
  }
}

function fractionsText(fractions) {
  return Object.entries(fractions)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => `${label} ${value}%`)
    .join(" · ");
}

function printTable(data) {
  const headings = Object.keys(data[0]).filter(
    (item) => item !== "minimalGood",
  );
  const values = data.map((item) =>
    Object.entries(item)
      .filter((entry) => entry[0] !== "minimalGood")
      .map((entry) => {
        const it = entry[1];

        if (typeof it !== "object") return it;
        if (it.fractions) return fractionsText(it.fractions);
        return colorizeValue(it.p75, it.rank);
      }),
  );
  const tableData = [headings].concat(values);
  const output = table(tableData);

  console.log(output);
}

function printDistribution(data) {
  const headings = Object.keys(data[0]);
  const values = data
    .map((item) =>
      Object.entries(item)
        .map((entry, i) => {
          const [key, it] = entry;

          if (key === "minimalGood") return;

          if (typeof it === "object") {
            if (it.fractions) {
              return (
                bold(headings[i].padStart(4)) +
                " " +
                fractionsText(it.fractions) +
                "\n"
              );
            }

            return (
              bold(headings[i].padStart(4)) +
              "" +
              colorizeValue(it.p75, it.rank, 6) +
              (it.histogram.length ? drawDistribution(it.histogram) : "\n")
            );
          } else {
            return "\n" + bold(it) + "\n";
          }
        })
        .join(""),
    )
    .join("");

  console.log(values);
}

function printCSV(data) {
  const titleRow = ["url", "metric", "p75", "good", "average", "poor"].join(
    ";",
  );
  const headings = Object.keys(data[0]);
  const values = data
    .map((item) => {
      const url = item.url;

      return Object.values(item)
        .map((it, i) => {
          if (typeof it === "object") {
            const distribution = it.fractions
              ? Object.entries(it.fractions)
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, value]) => `${label}=${value}`)
                  .join(";")
              : it.histogram.join(";");

            return [
              url,
              headings[i],
              it.fractions ? "-" : it.p75,
              distribution,
            ].join(";");
          }
        })
        .join("\n");
    })
    .join("\n");

  console.log(titleRow + values);
}

function printHeading(params) {
  // eslint-disable-next-line no-unused-vars
  const { collectionPeriod, date, origin, url, ...rest } = params;

  const formatCollectionPeriod = (period) => {
    const { firstDate, lastDate } = period;
    const formatDate = (d) =>
      new Date(d.year, d.month - 1, d.day).toLocaleString("pl-PL", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    return `${formatDate(firstDate)} to ${formatDate(lastDate)}`;
  };

  const data = Object.values(rest);

  const source = origin ? "origin" : "url";
  data.push(source);
  if (collectionPeriod) {
    data.push(formatCollectionPeriod(collectionPeriod));
  }

  const headerData = [yellow("Chrome UX Report"), ...data];
  const output = table([headerData]);
  console.log(output);
}

export { printTable, printDistribution, printCSV, printHeading };
