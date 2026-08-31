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
 * The third half - the one `pr: none` alone never covered - is *where a
 * credential comes from* and *which upstream run a publisher trusts*:
 *
 *   * A secret variable defined in the pipeline UI is not a protected
 *     resource. It has no pipeline permissions, no branch control check and no
 *     required-template check, so every run of the definition receives it,
 *     including a run a maintainer queues against an arbitrary ref - and Azure
 *     DevOps compiles that ref's YAML, gates included. Credentials must come
 *     from variable groups, mapped on the jobs that need them.
 *   * A `resources.pipelines` entry resolves either from a real trigger or
 *     from a run the queuer picked by hand, and the two are indistinguishable
 *     unless the run reason and the upstream run's own ref are checked. A
 *     publisher that skips that check will happily push a pull request's
 *     artifacts to production.
 *
 * This script fails the build when any of those shapes regresses. It is
 * deliberately dependency-free (no YAML parser) so it can run in a job that has
 * not installed anything, which is exactly where a credential-free check
 * belongs. `--self-test` additionally *executes* the publish request gate with
 * each known bypass as input, so the guards are proved rather than asserted.
 *
 * Usage:
 *   node .azure-pipelines/scripts/validate-pipeline-trust-boundary.mjs
 *   node .azure-pipelines/scripts/validate-pipeline-trust-boundary.mjs --self-test
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const PipelinesDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Every credential the pipelines use, and the protected variable group that
 * must supply it.
 *
 * A variable group is a *protected resource*: an administrator authorizes it
 * per pipeline, and can attach branch control and required-template checks that
 * the ref being checked cannot edit. A secret variable defined in the pipeline
 * UI is none of those things - it is handed to every run of the definition,
 * including a run queued against an arbitrary ref whose YAML the queuer wrote.
 * Credentials therefore only ever come from this table.
 */
const SecretVariableOwners = new Map([
    ["DEPLOY_TOKEN", "BabylonJS-Deployment"],
    ["GITHUB_RELEASE_TOKEN", "BabylonJS-Publish-GitHub"],
    ["NPM_REGISTRY_TOKEN", "BabylonJS-Publish-Npm"],
    ["BROWSERSTACK_ACCESS_KEY", "Browserstack-Opensource"],
    ["BROWSERSTACK_USERNAME", "Browserstack-Opensource"],
]);

/**
 * Secret variable names that only ever existed as pipeline-UI ("pipeline
 * scoped") secrets. Referencing one is by definition a request for an
 * unprotected credential, so none of them may appear in any pipeline again.
 */
const PipelineScopedSecretNames = ["GitHubPAT", "GITHUBPAT", "NPM_TOKEN", "SEARCH_KEY"];

/** Variable groups that carry a credential. None of these may be reachable from a PR-compiled pipeline. */
const SecretVariableGroups = new Set(SecretVariableOwners.values());

/** Every secret variable name, whether it is sourced correctly or not. */
const SecretVariableNames = [...SecretVariableOwners.keys(), ...PipelineScopedSecretNames];

/** The gate every credentialed job runs first. It is credentialed by definition, whoever includes it. */
const TrustGateTemplate = "templates/assert-trusted-source.yml";

/** The cross-pipeline snapshot publisher, whose publish request gate is executed by the self-tests. */
const SnapshotPublisherFile = "cd-ci-snapshots.yml";

/** The step in {@link SnapshotPublisherFile} that decides what may be published where. */
const PublishRequestGateStep = "ValidatePublishRequest";

/** The template that re-asserts, inside a credentialed job, that a real resource trigger started the run. */
const ResourceRunGateTemplate = "templates/assert-trusted-resource-run.yml";

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
// Where credentials come from
// ---------------------------------------------------------------------------

/**
 * Returns the body of the *pipeline-level* `variables:` block, i.e. the one at
 * column zero. Everything mapped there is in scope for every job in the run,
 * including the jobs that execute `npm ci` and the whole dependency tree.
 * @param {string} contents already comment-stripped
 * @returns {string}
 */
