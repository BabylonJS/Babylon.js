import { Camera } from "../../Cameras/camera";
import { Engine } from "../../Engines/engine";
import { Scene } from "../../scene";
import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import type { Nullable } from "../../types";
import type { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { Matrix, TmpVectors } from "../../Maths/math.vector";
import { UniformBuffer } from "../../Materials/uniformBuffer";
import { MultiviewRenderTarget } from "../../Materials/Textures/MultiviewRenderTarget";
import { Frustum } from "../../Maths/math.frustum";
import type { WebGLRenderTargetWrapper } from "../WebGL/webGLRenderTargetWrapper";
import type { RenderTargetWrapper } from "../renderTargetWrapper";

declare module "../../Engines/engine" {
    export interface Engine {
        /**
         * Creates a new multiview render target
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @returns the created multiview render target wrapper
         */
        createMultiviewRenderTargetTexture(width: number, height: number, colorTexture?: WebGLTexture, depthStencilTexture?: WebGLTexture): RenderTargetWrapper;

        /**
         * Binds a multiview render target wrapper to be drawn to
         * @param multiviewTexture render target wrapper to bind
         */
        bindMultiviewFramebuffer(multiviewTexture: RenderTargetWrapper): void;

        /**
         * Binds a Space Warp render target wrapper to be drawn to
         * @param spaceWarpTexture render target wrapper to bind
         */
        bindSpaceWarpFramebuffer(spaceWarpTexture: RenderTargetWrapper): void;
    }
}

Engine.prototype.createMultiviewRenderTargetTexture = function (width: number, height: number, colorTexture?: WebGLTexture, depthStencilTexture?: WebGLTexture) {
    const gl = this._gl;

    if (!this.getCaps().multiview) {
        // eslint-disable-next-line no-throw-literal
        throw "Multiview is not supported";
    }

    const rtWrapper = this._createHardwareRenderTargetWrapper(false, false, { width, height }) as WebGLRenderTargetWrapper;

    rtWrapper._framebuffer = gl.createFramebuffer();

    const internalTexture = new InternalTexture(this, InternalTextureSource.Unknown, true);
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

Engine.prototype.bindMultiviewFramebuffer = function (_multiviewTexture: RenderTargetWrapper) {
    const multiviewTexture = _multiviewTexture as WebGLRenderTargetWrapper;

    const gl: any = this._gl;
    const ext = this.getCaps().oculusMultiview || this.getCaps().multiview;

    this.bindFramebuffer(multiviewTexture, undefined, undefined, undefined, true);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, multiviewTexture._framebuffer);
    if (multiviewTexture._colorTextureArray && multiviewTexture._depthStencilTextureArray) {
        if (this.getCaps().oculusMultiview) {
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
        // eslint-disable-next-line no-throw-literal
        throw "Invalid multiview frame buffer";
    }
};

Engine.prototype.bindSpaceWarpFramebuffer = function (_spaceWarpTexture: RenderTargetWrapper) {
    const spaceWarpTexture = _spaceWarpTexture as WebGLRenderTargetWrapper;

    const gl: any = this._gl;
    const ext = this.getCaps().oculusMultiview || this.getCaps().multiview;

    this.bindFramebuffer(spaceWarpTexture, undefined, undefined, undefined, true);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, spaceWarpTexture._framebuffer);
    if (spaceWarpTexture._colorTextureArray && spaceWarpTexture._depthStencilTextureArray) {
        ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, spaceWarpTexture._colorTextureArray, 0, 0, 2);
        ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.DEPTH_ATTACHMENT, spaceWarpTexture._depthStencilTextureArray, 0, 0, 2);
    } else {
        throw new Error("Invalid Space Warp framebuffer");
    }
};

declare module "../../Cameras/camera" {
    export interface Camera {
        /**
         * @internal
         * For cameras that cannot use multiview images to display directly. (e.g. webVR camera will render to multiview texture, then copy to each eye texture and go from there)
         */
        _useMultiviewToSingleView: boolean;
        /**
         * @internal
         * For cameras that cannot use multiview images to display directly. (e.g. webVR camera will render to multiview texture, then copy to each eye texture and go from there)
         */
        _multiviewTexture: Nullable<RenderTargetTexture>;

        /**
         * @internal
         * For WebXR cameras that are rendering to multiview texture arrays.
         */
        _renderingMultiview: boolean;

        /**
         * @internal
         * ensures the multiview texture of the camera exists and has the specified width/height
         * @param width height to set on the multiview texture
         * @param height width to set on the multiview texture
         */
        _resizeOrCreateMultiviewTexture(width: number, height: number): void;
    }
}

