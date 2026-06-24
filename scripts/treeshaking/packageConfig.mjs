/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Shared package configuration for the tree-shaking maintenance scripts.
 *
 * Originally these scripts were hard-wired to `@babylonjs/core`. They are now
 * package-parameterized so the same tooling can maintain the side-effect-free
 * (`.pure.ts`) split for additional packages (gui, loaders, serializers).
 *
 * Pass `--package <name>` (or `--package=<name>`) on the command line. When the
 * flag is omitted the default package is `core`, preserving the previous
 * behavior of every script.
 */

import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");

/** Default package when `--package` is not provided. */
export const DEFAULT_PACKAGE = "core";

/**
 * Dev package name -> public `@babylonjs/<name>` package name.
 * For all current packages the dev and public names match, but keeping the map
 * explicit makes future divergence (and validation) trivial.
 */
const PUBLIC_PACKAGE_NAME = {
    core: "core",
    gui: "gui",
    loaders: "loaders",
    serializers: "serializers",
};

/** Packages that participate in the tree-shaking split tooling. */
export const SUPPORTED_PACKAGES = Object.keys(PUBLIC_PACKAGE_NAME);

/**
 * Extract the `--package` value from an argv array without mutating it.
 * Accepts both `--package <name>` and `--package=<name>` forms.
 * @param {string[]} [argv] Defaults to `process.argv.slice(2)`.
 * @returns {string} The resolved package name (validated).
 */
export function resolvePackageFromArgv(argv = process.argv.slice(2)) {
    let value;
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--package") {
            value = argv[i + 1];
            break;
        }
        if (arg.startsWith("--package=")) {
            value = arg.slice("--package=".length);
            break;
        }
    }

    if (value === undefined) {
        return DEFAULT_PACKAGE;
    }

    if (!SUPPORTED_PACKAGES.includes(value)) {
        throw new Error(`Unknown --package "${value}". Supported packages: ${SUPPORTED_PACKAGES.join(", ")}`);
    }

    return value;
}

/**
 * Remove `--package <name>` / `--package=<name>` from an argv array so a script
 * can still parse its own positional arguments (e.g. injectPureAnnotations).
 * @param {string[]} argv
 * @returns {string[]} A new argv array without the package flag.
 */
export function stripPackageArg(argv) {
    const result = [];
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--package") {
            i++; // also skip the value
            continue;
        }
        if (arg.startsWith("--package=")) {
            continue;
        }
        result.push(arg);
    }
    return result;
}

/**
 * Build the `--package` argv fragment to forward to child scripts. Returns an
 * empty array for the default package so existing invocations stay byte-identical.
 * @param {string} pkg
 * @returns {string[]}
 */
export function packageArgs(pkg) {
    return pkg === DEFAULT_PACKAGE ? [] : ["--package", pkg];
}

/**
 * Resolve all package-scoped paths used by the tree-shaking scripts.
 * @param {string} [pkg] Package name; defaults to {@link DEFAULT_PACKAGE}.
 * @returns {object} The resolved package configuration object.
 */
export function getPackageConfig(pkg = DEFAULT_PACKAGE) {
    if (!SUPPORTED_PACKAGES.includes(pkg)) {
        throw new Error(`Unknown package "${pkg}". Supported packages: ${SUPPORTED_PACKAGES.join(", ")}`);
    }

    const publicName = PUBLIC_PACKAGE_NAME[pkg];
    const manifestDir = resolve(__dirname, "side-effects-manifest", pkg);

    return {
        /** The dev package name (core, gui, loaders, serializers). */
        package: pkg,
        /** Repository root. */
        repoRoot: REPO_ROOT,
        /** Absolute path to `packages/dev/<pkg>/src`. */
        srcRoot: join(REPO_ROOT, "packages", "dev", pkg, "src"),
        /** Absolute path to `packages/dev/<pkg>/dist`. */
        distDir: join(REPO_ROOT, "packages", "dev", pkg, "dist"),
        /** Absolute path to the published `@babylonjs/<pkg>` package.json. */
        publicPkgJson: join(REPO_ROOT, "packages", "public", "@babylonjs", publicName, "package.json"),
        /** Absolute path to this package's committed manifest shard directory. */
        manifestDir,
        /** Repo-relative `_root.json` shard path for ADO annotations. */
        manifestAnnotationFile: join("scripts", "treeshaking", "side-effects-manifest", pkg, "_root.json"),
    };
}
