import { ShaderLanguage } from "../../Materials/shaderLanguage";
import type { Nullable } from "../../types";
import type { IShaderProcessor } from "../Processors/iShaderProcessor";
import type { _IShaderProcessingContext } from "../Processors/shaderProcessingOptions";

/** @internal */
export class WebGLShaderProcessor implements IShaderProcessor {
    public shaderLanguage = ShaderLanguage.GLSL;

    public postProcessor(
        code: string,
        defines: string[],
        isFragment: boolean,
        processingContext: Nullable<_IShaderProcessingContext>,
        parameters: { [key: string]: number | string | boolean | undefined }
    ) {
        // Remove extensions
        if (parameters.drawBuffersExtensionDisabled) {
            // even if enclosed in #if/#endif, IE11 does parse the #extension declaration, so we need to remove it altogether
            const regex = /#extension.+GL_EXT_draw_buffers.+(enable|require)/g;
            code = code.replace(regex, "");
        }

        return code;
    }
}
