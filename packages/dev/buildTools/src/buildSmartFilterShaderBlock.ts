/* eslint-disable no-console */
import * as childProcess from "child_process";

/**
 * Calls into the shader converter build tool that lives in \@dev/smart-filters to convert a .glsl file into a .ts file.
 * Note: this lives there so it is published so other users of \@babylonjs/smart-filters can use it.
 * @param filePath
 */
export function BuildSmartFilterShaderBlock(filePath: string) {
    try {
        childProcess.execSync(`node ./packages/dev/smartFilters/dist/utils/buildTools/buildShaders.js ${filePath} @babylonjs/smart-filters`, {
            stdio: "inherit",
            encoding: "utf8",
        });
    } catch (error) {
        console.error("Error running shader conversion:", error);
        throw error;
    }
}
