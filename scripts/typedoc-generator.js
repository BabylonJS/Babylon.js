/* eslint-disable no-console */
const TypeDoc = require("typedoc");
const fs = require("fs");
const glob = require("glob");
const { commentAnalyzer } = require("./comment-analyzer");
// const { run } = require("jest");
const exec = require("child_process").exec;

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, function (error, stdout, stderr) {
            if (error || typeof stderr !== "string") {
                console.log(error);
                return reject(error || stderr);
            }
            return resolve(stderr || stdout);
        });
    });
}

const warnings = {};

function warn(filePath, message) {
    if (!warnings[filePath]) {
        warnings[filePath] = message;
        console.log(filePath, message);
    }
}

function generateMessageFromError(error) {
    return `(${error.fileName}) ${error.componentName} in ${error.parentName} is missing ${error.missingParamNames ? "Parameter definition" : "Comment"} [${
        error.missingParamNames ? error.missingParamNames.join(", ") : ""
    }]`;
}

async function generateTypedocAndAnalyze(entryPoints, filesChanged) {
    const app = await TypeDoc.Application.bootstrapWithPlugins(
        {
            entryPoints,
            skipErrorChecking: true,
            compilerOptions: {
                skipLibCheck: true,
                paths: {
                    "core/*": ["packages/dev/core/src/*"],
                    "loaders/*": ["packages/dev/loaders/src/*"],
                    "materials/*": ["packages/dev/materials/src/*"],
                    "gui/*": ["packages/dev/gui/src/*"],
                    "serializers/*": ["packages/dev/serializers/src/*"],
                },
            },
            // Not using ignoreExternals, as if a public class extending an internal one it will claim the comments are missing.
            // excludeInternal: true,
        },
        []
    );
    console.log("Converting...");
    const project = await app.convert();
    console.log("Converting, generating JSON...");
    if (project) {
        const outputDir = "tmp";
        await app.generateJson(project, `${outputDir}/typedoc.json`);

        const data = JSON.parse(fs.readFileSync(`${outputDir}/typedoc.json`, "utf8"));
        console.log("Analyzing...");
        const msgs = commentAnalyzer(data);
        // check if the message is in one of the files that has been changed
        console.log(filesChanged);
        msgs.forEach((msg) => {
            const filePath = msg.fileName;
            if (filesChanged) {
                if (!filesChanged.includes(filePath)) {
                    return;
                }
            }
            warn(filePath, msg);
        });
    }
}

async function main() {
    const packages = process.argv.includes("--packages") ? process.argv[process.argv.indexOf("--packages") + 1].split(",") : ["core", "loaders", "materials", "gui", "serializers"];
    const full = process.argv.includes("--full");
    const filesChanged = (await runCommand(process.env.GIT_CHANGES_COMMAND || "git diff --name-only master")).split("\n");
    const files = glob.sync(`packages/dev/@(${packages.join("|")})/src/index.ts`).filter((f) => /*!f.endsWith("index.ts") && */ !f.endsWith(".d.ts"));
    console.log(files);
    const dirList = files.filter((file) => {
        return file.endsWith(".ts");
    });

    if (!fs.existsSync("tmp")) {
        fs.mkdirSync("tmp");
    }

    await generateTypedocAndAnalyze(dirList, full ? undefined : filesChanged);

    console.log("Done. Removing tmp folder.");
    // fs.rmSync("tmp", { recursive: true, force: true });

    if (Object.keys(warnings).length > 0) {
        console.error(`Found ${Object.keys(warnings).length} warnings.`);
        // generate junit.xml from the warnings
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
    <testsuite name="Typedoc Warnings" tests="${Object.keys(warnings).length}">
        ${Object.keys(warnings)
            .map(
                (w) => `<testcase name="${w}" >
        <failure message="${generateMessageFromError(warnings[w])}"></failure></testcase>`
            )
            .join("\n")}
    </testsuite>
</testsuites>`;
        fs.writeFileSync("junit.xml", xml);
        // if in CI, save to errors.txt
        if (process.env.CI) {
            const messages = Object.keys(warnings)
                .map((w) => `${w} ${generateMessageFromError(Object.keys(warnings)[w])}`)
                .join("\n");
            fs.writeFileSync("errors.txt", messages);
            // log to the console
            console.log(`
Found ${Object.keys(warnings).length} typedoc errors:

${messages}`);
        }
        process.exit(1);
    }
}

main().catch(console.error);
