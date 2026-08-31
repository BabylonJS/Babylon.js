#!/usr/bin/env node
/**
 * Validates the CI trust boundary described in .azure-pipelines/VARIABLE-GROUPS.md.
 *
 * The boundary is structural, not procedural: pipelines that Azure DevOps
 * compiles from pull request branches must not be able to request a
 * secret-bearing protected resource, because a pull request can rewrite any
 * gate written inside their YAML - including a same-branch `extends:` template.
 *
 * The second half of the boundary is that the credentialed pipelines, which are
 * compiled from master, must not build their scripts out of runtime text.
 * `$( )` macros and `${{ }}` template expressions are *textual* substitutions
 * performed while the step is rendered, before the first line of it runs, so a
 * value containing a quote breaks out of the string it lands in and executes
 * next to the credential. That includes Azure's own build metadata: a git ref
 * may contain `"`, `;` and `$`, so
 *
 *     SOURCE_BRANCH="$(Build.SourceBranch)"
 *
 * is attacker-controlled shell, not an assignment. Every value a credentialed
 * script uses must arrive through `env:` and be dereferenced as a shell
 * variable, where it can only ever be data.
 *
 * This script fails the build when either shape regresses. It is deliberately
 * dependency-free (no YAML parser) so it can run in a job that has not
 * installed anything, which is exactly where a credential-free check belongs.
 *
 * Usage:
 *   node .azure-pipelines/scripts/validate-pipeline-trust-boundary.mjs
 *   node .azure-pipelines/scripts/validate-pipeline-trust-boundary.mjs --self-test
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const PipelinesDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Variable groups that carry a credential. None of these may be reachable from a PR-compiled pipeline. */
const SecretVariableGroups = new Set(["BabylonJS-Deployment", "Browserstack-Opensource"]);

/** Pipeline-level secret variables configured in the Azure DevOps UI. */
const SecretVariableNames = ["DEPLOY_TOKEN", "GITHUBPAT", "GitHubPAT", "NPM_TOKEN", "BROWSERSTACK_ACCESS_KEY", "BROWSERSTACK_USERNAME"];

/** The gate every credentialed job runs first. It is credentialed by definition, whoever includes it. */
const TrustGateTemplate = "templates/assert-trusted-source.yml";

/**
 * @param {string} file
 * @returns {string}
 */
function read(file) {
    return readFileSync(file, "utf8");
}

/**
 * Blanks comment-only lines. Documentation in this directory necessarily names
 * the very credentials and anti-patterns this script rejects, so only
 * executable YAML is scanned.
 * @param {string} contents
 * @returns {string}
 */
