/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import type { Nullable } from "core/types";
import type { IShaderProcessor } from "../Processors/iShaderProcessor";
import type { NativeShaderProcessingContext } from "./nativeShaderProcessingContext";
import type { _IShaderProcessingContext } from "../Processors/shaderProcessingOptions";
import { ShaderLanguage } from "../../Materials/shaderLanguage";
import { InjectStartingAndEndingCode } from "../../Misc/codeStringParsingTools";

const VaryingRegex = /(flat\s)?\s*varying\s*.*/;

/** @internal */
export class NativeShaderProcessor implements IShaderProcessor {
    public shaderLanguage = ShaderLanguage.GLSL;

    protected _nativeProcessingContext: Nullable<NativeShaderProcessingContext>;

    public initializeShaders(processingContext: Nullable<_IShaderProcessingContext>): void {
        this._nativeProcessingContext = processingContext as Nullable<NativeShaderProcessingContext>;
        if (this._nativeProcessingContext) {
            this._nativeProcessingContext.remappedAttributeNames = {};
            this._nativeProcessingContext.injectInVertexMain = "";
        }
    }

    public attributeProcessor(attribute: string) {
        if (!this._nativeProcessingContext) {
            return attribute.replace("attribute", "in");
        }

        const attribRegex = /\s*(?:attribute|in)\s+(\S+)\s+(\S+)\s*;/gm;
        const match = attribRegex.exec(attribute);
        if (match !== null) {
            const attributeType = match[1];
            const name = match[2];

            const numComponents = this._nativeProcessingContext.vertexBufferKindToNumberOfComponents[name];
            if (numComponents !== undefined) {
                // Special case for an int/ivecX vertex buffer that is used as a float/vecX attribute in the shader.
                const newType = numComponents < 0 ? (numComponents === -1 ? "int" : "ivec" + -numComponents) : numComponents === 1 ? "uint" : "uvec" + numComponents;
                const newName = `_int_${name}_`;

                attribute = attribute.replace(match[0], `in ${newType} ${newName}; ${attributeType} ${name};`);

                this._nativeProcessingContext.injectInVertexMain += `${name} = ${attributeType}(${newName});\n`;
                this._nativeProcessingContext.remappedAttributeNames[name] = newName;
            } else {
                attribute = attribute.replace(match[0], `in ${attributeType} ${name};`);
            }
        }
        return attribute;
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

            code = code.replace(/texture2DLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCubeLodEXT\s*\(/g, "textureLod(");
            code = code.replace(/textureCube\s*\(/g, "texture(");
            code = code.replace(/gl_FragDepthEXT/g, "gl_FragDepth");
            code = code.replace(/gl_FragColor/g, "glFragColor");
            code = code.replace(/gl_FragData/g, "glFragData");
            code = code.replace(/void\s+?main\s*\(/g, (hasDrawBuffersExtension || hasOutput ? "" : "layout(location = 0) out vec4 glFragColor;\n") + "void main(");
        } else {
            if (defines.indexOf("#define VERTEXOUTPUT_INVARIANT") >= 0) {
                code = "invariant gl_Position;\n" + code;
            }
            if (this._nativeProcessingContext?.injectInVertexMain) {
                code = InjectStartingAndEndingCode(code, "void main", this._nativeProcessingContext.injectInVertexMain);
            }
            const hasMultiviewExtension = defines.indexOf("#define MULTIVIEW") !== -1;
            if (hasMultiviewExtension) {
                return "#extension GL_OVR_multiview2 : require\nlayout (num_views = 2) in;\n" + code;
            }
        }

        return code;
    }
}
