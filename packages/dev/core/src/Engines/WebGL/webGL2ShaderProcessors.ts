import { ShaderLanguage } from "../../Materials/shaderLanguage";
import type { IShaderProcessor } from "../Processors/iShaderProcessor";

const VaryingRegex = /(flat\s)?\s*varying\s*.*/;

/** @internal */
export class WebGL2ShaderProcessor implements IShaderProcessor {
    public shaderLanguage = ShaderLanguage.GLSL;

    public attributeProcessor(attribute: string) {
        return attribute.replace("attribute", "in");
    }

    public varyingCheck(varying: string, _isFragment: boolean) {
        return VaryingRegex.test(varying);
    }

    public varyingProcessor(varying: string, isFragment: boolean) {
        return varying.replace("varying", isFragment ? "in" : "out");
    }

    public postProcessor(code: string, defines: string[], isFragment: boolean) {
        const hasDrawBuffersExtension = code.search(/#extension.+GL_EXT_draw_buffers.+require/) !== -1;

        // Remove extensions
        const regex = /#extension.+(GL_OVR_multiview2|GL_OES_standard_derivatives|GL_EXT_shader_texture_lod|GL_EXT_frag_depth|GL_EXT_draw_buffers).+(enable|require)/g;
        code = code.replace(regex, "");

        // Replace instructions
        code = code.replace(/texture2D\s*\(/g, "texture(");
        if (isFragment) {
            const hasOutput = code.search(/layout *\(location *= *0\) *out/g) !== -1;
            const hasDualSourceBlending = defines.indexOf("#define DUAL_SOURCE_BLENDING") !== -1;
            const outputDeclaration = hasDualSourceBlending
                ? "layout(location = 0, index = 0) out vec4 glFragColor;\nlayout(location = 0, index = 1) out vec4 glFragColor2;\n"
                : "layout(location = 0) out vec4 glFragColor;\n";

            if (hasDualSourceBlending) {
                code = "#extension GL_EXT_blend_func_extended : require\n" + code;
            }
            code = code.replace(/texture2DLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCubeLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCube\s*\(/g, "texture(");
            code = code.replace(/gl_FragDepthEXT/g, "gl_FragDepth");
            code = code.replace(/gl_FragColor/g, "glFragColor");
            code = code.replace(/gl_FragData/g, "glFragData");
            code = code.replace(/void\s+?main\s*\(/g, (hasDrawBuffersExtension || hasOutput ? "" : outputDeclaration) + "void main(");
        } else {
            if (defines.indexOf("#define VERTEXOUTPUT_INVARIANT") >= 0) {
                code = "invariant gl_Position;\n" + code;
            }
            const hasMultiviewExtension = defines.indexOf("#define MULTIVIEW") !== -1;
            if (hasMultiviewExtension) {
                return "#extension GL_OVR_multiview2 : require\nlayout (num_views = 2) in;\n" + code;
            }
        }

        return code;
    }
}
