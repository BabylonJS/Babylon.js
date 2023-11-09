import { createCubeTexture } from "./Extensions/cubeTexture/cubeTexture.webgl.js";
import { createDynamicTexture, updateDynamicTexture } from "./Extensions/dynamicTexture/dynamicTexture.webgl.js";
import { createRawTexture, createRawTexture3D, createRawTexture2DArray, createRawCubeTexture } from "./Extensions/rawTexture/engine.rawTexture.webgl.js";
import type { IWebGLEnginePublic } from "./engine.webgl.js";
import {
    createTexture,
    _createHardwareTexture,
    _releaseTexture,
    _bindTextureDirectly,
    _unpackFlipY,
    _bindTexture,
    _executeWhenRenderingStateIsCompiled,
    _getShaderProcessor,
    _preparePipelineContext,
    bindSamplers,
    bindUniformBlock,
    createPipelineContext,
    setDepthStencilTexture,
    setTexture,
    setTextureArray,
    setTextureFromPostProcess,
} from "./engine.webgl.js";
import { getCaps, getHostDocument, getLoadedTexturesCache, getRenderingCanvas } from "./engine.base.js";
import type { InternalTexture } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import { InternalTextureSource } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { Nullable } from "@babylonjs/core/types.js";
import { _createPrefilteredCubeTexture } from "@babylonjs/core/Misc/dds.js";
import { augmentEngineState } from "./engine.adapters.js";
import { _loadFile } from "./engine.tools.js";
import { bindUniformBufferBase } from "./Extensions/uniformBuffer/uniformBuffer.webgl.js";

export const createPrefilteredCubeTextureWebGLAdapter = {
    getCaps,
    _bindTextureDirectly,
    _unpackFlipY,
    createCubeTexture,
};

export const effectWebGLAdapter = {
    getHostDocument,
    _getShaderProcessingContext: () => null,
    _getShaderProcessor,
    _loadFile,
    createPipelineContext,
    _preparePipelineContext,
    _executeWhenRenderingStateIsCompiled,
    bindSamplers,
    _bindTexture,
    setTexture,
    setDepthStencilTexture,
    setTextureArray,
    setTextureFromPostProcess,
    bindUniformBufferBase,
    bindUniformBlock,
};

// internal texture webgl
const internalTextureWebGLAdapter: { [key: string]: Function } = {
    _createHardwareTexture,
    updateTextureDimensions: () => {},
    getLoadedTexturesCache,
    _releaseTexture,
};

const createPrefilteredCubeTexture = (
    engineState: IWebGLEnginePublic,

    rootUrl: string,
    scene: Nullable<Scene>,
    lodScale: number,
    lodOffset: number,
    onLoad: Nullable<(internalTexture: Nullable<InternalTexture>) => void> = null,
    onError: Nullable<(message?: string, exception?: any) => void> = null,
    format?: number,
    forcedExtension: any = null,
    createPolynomials: boolean = true
): InternalTexture => {
    // TODO - web gl prefiltered engine augmentation
    return _createPrefilteredCubeTexture(
        augmentEngineState(engineState, createPrefilteredCubeTextureWebGLAdapter),
        rootUrl,
        scene,
        lodScale,
        lodOffset,
        onLoad,
        onError,
        format,
        forcedExtension,
        createPolynomials
    );
};

// TODO - this function is not very tree-shaking-friendly
export function getInternalTextureWebGLAdapter(type?: InternalTextureSource) {
    switch (type) {
        case undefined:
            internalTextureWebGLAdapter["createTexture"] = createTexture;
            internalTextureWebGLAdapter["createRawTexture"] = createRawTexture;
            internalTextureWebGLAdapter["createRawTexture3D"] = createRawTexture3D;
            internalTextureWebGLAdapter["createRawTexture2DArray"] = createRawTexture2DArray;
            internalTextureWebGLAdapter["createDynamicTexture"] = createDynamicTexture;
            internalTextureWebGLAdapter["updateDynamicTexture"] = updateDynamicTexture;
            internalTextureWebGLAdapter["getRenderingCanvas"] = getRenderingCanvas;
            internalTextureWebGLAdapter["createCubeTexture"] = createCubeTexture;
            internalTextureWebGLAdapter["createRawCubeTexture"] = createRawCubeTexture;
            internalTextureWebGLAdapter["createPrefilteredCubeTexture"] = createPrefilteredCubeTexture;

            break;
        case InternalTextureSource.Url:
            internalTextureWebGLAdapter["createTexture"] = createTexture;
            break;
        case InternalTextureSource.Raw:
            internalTextureWebGLAdapter["createRawTexture"] = createRawTexture;
            break;
        case InternalTextureSource.Raw3D:
            internalTextureWebGLAdapter["createRawTexture3D"] = createRawTexture3D;
            break;
        case InternalTextureSource.Raw2DArray:
            internalTextureWebGLAdapter["createRawTexture2DArray"] = createRawTexture2DArray;
            break;
        case InternalTextureSource.Dynamic:
            internalTextureWebGLAdapter["createDynamicTexture"] = createDynamicTexture;
            internalTextureWebGLAdapter["updateDynamicTexture"] = updateDynamicTexture;
            internalTextureWebGLAdapter["getRenderingCanvas"] = getRenderingCanvas;
            break;
        case InternalTextureSource.Cube:
            internalTextureWebGLAdapter["createCubeTexture"] = createCubeTexture;
            break;
        case InternalTextureSource.CubeRaw:
            internalTextureWebGLAdapter["createRawCubeTexture"] = createRawCubeTexture;
            break;
        case InternalTextureSource.CubePrefiltered:
            internalTextureWebGLAdapter["createPrefilteredCubeTexture"] = createPrefilteredCubeTexture;
            break;
    }
    return internalTextureWebGLAdapter;
}
