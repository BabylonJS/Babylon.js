import type { WebGLRenderTargetWrapper } from "core/Engines/WebGL/webGLRenderTargetWrapper.js";
import {
    _bindTextureDirectly,
    _bindUnboundFramebuffer,
    _getInternalFormat,
    _getRGBABufferInternalSizedFormat,
    _getSamplingParameters,
    _getWebGLTextureType,
    _setupFramebufferDepthAttachments,
    type IWebGLEnginePublic,
    type WebGLEngineState,
} from "../../engine.webgl.js";
import { _createHardwareRenderTargetWrapper } from "../renderTarget/renderTarget.webgl.js";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture.js";
import { Logger } from "core/Misc/logger.js";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper.js";
import type { RenderTargetCreationOptions } from "core/Materials/Textures/textureCreationOptions.js";
import { getInternalTextureWebGLAdapter } from "../../engine.adapterHelpers.js";
import type { IRenderTargetCubeEngineExtension } from "../../../Extensions/renderTargetCube/renderTargetCube.base.js";
import { augmentEngineState } from "../../../engine.adapters.js";
import { Constants } from "../../../engine.constants.js";

export const createRenderTargetCubeTexture: IRenderTargetCubeEngineExtension["createRenderTargetCubeTexture"] = function (
    engineState: IWebGLEnginePublic,
    size: number,
    options?: RenderTargetCreationOptions
): RenderTargetWrapper {
    const fes = engineState as WebGLEngineState;
    const rtWrapper = _createHardwareRenderTargetWrapper(engineState, false, true, size) as WebGLRenderTargetWrapper;

    const fullOptions = {
        generateMipMaps: true,
        generateDepthBuffer: true,
        generateStencilBuffer: false,
        type: Constants.TEXTURETYPE_UNSIGNED_INT as number,
        samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE as number,
        format: Constants.TEXTUREFORMAT_RGBA as number,
        ...options,
    };
    fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && fullOptions.generateStencilBuffer;

    if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !fes._caps.textureFloatLinearFiltering) {
        // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
        fullOptions.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    } else if (fullOptions.type === Constants.TEXTURETYPE_HALF_FLOAT && !fes._caps.textureHalfFloatLinearFiltering) {
        // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
        fullOptions.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    }
    const gl = fes._gl;

    const texture = new InternalTexture(augmentEngineState(engineState, getInternalTextureWebGLAdapter(InternalTextureSource.RenderTarget)), InternalTextureSource.RenderTarget);
    _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, texture, true);

    const filters = _getSamplingParameters(fes, fullOptions.samplingMode, fullOptions.generateMipMaps);

    if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !fes._caps.textureFloat) {
        fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
        Logger.Warn("Float textures are not supported. Cube render target forced to TEXTURETYPE_UNESIGNED_BYTE type");
    }

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filters.mag);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filters.min);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    for (let face = 0; face < 6; face++) {
        gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
            0,
            _getRGBABufferInternalSizedFormat(fes, fullOptions.type, fullOptions.format),
            size,
            size,
            0,
            _getInternalFormat(fes, fullOptions.format),
            _getWebGLTextureType(fes, fullOptions.type),
            null
        );
    }

    // Create the framebuffer
    const framebuffer = gl.createFramebuffer();
    _bindUnboundFramebuffer(fes, framebuffer);

    rtWrapper._depthStencilBuffer = _setupFramebufferDepthAttachments(fes, fullOptions.generateStencilBuffer, fullOptions.generateDepthBuffer, size, size);

    // MipMaps
    if (fullOptions.generateMipMaps) {
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    }

    // Unbind
    _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, null);
    _bindUnboundFramebuffer(fes, null);

    rtWrapper._framebuffer = framebuffer;
    rtWrapper._generateDepthBuffer = fullOptions.generateDepthBuffer;
    rtWrapper._generateStencilBuffer = fullOptions.generateStencilBuffer;

    texture.width = size;
    texture.height = size;
    texture.isReady = true;
    texture.isCube = true;
    texture.samples = 1;
    texture.generateMipMaps = fullOptions.generateMipMaps;
    texture.samplingMode = fullOptions.samplingMode;
    texture.type = fullOptions.type;
    texture.format = fullOptions.format;

    fes._internalTexturesCache.push(texture);
    rtWrapper.setTextures(texture);

    return rtWrapper;
};
