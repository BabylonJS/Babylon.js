/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import type { _IShaderProcessingContext } from "../Processors/shaderProcessingOptions";

/**
 * @internal
 */
export class NativeShaderProcessingContext implements _IShaderProcessingContext {
    public vertexBufferKindToNumberOfComponents: { [kind: string]: number } = {};
    public remappedAttributeNames: { [name: string]: string } = {};
    public injectInVertexMain = "";
}
