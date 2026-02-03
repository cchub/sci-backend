const { Code } = require("../../helpers/countryCode");
const { connected, categs } = require("../../helpers/fileData");
const {
  NOT_FOUND,
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
} = require("http-status-codes");

const _ = require("lodash");
const { destructured } = require("../../helpers/fileData");
const {
  value,
  value2,
  value3,
  foreignEx,
  properCase,
  dist,
} = require("../../helpers/value");
const { div } = require("../../helpers/divInterConnect");
const fs = require("fs");
const { resolve } = require("path");
// const script = resolve(
//   resolve(__dirname, "../..", "modules/storage/response.json")
// );
const pdf = require("html-pdf");
const moment = require("moment");
const HummusRecipe = require("hummus-recipe");
const { Trade } = require("../../models/Trade");
require("dotenv");
const backend = process.env.BACKEND_URL;

module.exports = class {
  static createPdf() {
    return async (req, res) => {
      let { export_code, import_code } = req.query;

      if (!export_code || !import_code)
        return res.status(BAD_REQUEST).send({
          error:
            "Please provide export(focus) country code and import country code.",
        });

      let exporter = Code(export_code);
      let importer = Code(import_code);
      if (!exporter || !importer)
        return res
          .status(BAD_REQUEST)
          .send({ error: "Country Code does not exist" });

      let payload = (
        await Trade.aggregate([
          {
            $match: {
              Exporting_country: exporter,
              Importing_country: importer,
            },
          },
          {
            $project: {
              _id: 0,
              Exporting_country: 1,
              Importing_country: 1,
              Importing_region: 1,
              Exporting_region: 1,
              Exporting_GDP: 1,
              Importing_GDP: 1,
              Exporting_GDP_per_Capita: 1,
              Importing_GDP_per_Capita: 1,
              Exporting_total_import: 1,
              Importing_total_import: 1,
              year: 1,
              comcol: 1,
              comlang_off: 1,
              comREC: 1,
              RECs: {
                $replaceAll: { input: "$RECs", find: ";", replacement: "," },
              },
              Exporting_RECs: {
                $replaceAll: {
                  input: "$Exporting_RECs",
                  find: ";",
                  replacement: ",",
                },
              },
              Importing_RECs: {
                $replaceAll: {
                  input: "$Importing_RECs",
                  find: ";",
                  replacement: ",",
                },
              },
              trade_value: "$total_export_value",
              scaled_sci: 1,
              Opportunity_Index: 1,
              iso2_export: 1,
              iso2_import: 1,
              ranked_SCI: 1,
              dist: 1,
              contig: 1,
              Exporting_exchange_rate: 1,
              Importing_exchange_rate: 1,
              Yesterday_Exporting_exchange_rate: 1,
              Yesterday_Importing_exchange_rate: 1,
              total_export_value: 1,
              interconnected_countries: 1,
              Country_Index: 1,
              Importing_Country_Index: 1,
            },
          },
        ])
      )[0];

      const commodity_tradeValue = await Trade.aggregate([
        {
          $match: { Exporting_country: exporter, Importing_country: importer },
        },
        { $unwind: "$commodity_tradeValue" },
        {
          $lookup: {
            from: "commodities",
            localField: "commodity_tradeValue.commodity",
            foreignField: "_id",
            as: "commodities",
          },
        },
        {
          $unwind: {
            path: "$commodities",
            preserveNullAndEmptyArrays: false,
          },
        },

        {
          $addFields: {
            commodity: "$commodities.commodity",
            export_value: "$commodity_tradeValue.export_value",
            category: "$commodities.category",
          },
        },
        {
          $project: {
            _id: 0,
            commodity: 1,
            export_value: 1,
            category: 1,
          },
        },

        { $limit: 20 },
      ]);

      const between = { ...payload, commodity_tradeValue };

      if (!between)
        return res.status(NOT_FOUND).send({
          error: "Trade between these two countries has not been stored.",
        });

      const options = {
        format: "A4",
        orientation: "portrait",
        phantomPath: "./node_modules/phantomjs-prebuilt/bin/phantomjs",
        // phantomPath: "./node_modules/phantomjs/bin/phantomjs",
        // phantomPath: "../../../node_modules/phantomjs-prebuilt/bin/phantomjs",
      };
      const script2 = resolve(
        resolve(
          __dirname,
          "../../",
          `modules/pdf/${exporter}-${importer}-coverPage.pdf`
        )
      );
      const script3 = resolve(
        resolve(
          __dirname,
          "../../",
          `modules/pdf/${exporter}-${importer}-opportunityIndex.pdf`
        )
      );
      const script4 = resolve(
        resolve(
          __dirname,
          "../../",
          `modules/pdf/${exporter}-${importer}-commodity1.pdf`
        )
      );

      const script5 = resolve(
        resolve(
          __dirname,
          "../../",
          `modules/pdf/${exporter}-${importer}-commodity2.pdf`
        )
      );

      const script6 = resolve(
        resolve(
          __dirname,
          "../../",
          `modules/pdf/${exporter}-${importer}-interconnected.pdf`
        )
      );
      const script7 = resolve(
        resolve(
          __dirname,
          "../../",
          `modules/pdf/${exporter}-${importer}-glossary.pdf`
        )
      );
      const script8 = resolve(
        resolve(
          __dirname,
          "../../",
          `modules/pdf/${exporter}-${importer}-back-page.pdf`
        )
      );
      const final = resolve(
        resolve(
          __dirname,
          "../../",
          `modules/pdf/${exporter}-${importer}-${moment().format(
            "YYYY-MM-DD"
          )}.pdf`
        )
      );

      return res.render(
        "cover-page",
        { backend, exporter, importer, export_code, import_code },
        function (err, html) {
          if (err) console.log(err.message);
          pdf.create(html, options).toFile(script2, function (err, result) {
            if (err) {
              console.log(err);
              return res
                .status(BAD_REQUEST)
                .send({ message: "Error creating pdf at cover-page" });
            }
            res.render(
              "opportunity-page",
              {
                backend,
                exporter,
                importer,
                export_code,
                import_code,
                opi: between.Opportunity_Index,
                trade_value: between.total_export_value
                  ? value2(between.total_export_value)
                  : "0",
                sci: between.scaled_sci,
                dist: Number(between.dist)
                  ? dist(between.dist) + " km"
                  : "Not Available",
                exporter_gdp: value(between.Exporting_GDP),
                importer_gdp: value(between.Importing_GDP),
                exporter_region: between.Exporting_region,
                importer_region: between.Importing_region,
                exporter_foreign_exchange: dist(
                  foreignEx(between.Exporting_exchange_rate)
                ),
                importer_foreign_exchange: dist(
                  foreignEx(between.Importing_exchange_rate)
                ),
                com_lang: between.comlang_off === 1 ? "YES" : "NO",
                com_border: between.contig === 1 ? "YES" : "NO",
                exporter_trade_blocks: between.Exporting_RECs.replace(
                  /;/g,
                  ","
                ),
                importer_trade_blocks: between.Importing_RECs.replace(
                  /;/g,
                  ","
                ),
                country_index: between.Country_Index,
                importing_country_index: between.Importing_Country_Index,
                year: between.year,
              },
              function (err, html) {
                pdf
                  .create(html, options)
                  .toFile(script3, async function (err, result) {
                    if (err)
                      return res.status(BAD_REQUEST).send({
                        message: "Error creating pdf at opportunity page",
                      });
                    res.render(
                      "commodities-page-one",
                      {
                        backend,
                        exporter,
                        importer,
                        export_code,
                        import_code,
                        commodity1: properCase(
                          between.commodity_tradeValue[0].commodity
                        ),
                        commodity2: properCase(
                          between.commodity_tradeValue[1].commodity
                        ),
                        commodity3: properCase(
                          between.commodity_tradeValue[2].commodity
                        ),
                        commodity4: properCase(
                          between.commodity_tradeValue[3].commodity
                        ),
                        commodity5: properCase(
                          between.commodity_tradeValue[4].commodity
                        ),
                        commodity6: properCase(
                          between.commodity_tradeValue[5].commodity
                        ),
                        commodity7: properCase(
                          between.commodity_tradeValue[6].commodity
                        ),
                        commodity8: properCase(
                          between.commodity_tradeValue[7].commodity
                        ),
                        commodity9: properCase(
                          between.commodity_tradeValue[8].commodity
                        ),
                        commodity10: properCase(
                          between.commodity_tradeValue[9].commodity
                        ),
                        export_value1: value3(
                          between.commodity_tradeValue[0].export_value
                        ),
                        export_value2: value3(
                          between.commodity_tradeValue[1].export_value
                        ),
                        export_value3: value3(
                          between.commodity_tradeValue[2].export_value
                        ),
                        export_value4: value3(
                          between.commodity_tradeValue[3].export_value
                        ),
                        export_value5: value3(
                          between.commodity_tradeValue[4].export_value
                        ),
                        export_value6: value3(
                          between.commodity_tradeValue[5].export_value
                        ),
                        export_value7: value3(
                          between.commodity_tradeValue[6].export_value
                        ),
                        export_value8: value3(
                          between.commodity_tradeValue[7].export_value
                        ),
                        export_value9: value3(
                          between.commodity_tradeValue[8].export_value
                        ),
                        export_value10: value3(
                          between.commodity_tradeValue[9].export_value
                        ),

                        opi: between.Opportunity_Index,
                        trade_value: between.total_export_value
                          ? value2(between.total_export_value)
                          : 0,
                        year: between.year,
                      },
                      function (err, html) {
                        pdf
                          .create(html, options)
                          .toFile(script4, async function (err, result) {
                            if (err)
                              return res.status(BAD_REQUEST).send({
                                message:
                                  "Error creating pdf at commodities page 1",
                              });
                            res.render(
                              "commodities-page-two",
                              {
                                backend,
                                exporter,
                                importer,
                                export_code,
                                import_code,
                                commodity1: properCase(
                                  between.commodity_tradeValue[10].commodity
                                ),
                                commodity2: properCase(
                                  between.commodity_tradeValue[11].commodity
                                ),
                                commodity3: properCase(
                                  between.commodity_tradeValue[12].commodity
                                ),
                                commodity4: properCase(
                                  between.commodity_tradeValue[13].commodity
                                ),
                                commodity5: properCase(
                                  between.commodity_tradeValue[14].commodity
                                ),
                                commodity6: properCase(
                                  between.commodity_tradeValue[15].commodity
                                ),
                                commodity7: properCase(
                                  between.commodity_tradeValue[16].commodity
                                ),
                                commodity8: properCase(
                                  between.commodity_tradeValue[17].commodity
                                ),
                                commodity9: properCase(
                                  between.commodity_tradeValue[18].commodity
                                ),
                                commodity10: properCase(
                                  between.commodity_tradeValue[19].commodity
                                ),
                                export_value1: value3(
                                  between.commodity_tradeValue[10].export_value
                                ),
                                export_value2: value3(
                                  between.commodity_tradeValue[11].export_value
                                ),
                                export_value3: value3(
                                  between.commodity_tradeValue[12].export_value
                                ),
                                export_value4: value3(
                                  between.commodity_tradeValue[13].export_value
                                ),
                                export_value5: value3(
                                  between.commodity_tradeValue[14].export_value
                                ),
                                export_value6: value3(
                                  between.commodity_tradeValue[15].export_value
                                ),
                                export_value7: value3(
                                  between.commodity_tradeValue[16].export_value
                                ),
                                export_value8: value3(
                                  between.commodity_tradeValue[17].export_value
                                ),
                                export_value9: value3(
                                  between.commodity_tradeValue[18].export_value
                                ),
                                export_value10: value3(
                                  between.commodity_tradeValue[19].export_value
                                ),

                                opi: between.Opportunity_Index,
                                trade_value: between.total_export_value
                                  ? value2(between.total_export_value)
                                  : 0,
                                year: between.year,
                              },
                              function (err, html) {
                                pdf
                                  .create(html, options)
                                  .toFile(
                                    script5,
                                    async function (err, result) {
                                      console.log(err);
                                      if (err)
                                        return res.status(BAD_REQUEST).send({
                                          message:
                                            "Error creating pdf at commodities page 2",
                                        });

                                      const interconnected_countries =
                                        await Trade.aggregate([
                                          {
                                            $match: {
                                              Exporting_country: exporter,
                                              Importing_country: {
                                                $in: between.interconnected_countries,
                                              },
                                            },
                                          },

                                          {
                                            $project: {
                                              _id: 0,
                                              commodity_tradeValue: {
                                                $slice: [
                                                  "$commodity_tradeValue",
                                                  3,
                                                ],
                                              },
                                              top_commodity: 1,
                                              Exporting_country: 1,
                                              Importing_country: 1,
                                              iso2_export: 1,
                                              iso2_import: 1,
                                              Commodities_count: 1,
                                              Opportunity_Index: 1,
                                              scaled_sci: 1,
                                              trade_value:
                                                "$total_export_value",
                                              total_export_value: 1,
                                              year: 1,
                                            },
                                          },

                                          { $unwind: "$commodity_tradeValue" },
                                          {
                                            $lookup: {
                                              from: "commodities",
                                              localField:
                                                "commodity_tradeValue.commodity",
                                              foreignField: "_id",
                                              as: "commodities",
                                            },
                                          },
                                          {
                                            $unwind: {
                                              path: "$commodities",
                                              preserveNullAndEmptyArrays: false,
                                            },
                                          },
                                          {
                                            $addFields: {
                                              commodity:
                                                "$commodities.commodity",
                                              export_value:
                                                "$commodity_tradeValue.export_value",
                                              category: "$commodities.category",
                                            },
                                          },
                                          {
                                            $group: {
                                              _id: {
                                                Exporting_country:
                                                  "$Exporting_country",
                                                Importing_country:
                                                  "$Importing_country",
                                                iso2_export: "$iso2_export",
                                                iso2_import: "$iso2_import",
                                                Commodities_count:
                                                  "$Commodities_count",
                                                Opportunity_Index:
                                                  "$Opportunity_Index",
                                              },
                                              commodity_tradeValue: {
                                                $push: {
                                                  commodity: "$commodity",
                                                  export_value: "$export_value",
                                                  category: "$category",
                                                },
                                              },
                                            },
                                          },
                                          {
                                            $project: {
                                              _id: 0,
                                              Exporting_country:
                                                "$_id.Exporting_country",
                                              Importing_country:
                                                "$_id.Importing_country",
                                              Opportunity_Index:
                                                "$_id.Opportunity_Index",
                                              iso2_export: "$_id.iso2_export",
                                              iso2_import: "$_id.iso2_import",
                                              Commodities_count:
                                                "$_id.Commodities_count",
                                              commodity_tradeValue:
                                                "$commodity_tradeValue",
                                            },
                                          },
                                          { $sort: { Opportunity_Index: -1 } },
                                        ]);
                                      div(
                                        backend,
                                        interconnected_countries,
                                        importer,
                                        exporter,
                                        export_code,
                                        import_code,
                                        between.Opportunity_Index,
                                        between.total_export_value
                                          ? value2(between.total_export_value)
                                          : 0,
                                        between.year
                                      );
                                      res.render(
                                        "interconn",
                                        function (err, html) {
                                          pdf
                                            .create(html, options)
                                            .toFile(
                                              script6,
                                              async function (err, result) {
                                                if (err)
                                                  return res
                                                    .status(BAD_REQUEST)
                                                    .send({
                                                      message:
                                                        "Error creating pdf at interconnected",
                                                    });

                                                res.render(
                                                  "glossary-page",
                                                  { backend },
                                                  function (err, html) {
                                                    pdf
                                                      .create(html, options)
                                                      .toFile(
                                                        script7,
                                                        async function (
                                                          err,
                                                          result
                                                        ) {
                                                          if (err)
                                                            return res
                                                              .status(
                                                                BAD_REQUEST
                                                              )
                                                              .send({
                                                                message:
                                                                  "Error creating pdf at glossary",
                                                              });
                                                          res.render(
                                                            "back-page",
                                                            { backend },
                                                            function (
                                                              err,
                                                              html
                                                            ) {
                                                              pdf
                                                                .create(
                                                                  html,
                                                                  options
                                                                )
                                                                .toFile(
                                                                  script8,
                                                                  async function (
                                                                    err,
                                                                    result
                                                                  ) {
                                                                    if (err)
                                                                      return res
                                                                        .status(
                                                                          BAD_REQUEST
                                                                        )
                                                                        .send({
                                                                          message:
                                                                            "Error creating pdf",
                                                                        });
                                                                    const pdfDoc =
                                                                      new HummusRecipe(
                                                                        script2,
                                                                        final
                                                                      );

                                                                    pdfDoc
                                                                      // just page 10
                                                                      .appendPage(
                                                                        script3
                                                                      )
                                                                      // page 4 and page 6
                                                                      .appendPage(
                                                                        script4
                                                                      )
                                                                      // page 1-3 and 6-20
                                                                      .appendPage(
                                                                        script5
                                                                      )
                                                                      // all pages
                                                                      .appendPage(
                                                                        script6
                                                                      )
                                                                      .appendPage(
                                                                        script7
                                                                      )
                                                                      .appendPage(
                                                                        script8
                                                                      )

                                                                      .endPDF();
                                                                    //   const data = fs.readFileSync(
                                                                    //     final
                                                                    //   );
                                                                    res.header(
                                                                      "content-type",
                                                                      "application/pdf"
                                                                    );
                                                                    fs.unlinkSync(
                                                                      script2
                                                                    );
                                                                    fs.unlinkSync(
                                                                      script3
                                                                    );
                                                                    fs.unlinkSync(
                                                                      script4
                                                                    );
                                                                    fs.unlinkSync(
                                                                      script5
                                                                    );
                                                                    fs.unlinkSync(
                                                                      script6
                                                                    );
                                                                    fs.unlinkSync(
                                                                      script7
                                                                    );
                                                                    fs.unlinkSync(
                                                                      script8
                                                                    );
                                                                    return res.download(
                                                                      final,
                                                                      function (
                                                                        err
                                                                      ) {
                                                                        if (err)
                                                                          return console.log(
                                                                            err
                                                                          );
                                                                        fs.unlinkSync(
                                                                          final
                                                                        );
                                                                      }
                                                                    );
                                                                  }
                                                                );
                                                            }
                                                          );
                                                        }
                                                      );
                                                  }
                                                );
                                              }
                                            );
                                        }
                                      );
                                    }
                                  );
                              }
                            );
                          });
                      }
                    );
                  });
              }
            );
          });
        }
      );
    };
  }
};
