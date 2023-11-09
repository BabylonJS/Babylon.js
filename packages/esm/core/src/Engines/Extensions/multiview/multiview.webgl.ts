import type { WebGLRenderTargetWrapper } from "@babylonjs/core/Engines/WebGL/webGLRenderTargetWrapper.js";
import type { RenderTargetWrapper } from "@babylonjs/core/Engines/renderTargetWrapper.js";
import { InternalTexture, InternalTextureSource } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import { bindFramebuffer, type IWebGLEnginePublic, type WebGLEngineStateFull } from "../../engine.webgl.js";
import { _createHardwareRenderTargetWrapper } from "../renderTarget/renderTarget.webgl.js";
import { augmentEngineState } from "../../engine.adapters.js";
import { getInternalTextureWebGLAdapter } from "../../engine.adapterHelpers.js";
import type { IMultiviewEngineExtension } from "./multiview.base.js";

export const createMultiviewRenderTargetTexture: IMultiviewEngineExtension["createMultiviewRenderTargetTexture"] = function (
    engineState: IWebGLEnginePublic,
    width: number,
    height: number,
    colorTexture?: WebGLTexture,
    depthStencilTexture?: WebGLTexture
) {
    const fes = engineState as WebGLEngineStateFull;
    const gl = fes._gl;

    if (!fes._caps.multiview) {
        throw "Multiview is not supported";
    }

    const rtWrapper = _createHardwareRenderTargetWrapper(fes, false, false, { width, height }) as WebGLRenderTargetWrapper;

    rtWrapper._framebuffer = gl.createFramebuffer();

    const internalTexture = new InternalTexture(
        augmentEngineState(engineState, getInternalTextureWebGLAdapter(InternalTextureSource.Unknown)),
        InternalTextureSource.Unknown,
        true
    );
    internalTexture.width = width;
    internalTexture.height = height;
    internalTexture.isMultiview = true;

    if (!colorTexture) {
        colorTexture = gl.createTexture() as WebGLTexture;
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, colorTexture);
        (gl as any).texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, width, height, 2);
    }

    rtWrapper._colorTextureArray = colorTexture;

    if (!depthStencilTexture) {
        depthStencilTexture = gl.createTexture() as WebGLTexture;
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, depthStencilTexture);
        (gl as any).texStorage3D(gl.TEXTURE_2D_ARRAY, 1, (gl as any).DEPTH24_STENCIL8, width, height, 2);
    }

    rtWrapper._depthStencilTextureArray = depthStencilTexture;

    internalTexture.isReady = true;

    rtWrapper.setTextures(internalTexture);
    rtWrapper._depthStencilTexture = internalTexture;

    return rtWrapper;
};

export const bindMultiviewFramebuffer: IMultiviewEngineExtension["bindMultiviewFramebuffer"] = function (engineState: IWebGLEnginePublic, _multiviewTexture: RenderTargetWrapper) {
    const multiviewTexture = _multiviewTexture as WebGLRenderTargetWrapper;
    const fes = engineState as WebGLEngineStateFull;

    const gl: any = fes._gl;
    const ext = fes._caps.oculusMultiview || fes._caps.multiview;

    bindFramebuffer(fes, multiviewTexture, undefined, undefined, undefined, true);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, multiviewTexture._framebuffer);
    if (multiviewTexture._colorTextureArray && multiviewTexture._depthStencilTextureArray) {
        if (fes._caps.oculusMultiview) {
            ext.framebufferTextureMultisampleMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, multiviewTexture._colorTextureArray, 0, multiviewTexture.samples, 0, 2);
            ext.framebufferTextureMultisampleMultiviewOVR(
                gl.DRAW_FRAMEBUFFER,
                gl.DEPTH_STENCIL_ATTACHMENT,
                multiviewTexture._depthStencilTextureArray,
                0,
                multiviewTexture.samples,
                0,
                2
            );
        } else {
            ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, multiviewTexture._colorTextureArray, 0, 0, 2);
            ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, multiviewTexture._depthStencilTextureArray, 0, 0, 2);
        }
    } else {
        throw "Invalid multiview frame buffer";
    }
};

export const bindSpaceWarpFramebuffer: IMultiviewEngineExtension["bindSpaceWarpFramebuffer"] = function (engineState: IWebGLEnginePublic, _spaceWarpTexture: RenderTargetWrapper) {
    const spaceWarpTexture = _spaceWarpTexture as WebGLRenderTargetWrapper;
    const fes = engineState as WebGLEngineStateFull;

    const gl: any = fes._gl;
    const ext = fes._caps.oculusMultiview || fes._caps.multiview;

    bindFramebuffer(fes, spaceWarpTexture, undefined, undefined, undefined, true);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, spaceWarpTexture._framebuffer);
    if (spaceWarpTexture._colorTextureArray && spaceWarpTexture._depthStencilTextureArray) {
        ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, spaceWarpTexture._colorTextureArray, 0, 0, 2);
        ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, spaceWarpTexture._depthStencilTextureArray, 0, 0, 2);
    } else {
        throw new Error("Invalid Space Warp framebuffer");
    }
};

export const multiviewEngineExtension: IMultiviewEngineExtension = {
    createMultiviewRenderTargetTexture,
    bindMultiviewFramebuffer,
    bindSpaceWarpFramebuffer,
};

export default multiviewEngineExtension;
