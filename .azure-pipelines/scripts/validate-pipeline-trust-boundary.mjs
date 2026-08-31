#!/usr/bin/env node
/**
 * Validates the CI trust boundary described in .azure-pipelines/VARIABLE-GROUPS.md.
 *
 * The boundary is structural, not procedural: pipelines that Azure DevOps
 * compiles from pull request branches must not be able to request a
 * secret-bearing protected resource, because a pull request can rewrite any
 * gate written inside their YAML - including a same-branch `extends:` template.
 *
 * This script fails the build when that shape regresses. It is deliberately
 * dependency-free (no YAML parser) so it can run in a job that has not
 * installed anything, which is exactly where a credential-free check belongs.
 *
 * Usage: node .azure-pipelines/scripts/validate-pipeline-trust-boundary.mjs
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PipelinesDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Variable groups that carry a credential. None of these may be reachable from a PR-compiled pipeline. */
const SecretVariableGroups = new Set(["BabylonJS-Deployment", "Browserstack-Opensource"]);

/** Pipeline-level secret variables configured in the Azure DevOps UI. */
const SecretVariableNames = ["DEPLOY_TOKEN", "GITHUBPAT", "GitHubPAT", "NPM_TOKEN", "BROWSERSTACK_ACCESS_KEY", "BROWSERSTACK_USERNAME"];

const Errors = [];

/**
 * @param {string} file
 * @returns {string}
 */
function read(file) {
    return readFileSync(file, "utf8");
}

/**
 * Reads a pipeline file with comment-only lines blanked out. Documentation in
 * this directory necessarily names the very credentials and anti-patterns this
 * script rejects, so only executable YAML is scanned.
 * @param {string} file
 * @returns {string}
 */
