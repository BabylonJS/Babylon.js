import { Nullable } from '../../types';
import { WebGL2ShaderProcessor } from '../WebGL/webGL2ShaderProcessors';
import { ShaderProcessingContext } from '../Processors/shaderProcessingOptions';

declare type ThinEngine = import("../thinEngine").ThinEngine;
declare type NativeEngine = import("../nativeEngine").NativeEngine;

/** @hidden */
export class NativeShaderProcessor extends WebGL2ShaderProcessor {
    public postProcessor(code: string, defines: string[], isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>, engine: ThinEngine) {
        code = super.postProcessor(code, defines, isFragment, processingContext, engine);

        // Depending on API, depth range is [-1..1] or [0..1]
        // This is defined by homogeneousDepth in bgfx caps
        if (!isFragment && !(<NativeEngine>engine).homogeneousDepth) {
            const lastClosingCurly = code.lastIndexOf("}");
            code = code.substring(0, lastClosingCurly);
            if (!(<NativeEngine>engine).originBottomLeft) {
                code += "gl_Position.y *= -1.;\n";
            }
            code += "gl_Position.z = (gl_Position.z + gl_Position.w) / 2.0; }";
        }

        return code;
    }
}