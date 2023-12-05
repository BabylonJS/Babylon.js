import { getHostDocument } from "../engine.base.js";
import { _createPrefilteredCubeTexture } from "core/Misc/dds.js";
import { _loadFile } from "../engine.tools.js";

export const effectWebGPUAdapter = {
    getHostDocument,
    _getShaderProcessingContext: () => null,
    // _getShaderProcessor,
    _loadFile,
    // createPipelineContext,
    // _preparePipelineContext,
    //_executeWhenRenderingStateIsCompiled,
    // bindSamplers,
    // _bindTexture,
    // setTexture,
    // setDepthStencilTexture,
    // setTextureArray,
    // setTextureFromPostProcess,
    // bindUniformBufferBase,
    // bindUniformBlock,
};
