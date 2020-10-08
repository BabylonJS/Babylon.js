import { IShaderProcessor } from '../Processors/iShaderProcessor';

import { ThinEngine } from '../thinEngine';

/** @hidden */
export class WebGLShaderProcessor implements IShaderProcessor {
    public postProcessor(code: string, defines: string[], isFragment: boolean, engine: ThinEngine) {

        // Remove extensions
        if (!engine.getCaps().drawBuffersExtension) {
            // even if enclosed in #if/#endif, IE11 does parse the #extension declaration, so we need to remove it altogether
            var regex = /#extension.+GL_EXT_draw_buffers.+(enable|require)/g;
            code = code.replace(regex, "");
        }

        return code;
    }
}