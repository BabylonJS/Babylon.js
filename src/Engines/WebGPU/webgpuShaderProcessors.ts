import { Nullable } from '../../types';
import { IShaderProcessor } from '../Processors/iShaderProcessor';
import { ShaderProcessingContext } from "../processors/shaderProcessingOptions";
import { WebGPUShaderProcessingContext } from './webgpuShaderProcessingContext';

const _knownUBOs: { [key: string]: { setIndex: number, bindingIndex: number} } = {
    "Scene": { setIndex: 0, bindingIndex: 0 },
    "Material": { setIndex: 1, bindingIndex: 0 },
    "Mesh": { setIndex: 1, bindingIndex: 1 },
};

const _knownSamplers: { [key: string]: { setIndex: number, bindingIndex: number} } = {
    "environmentBrdfSampler": { setIndex: 0, bindingIndex: 1 },
    // "reflectionSampler": { setIndex: 0, bindingIndex: 3 },
};

const _samplerFunctionByWebGLSamplerType: { [key: string]: string } = {
    "textureCube": "samplerCube",
    "texture2D": "sampler2D",
    "sampler2D": "sampler2D",
    "samplerCube": "samplerCube"
};

const _textureTypeByWebGLSamplerType: { [key: string]: string } = {
    "textureCube": "textureCube",
    "texture2D": "texture2D",
    "sampler2D": "texture2D",
    "samplerCube": "textureCube"
};

/** @hidden */
export class WebGPUShaderProcessor implements IShaderProcessor {

    public varyingProcessor(varying: string, isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>) {
        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

        const varyingRegex = new RegExp(/\s*varying\s+(\S+)\s+(\S+)\s*;/gm);
        const match = varyingRegex.exec(varying);
        if (match != null) {
            const name = match[2];
            let location: number;
            if (isFragment) {
                location = webgpuProcessingContext.availableVaryings[name];
            }
            else {
                location = webgpuProcessingContext.varyingNextLocation++;
                webgpuProcessingContext.availableVaryings[name] = location;
            }

            varying = varying.replace(match[0], `layout(location = ${location}) ${isFragment ? "in" : "out"} ${match[1]} ${name};`);
        }
        return varying;
    }

    public attributeProcessor(attribute: string, processingContext: Nullable<ShaderProcessingContext>) {
        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

        const attribRegex = new RegExp(/\s*attribute\s+(\S+)\s+(\S+)\s*;/gm);
        const match = attribRegex.exec(attribute);
        if (match != null) {
            const name = match[2];
            const location = webgpuProcessingContext.attributeNextLocation++;

            webgpuProcessingContext.availableAttributes[name] = location;
            webgpuProcessingContext.orderedAttributes[location] = name;

            attribute = attribute.replace(match[0], `layout(location = ${location}) in ${match[1]} ${name};`);
        }
        return attribute;
    }

