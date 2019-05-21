import { IShaderProcessor } from '../Processors/iShaderProcessor';

/** @hidden */
export class WebGL2ShaderProcessor implements IShaderProcessor {
    public attributeProcessor(attribute: string) {
        return attribute.replace("attribute", "in");
    }

    public varyingProcessor(varying: string, isFragment: boolean) {
        return varying.replace("varying", isFragment ? "in" : "out");
    }

    public postProcessor(code: string, defines: string[], isFragment: boolean) {
        // Remove extensions
        // #extension GL_OES_standard_derivatives : enable
        // #extension GL_EXT_shader_texture_lod : enable
        // #extension GL_EXT_frag_depth : enable
        // #extension GL_EXT_draw_buffers : require
        var regex = /#extension.+(GL_OVR_multiview2|GL_OES_standard_derivatives|GL_EXT_shader_texture_lod|GL_EXT_frag_depth|GL_EXT_draw_buffers).+(enable|require)/g;
        code = code.replace(regex, "");

        code = code.replace(/texture2D\s*\(/g, "texture(");
        if (isFragment) {
            const hasDrawBuffersExtension = code.search(/#extension.+GL_EXT_draw_buffers.+require/) !== -1;
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