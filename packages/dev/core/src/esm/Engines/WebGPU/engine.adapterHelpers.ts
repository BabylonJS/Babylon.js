import { getHostDocument } from "../engine.base";
import { _createPrefilteredCubeTexture } from "core/Misc/dds";
import { _loadFile } from "../engine.tools";

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
