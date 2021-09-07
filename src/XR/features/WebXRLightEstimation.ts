// import { CubeTexture } from "../../Materials/Textures/cubeTexture";
import { WebGLHardwareTexture } from "../../Engines/WebGL/webGLHardwareTexture";
import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { Observable } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import { Nullable } from "../../types";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Constants } from "../../Engines/constants";
import { Color3 } from "../../Maths/math.color";
import { Vector3 } from "../../Maths/math.vector";
import { DirectionalLight } from "../../Lights/directionalLight";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import { WebGLRenderTargetWrapper } from "../../Engines/WebGL/webGLRenderTargetWrapper";

/**
 * Options for Light Estimation feature
 */
export interface IWebXRLightEstimationOptions {
    disableCubeMapReflection?: boolean;
    setSceneEnvironmentTexture?: boolean;
    cubeMapPollInterval?: number;
    lightEstimationPollInterval?: number;
    createDirectionalLightSource?: boolean;
    /**
     * Instead of using preferred reflection format use srgba8 to initialize the light probe
     * Defaults to true.
     */
    reflectionFormat?: XRReflectionFormat;
    disableVectorReuse?: boolean;
}

export interface IWebXRLightEstimation {
    lightIntensity: number;
    lightColor: Color3;
    lightDirection: Vector3;
}

/**
 * Light Estimation Feature
 *
 * @since 5.0.0
 */
export class WebXRLightEstimation extends WebXRAbstractFeature {

    private _canvasContext: Nullable<WebGLRenderingContext | WebGL2RenderingContext> = null;
    private _reflectionCubeMap: Nullable<RenderTargetTexture> = null;
    private _xrLightEstimate: Nullable<XRLightEstimate> = null;
    private _xrLightProbe: Nullable<XRLightProbe> = null;
    private _xrWebGLBinding: Nullable<XRWebGLBinding> = null;
    private _lightDirection: Vector3 = Vector3.Up().negateInPlace();
    private _lightColor: Color3 = Color3.White();
    // private _cubeMapPollTime = Date.now();
    private _lightEstimationPollTime = Date.now();

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.LIGHT_ESTIMATION;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * ARCore's reflection cube map size is 16x16.
     * Once other systems support this feature we will need to change this to be dynamic.
     * see https://github.com/immersive-web/lighting-estimation/blob/main/lighting-estimation-explainer.md#cube-map-open-questions
     */
    public static ReflectionCubeMapTextureSize: number = 16;

    public directionalLight: Nullable<DirectionalLight> = null;

    /**
     * This observable will notify when the reflection cube map is updated.
     */
    public onReflectionCubeMapUpdatedObservable: Observable<RenderTargetTexture> = new Observable();

    /**
    * Creates a new instance of the light estimation feature
    * @param _xrSessionManager an instance of WebXRSessionManager
    * @param options options to use when constructing this feature
    */
    constructor(
        _xrSessionManager: WebXRSessionManager,
        /**
         * options to use when constructing this feature
         */
        public readonly options: IWebXRLightEstimationOptions
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "light-estimation";

        if (this.options.createDirectionalLightSource) {
            this.directionalLight = new DirectionalLight("light estimation directional", this._lightDirection, this._xrSessionManager.scene);
            this.directionalLight.position = new Vector3(0, 8, 0);
            // intensity will be set later
            this.directionalLight.intensity = 0;
        }

        // https://immersive-web.github.io/lighting-estimation/
        Tools.Warn("light-estimation is an experimental and unstable feature.");
    }

    /**
     * While the estimated cube map is expected to update over time to better reflect the user's environment as they move around those changes are unlikely to happen with every XRFrame.
     * Since creating and processing the cube map is potentially expensive, especially if mip maps are needed, you can listen to the onReflectionCubeMapUpdatedObservable to determine
     * when it has been updated.
     */
    public get reflectionCubeMap(): Nullable<RenderTargetTexture> {
        return this._reflectionCubeMap;
    }

