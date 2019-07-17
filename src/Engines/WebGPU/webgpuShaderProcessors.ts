import { IShaderProcessor } from '../Processors/iShaderProcessor';

/** @hidden */
export class WebGPUShaderProcessor implements IShaderProcessor {
    // attributeProcessor?: (attribute: string) => string;
    // varyingProcessor?: (varying: string, isFragment: boolean) => string;
    // uniformProcessor?: (uniform: string, isFragment: boolean) => string;
    // uniformBufferProcessor?: (uniformBuffer: string, isFragment: boolean) => string;
    // endOfUniformBufferProcessor?: (closingBracketLine: string, isFragment: boolean) => string;
    // lineProcessor?: (line: string, isFragment: boolean) => string;
    // preProcessor?: (code: string, defines: string[], isFragment: boolean) => string;
    // postProcessor?: (code: string, defines: string[], isFragment: boolean) => string;

    // public preProcessor(preparedSourceCode: string, defines: string[], isFragment: boolean): string {
    //     return "#define WEBGPU \n" + preparedSourceCode;
    // }

    public attributeProcessor(attribute: string) {
        return attribute.replace("attribute", "in");
        // const inOut = isFragment ? "in" : "out";
        // const attribRegex = new RegExp(/\s+attribute\s+(\w+)\s+/gm);

        // let location = 0;
        // let match = attribRegex.exec(code);
        // while (match != null) {
        //     if (match[1]) {
        //         code = code.replace(match[0], ` layout(location = ${location}) ${inOut} ${match[1]} `);
        //         location++;
        //     }
        //     match = attribRegex.exec(code);
        // }
        // return code;
    }

    public varyingProcessor(varying: string, isFragment: boolean) {
        return varying.replace("varying", isFragment ? "in" : "out");
        // const inOut = isFragment ? "in" : "out";
        // const attribRegex = new RegExp(/\s+varying\s+(\w+)\s+/gm);

        // let location = 0;
        // let match = attribRegex.exec(code);
        // while (match != null) {
        //     if (match[1]) {
        //         code = code.replace(match[0], ` layout(location = ${location}) ${inOut} ${match[1]} `);
        //         location++;
        //     }
        //     match = attribRegex.exec(code);
        // }
        // return code;
    }

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
        if (!isFragment) {
            const lastClosingCurly = code.lastIndexOf("}");
            code = code.substring(0, lastClosingCurly);
            code += "gl_Position.y *= -1.; }";
        }

        return code;
    }
}