function pipelineLevelVariableBlock(contents) {
    const lines = contents.split("\n");
    const start = lines.findIndex((line) => /^variables:\s*$/.test(line));
    if (start === -1) {
        return "";
    }

    const block = [];
    for (let index = start + 1; index < lines.length; index++) {
        const line = lines[index];
        if (line.trim() === "") {
            continue;
        }
        if (/^\S/.test(line)) {
            break;
        }
        block.push(line);
    }
    return block.join("\n");
}

/**
 * A secret must come from a protected variable group, never from a secret
 * variable configured on the pipeline definition, and the group that owns it
 * must actually be mapped somewhere in the pipeline's graph.
 * @param {string} name display name of the root pipeline
 * @param {string} contents the whole graph, comment-stripped and concatenated
 * @returns {string[]}
 */
function checkSecretSourcing(name, contents) {
    const errors = [];

    for (const secret of PipelineScopedSecretNames) {
        if (new RegExp(`\\$\\(${secret}\\)`).test(contents)) {
            errors.push(
                `${name} reads '${secret}', which can only be a secret variable configured on the pipeline definition. ` +
                    `A pipeline UI secret is not a protected resource: it has no pipeline permissions, no branch control and no ` +
                    `required-template check, so every run of the definition receives it - including a run queued against an ` +
                    `arbitrary ref, whose YAML (gates included) the queuer wrote. Move it into a dedicated variable group.`
            );
        }
    }

    const mappedGroups = new Set(referencedGroups(contents));
    for (const [secret, group] of SecretVariableOwners) {
        if (!new RegExp(`\\$\\(${secret}\\)`).test(contents) || mappedGroups.has(group)) {
            continue;
        }
        errors.push(`${name} reads the secret '${secret}' but never maps its protected variable group '${group}'.`);
    }

    return errors;
}

/**
 * A secret group mapped at pipeline scope is in scope for every job, including
 * the ones that run repository and dependency code.
 * @param {string} name
 * @param {string} contents already comment-stripped
 * @returns {string[]}
 */
function checkPipelineScopedGroups(name, contents) {
    const errors = [];
    for (const group of referencedGroups(pipelineLevelVariableBlock(contents))) {
        if (SecretVariableGroups.has(group)) {
            errors.push(
                `${name} maps the secret variable group '${group}' at pipeline scope, so every job in the run - including the ones ` +
                    `that execute dependency lifecycle scripts - can expand its secrets. Map it on the jobs that need it instead.`
            );
        }
    }
    return errors;
}

// ---------------------------------------------------------------------------
// Cross-pipeline publisher: which upstream run may be published, and where
// ---------------------------------------------------------------------------

/**
 * Finds the inline script step carrying `name: <stepName>`.
 * @param {string} contents already comment-stripped
 * @param {string} stepName
 * @returns {{ line: number, body: string, tail: string } | undefined}
 */
function namedScriptStep(contents, stepName) {
    return inlineScriptSteps(contents).find((step) => new RegExp(`^\\s*name:\\s*${stepName}\\s*$`, "m").test(step.tail));
}

/**
 * The snapshot publisher takes its payload from another pipeline's run. Azure
 * DevOps resolves that resource either from a real completion trigger or from a
 * run whoever queued this one picked in the "Resources" panel - which offers
 * pull request validation runs of unmerged code. The gate can only tell them
 * apart from the run reason and from Azure's own metadata about the upstream
 * run, so those must reach it, and its parameters must not default to a
 * production destination.
 * @param {string} name
 * @param {string} contents already comment-stripped
 * @returns {string[]}
 */
