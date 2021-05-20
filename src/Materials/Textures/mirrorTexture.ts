import { Observer } from "../../Misc/observable";
import { Nullable } from "../../types";
import { Camera } from "../../Cameras/camera";
import { Scene } from "../../scene";
import { Matrix, Vector3, Vector2 } from "../../Maths/math.vector";
import { Texture } from "../../Materials/Textures/texture";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { ImageProcessingConfiguration } from "../../Materials/imageProcessingConfiguration";
import { BlurPostProcess } from "../../PostProcesses/blurPostProcess";
import { Constants } from "../../Engines/constants";
import { Plane } from '../../Maths/math.plane';
/**
 * Mirror texture can be used to simulate the view from a mirror in a scene.
 * It will dynamically be rendered every frame to adapt to the camera point of view.
 * You can then easily use it as a reflectionTexture on a flat surface.
 * In case the surface is not a plane, please consider relying on reflection probes.
 * @see https://doc.babylonjs.com/how_to/reflect#mirrors
 */
export class MirrorTexture extends RenderTargetTexture {
    /**
     * Define the reflection plane we want to use. The mirrorPlane is usually set to the constructed reflector.
     * It is possible to directly set the mirrorPlane by directly using a Plane(a, b, c, d) where a, b and c give the plane normal vector (a, b, c) and d is a scalar displacement from the mirrorPlane to the origin. However in all but the very simplest of situations it is more straight forward to set it to the reflector as stated in the doc.
     * @see https://doc.babylonjs.com/how_to/reflect#mirrors
     */
    public mirrorPlane = new Plane(0, 1, 0, 1);

    /**
     * Define the blur ratio used to blur the reflection if needed.
     */
    public set blurRatio(value: number) {
        if (this._blurRatio === value) {
            return;
        }

        this._blurRatio = value;
        this._preparePostProcesses();
    }

    public get blurRatio(): number {
        return this._blurRatio;
    }

    /**
     * Define the adaptive blur kernel used to blur the reflection if needed.
     * This will autocompute the closest best match for the `blurKernel`
     */
    public set adaptiveBlurKernel(value: number) {
        this._adaptiveBlurKernel = value;
        this._autoComputeBlurKernel();
    }

    /**
     * Define the blur kernel used to blur the reflection if needed.
     * Please consider using `adaptiveBlurKernel` as it could find the closest best value for you.
     */
    public set blurKernel(value: number) {
        this.blurKernelX = value;
        this.blurKernelY = value;
    }

    /**
     * Define the blur kernel on the X Axis used to blur the reflection if needed.
     * Please consider using `adaptiveBlurKernel` as it could find the closest best value for you.
     */
    public set blurKernelX(value: number) {
        if (this._blurKernelX === value) {
            return;
        }

        this._blurKernelX = value;
        this._preparePostProcesses();
    }

    public get blurKernelX(): number {
        return this._blurKernelX;
    }

    /**
     * Define the blur kernel on the Y Axis used to blur the reflection if needed.
     * Please consider using `adaptiveBlurKernel` as it could find the closest best value for you.
     */
    public set blurKernelY(value: number) {
        if (this._blurKernelY === value) {
            return;
        }

        this._blurKernelY = value;
        this._preparePostProcesses();
    }

    public get blurKernelY(): number {
        return this._blurKernelY;
    }

    private _autoComputeBlurKernel(): void {
        let engine = this.getScene()!.getEngine();

        let dw = this.getRenderWidth() / engine.getRenderWidth();
        let dh = this.getRenderHeight() / engine.getRenderHeight();
        this.blurKernelX = this._adaptiveBlurKernel * dw;
        this.blurKernelY = this._adaptiveBlurKernel * dh;
    }

    protected _onRatioRescale(): void {
        if (this._sizeRatio) {
            this.resize(this._initialSizeParameter);
            if (!this._adaptiveBlurKernel) {
                this._preparePostProcesses();
            }
        }

        if (this._adaptiveBlurKernel) {
            this._autoComputeBlurKernel();
        }
    }

    private _updateGammaSpace() {
        this.gammaSpace = !this.scene.imageProcessingConfiguration.isEnabled || !this.scene.imageProcessingConfiguration.applyByPostProcess;
    }

    private _imageProcessingConfigChangeObserver: Nullable<Observer<ImageProcessingConfiguration>>;

    private _transformMatrix = Matrix.Zero();
    private _mirrorMatrix = Matrix.Zero();

    private _blurX: Nullable<BlurPostProcess>;
    private _blurY: Nullable<BlurPostProcess>;
    private _adaptiveBlurKernel = 0;
    private _blurKernelX = 0;
    private _blurKernelY = 0;
    private _blurRatio = 1.0;

