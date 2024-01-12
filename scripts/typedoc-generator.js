/* eslint-disable no-console */
const TypeDoc = require("typedoc");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const { commentAnalyzer } = require("./comment-analyzer");
// const { run } = require("jest");
const exec = require("child_process").exec;

function runCommand(command) {
    return new Promise((resolve, reject) => {
        // console.log(command);
        exec(command, function (error, stdout, stderr) {
            if (error || typeof stderr !== "string") {
                console.log(error);
                return reject(error || stderr);
            }
            // console.log(stderr || stdout);
            return resolve(stderr || stdout);
        });
    });
}

const warnings = [];

function warn(filePath, message) {
    warnings.push({
        filePath,
        message,
    });
    console.log(filePath, message);
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
            },
            excludeInternal: true,
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
            // if (entryPoints.includes(filePath)) {
            warn(filePath, msg);
            // }
        });
    }
}

async function main() {
    const full = process.argv.includes("--full");
    // const branch = (await runCommand("git rev-parse --abbrev-ref HEAD")).trim();
    const filesChanged = (await runCommand("git diff --name-only master")).split("\n");
    const files = glob.sync("packages/dev/**/src/**/*.ts").filter((f) => !f.endsWith("index.ts"));
    const dirList = files.filter((file) => {
        return file.endsWith(".ts");
    });

    if (!fs.existsSync("tmp")) {
        fs.mkdirSync("tmp");
    }

    await generateTypedocAndAnalyze(dirList, full ? undefined : filesChanged);

    console.log("Done. Removing tmp folder.");
    fs.rmSync("tmp", { recursive: true, force: true });

    if (warnings.length > 0) {
        console.error(`Found ${warnings.length} warnings.`);
        // generate junit.xml from the warnings
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
    <testsuite name="Typedoc Warnings" tests="${warnings.length}">
        ${warnings
            .map(
                (w) => `<testcase name="${w.filePath}" >
        <failure message="${generateMessageFromError(w.message)}"></failure></testcase>`
            )
            .join("\n")}
    </testsuite>
</testsuites>`;
        fs.writeFileSync("junit.xml", xml);
        // process.env.
        process.exit(1);
    }
}

main().catch(console.error);