Camera.prototype._useMultiviewToSingleView = false;

Camera.prototype._multiviewTexture = null;

Camera.prototype._resizeOrCreateMultiviewTexture = function (width: number, height: number) {
    if (!this._multiviewTexture) {
        this._multiviewTexture = new MultiviewRenderTarget(this.getScene(), { width: width, height: height });
    } else if (this._multiviewTexture.getRenderWidth() != width || this._multiviewTexture.getRenderHeight() != height) {
        this._multiviewTexture.dispose();
        this._multiviewTexture = new MultiviewRenderTarget(this.getScene(), { width: width, height: height });
    }
};

declare module "../../scene" {
    export interface Scene {
        /** @internal */
        _transformMatrixR: Matrix;
        /** @internal */
        _multiviewSceneUbo: Nullable<UniformBuffer>;
        /** @internal */
        _createMultiviewUbo(): void;
        /** @internal */
        _updateMultiviewUbo(viewR?: Matrix, projectionR?: Matrix): void;
        /** @internal */
        _renderMultiviewToSingleView(camera: Camera): void;
    }
}

function createMultiviewUbo(engine: Engine, name?: string) {
    const ubo = new UniformBuffer(engine, undefined, true, name);
    ubo.addUniform("viewProjection", 16);
    ubo.addUniform("viewProjectionR", 16);
    ubo.addUniform("view", 16);
    ubo.addUniform("projection", 16);
    ubo.addUniform("vEyePosition", 4);
    return ubo;
}

const currentCreateSceneUniformBuffer = Scene.prototype.createSceneUniformBuffer;

Scene.prototype._transformMatrixR = Matrix.Zero();
Scene.prototype._multiviewSceneUbo = null;
Scene.prototype._createMultiviewUbo = function () {
    this._multiviewSceneUbo = createMultiviewUbo(this.getEngine(), "scene_multiview");
};
Scene.prototype.createSceneUniformBuffer = function (name?: string): UniformBuffer {
    if (this._multiviewSceneUbo) {
        return createMultiviewUbo(this.getEngine(), name);
    }
    return currentCreateSceneUniformBuffer.bind(this)(name);
};
Scene.prototype._updateMultiviewUbo = function (viewR?: Matrix, projectionR?: Matrix) {
    if (viewR && projectionR) {
        viewR.multiplyToRef(projectionR, this._transformMatrixR);
    }

    if (viewR && projectionR) {
        viewR.multiplyToRef(projectionR, TmpVectors.Matrix[0]);
        Frustum.GetRightPlaneToRef(TmpVectors.Matrix[0], this._frustumPlanes[3]); // Replace right plane by second camera right plane
    }

    if (this._multiviewSceneUbo) {
        this._multiviewSceneUbo.updateMatrix("viewProjection", this.getTransformMatrix());
        this._multiviewSceneUbo.updateMatrix("viewProjectionR", this._transformMatrixR);
        this._multiviewSceneUbo.updateMatrix("view", this._viewMatrix);
        this._multiviewSceneUbo.updateMatrix("projection", this._projectionMatrix);
    }
};
Scene.prototype._renderMultiviewToSingleView = function (camera: Camera) {
    // Multiview is only able to be displayed directly for API's such as webXR
    // This displays a multiview image by rendering to the multiview image and then
    // copying the result into the sub cameras instead of rendering them and proceeding as normal from there

    // Render to a multiview texture
    camera._resizeOrCreateMultiviewTexture(
        camera._rigPostProcess && camera._rigPostProcess && camera._rigPostProcess.width > 0 ? camera._rigPostProcess.width : this.getEngine().getRenderWidth(true),
        camera._rigPostProcess && camera._rigPostProcess && camera._rigPostProcess.height > 0 ? camera._rigPostProcess.height : this.getEngine().getRenderHeight(true)
    );
    if (!this._multiviewSceneUbo) {
        this._createMultiviewUbo();
    }
    camera.outputRenderTarget = camera._multiviewTexture;
    this._renderForCamera(camera);
    camera.outputRenderTarget = null;

    // Consume the multiview texture through a shader for each eye
    for (let index = 0; index < camera._rigCameras.length; index++) {
        const engine = this.getEngine();
        this._activeCamera = camera._rigCameras[index];
        engine.setViewport(this._activeCamera.viewport);
        if (this.postProcessManager) {
            this.postProcessManager._prepareFrame();
            this.postProcessManager._finalizeFrame(this._activeCamera.isIntermediate);
        }
    }
};
