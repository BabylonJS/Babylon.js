import type { RenderTargetWrapper } from "@babylonjs/core/Engines/renderTargetWrapper.js";
import type { IBaseEnginePublic } from "../../engine.base.js";
import { Camera } from "@babylonjs/core/Cameras/camera.js";
import { Scene } from "@babylonjs/core/scene.js";
import type { Engine } from "@babylonjs/core/Engines/engine.js";
import type { RenderTargetTexture } from "@babylonjs/core/Materials/Textures/renderTargetTexture.js";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer.js";
import { Frustum } from "@babylonjs/core/Maths/math.frustum.js";
import { Matrix, TmpVectors } from "@babylonjs/core/Maths/math.vector.js";
import type { Nullable } from "@babylonjs/core/types.js";
import { MultiviewRenderTarget } from "@babylonjs/core/Materials/Textures/MultiviewRenderTarget.js";

export interface IMultiviewEngineExtension {
    /**
     * Creates a new multiview render target
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @returns the created multiview render target wrapper
     */
    createMultiviewRenderTargetTexture(
        engineState: IBaseEnginePublic,
        width: number,
        height: number,
        colorTexture?: WebGLTexture,
        depthStencilTexture?: WebGLTexture
    ): RenderTargetWrapper;

    /**
     * Binds a multiview render target wrapper to be drawn to
     * @param multiviewTexture render target wrapper to bind
     */
    bindMultiviewFramebuffer(engineState: IBaseEnginePublic, multiviewTexture: RenderTargetWrapper): void;

    /**
     * Binds a Space Warp render target wrapper to be drawn to
     * @param spaceWarpTexture render target wrapper to bind
     */
    bindSpaceWarpFramebuffer(engineState: IBaseEnginePublic, spaceWarpTexture: RenderTargetWrapper): void;
}
declare module "@babylonjs/core/Cameras/camera.js" {
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

declare module "@babylonjs/core/scene.js" {
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

export const initMultiviewExtension = () => {
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
};
