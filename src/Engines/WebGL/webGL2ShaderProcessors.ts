import { Nullable } from '../../types';
import { IShaderProcessor } from '../Processors/iShaderProcessor';
import { ShaderProcessingContext } from '../Processors/shaderProcessingOptions';
import { ShaderFlipInjector, ModificationType } from "../Processors/shaderFlipInjector";

declare type ThinEngine = import("../thinEngine").ThinEngine;

/** @hidden */
export class WebGL2ShaderProcessor implements IShaderProcessor {
    public attributeProcessor(attribute: string) {
        return attribute.replace("attribute", "in");
    }

    public varyingProcessor(varying: string, isFragment: boolean) {
        return varying.replace("varying", isFragment ? "in" : "out");
    }

    public postProcessor(code: string, defines: string[], isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>, engine: ThinEngine) {
        const hasDrawBuffersExtension = code.search(/#extension.+GL_EXT_draw_buffers.+require/) !== -1;

        if (!engine.hasOriginBottomLeft) {
            const fi = new ShaderFlipInjector(code);
            fi.processCode("texture2DLodEXT", ModificationType.flipY);
            fi.processCode("texture2D", ModificationType.flipY);
            fi.processCode("textureCubeLodEXT", ModificationType.negateY);
            fi.processCode("textureCube", ModificationType.negateY);
            fi.processCode("dFdy", ModificationType.negate, 0);
            code = `
                vec4 _flipY(vec4 uv)
                {
                    return vec4(uv.x, 1. - uv.y, uv.z, uv.w);
                }
                vec3 _flipY(vec3 uv)
                {
                    return vec3(uv.x, 1. - uv.y, uv.z);
                }
                vec2 _flipY(vec2 uv)
                {
                    return vec2(uv.x, 1. - uv.y);
                }
                vec4 _negateY(vec4 uv)
                {
                    return vec4(uv.x, -uv.y, uv.z, uv.w);
                }
                vec3 _negateY(vec3 uv)
                {
                    return vec3(uv.x, -uv.y, uv.z);
                }
                vec2 _negateY(vec2 uv)
                {
                    return vec2(uv.x, -uv.y);
                }
            ` + fi.code;
        }

        // Remove extensions
        var regex = /#extension.+(GL_OVR_multiview2|GL_OES_standard_derivatives|GL_EXT_shader_texture_lod|GL_EXT_frag_depth|GL_EXT_draw_buffers).+(enable|require)/g;
        code = code.replace(regex, "");

        // Replace instructions
        code = code.replace(/texture2D\s*\(/g, "texture(");
        if (isFragment) {
            code = code.replace(/texture2DLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCubeLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCube\s*\(/g, "texture(");
            code = code.replace(/gl_FragDepthEXT/g, "gl_FragDepth");
            code = code.replace(/gl_FragColor/g, "glFragColor");
            code = code.replace(/gl_FragData/g, "glFragData");
            code = code.replace(/void\s+?main\s*\(/g, (hasDrawBuffersExtension ? "" : "out vec4 glFragColor;\n") + "void main(");
        } else {
            var hasMultiviewExtension = defines.indexOf("#define MULTIVIEW") !== -1;
            if (hasMultiviewExtension) {
                return "#extension GL_OVR_multiview2 : require\nlayout (num_views = 2) in;\n" + code;
            }
        }

        return code;
    }
}