    /**
     * Instantiates a Mirror Texture.
     * Mirror texture can be used to simulate the view from a mirror in a scene.
     * It will dynamically be rendered every frame to adapt to the camera point of view.
     * You can then easily use it as a reflectionTexture on a flat surface.
     * In case the surface is not a plane, please consider relying on reflection probes.
     * @see https://doc.babylonjs.com/how_to/reflect#mirrors
     * @param name
     * @param size
     * @param scene
     * @param generateMipMaps
     * @param type
     * @param samplingMode
     * @param generateDepthBuffer
     */
    constructor(name: string, size: number | { width: number, height: number } | { ratio: number }, private scene: Scene, generateMipMaps?: boolean, type: number = Constants.TEXTURETYPE_UNSIGNED_INT, samplingMode = Texture.BILINEAR_SAMPLINGMODE, generateDepthBuffer = true) {
        super(name, size, scene, generateMipMaps, true, type, false, samplingMode, generateDepthBuffer);

        this.ignoreCameraViewport = true;

        this._updateGammaSpace();
        this._imageProcessingConfigChangeObserver = scene.imageProcessingConfiguration.onUpdateParameters.add(() => {
            this._updateGammaSpace();
        });

        const engine = this.getScene()!.getEngine();

        this.onBeforeBindObservable.add(() => {
            engine._debugPushGroup?.(`mirror generation for ${name}`, 1);
        });

        this.onAfterUnbindObservable.add(() => {
            engine._debugPopGroup?.(1);
        });

        let saveClipPlane: Nullable<Plane>;

        this.onBeforeRenderObservable.add(() => {
            Matrix.ReflectionToRef(this.mirrorPlane, this._mirrorMatrix);
            this._mirrorMatrix.multiplyToRef(scene.getViewMatrix(), this._transformMatrix);

            scene.setTransformMatrix(this._transformMatrix, scene.getProjectionMatrix());

            saveClipPlane = scene.clipPlane;
            scene.clipPlane = this.mirrorPlane;

            scene.getEngine().cullBackFaces = false;

            scene._mirroredCameraPosition = Vector3.TransformCoordinates((<Camera>scene.activeCamera).globalPosition, this._mirrorMatrix);
        });

        this.onAfterRenderObservable.add(() => {
            scene.updateTransformMatrix();
            scene.getEngine().cullBackFaces = null;
            scene._mirroredCameraPosition = null;

            scene.clipPlane = saveClipPlane;
        });
    }

    private _preparePostProcesses(): void {
        this.clearPostProcesses(true);

        if (this._blurKernelX && this._blurKernelY) {
            var engine = (<Scene>this.getScene()).getEngine();

            var textureType = engine.getCaps().textureFloatRender ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_HALF_FLOAT;

            this._blurX = new BlurPostProcess("horizontal blur", new Vector2(1.0, 0), this._blurKernelX, this._blurRatio, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, textureType);
            this._blurX.autoClear = false;

            if (this._blurRatio === 1 && this.samples < 2 && this._texture) {
                this._blurX.inputTexture = this._texture;
            } else {
                this._blurX.alwaysForcePOT = true;
            }

            this._blurY = new BlurPostProcess("vertical blur", new Vector2(0, 1.0), this._blurKernelY, this._blurRatio, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, textureType);
            this._blurY.autoClear = false;
            this._blurY.alwaysForcePOT = this._blurRatio !== 1;

            this.addPostProcess(this._blurX);
            this.addPostProcess(this._blurY);
        }
        else {
            if (this._blurY) {
                this.removePostProcess(this._blurY);
                this._blurY.dispose();
                this._blurY = null;
            }
            if (this._blurX) {
                this.removePostProcess(this._blurX);
                this._blurX.dispose();
                this._blurX = null;
            }
        }
    }

    /**
     * Clone the mirror texture.
     * @returns the cloned texture
     */
    public clone(): MirrorTexture {
        let scene = this.getScene();

        if (!scene) {
            return this;
        }

        var textureSize = this.getSize();
        var newTexture = new MirrorTexture(
            this.name,
            textureSize.width,
            scene,
            this._renderTargetOptions.generateMipMaps,
            this._renderTargetOptions.type,
            this._renderTargetOptions.samplingMode,
            this._renderTargetOptions.generateDepthBuffer
        );

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // Mirror Texture
        newTexture.mirrorPlane = this.mirrorPlane.clone();
        if (this.renderList) {
            newTexture.renderList = this.renderList.slice(0);
        }

        return newTexture;
    }

    /**
     * Serialize the texture to a JSON representation you could use in Parse later on
     * @returns the serialized JSON representation
     */
    public serialize(): any {
        if (!this.name) {
            return null;
        }

        var serializationObject = super.serialize();

        serializationObject.mirrorPlane = this.mirrorPlane.asArray();

        return serializationObject;
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose() {
        super.dispose();
        this.scene.imageProcessingConfiguration.onUpdateParameters.remove(this._imageProcessingConfigChangeObserver);
    }
}

Texture._CreateMirror = (name: string, renderTargetSize: number, scene: Scene, generateMipMaps: boolean): MirrorTexture => {
    return new MirrorTexture(name, renderTargetSize, scene, generateMipMaps);
};