import { getGlobalConfig } from "@tools/test-tools";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

// Performance tests require the PROD version of the CDN (babylon-server)

let skipUnneededTest = false;
let fileSizes;
let fileSizesBaseline;

describe("ES6 modules files size", () => {
    beforeAll(async () => {
        // read the json file with the file sizes
        if (fs.existsSync(path.join(__dirname, "packageSizeBaseline.json"))) {
            fileSizesBaseline = JSON.parse(fs.readFileSync(path.join(__dirname, "packageSizeBaseline.json"), "utf8"));
        }
        if (fileSizes) {
            return;
        }
        // get the fileSize.log file. If it doesn't exist, skip this test
        const request: {
            status: number;
            data: string;
        } = await new Promise((resolve) => {
            const url = getGlobalConfig().baseUrl + "/fileSizes.json";
            if (!url.startsWith("https://")) {
                skipUnneededTest = true;
                return resolve({
                    status: 200,
                    data: "{}",
                });
            }
            https
                .get(getGlobalConfig().baseUrl + "/fileSizes.json", (res) => {
                    let data = [];
                    const headerDate = res.headers && res.headers.date ? res.headers.date : "no response date";
                    console.log("Status Code:", res.statusCode);
                    console.log("Date in Response header:", headerDate);

                    res.on("data", (chunk) => {
                        data.push(chunk);
                    });

                    res.on("end", () => {
                        resolve({
                            status: res.statusCode,
                            data: Buffer.concat(data).toString(),
                        });
                    });
                })
                .on("error", (err) => {
                    console.log("Error: ", err.message);
                });
        });

        //(getGlobalConfig().baseUrl + "/fileSizes.json");
        if (request.status !== 200) {
            skipUnneededTest = true;
        } else {
            fileSizes = JSON.parse(request.data);
        }
    });

    if (!skipUnneededTest) {
        test("Should keep module sizes within the accepted threshold", async () => {
            if (skipUnneededTest || !fileSizes) {
                console.log("no file sizes reported, skipping");
                return;
            }
            Object.keys(fileSizesBaseline).forEach((key) => {
                const fileSize = fileSizes[key + ".js"];
                const fileSizeBaseline = fileSizesBaseline[key];
                if (fileSize) expect(fileSize).toBeLessThanOrEqual(fileSizeBaseline + 10000 /*fileSizeBaseline * 0.02*/);
            });
        }, 30000);
    }
});
