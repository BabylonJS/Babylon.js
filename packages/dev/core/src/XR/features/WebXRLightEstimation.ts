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
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { SphericalHarmonics, SphericalPolynomial } from "../../Maths/sphericalPolynomial";
import { LightConstants } from "../../Lights/lightConstants";

/**
 * Options for Light Estimation feature
 */
export interface IWebXRLightEstimationOptions {
    /**
     * Disable the cube map reflection feature. In this case only light direction and color will be updated
     */
    disableCubeMapReflection?: boolean;
    /**
     * Should the scene's env texture be set to the cube map reflection texture
     * Note that this doesn't work is disableCubeMapReflection if set to false
     */
    setSceneEnvironmentTexture?: boolean;
    /**
     * How often should the cubemap update in ms.
     * If not set the cubemap will be updated every time the underlying system updates the environment texture.
     */
    cubeMapPollInterval?: number;
    /**
     * How often should the light estimation properties update in ms.
     * If not set the light estimation properties will be updated on every frame (depending on the underlying system)
     */
    lightEstimationPollInterval?: number;
    /**
     * Should a directional light source be created.
     * If created, this light source will be updated whenever the light estimation values change
     */
    createDirectionalLightSource?: boolean;
    /**
     * Define the format to be used for the light estimation texture.
     */
    reflectionFormat?: XRReflectionFormat;
    /**
     * Should the light estimation's needed vectors be constructed on each frame.
     * Use this when you use those vectors and don't want their values to change outside of the light estimation feature
     */
    disableVectorReuse?: boolean;

    /**
     * disable applying the spherical polynomial to the cube map texture
     */
    disableSphericalPolynomial?: boolean;
}

/**
 * An interface describing the result of a light estimation
 */
export interface IWebXRLightEstimation {
    /**
     * The intensity of the light source
     */
    lightIntensity: number;
    /**
     * Color of light source
     */
    lightColor: Color3;
    /**
     * The direction from the light source
     */
    lightDirection: Vector3;
    /**
     * Spherical harmonics coefficients of the light source
     */
    sphericalHarmonics: SphericalHarmonics;
}

/**
 * Light Estimation Feature
 *
 * @since 5.0.0
 */
export class WebXRLightEstimation extends WebXRAbstractFeature {

    private _canvasContext: Nullable<WebGLRenderingContext | WebGL2RenderingContext> = null;
    private _reflectionCubeMap: Nullable<BaseTexture> = null;
    private _xrLightEstimate: Nullable<XRLightEstimate> = null;
    private _xrLightProbe: Nullable<XRLightProbe> = null;
    private _xrWebGLBinding: Nullable<XRWebGLBinding> = null;
    private _lightDirection: Vector3 = Vector3.Up().negateInPlace();
    private _lightColor: Color3 = Color3.White();
    private _intensity: number = 1;
    private _sphericalHarmonics: SphericalHarmonics = new SphericalHarmonics();
    private _cubeMapPollTime = Date.now();
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
    private _ReflectionCubeMapTextureSize: number = 16;

    /**
     * If createDirectionalLightSource is set to true this light source will be created automatically.
     * Otherwise this can be set with an external directional light source.
     * This light will be updated whenever the light estimation values change.
     */
    public directionalLight: Nullable<DirectionalLight> = null;