    public uniformProcessor(uniform: string, isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>): string {
        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;

        const uniformRegex = new RegExp(/\s*uniform\s+(\S+)\s+(\S+)\s*;/gm);

        const match = uniformRegex.exec(uniform);
        if (match != null) {
            const uniformType = match[1];
            const name = match[2];

            if (uniformType.indexOf("texture") === 0 || uniformType.indexOf("sampler") === 0) {
                let samplerInfo = _knownSamplers[name];
                if (!samplerInfo) {
                    samplerInfo = webgpuProcessingContext.getNextFreeTextureBinding();
                }

                const setIndex = samplerInfo.setIndex;
                const textureBindingIndex = samplerInfo.bindingIndex;
                const samplerBindingIndex = samplerInfo.bindingIndex + 1;
                const samplerFunction = _samplerFunctionByWebGLSamplerType[uniformType];
                const textureType = _textureTypeByWebGLSamplerType[uniformType];

                // Manage textures and samplers.
                uniform = `layout(set = ${setIndex}, binding = ${textureBindingIndex}) uniform ${textureType} ${name}Texture;
                    layout(set = ${setIndex}, binding = ${samplerBindingIndex}) uniform sampler ${name}Sampler;
                    #define ${name} ${samplerFunction}(${name}Texture, ${name}Sampler)`;

                webgpuProcessingContext.availableSamplers[name] = samplerInfo;
                if (!webgpuProcessingContext.orderedUBOsAndSamplers[setIndex]) {
                    webgpuProcessingContext.orderedUBOsAndSamplers[setIndex] = [];
                }
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][textureBindingIndex] = { isSampler: true, name };
            }
            else {
                // TODO WEBGPU. Manage none UBOs uniforms.
            }
        }
        return uniform;
    }

    public uniformBufferProcessor(uniformBuffer: string, isFragment: boolean, processingContext: Nullable<ShaderProcessingContext>): string {
        const webgpuProcessingContext = processingContext! as WebGPUShaderProcessingContext;
        const uboRegex = new RegExp(/uniform\s+(\w+)/gm);

        const match = uboRegex.exec(uniformBuffer);
        if (match != null) {
            const name = match[1];
            let setIndex: number;
            let bindingIndex: number;
            const knownUBO = _knownUBOs[name];
            if (knownUBO) {
                setIndex = knownUBO.setIndex;
                bindingIndex = knownUBO.bindingIndex;
            }
            else {
                if (isFragment) {
                    const availableUBO = webgpuProcessingContext.availableUBOs[name];
                    if (availableUBO) {
                        setIndex = availableUBO.setIndex;
                        bindingIndex = availableUBO.bindingIndex;
                    }
                    else {
                        const nextBinding = webgpuProcessingContext.getNextFreeUBOBinding();
                        setIndex = nextBinding.setIndex;
                        bindingIndex = nextBinding.bindingIndex;
                    }
                }
                else {
                    const nextBinding = webgpuProcessingContext.getNextFreeUBOBinding();
                    setIndex = nextBinding.setIndex;
                    bindingIndex = nextBinding.bindingIndex;
                }
            }

            webgpuProcessingContext.availableUBOs[name] = { setIndex, bindingIndex };
            if (!webgpuProcessingContext.orderedUBOsAndSamplers[setIndex]) {
                webgpuProcessingContext.orderedUBOsAndSamplers[setIndex] = [];
            }
            webgpuProcessingContext.orderedUBOsAndSamplers[setIndex][bindingIndex] = { isSampler: false, name };

            uniformBuffer = uniformBuffer.replace("uniform", `layout(set = ${setIndex}, binding = ${bindingIndex}) uniform`);
        }
        return uniformBuffer;
    }

    // public endOfUniformBufferProcessor(closingBracketLine: string, isFragment: boolean): string {
    //     console.log("uniformBuffer closingBracketLine ", closingBracketLine);
    //     return closingBracketLine;
    // }

    public postProcessor(code: string, defines: string[], isFragment: boolean) {
        const hasDrawBuffersExtension = code.search(/#extension.+GL_EXT_draw_buffers.+require/) !== -1;

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
            code = code.replace(/void\s+?main\s*\(/g, (hasDrawBuffersExtension ? "" : "layout(location = 0) out vec4 glFragColor;\n") + "void main(");
        } else {
            var hasMultiviewExtension = defines.indexOf("#define MULTIVIEW") !== -1;
            if (hasMultiviewExtension) {
                return "#extension GL_OVR_multiview2 : require\nlayout (num_views = 2) in;\n" + code;
            }
        }

        // Flip Y.
        // TODO WEBGPU. Triple check this part and wait on Google News for this issue.
        // https://github.com/gpuweb/gpuweb/issues/379
        if (!isFragment) {
            const lastClosingCurly = code.lastIndexOf("}");
            code = code.substring(0, lastClosingCurly);
            code += "gl_Position.y *= -1.; }";
        }

        return code;
    }
}