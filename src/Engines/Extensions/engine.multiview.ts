import { Camera } from "../../Cameras/camera";
import { Engine } from "../../Engines/engine";
import { Scene } from "../../scene";
import { InternalTexture, InternalTextureSource } from '../../Materials/Textures/internalTexture';
import { Nullable } from '../../types';
import { RenderTargetTexture } from '../../Materials/Textures/renderTargetTexture';
import { Matrix, TmpVectors } from '../../Maths/math.vector';
import { UniformBuffer } from '../../Materials/uniformBuffer';
import { MultiviewRenderTarget } from '../../Materials/Textures/MultiviewRenderTarget';
import { Frustum } from '../../Maths/math.frustum';

declare module "../../Engines/engine" {
    export interface Engine {
        /**
         * Creates a new multiview render target
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @returns the created multiview texture
         */
        createMultiviewRenderTargetTexture(width: number, height: number): InternalTexture;

        /**
         * Binds a multiview framebuffer to be drawn to
         * @param multiviewTexture texture to bind
         */
        bindMultiviewFramebuffer(multiviewTexture: InternalTexture): void;
    }
}

Engine.prototype.createMultiviewRenderTargetTexture = function(width: number, height: number) {
    var gl = this._gl;

    if (!this.getCaps().multiview) {
        throw "Multiview is not supported";
    }

    var internalTexture = new InternalTexture(this, InternalTextureSource.Unknown, true);
    internalTexture.width = width;
    internalTexture.height = height;
    internalTexture._framebuffer = gl.createFramebuffer();

    internalTexture._colorTextureArray = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, internalTexture._colorTextureArray);
    (gl as any).texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, width, height, 2);

    internalTexture._depthStencilTextureArray = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, internalTexture._depthStencilTextureArray);
    (gl as any).texStorage3D(gl.TEXTURE_2D_ARRAY, 1, (gl as any).DEPTH32F_STENCIL8, width, height, 2);
    internalTexture.isReady = true;
    return internalTexture;
};

Engine.prototype.bindMultiviewFramebuffer = function(multiviewTexture: InternalTexture) {
    var gl: any = this._gl;
    var ext = this.getCaps().oculusMultiview || this.getCaps().multiview;

    this.bindFramebuffer(multiviewTexture, undefined, undefined, undefined, true);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, multiviewTexture._framebuffer);
    if (multiviewTexture._colorTextureArray && multiviewTexture._depthStencilTextureArray) {
        if (this.getCaps().oculusMultiview) {
            ext.framebufferTextureMultisampleMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, multiviewTexture._colorTextureArray, 0, multiviewTexture.samples, 0, 2);
            ext.framebufferTextureMultisampleMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, multiviewTexture._depthStencilTextureArray, 0, multiviewTexture.samples, 0, 2);
        } else {
            ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, multiviewTexture._colorTextureArray, 0, 0, 2);
            ext.framebufferTextureMultiviewOVR(gl.DRAW_FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, multiviewTexture._depthStencilTextureArray, 0, 0, 2);
        }
    } else {
        throw "Invalid multiview frame buffer";
    }
};

declare module "../../Cameras/camera" {
    export interface Camera {
        /**
         * @hidden
         * For cameras that cannot use multiview images to display directly. (e.g. webVR camera will render to multiview texture, then copy to each eye texture and go from there)
         */
        _useMultiviewToSingleView: boolean;
        /**
         * @hidden
         * For cameras that cannot use multiview images to display directly. (e.g. webVR camera will render to multiview texture, then copy to each eye texture and go from there)
         */
        _multiviewTexture: Nullable<RenderTargetTexture>;

        /**
         * @hidden
         * ensures the multiview texture of the camera exists and has the specified width/height
         * @param width height to set on the multiview texture
         * @param height width to set on the multiview texture
         */
        _resizeOrCreateMultiviewTexture(width: number, height: number): void;
    }
}

Camera.prototype._useMultiviewToSingleView = false;

Camera.prototype._multiviewTexture = null;

Camera.prototype._resizeOrCreateMultiviewTexture = function(width: number, height: number) {
    if (!this._multiviewTexture) {
        this._multiviewTexture = new MultiviewRenderTarget(this.getScene(), { width: width, height: height });
    } else if (this._multiviewTexture.getRenderWidth() != width || this._multiviewTexture.getRenderHeight() != height) {
        this._multiviewTexture.dispose();
        this._multiviewTexture = new MultiviewRenderTarget(this.getScene(), { width: width, height: height });
    }
};

declare module "../../scene" {
    export interface Scene {
        /** @hidden */
        _transformMatrixR: Matrix;
        /** @hidden */
        _multiviewSceneUbo: Nullable<UniformBuffer>;
        /** @hidden */
        _createMultiviewUbo(): void;
        /** @hidden */
        _updateMultiviewUbo(viewR?: Matrix, projectionR?: Matrix): void;
        /** @hidden */
        _renderMultiviewToSingleView(camera: Camera): void;
    }
}

Scene.prototype._transformMatrixR = Matrix.Zero();
Scene.prototype._multiviewSceneUbo = null;
Scene.prototype._createMultiviewUbo = function() {
    this._multiviewSceneUbo = new UniformBuffer(this.getEngine(), undefined, true, "scene_multiview");
    this._multiviewSceneUbo.addUniform("viewProjection", 16);
    this._multiviewSceneUbo.addUniform("viewProjectionR", 16);
    this._multiviewSceneUbo.addUniform("view", 16);
    this._multiviewSceneUbo.addUniform("projection", 16);
    this._multiviewSceneUbo.addUniform("viewPosition", 4);
};
Scene.prototype._updateMultiviewUbo = function(viewR?: Matrix, projectionR?: Matrix) {
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
Scene.prototype._renderMultiviewToSingleView = function(camera: Camera) {
    // Multiview is only able to be displayed directly for API's such as webXR
    // This displays a multiview image by rendering to the multiview image and then
    // copying the result into the sub cameras instead of rendering them and proceeding as normal from there

    // Render to a multiview texture
    camera._resizeOrCreateMultiviewTexture(
        (camera._rigPostProcess && camera._rigPostProcess && camera._rigPostProcess.width > 0) ? camera._rigPostProcess.width : this.getEngine().getRenderWidth(true),
        (camera._rigPostProcess && camera._rigPostProcess && camera._rigPostProcess.height > 0) ? camera._rigPostProcess.height : this.getEngine().getRenderHeight(true)
    );
    if (!this._multiviewSceneUbo) {
        this._createMultiviewUbo();
    }
    camera.outputRenderTarget = camera._multiviewTexture;
    this._renderForCamera(camera);
    camera.outputRenderTarget = null;

    // Consume the multiview texture through a shader for each eye
    for (var index = 0; index < camera._rigCameras.length; index++) {
        var engine = this.getEngine();
        this._activeCamera = camera._rigCameras[index];
        engine.setViewport(this._activeCamera.viewport);
        if (this.postProcessManager) {
            this.postProcessManager._prepareFrame();
            this.postProcessManager._finalizeFrame(this._activeCamera.isIntermediate);
        }
    }
};