function checkSnapshotPublisher(name, contents) {
    const errors = [];

    for (const parameterName of ["sourceRunId", "buildName"]) {
        const declaration = new RegExp(`-\\s*name:\\s*${parameterName}\\b[\\s\\S]*?default:\\s*(\\S*)`).exec(contents);
        if (!declaration) {
            errors.push(`${name}: parameter '${parameterName}' is missing; the publish gate depends on it.`);
            continue;
        }
        if (declaration[1] !== '""' && declaration[1] !== "''") {
            errors.push(
                `${name}: parameter '${parameterName}' defaults to ${declaration[1]}. It must default to an empty string, so a run that ` +
                    `supplies nothing cannot inherit a production destination or an implicitly trusted source run.`
            );
        }
    }

    const gate = namedScriptStep(contents, PublishRequestGateStep);
    if (!gate) {
        errors.push(`${name}: no inline script step named '${PublishRequestGateStep}'. The publish request is then ungated.`);
        return errors;
    }

    const required = [
        ["BUILD_REASON", /^\s*BUILD_REASON:\s*\$\(Build\.Reason\)\s*$/m],
        ["RESOURCE_SOURCE_BRANCH", /^\s*RESOURCE_SOURCE_BRANCH:\s*\$\(resources\.pipeline\.\w+\.sourceBranch\)\s*$/m],
        ["RESOURCE_PIPELINE_ID", /^\s*RESOURCE_PIPELINE_ID:\s*\$\(resources\.pipeline\.\w+\.pipelineID\)\s*$/m],
        ["RESOURCE_RUN_ID", /^\s*RESOURCE_RUN_ID:\s*\$\(resources\.pipeline\.\w+\.runID\)\s*$/m],
    ];
    for (const [variable, pattern] of required) {
        if (!pattern.test(gate.tail)) {
            errors.push(
                `${name}: the publish request gate must receive '${variable}' from Azure's own run metadata through 'env:'. ` +
                    `Without it the gate cannot tell a real resource trigger from a hand-picked source run.`
            );
        }
    }

    if (!/requireTrustedResourceRun:\s*true/.test(contents)) {
        errors.push(
            `${name}: no job sets 'requireTrustedResourceRun: true'. The production CDN job must re-assert on its own agent that a ` +
                `resource trigger from a trusted ref started the run, so a weakened 'dependsOn' cannot let a manual run reach production.`
        );
    }

    return errors;
}

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

        // A secret must be traceable to a protected variable group from
        // anywhere in the pipeline's graph, and must never be mapped for the
        // whole run.
        errors.push(...checkSecretSourcing(rootName, graph.map((file) => readCode(file)).join("\n")));
        errors.push(...checkPipelineScopedGroups(rootName, readCode(root)));

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

    // The cross-pipeline publisher must be able to tell a real resource trigger
    // from a run somebody picked out of the queue-time resource picker.
    const snapshotPublisher = path.join(PipelinesDirectory, SnapshotPublisherFile);
    if (!existsSync(snapshotPublisher)) {
        errors.push(`${SnapshotPublisherFile} is missing. The detection in this script has probably drifted from the pipeline layout.`);
    } else {
        errors.push(...checkSnapshotPublisher(SnapshotPublisherFile, readCode(snapshotPublisher)));
    }

    if (!existsSync(path.join(PipelinesDirectory, ResourceRunGateTemplate))) {
        errors.push(`${ResourceRunGateTemplate} is missing. Production publishers have nothing to re-assert their upstream run with.`);
    }

    return { errors, pullRequestPipelineCount, credentialedFileCount: credentialedFiles.size };
}

// ---------------------------------------------------------------------------
// Executable trust boundary tests
//
// The checks above are structural: they prove a value reaches the gate, not
// that the gate rejects it. These tests take the gate scripts *as shipped* out
// of the YAML and run them with each known bypass as input, so a regression
// that keeps the shape but loses the rule still fails the build.
// ---------------------------------------------------------------------------

/**
 * Runs a shell script body with a fixed environment and no inherited variables
 * beyond PATH, so nothing on the developer's machine can make a case pass.
 * @param {string} body
 * @param {Record<string, string>} environment
 * @returns {{ status: number, output: string }}
 */
