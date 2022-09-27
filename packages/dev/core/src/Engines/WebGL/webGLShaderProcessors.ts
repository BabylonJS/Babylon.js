import { ShaderLanguage } from "../../Materials/shaderLanguage";
import type { Nullable } from "../../types";
import type { IShaderProcessor } from "../Processors/iShaderProcessor";
import type { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";

declare type ThinEngine = import("../thinEngine").ThinEngine;

/** @internal */
export class WebGLShaderProcessor implements IShaderProcessor {
    public shaderLanguage = ShaderLanguage.GLSL;

    public postProcessor(code: string, defines: string[], isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>, engine: ThinEngine) {
        // Remove extensions
        if (!engine.getCaps().drawBuffersExtension) {
            // even if enclosed in #if/#endif, IE11 does parse the #extension declaration, so we need to remove it altogether
            const regex = /#extension.+GL_EXT_draw_buffers.+(enable|require)/g;
            code = code.replace(regex, "");
        }

        return code;
    }
}