    /**
     * This observable will notify when the reflection cube map is updated.
     */
    public onReflectionCubeMapUpdatedObservable: Observable<BaseTexture> = new Observable();

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
            this.directionalLight.falloffType = LightConstants.FALLOFF_GLTF;
        }

        // https://immersive-web.github.io/lighting-estimation/
        Tools.Warn("light-estimation is an experimental and unstable feature.");
    }

    /**
     * While the estimated cube map is expected to update over time to better reflect the user's environment as they move around those changes are unlikely to happen with every XRFrame.
     * Since creating and processing the cube map is potentially expensive, especially if mip maps are needed, you can listen to the onReflectionCubeMapUpdatedObservable to determine
     * when it has been updated.
     */
    public get reflectionCubeMapTexture(): Nullable<BaseTexture> {
        return this._reflectionCubeMap;
    }

    /**
     * The most recent light estimate.  Available starting on the first frame where the device provides a light probe.
     */
    public get xrLightingEstimate(): Nullable<IWebXRLightEstimation> {
        if (this._xrLightEstimate) {
            return {
                lightColor: this._lightColor,
                lightDirection: this._lightDirection,
                lightIntensity: this._intensity,
                sphericalHarmonics: this._sphericalHarmonics
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
            const context = this._getCanvasContext();
            this._xrWebGLBinding = new XRWebGLBinding(this._xrSessionManager.session, context);
        }
        return this._xrWebGLBinding;
    }

    /**
     * Event Listener for "reflectionchange" events.
     */
    private _updateReflectionCubeMap = (): void => {
        if (!this._xrLightProbe) {
            return;
        }
        // check poll time, do not update if it has not been long enough
        if (this.options.cubeMapPollInterval) {
            const now = Date.now();
            if (now - this._cubeMapPollTime < this.options.cubeMapPollInterval) {
                return;
            }
            this._cubeMapPollTime = now;
        }
        const lp = this._getXRGLBinding().getReflectionCubeMap(this._xrLightProbe);
        if (lp && this._reflectionCubeMap) {
            if (!this._reflectionCubeMap._texture) {
                const internalTexture = new InternalTexture(this._xrSessionManager.scene.getEngine(), InternalTextureSource.Unknown);
                internalTexture.isCube = true;
                internalTexture.invertY = false;
                internalTexture._useSRGBBuffer = this.options.reflectionFormat === 'srgba8';
                internalTexture.format = Constants.TEXTUREFORMAT_RGBA;
                internalTexture.generateMipMaps = true;
                internalTexture.type = this.options.reflectionFormat !== 'srgba8' ? Constants.TEXTURETYPE_HALF_FLOAT : Constants.TEXTURETYPE_UNSIGNED_BYTE;
                internalTexture.samplingMode = Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR;
                internalTexture.width = this._ReflectionCubeMapTextureSize;
                internalTexture.height = this._ReflectionCubeMapTextureSize;
                internalTexture._cachedWrapU = Constants.TEXTURE_WRAP_ADDRESSMODE;
                internalTexture._cachedWrapV = Constants.TEXTURE_WRAP_ADDRESSMODE;
                internalTexture._hardwareTexture = new WebGLHardwareTexture(lp, this._getCanvasContext() as WebGLRenderingContext);
                this._reflectionCubeMap._texture = internalTexture;
            } else {
                this._reflectionCubeMap._texture._hardwareTexture?.set(lp);
                this._reflectionCubeMap._texture.getEngine().resetTextureCache();
            }
            this._reflectionCubeMap._texture.isReady = true;
            this._xrSessionManager.scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);

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
        this.options.reflectionFormat = reflectionFormat;
        this._xrSessionManager.session.requestLightProbe({
            reflectionFormat
        }).then((xrLightProbe: XRLightProbe) => {
            this._xrLightProbe = xrLightProbe;
            if (!this.options.disableCubeMapReflection) {
                if (!this._reflectionCubeMap) {
                    this._reflectionCubeMap = new BaseTexture(this._xrSessionManager.scene);
                    this._reflectionCubeMap.isCube = true;
                    this._reflectionCubeMap.coordinatesMode = Constants.TEXTURE_CUBIC_MODE;
                    if (this.options.setSceneEnvironmentTexture) {
                        this._xrSessionManager.scene.environmentTexture = this._reflectionCubeMap;
                    }
                }
                this._xrLightProbe.addEventListener('reflectionchange', this._updateReflectionCubeMap);
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

        if (this._xrLightProbe !== null && !this.options.disableCubeMapReflection) {
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
                this._intensity = Math.max(1.0,
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
                        this.directionalLight.diffuse = this._lightColor;
                    }
                }

                this._lightDirection.copyFromFloats(
                    this._xrLightEstimate.primaryLightDirection.x,
                    this._xrLightEstimate.primaryLightDirection.y,
                    this._xrLightEstimate.primaryLightDirection.z * rhsFactor
                );
                this._lightColor.copyFromFloats(
                    this._xrLightEstimate.primaryLightIntensity.x / this._intensity,
                    this._xrLightEstimate.primaryLightIntensity.y / this._intensity,
                    this._xrLightEstimate.primaryLightIntensity.z / this._intensity
                );
                this._sphericalHarmonics.updateFromFloatsArray(this._xrLightEstimate.sphericalHarmonicsCoefficients);
                if (this._reflectionCubeMap && !this.options.disableSphericalPolynomial) {
                    this._reflectionCubeMap.sphericalPolynomial = this._reflectionCubeMap.sphericalPolynomial || new SphericalPolynomial();
                    this._reflectionCubeMap.sphericalPolynomial?.updateFromHarmonics(this._sphericalHarmonics);
                }

                // direction from instead of direction to
                this._lightDirection.negateInPlace();
                // set the values after calculating them
                if (this.directionalLight) {
                    this.directionalLight.direction.copyFrom(this._lightDirection);
                    this.directionalLight.intensity = Math.min(this._intensity, 1.0);
                    this.directionalLight.diffuse.copyFrom(this._lightColor);
                }

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