function runScript(body, environment) {
    const result = spawnSync("bash", ["-c", body], {
        env: { PATH: process.env.PATH ?? "/usr/bin:/bin", ...environment },
        encoding: "utf8",
    });
    if (result.error) {
        throw result.error;
    }
    return { status: result.status ?? 1, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

/**
 * @param {string} file relative to the pipelines directory
 * @param {string} stepName
 * @returns {string}
 */
function scriptBodyOf(file, stepName) {
    const absolute = path.join(PipelinesDirectory, file);
    const step = namedScriptStep(readCode(absolute), stepName);
    if (!step) {
        throw new Error(`${file} has no inline script step named '${stepName}'`);
    }
    return step.body;
}

/**
 * @param {string} file relative to the pipelines directory
 * @returns {string} the body of the file's single inline script step
 */
function soleScriptBodyOf(file) {
    const steps = inlineScriptSteps(readCode(path.join(PipelinesDirectory, file)));
    if (steps.length !== 1) {
        throw new Error(`${file} must contain exactly one inline script step, found ${steps.length}`);
    }
    return steps[0].body;
}

/** A trusted automatic publish: the shape every rejection below deviates from. */
const AutomaticPublish = {
    BUILD_REASON: "ResourceTrigger",
    EXPLICIT_SOURCE_RUN_ID: "",
    REQUESTED_BUILD_NAME: "",
    RESOLVED_BUILD_NAME: "refs/heads/master",
    RESOLVED_RUN_ID: "9876",
    RESOURCE_RUN_ID: "9876",
    RESOURCE_SOURCE_BRANCH: "refs/heads/master",
    RESOURCE_PIPELINE_ID: "14",
    SOURCE_DEFINITION_ID: "14",
    PULL_REQUEST_ID: "",
    DEPLOY_TO_CDN: "True",
    TRUSTED_RESOURCE_REFS: "refs/heads/master refs/heads/preview",
    PRODUCTION_REFS: "refs/heads/master refs/heads/preview",
};

/** A maintainer republishing one pull request run to a pull request snapshot. */
const ManualRepublish = {
    ...AutomaticPublish,
    BUILD_REASON: "Manual",
    EXPLICIT_SOURCE_RUN_ID: "555",
    REQUESTED_BUILD_NAME: "refs/pull/42/merge",
    RESOLVED_BUILD_NAME: "refs/pull/42/merge",
    RESOLVED_RUN_ID: "555",
    DEPLOY_TO_CDN: "False",
};

/**
 * @param {Record<string, string>} environment
 * @returns {{ status: number, output: string }}
 */
function runPublishGate(environment) {
    return runScript(scriptBodyOf(SnapshotPublisherFile, PublishRequestGateStep), environment);
}

/**
 * @param {Record<string, string>} environment
 * @returns {{ status: number, output: string }}
 */
function runResourceRunGate(environment) {
    return runScript(soleScriptBodyOf(ResourceRunGateTemplate), environment);
}

/**
 * @param {{ status: number, output: string }} result
 * @param {string} expectation text the rejection message must contain
 * @returns {string[]}
 */
function expectRejected(result, expectation) {
    const failures = [];
    if (result.status === 0) {
        failures.push(`the gate accepted the request (expected a rejection mentioning "${expectation}")`);
    } else if (!result.output.includes(expectation)) {
        failures.push(`rejected, but not because of "${expectation}": ${result.output.trim()}`);
    }
    // A rejection message quotes attacker-supplied text, so it must never carry
    // a live Azure Pipelines logging command other than the logissue it emits.
    if (/##vso\[task\.setvariable/.test(result.output)) {
        failures.push(`the rejection emitted a live logging command: ${result.output.trim()}`);
    }
    return failures;
}

/**
 * @param {{ status: number, output: string }} result
 * @param {string[]} expectations text the acceptance must contain
 * @returns {string[]}
 */
function expectAccepted(result, expectations) {
    const failures = [];
    if (result.status !== 0) {
        failures.push(`the gate rejected a legitimate request: ${result.output.trim()}`);
        return failures;
    }
    for (const expectation of expectations) {
        if (!result.output.includes(expectation)) {
            failures.push(`accepted, but did not publish "${expectation}": ${result.output.trim()}`);
        }
    }
    return failures;
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

    // -- where credentials come from ---------------------------------------
    {
        title: "a pipeline-scoped secret variable is rejected",
        run: () => checkSecretSourcing("cd-publish.yml", "env:\n    GITHUBPAT: $(GitHubPAT)\n    NPM_TOKEN: $(NPM_TOKEN)\n"),
        expect: (found) => found.some((error) => error.includes("GitHubPAT")) && found.some((error) => error.includes("NPM_TOKEN")),
    },
    {
        title: "a secret whose protected group is never mapped is rejected",
        run: () => checkSecretSourcing("cd-publish.yml", "env:\n    GITHUBPAT: $(GITHUB_RELEASE_TOKEN)\n"),
        expect: (found) => found.some((error) => error.includes("BabylonJS-Publish-GitHub")),
    },
    {
        title: "a secret sourced from its protected group is accepted",
        run: () => checkSecretSourcing("cd-publish.yml", "variables:\n    - group: BabylonJS-Publish-GitHub\nenv:\n    GITHUBPAT: $(GITHUB_RELEASE_TOKEN)\n"),
        expect: (found) => found.length === 0,
    },
    {
        title: "a secret group mapped at pipeline scope is rejected",
        run: () => checkPipelineScopedGroups("cd-publish.yml", "variables:\n    - group: BabylonJS-CI-Infrastructure\n    - group: BabylonJS-Deployment\n\njobs:\n"),
        expect: (found) => found.some((error) => error.includes("BabylonJS-Deployment")),
    },
    {
        title: "a secret group mapped at job scope only is accepted",
        run: () =>
            checkPipelineScopedGroups(
                "cd-publish.yml",
                "variables:\n    - group: BabylonJS-CI-Infrastructure\n\njobs:\n    - job: Publish\n      variables:\n          - group: BabylonJS-Deployment\n"
            ),
        expect: (found) => found.length === 0,
    },
    {
        title: "a publish parameter that defaults to a production ref is rejected",
        run: () =>
            checkSnapshotPublisher(
                "fixture.yml",
                'parameters:\n    - name: sourceRunId\n      type: string\n      default: ""\n    - name: buildName\n      type: string\n      default: "refs/heads/master"\n'
            ),
        expect: (found) => found.some((error) => error.includes("buildName") && error.includes("empty string")),
    },

    // -- the shipped publish request gate, executed --------------------------
    {
        title: "BYPASS: a manual run with no sourceRunId that picked a pull request run is rejected",
        run: () =>
            expectRejected(
                runPublishGate({
                    ...AutomaticPublish,
                    BUILD_REASON: "Manual",
                    RESOURCE_SOURCE_BRANCH: "refs/pull/42/merge",
                    RESOURCE_RUN_ID: "555",
                    RESOLVED_RUN_ID: "555",
                    RESOLVED_BUILD_NAME: "refs/pull/42/merge",
                }),
                "Only a resource-triggered run may publish without an explicit sourceRunId"
            ),
        expect: (found) => found.length === 0,
    },
    {
        title: "BYPASS: a manual run with no sourceRunId still targeting the master snapshot is rejected",
        run: () =>
            expectRejected(
                runPublishGate({ ...AutomaticPublish, BUILD_REASON: "Manual", RESOURCE_SOURCE_BRANCH: "refs/pull/42/merge" }),
                "Only a resource-triggered run may publish without an explicit sourceRunId"
            ),
        expect: (found) => found.length === 0,
    },
    {
        title: "BYPASS: a manual run that picked a master run but named no sourceRunId is still rejected",
        run: () => expectRejected(runPublishGate({ ...AutomaticPublish, BUILD_REASON: "Manual" }), "explicit sourceRunId"),
        expect: (found) => found.length === 0,
    },
    {
        title: "BYPASS: a manual republish to the master snapshot is rejected",
        run: () => expectRejected(runPublishGate({ ...ManualRepublish, REQUESTED_BUILD_NAME: "refs/heads/master", RESOLVED_BUILD_NAME: "refs/heads/master" }), "may not overwrite"),
        expect: (found) => found.length === 0,
    },
    {
        title: "BYPASS: a manual republish that also asks for the production CDN is rejected",
        run: () => expectRejected(runPublishGate({ ...ManualRepublish, DEPLOY_TO_CDN: "True" }), "may not deploy to the production CDN"),
        expect: (found) => found.length === 0,
    },
    {
        title: "a resource trigger whose upstream run built a pull request ref is rejected",
        run: () =>
            expectRejected(runPublishGate({ ...AutomaticPublish, RESOURCE_SOURCE_BRANCH: "refs/pull/42/merge", RESOLVED_BUILD_NAME: "refs/pull/42/merge" }), "not a trusted ref"),
        expect: (found) => found.length === 0,
    },
    {
        title: "a resource trigger from another pipeline definition is rejected",
        run: () => expectRejected(runPublishGate({ ...AutomaticPublish, RESOURCE_PIPELINE_ID: "99" }), "not the expected source definition"),
        expect: (found) => found.length === 0,
    },
    {
        title: "an automatic run that also supplied a destination is rejected",
        run: () => expectRejected(runPublishGate({ ...AutomaticPublish, REQUESTED_BUILD_NAME: "refs/heads/master" }), "only be supplied together with an explicit sourceRunId"),
        expect: (found) => found.length === 0,
    },
    {
        title: "an automatic run whose resolved run ID is not the triggering run is rejected",
        run: () => expectRejected(runPublishGate({ ...AutomaticPublish, RESOLVED_RUN_ID: "1234" }), "does not match the triggering resource run"),
        expect: (found) => found.length === 0,
    },
    {
        title: "a non-numeric sourceRunId is rejected before it reaches a credentialed job",
        run: () => expectRejected(runPublishGate({ ...ManualRepublish, EXPLICIT_SOURCE_RUN_ID: "555; rm -rf /" }), "sourceRunId must be a run number"),
        expect: (found) => found.length === 0,
    },
    {
        title: "a snapshot name that is not a plain ref is rejected",
        run: () => expectRejected(runPublishGate({ ...ManualRepublish, REQUESTED_BUILD_NAME: "cdn/master", RESOLVED_BUILD_NAME: "cdn/master" }), "not a plain ref"),
        expect: (found) => found.length === 0,
    },
    {
        title: "a snapshot name that walks out of the snapshot root is rejected",
        run: () =>
            expectRejected(runPublishGate({ ...ManualRepublish, REQUESTED_BUILD_NAME: "refs/pull/../../etc", RESOLVED_BUILD_NAME: "refs/pull/../../etc" }), "path traversal"),
        expect: (found) => found.length === 0,
    },
    {
        title: "a logging command smuggled through a parameter cannot reach the log",
        run: () =>
            expectRejected(
                runPublishGate({
                    ...ManualRepublish,
                    REQUESTED_BUILD_NAME: "refs/pull/1/merge##vso[task.setvariable variable=BuildName]refs/heads/master",
                    RESOLVED_BUILD_NAME: "refs/pull/1/merge##vso[task.setvariable variable=BuildName]refs/heads/master",
                }),
                "not a plain ref"
            ),
        expect: (found) => found.length === 0,
    },
    {
        title: "a pullRequestId that is not an issue number is rejected",
        run: () => expectRejected(runPublishGate({ ...ManualRepublish, PULL_REQUEST_ID: "12##vso[task.setvariable variable=X]y" }), "pullRequestId must be an issue number"),
        expect: (found) => found.length === 0,
    },
    {
        title: "the trusted automatic publish is accepted and resolves the CDN path itself",
        run: () => expectAccepted(runPublishGate(AutomaticPublish), ["variable=CdnDestination;isOutput=true]cdn/master", "variable=PublishMode;isOutput=true]Automatic"]),
        expect: (found) => found.length === 0,
    },
    {
        title: "an automatic publish of preview resolves the preview CDN path",
        run: () =>
            expectAccepted(runPublishGate({ ...AutomaticPublish, RESOURCE_SOURCE_BRANCH: "refs/heads/preview", RESOLVED_BUILD_NAME: "refs/heads/preview" }), [
                "variable=CdnDestination;isOutput=true]cdn/preview",
            ]),
        expect: (found) => found.length === 0,
    },
    {
        title: "a legitimate manual republish is accepted and resolves no CDN path",
        run: () => expectAccepted(runPublishGate(ManualRepublish), ["variable=CdnDestination;isOutput=true]\n", "variable=PublishMode;isOutput=true]Manual"]),
        expect: (found) => found.length === 0,
    },

    // -- the in-job resource gate, executed ---------------------------------
    {
        title: "the credentialed CDN job rejects a manually queued run",
        run: () =>
            expectRejected(
                runResourceRunGate({
                    BUILD_REASON: "Manual",
                    RESOURCE_SOURCE_BRANCH: "refs/heads/master",
                    RESOURCE_PIPELINE_ID: "14",
                    EXPECTED_PIPELINE_ID: "14",
                    EXPLICIT_SOURCE_RUN_ID: "",
                    ALLOWED_RESOURCE_REFS: "refs/heads/master refs/heads/preview",
                }),
                "Only a resource-triggered run may publish here"
            ),
        expect: (found) => found.length === 0,
    },
    {
        title: "the credentialed CDN job rejects a hand-picked source run",
        run: () =>
            expectRejected(
                runResourceRunGate({
                    BUILD_REASON: "ResourceTrigger",
                    RESOURCE_SOURCE_BRANCH: "refs/heads/master",
                    RESOURCE_PIPELINE_ID: "14",
                    EXPECTED_PIPELINE_ID: "14",
                    EXPLICIT_SOURCE_RUN_ID: "555",
                    ALLOWED_RESOURCE_REFS: "refs/heads/master refs/heads/preview",
                }),
                "hand-picked source run"
            ),
        expect: (found) => found.length === 0,
    },
    {
        title: "the credentialed CDN job rejects an upstream run from a pull request ref",
        run: () =>
            expectRejected(
                runResourceRunGate({
                    BUILD_REASON: "ResourceTrigger",
                    RESOURCE_SOURCE_BRANCH: "refs/pull/42/merge",
                    RESOURCE_PIPELINE_ID: "14",
                    EXPECTED_PIPELINE_ID: "14",
                    EXPLICIT_SOURCE_RUN_ID: "",
                    ALLOWED_RESOURCE_REFS: "refs/heads/master refs/heads/preview",
                }),
                "not an allowed ref"
            ),
        expect: (found) => found.length === 0,
    },
    {
        title: "the credentialed CDN job accepts a genuine trigger from master",
        run: () =>
            expectAccepted(
                runResourceRunGate({
                    BUILD_REASON: "ResourceTrigger",
                    RESOURCE_SOURCE_BRANCH: "refs/heads/master",
                    RESOURCE_PIPELINE_ID: "14",
                    EXPECTED_PIPELINE_ID: "14",
                    EXPLICIT_SOURCE_RUN_ID: "",
                    ALLOWED_RESOURCE_REFS: "refs/heads/master refs/heads/preview",
                }),
                ["Trusted resource run confirmed"]
            ),
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
