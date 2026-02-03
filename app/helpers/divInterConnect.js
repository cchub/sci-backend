"use strict";
const DOMParser = require("dom-parser");
const { resolve } = require("path");
const fs = require("fs");

exports.div = (
  backend,
  data,
  importer,
  exporter,
  export_code,
  import_code,
  opi,
  trade_value,
  year
) => {
  const script = resolve(resolve(__dirname, "../../", `views/interconn.ejs`));
  let main;
  let final = "";
  let counter = 0;
  const size = data.length > 5 ? 5 : data.length;

  for (let i = 0; i < size; i++) {
    counter += 1;
    let dt = data[i];
    let div = `
        <tr>
            <td>${counter}</td>
            <td>
                <img src="https://lipis.github.io/flag-icon-css/flags/4x3/${dt.iso2_import.toLowerCase()}.svg" alt="" class="country-flag">
                <p>${dt.Importing_country}</p>
            </td>
            <td>${dt.Opportunity_Index}%</td>
            <td>
                ${dt.commodity_tradeValue[0].commodity},
                ${dt.commodity_tradeValue[1].commodity}, ${
      dt.commodity_tradeValue[2].commodity
    },
                + ${dt.Commodities_count} more imports.
            </td>
        </tr>
      `;

    final += div;
  }

  let header = `
  <div class="page-content">
  <h4 class="page-title"><span>03</span>Interconnected Countries</h4>
  <p class="page-description">
      These are the countries that are in the top 10 socially connected countries
      between the two counties. If no direct trade route exists, these counties can be used as proxies.
  </p>
  <!-- <div class="countries-no">
      ${data.length} Interconnected Countries
  </div> -->
  <table>
  <tr>
    <th>S/N</th>
    <th>Country</th>
    <th>Opportunity Index</th>
    <th>Top Imports from ${exporter}</th>
    </tr>
  ${final}
  </table>
  <p class="table-no">Table ${pager1(data).page} of ${pager1(data).end}</p>
</div>
  `;

  main = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <title>Cover page!</title>
        <link rel="stylesheet" href="${backend}/styles/style.css">
        <link rel="stylesheet" href="${backend}/styles/main.css">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    
    <body>
        <section class="interconnected-page page">
            <div class="page-header">
                <div class="country-details">
                    <h5 class="type-label">Exporting Country</h5>
                    <div class="country-name-flag">
                        <img src="https://lipis.github.io/flag-icon-css/flags/4x3/${export_code}.svg" alt="" class="country-flag">
                        <h2 class="country-name">${exporter}</h2>
                    </div>
                </div>
                <img src="${backend}/assets/circle-arrow-right.svg" alt="" class="arrow">
                <div class="country-details">
                    <h5 class="type-label">Importing Country</h5>
                    <div class="country-name-flag">
                        <img src="https://lipis.github.io/flag-icon-css/flags/4x3/${import_code}.svg" alt="" class="country-flag">
                        <h2 class="country-name">${importer}</h2>
                    </div>
                </div>
                <img src="${backend}/assets/sci-logo-dark.svg" alt="" class="page-header-logo">
            </div>
            <div class="index-value">
                <div class="item">
                    <p>Opportunity Index <sup>1</sup></p>
                    <h3><span>OPI</span>${opi}%</h3>
                </div>
                <div class="item">
                    <p><sup>2</sup> Current Trading Value (${year})</p>
                    <h3>$${trade_value}</h3>
                </div>
            </div>
            ${header}
  
        </section>
    </body>
    
    </html>`;
  if (data.length > 5) {
    main += div2(
      backend,
      data,
      importer,
      exporter,
      export_code,
      import_code,
      opi,
      trade_value,
      year
    );
  }

  //   const doc = new DOMParser().parseFromString(main, "text/xml");
  return fs.writeFileSync(script, main);
};

function pager1(data) {
  if (data.length > 5) {
    return { page: 1, end: 2 };
  } else {
    return { page: 1, end: 1 };
  }
}

const div2 = (
  backend,
  data,
  importer,
  exporter,
  export_code,
  import_code,
  opi,
  trade_value,
  year
) => {
  let final = "";
  let counter = 5;

  for (let i = 5; i < data.length; i++) {
    counter += 1;
    let dt = data[i];
    let div = `
        <tr>
            <td>${counter}</td>
            <td>
                <img src="https://lipis.github.io/flag-icon-css/flags/4x3/${dt.iso2_import.toLowerCase()}.svg" alt="" class="country-flag">
                <p>${dt.Importing_country}</p>
            </td>
            <td>${dt.Opportunity_Index}%</td>
            <td>
                ${dt.commodity_tradeValue[0].commodity},
                ${dt.commodity_tradeValue[1].commodity}, ${
      dt.commodity_tradeValue[2].commodity
    },
                + ${dt.Commodities_count} more imports.
            </td>
        </tr>
      `;

    final += div;
  }

  let header = `
  <div class="page-content">
  <h4 class="page-title"><span>03</span>Interconnected Countries</h4>
  <table>
  <tr>
    <th>S/N</th>
    <th>Country</th>
    <th>Opportunity Index</th>
    <th>Top Imports from ${exporter}</th>
    </tr>
  ${final}
  </table>
  <p class="table-no">Table 2 of 2</p>
</div>
  `;

  let main = `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <title>Cover page!</title>
      <link rel="stylesheet" href="${backend}/styles/style.css">
      <link rel="stylesheet" href="${backend}/styles/main.css">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  
  <body>
      <section class="interconnected-page page">
          <div class="page-header">
              <div class="country-details">
                  <h5 class="type-label">Exporting Country</h5>
                  <div class="country-name-flag">
                      <img src="https://lipis.github.io/flag-icon-css/flags/4x3/${export_code}.svg" alt="" class="country-flag">
                      <h2 class="country-name">${exporter}</h2>
                  </div>
              </div>
              <img src="${backend}/assets/circle-arrow-right.svg" alt="" class="arrow">
              <div class="country-details">
                  <h5 class="type-label">Importing Country</h5>
                  <div class="country-name-flag">
                      <img src="https://lipis.github.io/flag-icon-css/flags/4x3/${import_code}.svg" alt="" class="country-flag">
                      <h2 class="country-name">${importer}</h2>
                  </div>
              </div>
              <img src="${backend}/assets/sci-logo-dark.svg" alt="" class="page-header-logo">
          </div>
          <div class="index-value">
              <div class="item">
                  <p>Opportunity Index <sup>1</sup></p>
                  <h3><span>OPI</span>${opi}%</h3>
              </div>
              <div class="item">
                  <p><sup>2</sup> Current Trading Value (${year})</p>
                  <h3>$${trade_value}</h3>
              </div>
          </div>
          ${header}

      </section>
  </body>
  
  </html>`;

  return main;
};
