export const LintSourceFiles = ["packages/**/src/**/*.{ts,tsx,js}"];
export const LintTestFiles = ["packages/**/test/**/*.{test,spec}.{ts,tsx,js}"];
export const LintFiles = [...LintSourceFiles, ...LintTestFiles];
export const FormatOnlyFiles = ["packages/**/src/**/*.{json,scss,css}", "packages/**/test/**/*.json"];
export const FormatFiles = [...LintFiles, ...FormatOnlyFiles];

const SourceFilePattern = /^packages\/(?:[^/]+\/)*src\/(?:[\s\S]*\/)?[^/]+\.(?:ts|tsx|js)$/;
const TestFilePattern = /^packages\/(?:[^/]+\/)*test\/(?:[\s\S]*\/)?[^/]+\.(?:test|spec)\.(?:ts|tsx|js)$/;

/**
 * @param {string} file Repository-relative file path.
 * @returns {boolean} Whether the file is included in the shared lint scopes.
 */
export function isLintFile(file) {
    return SourceFilePattern.test(file) || TestFilePattern.test(file);
}
