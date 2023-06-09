const fs = require("fs");
const path = require("path");

const DIFF_DIRECTORY = path.join(__dirname, "..", "jest-screenshot-report");

class ImageDiffReporter {
    /* istanbul ignore next - test coverage in child process */
    onRunStart() {
        try {
            fs.statSync(DIFF_DIRECTORY);
        } catch (e) {
            fs.mkdirSync(DIFF_DIRECTORY, { recursive: true });
        }

        // cleanup
        const files = fs.readdirSync(DIFF_DIRECTORY);

        if (files.length > 0) {
            files.forEach(function (filename) {
                if (fs.statSync(DIFF_DIRECTORY + "/" + filename).isDirectory()) {
                    this.removeDir(DIFF_DIRECTORY + "/" + filename);
                } else {
                    fs.unlinkSync(DIFF_DIRECTORY + "/" + filename);
                }
            });
        }
    }

    /* istanbul ignore next - test coverage in child process */
    onRunComplete() {
        const files = fs.readdirSync(DIFF_DIRECTORY);
        const imagesHtml = files.map((file) => `<h3>${file.replace("-diff.png", "")}</h3><img src="./${file}" />`).join("\n");
        // write index.html
        const html = `

            <html>
                <head>
                    <title>Diff reporter</title>
                    </head>
                    <body>
                        <h1>Diff reporter</h1>
                        ${imagesHtml}
                    </body>
                </html>
            `;
        fs.writeFileSync(path.join(DIFF_DIRECTORY, "index.html"), html);
    }
}

module.exports = ImageDiffReporter;
