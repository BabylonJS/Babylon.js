import { ShaderCodeInliner } from "../../Processors/shaderCodeInliner";
import { NativeEngine } from "../../nativeEngine";

NativeEngine.prototype.inlineShaderCode = function(code: string) {
    const sci = new ShaderCodeInliner(code);
    sci.debug = false;
    sci.processCode();
    return sci.code;
};