    /**
     * The most recent light estimate.  Available starting on the first frame where the device provides a light probe.
     */
    public get xrLightingEstimate(): Nullable<IWebXRLightEstimation> {
        if (this._xrLightEstimate) {
            let intensity = Math.max(1.0,
                this._xrLightEstimate.primaryLightIntensity.x,
                this._xrLightEstimate.primaryLightIntensity.y,
                this._xrLightEstimate.primaryLightIntensity.z);

            const rhsFactor = this._xrSessionManager.scene.useRightHandedSystem ? 1.0 : -1.0;

            // recreate the vector caches, so that the last one provided to the user will persist
            if (this.options.disableVectorReuse) {
                this._lightDirection = new Vector3();
                this._lightColor = new Color3();
                if (this.directionalLight) {
                    this.directionalLight.direction = this._lightDirection;
                }
            }

            this._lightDirection.copyFromFloats(
                this._xrLightEstimate.primaryLightDirection.x,
                this._xrLightEstimate.primaryLightDirection.y,
                this._xrLightEstimate.primaryLightDirection.z * rhsFactor
            );

            // direction from instead of direction to
            this._lightDirection.negateInPlace();
            if (this.directionalLight) {
                this.directionalLight.direction.copyFrom(this._lightDirection);
                this.directionalLight.intensity = intensity;
            }

            this._lightColor.copyFromFloats(
                this._xrLightEstimate.primaryLightIntensity.x / intensity,
                this._xrLightEstimate.primaryLightIntensity.y / intensity,
                this._xrLightEstimate.primaryLightIntensity.z / intensity
            );

            console.log(this._lightDirection, this._lightColor, intensity, this.directionalLight);
            return {
                lightColor: this._lightColor,
                lightDirection: this._lightDirection,
                lightIntensity: intensity
            };

        }
        return this._xrLightEstimate;
    }

    private _getCanvasContext(): WebGLRenderingContext | WebGL2RenderingContext {
        if (this._canvasContext === null) {
            this._canvasContext = this._xrSessionManager.scene.getEngine()._gl;
        }
        return this._canvasContext;
    }

    private _getXRGLBinding(): XRWebGLBinding {
        if (this._xrWebGLBinding === null) {
            let context = this._getCanvasContext();
            this._xrWebGLBinding = new XRWebGLBinding(this._xrSessionManager.session, context);
        }
        return this._xrWebGLBinding;
    }

