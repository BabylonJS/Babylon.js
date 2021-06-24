import { ThinEngine } from "../../Engines/thinEngine";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Inline functions in shader code that are marked to be inlined
         * @param code code to inline
         * @returns inlined code
         */
        inlineShaderCode(code: string): string;
    }
}

ThinEngine.prototype.inlineShaderCode = function(code: string) {
    // no inlining needed in the WebGL engine
    return code;
};
