import { ShaderLanguage } from "../../Materials/shaderLanguage";
import { type IShaderProcessor } from "../Processors/iShaderProcessor";

const VaryingRegex = /varying/;
const ExtensionDirectiveRegex = /#extension[^\r\n]*/g;
const RemovableExtensions = ["GL_OVR_multiview2", "GL_OES_standard_derivatives", "GL_EXT_shader_texture_lod", "GL_EXT_frag_depth", "GL_EXT_draw_buffers"];
const RemovableBehaviors = ["enable", "require"];
const DrawBuffersExtension = ["GL_EXT_draw_buffers"];
const RequireBehavior = ["require"];

// Returns the end of the "#extension <name> ... <behavior>" span in a directive line (the same span the previous
// greedy regex matched), or -1 when no listed extension is found. Uses string scanning to stay linear.
function GetExtensionSpanEnd(directive: string, extensions: string[], behaviors: string[]): number {
    let behaviorIndex = -1;
    let behaviorLength = 0;
    for (const behavior of behaviors) {
        const index = directive.lastIndexOf(behavior);
        if (index > behaviorIndex) {
            behaviorIndex = index;
            behaviorLength = behavior.length;
        }
    }
    if (behaviorIndex === -1) {
        return -1;
    }
    for (const extension of extensions) {
        if (directive.lastIndexOf(extension, behaviorIndex - extension.length - 1) > "#extension".length) {
            return behaviorIndex + behaviorLength;
        }
    }
    return -1;
}

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
        let hasDrawBuffersExtension = false;

        // Remove extensions
        code = code.replace(ExtensionDirectiveRegex, (directive) => {
            hasDrawBuffersExtension ||= GetExtensionSpanEnd(directive, DrawBuffersExtension, RequireBehavior) !== -1;
            const end = GetExtensionSpanEnd(directive, RemovableExtensions, RemovableBehaviors);
            return end === -1 ? directive : directive.substring(end);
        });

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
