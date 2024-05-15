/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import type { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";

/**
 * @internal
 */
export class NativeShaderProcessingContext implements ShaderProcessingContext {
    public vertexBufferKindToNumberOfComponents: { [kind: string]: number } = {};
    public remappedAttributeNames: { [name: string]: string } = {};
    public injectInVertexMain = "";
}