function stripComments(contents) {
    return contents
        .split("\n")
        .map((line) => (/^\s*#/.test(line) ? "" : line))
        .join("\n");
}

/**
 * @param {string} file
 * @returns {string}
 */
function readCode(file) {
    return stripComments(read(file));
}

/**
 * Collects the template files a pipeline file pulls in, transitively.
 * Both `- template: x.yml` (step/job include) and `extends: template: x.yml` use the same key.
 * @param {string} file absolute path
 * @param {string[]} errors
 * @param {Set<string>} seen
 * @returns {Set<string>}
 */
function collectGraph(file, errors, seen = new Set()) {
    if (seen.has(file)) {
        return seen;
    }
    seen.add(file);

    for (const match of read(file).matchAll(/^\s*(?:-\s+)?template:\s*["']?([^"'\s#@]+\.ya?ml)["']?/gm)) {
        const resolved = path.resolve(path.dirname(file), match[1]);
        if (existsSync(resolved)) {
            collectGraph(resolved, errors, seen);
        } else {
            errors.push(`${path.relative(PipelinesDirectory, file)} references a template that does not exist: ${match[1]}`);
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

/**
 * True when a file maps a secret variable group or reads a secret variable, and
 * therefore puts a credential in scope for the jobs it defines.
 * @param {string} contents already comment-stripped
 * @returns {boolean}
 */
function holdsCredential(contents) {
    if (referencedGroups(contents).some((group) => SecretVariableGroups.has(group))) {
        return true;
    }
    return SecretVariableNames.some((secret) => new RegExp(`\\$\\(${secret}\\)`).test(contents));
}

// ---------------------------------------------------------------------------
// Interpolation detection
// ---------------------------------------------------------------------------

/**
 * Distinguishes an Azure macro from a bash command substitution. Both are
 * spelled `$( )`. A macro names a pipeline variable: a bare identifier, and -
 * because Azure's own variables are dotted (`Build.SourceBranch`) and this
 * repository's are upper case (`SNAPSHOT_CDN_URL`, `NpmAuthConfig`) - it always
 * contains a dot or an upper-case letter. A command substitution either carries
 * arguments (`$(mktemp -d)`) or names a lower-case command (`$(pwd)`).
 * @param {string} inner text between the parentheses
 * @returns {boolean}
 */
function isAzureMacro(inner) {
    if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(inner)) {
        return false;
    }
    return inner.includes(".") || /[A-Z]/.test(inner);
}

/**
 * Splits a pipeline file into inline-script steps, both the block form
 * (`- bash: |`) and the single-line form (`- bash: some command`).
 * @param {string} contents already comment-stripped
 * @returns {{ line: number, body: string, tail: string }[]}
 */
function inlineScriptSteps(contents) {
    const lines = contents.split("\n");
    const steps = [];

    for (let index = 0; index < lines.length; index++) {
        const start = /^(\s*)-\s+(?:bash|script|powershell|pwsh):\s*(\|-?|>-?)?\s*(.*)$/.exec(lines[index]);
        if (!start) {
            continue;
        }
        const indent = start[1].length;
        const isBlock = Boolean(start[2]);
        const bodyLines = isBlock ? [] : [start[3]];
        const tailLines = [];
        let inBody = isBlock;

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
        steps.push({ line: index + 1, body: bodyLines.join("\n"), tail: tailLines.join("\n") });
    }
    return steps;
}

/**
 * Reports every interpolation in a script body.
 * @param {string} body
 * @returns {string[]} the offending expressions, e.g. `$(Build.SourceBranch)`
 */
function interpolationsIn(body) {
    const found = [];
    for (const macro of body.matchAll(/\$\(([^()\n]*)\)/g)) {
        if (isAzureMacro(macro[1])) {
            found.push(`$(${macro[1]})`);
        }
    }
    for (const expression of body.matchAll(/\$\{\{([^}]*)\}\}/g)) {
        found.push(`\${{${expression[1]}}}`);
    }
    return found;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/**
 * No script that runs where a credential is in scope may be built out of
 * interpolated text.
 * @param {string} name display name of the file
 * @param {string} contents already comment-stripped
 * @param {boolean} fileHoldsCredential whether the file itself puts a secret in job scope
 * @returns {string[]}
 */
function checkScriptBodies(name, contents, fileHoldsCredential) {
    const errors = [];
    for (const step of inlineScriptSteps(contents)) {
        const stepHoldsCredential = SecretVariableNames.some((secret) => new RegExp(`\\$\\(${secret}\\)`).test(step.tail));
        if (!fileHoldsCredential && !stepHoldsCredential) {
            continue;
        }
        for (const interpolation of new Set(interpolationsIn(step.body))) {
            errors.push(
                `${name}: the script at line ${step.line} runs where a credential is in scope and interpolates '${interpolation}' into its body. ` +
                    `Pass it through 'env:' and read it as a shell variable.`
            );
        }
    }
    return errors;
}

/**
 * The trust gate decides whether credentialed work may run at all, from values
 * an attacker chooses (the ref name). Nothing may be rendered into it.
 * @param {string} name
 * @param {string} contents already comment-stripped
 * @returns {string[]}
 */
function checkTrustGate(name, contents) {
    const errors = [];
    const steps = inlineScriptSteps(contents);

    if (steps.length === 0) {
        errors.push(`${name}: the trust gate has no inline script step. The gate must be a plain failing step, never a condition.`);
        return errors;
    }

    for (const step of steps) {
        for (const interpolation of new Set(interpolationsIn(step.body))) {
            errors.push(
                `${name}: the trust gate interpolates '${interpolation}' into its script body. A ref name may contain '"', ';' and '$', ` +
                    `so it must arrive through 'env:' and be compared as a shell variable.`
            );
        }
        if (!/^\s*SOURCE_BRANCH:\s*\$\(Build\.SourceBranch\)\s*$/m.test(step.tail)) {
            errors.push(`${name}: the trust gate must read the full ref as 'SOURCE_BRANCH: $(Build.SourceBranch)' in its 'env:' block.`);
        }
        if (!/^\s*REASON:\s*\$\(Build\.Reason\)\s*$/m.test(step.tail)) {
            errors.push(`${name}: the trust gate must read the build reason as 'REASON: $(Build.Reason)' in its 'env:' block.`);
        }
    }
    return errors;
}

/**
 * @param {string} rootName
 * @param {string} name
 * @param {string} contents already comment-stripped
 * @returns {string[]}
 */
function checkPullRequestPipelineFile(rootName, name, contents) {
    const errors = [];

    for (const group of referencedGroups(contents)) {
        if (SecretVariableGroups.has(group)) {
            errors.push(
                `${rootName} is compiled from pull request branches but ${name} maps the secret variable group '${group}'. ` +
                    `Move that work into a pipeline that declares 'pr: none'.`
            );
        }
    }

    for (const secret of SecretVariableNames) {
        if (new RegExp(`\\$\\(${secret}\\)`).test(contents)) {
            errors.push(`${rootName} is compiled from pull request branches but ${name} reads the secret variable '${secret}'.`);
        }
    }

    if (/gitHubConnection:/.test(contents)) {
        errors.push(`${rootName} is compiled from pull request branches but ${name} uses a GitHub service connection.`);
    }

    return errors;
}

/**
 * @param {string} name
 * @param {string} contents already comment-stripped
 * @returns {string[]}
 */
function checkCredentialHandling(name, contents) {
    const errors = [];

    // A tag can be named 'master', and Build.SourceBranchName is only the last
    // segment of the ref, so it must never be used to decide whether a run is
    // trusted. Full refs (Build.SourceBranch) or TrustedBranchName only.
    if (/Build\.SourceBranchName/.test(contents)) {
        errors.push(`${name} uses Build.SourceBranchName. A tag can be named 'master', so compare the full Build.SourceBranch ref, or use TrustedBranchName.`);
    }

    // Credentials must never reach a command line, where any other process on
    // the agent can read them out of the process table.
    for (const secret of SecretVariableNames) {
        if (new RegExp(`(?:curl|wget|git)[^\\n]*\\$\\(${secret}\\)`).test(contents)) {
            errors.push(`${name} passes '${secret}' on a command line. Pass it through stdin or an environment variable instead.`);
        }
        if (new RegExp(`https?://[^\\s"']*\\$\\(?${secret}`).test(contents)) {
            errors.push(`${name} embeds '${secret}' in a URL.`);
        }
    }

    return errors;
}

// ---------------------------------------------------------------------------
// Whole-directory validation
// ---------------------------------------------------------------------------

/**
 * @returns {string[]}
 */
function validatePipelines() {
    const errors = [];

    const rootFiles = readdirSync(PipelinesDirectory)
        .filter((entry) => entry.endsWith(".yml"))
        .map((entry) => path.join(PipelinesDirectory, entry));

    /** Every file reachable from any root. */
    const allFiles = new Set(rootFiles.flatMap((root) => [...collectGraph(root, errors)]));

    /** Files reachable from a root whose graph puts a credential in scope. */
    const credentialedFiles = new Set([path.join(PipelinesDirectory, TrustGateTemplate)].filter((file) => existsSync(file)));

    let pullRequestPipelineCount = 0;

    for (const root of rootFiles) {
        const rootName = path.relative(PipelinesDirectory, root);
        const graph = [...collectGraph(root, errors)];
        const isPullRequestPipeline = hasPullRequestTrigger(read(root));

        if (isPullRequestPipeline) {
            pullRequestPipelineCount++;
            for (const file of graph) {
                errors.push(...checkPullRequestPipelineFile(rootName, path.relative(PipelinesDirectory, file), readCode(file)));
            }
            continue;
        }

        if (graph.some((file) => holdsCredential(readCode(file)))) {
            for (const file of graph) {
                credentialedFiles.add(file);
            }
        }
    }

    if (pullRequestPipelineCount === 0) {
        errors.push("No pull-request-triggered pipeline was found. The detection in this script has probably drifted from the pipeline layout.");
    }

    if (credentialedFiles.size === 0) {
        errors.push("No credentialed pipeline was found. The detection in this script has probably drifted from the pipeline layout.");
    }

    for (const file of allFiles) {
        errors.push(...checkCredentialHandling(path.relative(PipelinesDirectory, file), readCode(file)));
    }

    for (const file of credentialedFiles) {
        errors.push(...checkScriptBodies(path.relative(PipelinesDirectory, file), readCode(file), true));
    }

    // Files outside a credentialed graph can still hold a secret in a single
    // step's `env:`; that step's body is credentialed too.
    for (const file of allFiles) {
        if (!credentialedFiles.has(file)) {
            errors.push(...checkScriptBodies(path.relative(PipelinesDirectory, file), readCode(file), false));
        }
    }

    const gate = path.join(PipelinesDirectory, TrustGateTemplate);
    if (!existsSync(gate)) {
        errors.push(`${TrustGateTemplate} is missing. Credentialed jobs have nothing to assert their source with.`);
    } else {
        errors.push(...checkTrustGate(TrustGateTemplate, readCode(gate)));
    }

    // npm publish must never run lifecycle scripts while a registry token is reachable.
    const publishFile = path.join(PipelinesDirectory, "cd-publish.yml");
    if (existsSync(publishFile)) {
        const contents = readCode(publishFile);
        for (const match of contents.matchAll(/^\s*npm (publish|pack)\b[^\n]*/gm)) {
            if (!match[0].includes("--ignore-scripts")) {
                errors.push(`cd-publish.yml runs '${match[0].trim()}' without --ignore-scripts.`);
            }
        }
    }

    return { errors, pullRequestPipelineCount, credentialedFileCount: credentialedFiles.size };
}

// ---------------------------------------------------------------------------
// Self-test: the detectors must reject the shapes they exist to reject.
// ---------------------------------------------------------------------------

const CredentialedStep = `
steps:
    - bash: |
          set -euo pipefail
          SOURCE_BRANCH="$(Build.SourceBranch)"
          curl "$DEPLOYMENT_SERVER" -H "x: $DEPLOY_TOKEN"
      displayName: "upload"
      env:
          DEPLOY_TOKEN: $(DEPLOY_TOKEN)
`;

const SafeStep = `
steps:
    - bash: |
          set -euo pipefail
          WORK=$(mktemp -d)
          HERE=$(pwd)
          echo "$SOURCE_BRANCH in $WORK from $HERE"
      displayName: "upload"
      env:
          DEPLOY_TOKEN: $(DEPLOY_TOKEN)
          SOURCE_BRANCH: $(Build.SourceBranch)
`;

const GateWithInterpolation = `
steps:
    - bash: |
          set -euo pipefail
          SOURCE_BRANCH="$(Build.SourceBranch)"
          REASON="$(Build.Reason)"
      displayName: "gate"
      env:
          SOURCE_BRANCH: $(Build.SourceBranch)
          REASON: $(Build.Reason)
`;

const GateWithEnv = `
steps:
    - bash: |
          set -euo pipefail
          if [ "$SOURCE_BRANCH" != "refs/heads/master" ]; then exit 1; fi
          if [ "$REASON" = "PullRequest" ]; then exit 1; fi
      displayName: "gate"
      env:
          SOURCE_BRANCH: $(Build.SourceBranch)
          REASON: $(Build.Reason)
          ALLOWED_REFS: refs/heads/master
`;

const cases = [
    {
        title: "a system variable rendered into a credentialed script body is rejected",
        run: () => checkScriptBodies("fixture.yml", stripComments(CredentialedStep), false),
        expect: (found) => found.some((error) => error.includes("$(Build.SourceBranch)")),
    },
    {
        title: "a template expression rendered into a credentialed script body is rejected",
        run: () =>
            checkScriptBodies(
                "fixture.yml",
                stripComments(`
steps:
    - bash: |
          echo "${"${{ parameters.artifact }}"}"
      env:
          DEPLOY_TOKEN: $(DEPLOY_TOKEN)
`),
                false
            ),
        expect: (found) => found.some((error) => error.includes("parameters.artifact")),
    },
    {
        title: "a pipeline variable rendered into a credentialed script body is rejected",
        run: () =>
            checkScriptBodies(
                "fixture.yml",
                stripComments(`
steps:
    - bash: |
          echo "$(SNAPSHOT_CDN_URL)/report.html"
      env:
          DEPLOY_TOKEN: $(DEPLOY_TOKEN)
`),
                false
            ),
        expect: (found) => found.some((error) => error.includes("$(SNAPSHOT_CDN_URL)")),
    },
    {
        title: "a single-line credentialed script is scanned too",
        run: () =>
            checkScriptBodies(
                "fixture.yml",
                stripComments(`
steps:
    - bash: node ./scripts/updateVersion.js $(TrustedBranchName)
      env:
          DEPLOY_TOKEN: $(DEPLOY_TOKEN)
`),
                false
            ),
        expect: (found) => found.some((error) => error.includes("$(TrustedBranchName)")),
    },
    {
        title: "an uncredentialed step in a credentialed file is scanned too",
        run: () =>
            checkScriptBodies(
                "fixture.yml",
                stripComments(`
steps:
    - bash: |
          echo "$(Build.SourceBranch)"
      displayName: "log"
`),
                true
            ),
        expect: (found) => found.some((error) => error.includes("$(Build.SourceBranch)")),
    },
    {
        title: "values passed through env: and bash command substitution are accepted",
        run: () => checkScriptBodies("fixture.yml", stripComments(SafeStep), true),
        expect: (found) => found.length === 0,
    },
    {
        title: "the trust gate is rejected when it renders the ref into its body",
        run: () => checkTrustGate("gate.yml", stripComments(GateWithInterpolation)),
        expect: (found) => found.some((error) => error.includes("$(Build.SourceBranch)")),
    },
    {
        title: "the trust gate is accepted when it reads the ref from env:",
        run: () => checkTrustGate("gate.yml", stripComments(GateWithEnv)),
        expect: (found) => found.length === 0,
    },
    {
        title: "the trust gate is rejected when it stops reading the full ref",
        run: () =>
            checkTrustGate(
                "gate.yml",
                stripComments(`
steps:
    - bash: |
          echo "$SOURCE_BRANCH"
      env:
          SOURCE_BRANCH: $(Build.SourceBranchName)
          REASON: $(Build.Reason)
`)
            ),
        expect: (found) => found.some((error) => error.includes("SOURCE_BRANCH: $(Build.SourceBranch)")),
    },
    {
        title: "a secret group in a pull-request-compiled pipeline is rejected",
        run: () => checkPullRequestPipelineFile("root.yml", "root.yml", stripComments("variables:\n    - group: BabylonJS-Deployment\n")),
        expect: (found) => found.some((error) => error.includes("BabylonJS-Deployment")),
    },
    {
        title: "Build.SourceBranchName is rejected anywhere",
        run: () => checkCredentialHandling("fixture.yml", "condition: eq(variables['Build.SourceBranchName'], 'master')"),
        expect: (found) => found.some((error) => error.includes("Build.SourceBranchName")),
    },
    {
        title: "a credential on a command line is rejected",
        run: () => checkCredentialHandling("fixture.yml", 'curl -H "Authorization: $(DEPLOY_TOKEN)" https://example.test'),
        expect: (found) => found.some((error) => error.includes("command line")),
    },
    {
        title: "an Azure macro is told apart from a bash command substitution",
        run: () => [
            ...(isAzureMacro("Build.SourceBranch") ? [] : ["dotted macro not detected"]),
            ...(isAzureMacro("SNAPSHOT_CDN_URL") ? [] : ["upper-case macro not detected"]),
            ...(isAzureMacro("pwd") ? ["bare command flagged as macro"] : []),
            ...(isAzureMacro("mktemp -d") ? ["command with arguments flagged as macro"] : []),
        ],
        expect: (found) => found.length === 0,
    },
];

/**
 * @returns {number} process exit code
 */
function selfTest() {
    let failures = 0;
    for (const testCase of cases) {
        const found = testCase.run();
        if (testCase.expect(found)) {
            console.log(`  ok   ${testCase.title}`);
        } else {
            failures++;
            console.error(`  FAIL ${testCase.title}`);
            console.error(`       got: ${JSON.stringify(found, null, 2)}`);
        }
    }
    if (failures > 0) {
        console.error(`\n${failures} trust boundary guard test(s) failed.`);
        return 1;
    }
    console.log(`\nTrust boundary guard tests OK (${cases.length} checks).`);
    return 0;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (process.argv.includes("--self-test")) {
    process.exit(selfTest());
}

const { errors, pullRequestPipelineCount, credentialedFileCount } = validatePipelines();
const uniqueErrors = [...new Set(errors)];

if (uniqueErrors.length > 0) {
    console.error("CI trust boundary violations:\n");
    for (const error of uniqueErrors) {
        console.error(`  - ${error}`);
    }
    console.error("\nSee .azure-pipelines/VARIABLE-GROUPS.md, section 'CI trust boundary'.");
    process.exit(1);
}

console.log(
    `CI trust boundary OK (${pullRequestPipelineCount} pull-request-compiled pipeline(s) checked, all credential-free; ` +
        `${credentialedFileCount} credentialed file(s) checked, no interpolation in any script body).`
);
