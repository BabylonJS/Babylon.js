/**
 * Shared Rollup utilities for @babylonjs public packages.
 *
 * These helpers replace the compile-time path transforms that were previously
 * handled by ts-patch.  During rollup bundling they rewrite bare dev-package
 * imports (e.g. "core/Meshes/mesh") to their public @babylonjs/ equivalents
 * ("@babylonjs/core/Meshes/mesh") and append ".js" extensions for ESM compat.
 */

/**
 * Creates a Rollup plugin that rewrites bare dev-package imports to
 * their public @babylonjs/ scoped equivalents.
 *
 * @param {Record<string, string | null>} devPackageMap
 *   Map from dev package name to public package name (e.g. { core: "\@babylonjs/core" }).
 *   Entries whose value is `null` are skipped (use the Rollup `alias` plugin for
 *   those packages instead).
 *   The map should be ordered longest-first to prevent prefix collisions.
 * @returns A Rollup plugin.
 */
export function rewriteDevImports(devPackageMap) {
    return {
        name: "rewrite-dev-imports",
        resolveId(source) {
            for (const [pkg, replacement] of Object.entries(devPackageMap)) {
                if (replacement && (source === pkg || source.startsWith(pkg + "/"))) {
                    return { id: replacement + source.slice(pkg.length), external: true };
                }
            }
            return null;
        },
    };
}

/**
 * Rollup `output.paths` callback that appends ".js" to \@babylonjs/ subpath
 * imports for ESM compatibility.
 *
 * Only \@babylonjs/ packages use bare subpath imports that need the extension;
 * other external packages (e.g. react, \@fluentui) already resolve correctly
 * via node module resolution.
 *
 * @param {string} id The module specifier.
 * @returns {string} The (possibly .js-suffixed) specifier.
 */
export function appendJsToExternalPaths(id) {
    if (/^@babylonjs\/[^/]+\/.+/.test(id) && !id.endsWith(".js")) {
        return id + ".js";
    }
    return id;
}
