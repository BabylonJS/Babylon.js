import { FormatOnlyFiles, LintFiles } from "./scripts/lint-globs.mjs";

export default {
    [`{${LintFiles.join(",")}}`]: ["prettier --write", "node scripts/lint-changed.mjs --staged"],
    ...Object.fromEntries(FormatOnlyFiles.map((pattern) => [pattern, "prettier --write"])),
};