function readCode(file) {
    return read(file)
        .split("\n")
        .map((line) => (/^\s*#/.test(line) ? "" : line))
        .join("\n");
}

/**
 * Collects the template files a pipeline file pulls in, transitively.
 * Both `- template: x.yml` (step/job include) and `extends: template: x.yml` use the same key.
 * @param {string} file absolute path
 * @param {Set<string>} seen
 * @returns {Set<string>}
 */
function collectGraph(file, seen = new Set()) {
    if (seen.has(file)) {
        return seen;
    }
    seen.add(file);

    for (const match of read(file).matchAll(/^\s*(?:-\s+)?template:\s*["']?([^"'\s#@]+\.ya?ml)["']?/gm)) {
        const resolved = path.resolve(path.dirname(file), match[1]);
        if (existsSync(resolved)) {
            collectGraph(resolved, seen);
        } else {
            Errors.push(`${path.relative(PipelinesDirectory, file)} references a template that does not exist: ${match[1]}`);
        }
    }
    return seen;
}

/**
 * A root pipeline is pull-request-compiled unless it declares `pr: none`.
 * @param {string} contents
 * @returns {boolean}
 */
function hasPullRequestTrigger(contents) {
    if (/^pr:\s*none\s*$/m.test(contents)) {
        return false;
    }
    return /^pr:\s*$/m.test(contents) || /^pr:\s*\S/m.test(contents);
}

/**
 * @param {string} contents
 * @returns {string[]}
 */
function referencedGroups(contents) {
    return [...contents.matchAll(/^\s*-\s*group:\s*(\S+)\s*$/gm)].map((match) => match[1]);
}

const rootFiles = readdirSync(PipelinesDirectory)
    .filter((entry) => entry.endsWith(".yml"))
    .map((entry) => path.join(PipelinesDirectory, entry));

let pullRequestPipelineCount = 0;

for (const root of rootFiles) {
    const rootContents = read(root);
    const rootName = path.relative(PipelinesDirectory, root);
    const graph = collectGraph(root);

    if (!hasPullRequestTrigger(rootContents)) {
        continue;
    }
    pullRequestPipelineCount++;

    for (const file of graph) {
        const contents = readCode(file);
        const name = path.relative(PipelinesDirectory, file);

        for (const group of referencedGroups(contents)) {
            if (SecretVariableGroups.has(group)) {
                Errors.push(
                    `${rootName} is compiled from pull request branches but ${name} maps the secret variable group '${group}'. ` +
                        `Move that work into a pipeline that declares 'pr: none'.`
                );
            }
        }

        for (const secret of SecretVariableNames) {
            if (new RegExp(`\\$\\(${secret}\\)`).test(contents)) {
                Errors.push(`${rootName} is compiled from pull request branches but ${name} reads the secret variable '${secret}'.`);
            }
        }

        if (/gitHubConnection:/.test(contents)) {
            Errors.push(`${rootName} is compiled from pull request branches but ${name} uses a GitHub service connection.`);
        }
    }
}

if (pullRequestPipelineCount === 0) {
    Errors.push("No pull-request-triggered pipeline was found. The detection in this script has probably drifted from the pipeline layout.");
}

// A tag can be named 'master', and Build.SourceBranchName is only the last
// segment of the ref, so it must never be used to decide whether a run is
// trusted. Full refs (Build.SourceBranch) or TrustedBranchName only.
for (const file of new Set(rootFiles.flatMap((root) => [...collectGraph(root)]))) {
    const contents = readCode(file);
    const name = path.relative(PipelinesDirectory, file);
    if (/Build\.SourceBranchName/.test(contents)) {
        Errors.push(`${name} uses Build.SourceBranchName. A tag can be named 'master', so compare the full Build.SourceBranch ref, or use TrustedBranchName.`);
    }

    // Credentials must never reach a command line, where any other process on
    // the agent can read them out of the process table.
    for (const secret of SecretVariableNames) {
        if (new RegExp(`(?:curl|wget|git)[^\\n]*\\$\\(${secret}\\)`).test(contents)) {
            Errors.push(`${name} passes '${secret}' on a command line. Pass it through stdin or an environment variable instead.`);
        }
        if (new RegExp(`https?://[^\\s"']*\\$\\(?${secret}`).test(contents)) {
            Errors.push(`${name} embeds '${secret}' in a URL.`);
        }
    }
}

// A credentialed step must not interpolate a caller-supplied value into its
// script body. Both `${{ }}` template expressions and `$( )` macros are textual
// substitutions performed before the script runs, so a value containing a quote
// breaks out of the string it lands in and executes next to the credential -
// and it does so before any in-script validation can reject it. Such values must
// be passed through `env:` and dereferenced as shell variables instead.
const SystemVariablePrefixes = ["Build.", "Agent.", "Pipeline.", "System.", "Environment.", "Release."];

/**
 * Splits a pipeline file into inline-script steps.
 * @param {string} contents
 * @returns {{ indent: number, body: string, tail: string }[]}
 */
function inlineScriptSteps(contents) {
    const lines = contents.split("\n");
    const steps = [];

    for (let index = 0; index < lines.length; index++) {
        const start = /^(\s*)-\s+(?:bash|script|powershell|pwsh):\s*\|/.exec(lines[index]);
        if (!start) {
            continue;
        }
        const indent = start[1].length;
        const bodyLines = [];
        const tailLines = [];
        let inBody = true;

        for (let cursor = index + 1; cursor < lines.length; cursor++) {
            const line = lines[cursor];
            const lineIndent = line.search(/\S/);
            if (lineIndent !== -1 && lineIndent <= indent) {
                break;
            }
            if (inBody && lineIndent !== -1 && lineIndent <= indent + 2) {
                inBody = false;
            }
            (inBody ? bodyLines : tailLines).push(line);
        }
        steps.push({ indent, body: bodyLines.join("\n"), tail: tailLines.join("\n") });
    }
    return steps;
}

for (const file of new Set(rootFiles.flatMap((root) => [...collectGraph(root)]))) {
    const name = path.relative(PipelinesDirectory, file);
    for (const step of inlineScriptSteps(readCode(file))) {
        const holdsSecret = SecretVariableNames.some((secret) => new RegExp(`\\$\\(${secret}\\)`).test(step.tail));
        if (!holdsSecret) {
            continue;
        }

        if (/\$\{\{\s*(parameters|variables)\./.test(step.body)) {
            Errors.push(
                `${name} interpolates a template expression into the body of a script that holds a credential. Pass the value through 'env:' and read it as a shell variable.`
            );
        }

        for (const macro of step.body.matchAll(/\$\(([A-Za-z_][A-Za-z0-9_.]*)\)/g)) {
            const variable = macro[1];
            if (SystemVariablePrefixes.some((prefix) => variable.startsWith(prefix))) {
                continue;
            }
            Errors.push(`${name} interpolates '$(${variable})' into the body of a script that holds a credential. Pass it through 'env:' and read it as a shell variable.`);
        }
    }
}

// npm publish must never run lifecycle scripts while a registry token is reachable.
const publishFile = path.join(PipelinesDirectory, "cd-publish.yml");
if (existsSync(publishFile)) {
    const contents = readCode(publishFile);
    for (const match of contents.matchAll(/^\s*npm (publish|pack)\b[^\n]*/gm)) {
        if (!match[0].includes("--ignore-scripts")) {
            Errors.push(`cd-publish.yml runs '${match[0].trim()}' without --ignore-scripts.`);
        }
    }
}

const uniqueErrors = [...new Set(Errors)];

if (uniqueErrors.length > 0) {
    console.error("CI trust boundary violations:\n");
    for (const error of uniqueErrors) {
        console.error(`  - ${error}`);
    }
    console.error("\nSee .azure-pipelines/VARIABLE-GROUPS.md, section 'CI trust boundary'.");
    process.exit(1);
}

console.log(`CI trust boundary OK (${pullRequestPipelineCount} pull-request-compiled pipeline(s) checked, all credential-free).`);
