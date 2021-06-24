import { ShaderCodeInliner } from "../../Processors/shaderCodeInliner";
import { WebGPUEngine } from "../../webgpuEngine";

WebGPUEngine.prototype.inlineShaderCode = function(code: string) {
    const sci = new ShaderCodeInliner(code);
    sci.debug = false;
    sci.processCode();
    return sci.code;
};