    /**
     * Event Listener to for "reflectionchange" events.
     */
    private _updateReflectionCubeMap = (): void => {
        if (!this._xrLightProbe) {
            return;
        }
        const lp = this._getXRGLBinding().getReflectionCubeMap(this._xrLightProbe);
        if (lp) {
            if (this._reflectionCubeMap === null) {
                this._reflectionCubeMap = new RenderTargetTexture(
                    'le-rtt',
                    16,
                    this._xrSessionManager.scene,
                    false,
                    undefined,
                    this.options.reflectionFormat !== 'srgba8' ? Constants.TEXTURETYPE_HALF_FLOAT : Constants.TEXTURETYPE_UNSIGNED_BYTE,
                    true,
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                    undefined,
                    undefined,
                    false,
                    Constants.TEXTUREFORMAT_RGBA
                );
                const webglRTWrapper = this._reflectionCubeMap.renderTarget as WebGLRenderTargetWrapper;
                const internalTexture = new InternalTexture(this._xrSessionManager.scene.getEngine(), InternalTextureSource.Unknown);
                internalTexture.isCube = true;
                internalTexture.invertY = false;
                // internalTexture._useSRGBBuffer = this.options.reflectionFormat === 'srgba8';
                // internalTexture.format = Constants.TEXTUREFORMAT_RGBA;
                // internalTexture.generateMipMaps = false;
                // internalTexture.type = this.options.reflectionFormat !== 'srgba8' ? Constants.TEXTURETYPE_HALF_FLOAT : Constants.TEXTURETYPE_UNSIGNED_BYTE;
                // internalTexture.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
                internalTexture.width = WebXRLightEstimation.ReflectionCubeMapTextureSize;
                internalTexture.height = WebXRLightEstimation.ReflectionCubeMapTextureSize;
                // internalTexture._cachedWrapU = Constants.TEXTURE_WRAP_ADDRESSMODE;
                // internalTexture._cachedWrapV = Constants.TEXTURE_WRAP_ADDRESSMODE;
                internalTexture._hardwareTexture = new WebGLHardwareTexture(null, this._getCanvasContext() as WebGLRenderingContext);
                webglRTWrapper.setTexture(internalTexture, 0);
                this._reflectionCubeMap._texture = internalTexture;
                this._reflectionCubeMap.disableRescaling();
                this._reflectionCubeMap._invertY = false;
                if (this.options.setSceneEnvironmentTexture) {
                    this._xrSessionManager.scene.environmentTexture = this._reflectionCubeMap;
                }
                // this._reflectionCubeMap.hasAlpha = true;
            }

            if (this._reflectionCubeMap.renderTarget) {
                const webglRTWrapper = this._reflectionCubeMap.renderTarget as WebGLRenderTargetWrapper;
                const texture = webglRTWrapper.texture as InternalTexture;
                // this._reflectionCubeMap._texture._hardwareTexture.release();
                if (texture._hardwareTexture) {
                    texture._hardwareTexture.set(lp);
                    texture.isReady = true;
                    console.log(lp);
                }
            }
            // check poll time, do not update if it has not been long enough
            // if (this.options.cubeMapPollInterval) {
            //     const now = Date.now();
            //     if (now - this._cubeMapPollTime < this.options.cubeMapPollInterval) {
            //         return;
            //     }
            //     this._cubeMapPollTime = now;
            // }
            // if (!this._reflectionCubeMap._texture._hardwareTexture) {
            //     this._reflectionCubeMap._texture
            // } else {
            //     // this._reflectionCubeMap._texture._hardwareTexture.release();
            //     // this._reflectionCubeMap._texture._hardwareTexture.set(lp);
            // }
            // const internalTexture = new InternalTexture(this._xrSessionManager.scene.getEngine(), InternalTextureSource.Unknown, true);
            // // internalTexture.isCube = true;
            // internalTexture._useSRGBBuffer = this.options.reflectionFormat === 'srgba8';
            // internalTexture.format = Constants.TEXTUREFORMAT_RGBA;
            // // internalTexture.format = this.options.reflectionFormat === 'srgba8' ?
            // //     (this._getCanvasContext() as WebGLRenderingContext).SRGB8_ALPHA8 :
            // //     (this._getCanvasContext() as WebGLRenderingContext).RGBA16F;
            // internalTexture.generateMipMaps = false;
            // internalTexture.type = Constants.TEXTURETYPE_HALF_FLOAT;
            // internalTexture.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
            // internalTexture.width = WebXRLightEstimation.ReflectionCubeMapTextureSize;
            // internalTexture.height = WebXRLightEstimation.ReflectionCubeMapTextureSize;
            // internalTexture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            // internalTexture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            // internalTexture._hardwareTexture?.(lp);
            // internalTexture._hardwareTexture = new WebGLHardwareTexture(lp, this._getCanvasContext() as WebGLRenderingContext);
            // if (this._reflectionCubeMap._texture) {
            //     this._reflectionCubeMap._texture.dispose();
            // }
            // this._reflectionCubeMap._texture = internalTexture;
            // this._reflectionCubeMap._texture.isReady = true;

            // const internalTexture = new InternalTexture(this._xrSessionManager.scene.getEngine(), InternalTextureSource.Unknown, true);
            // internalTexture.isCube = true;
            // internalTexture.format = (this._getCanvasContext() as WebGLRenderingContext).SRGB8_ALPHA8;
            // internalTexture.generateMipMaps = false;
            // internalTexture.type = Constants.TEXTURETYPE_HALF_FLOAT;
            // internalTexture.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
            // internalTexture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            // internalTexture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
            // internalTexture.width = 16;
            // internalTexture.height = 16;
            // internalTexture._hardwareTexture = new WebGLHardwareTexture(lp, this._getCanvasContext() as WebGLRenderingContext);
            // this._reflectionCubeMap._texture = internalTexture;
            // internalTexture.isReady = true;
            // this.onReflectionCubeMapUpdatedObservable.notifyObservers(this._reflectionCubeMap!);

            this.onReflectionCubeMapUpdatedObservable.notifyObservers(this._reflectionCubeMap);
        }
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        const reflectionFormat = this.options.reflectionFormat ?? (this._xrSessionManager.session.preferredReflectionFormat || "srgba8");
        this.options.reflectionFormat = "srgba8" || reflectionFormat;
        this._xrSessionManager.session.requestLightProbe({
            reflectionFormat
        }).then((xrLightProbe: XRLightProbe) => {
            this._xrLightProbe = xrLightProbe;
            if (!this.options.disableCubeMapReflection) {
                this._xrLightProbe.addEventListener('reflectionchange', this._updateReflectionCubeMap);
                this._updateReflectionCubeMap();
            }
        });

        return true;
    }

