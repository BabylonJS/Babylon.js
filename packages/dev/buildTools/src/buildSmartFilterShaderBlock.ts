import { ConvertShader } from "../../../dev/smartFilters/dist/utils/buildTools/convertShaders.js";

/**
 * Calls into the shader converter build tool that lives in \@dev/smart-filters to convert a .glsl file into a .ts file.
 * Note: this lives there so it is published so other users of \@babylonjs/smart-filters can use it.
 * @param filePath
 */
export function BuildSmartFilterShaderBlock(filePath: string) {
    ConvertShader(filePath, "@babylonjs/smart-filters");
}