    /**
     * detach this feature.
     * Will usually be called by the features manager
     *
     * @returns true if successful.
     */
    public detach(): boolean {
        const detached = super.detach();

        if (this._xrLightProbe !== null) {
            this._xrLightProbe.removeEventListener('reflectionchange', this._updateReflectionCubeMap);
            this._xrLightProbe = null;
        }

        this._canvasContext = null;
        this._xrLightEstimate = null;
        // When the session ends (on detach) we must clear our XRWebGLBinging instance, which references the ended session.
        this._xrWebGLBinding = null;

        return detached;
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public dispose(): void {
        super.dispose();

        this.onReflectionCubeMapUpdatedObservable.clear();

        if (this.directionalLight) {
            this.directionalLight.dispose();
            this.directionalLight = null;
        }

        if (this._reflectionCubeMap !== null) {
            if (this._reflectionCubeMap._texture) {
                this._reflectionCubeMap._texture.dispose();
            }
            this._reflectionCubeMap.dispose();
            this._reflectionCubeMap = null;
        }
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        if (this._xrLightProbe !== null) {
            if (this.options.lightEstimationPollInterval) {
                const now = Date.now();
                if (now - this._lightEstimationPollTime < this.options.lightEstimationPollInterval) {
                    return;
                }
                this._lightEstimationPollTime = now;
            }
            this._xrLightEstimate = _xrFrame.getLightEstimate(this._xrLightProbe);
            if (this._xrLightEstimate) {
                let intensity = Math.max(1.0,
                    this._xrLightEstimate.primaryLightIntensity.x,
                    this._xrLightEstimate.primaryLightIntensity.y,
                    this._xrLightEstimate.primaryLightIntensity.z);

                const rhsFactor = this._xrSessionManager.scene.useRightHandedSystem ? 1.0 : -1.0;

                // recreate the vector caches, so that the last one provided to the user will persist
                if (this.options.disableVectorReuse) {
                    this._lightDirection = new Vector3();
                    this._lightColor = new Color3();
                    if (this.directionalLight) {
                        this.directionalLight.direction = this._lightDirection;
                    }
                }

                this._lightDirection.copyFromFloats(
                    this._xrLightEstimate.primaryLightDirection.x,
                    this._xrLightEstimate.primaryLightDirection.y,
                    this._xrLightEstimate.primaryLightDirection.z * rhsFactor
                );

                // direction from instead of direction to
                this._lightDirection.negateInPlace();
                if (this.directionalLight) {
                    this.directionalLight.direction.copyFrom(this._lightDirection);
                    this.directionalLight.intensity = intensity;
                }

                this._lightColor.copyFromFloats(
                    this._xrLightEstimate.primaryLightIntensity.x / intensity,
                    this._xrLightEstimate.primaryLightIntensity.y / intensity,
                    this._xrLightEstimate.primaryLightIntensity.z / intensity
                );
            }
        }
    }
}

// register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRLightEstimation.Name,
    (xrSessionManager, options) => {
        return () => new WebXRLightEstimation(xrSessionManager, options);
    },
    WebXRLightEstimation.Version,
    false
);