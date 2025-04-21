import { RawTexture } from "../../Materials/Textures/rawTexture";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import type { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { Tools } from "../../Misc/tools";
import { Texture } from "../../Materials/Textures/texture";
import type { Observer } from "../../Misc/observable";
import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { Constants } from "../../Engines/constants";
import { WebGLHardwareTexture } from "../../Engines/WebGL/webGLHardwareTexture";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { ThinEngine } from "../../Engines/thinEngine";
import { MaterialPluginBase } from "core/Materials/materialPluginBase";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { Material } from "core/Materials/material";
import { MaterialDefines } from "core/Materials/materialDefines";
import type { UniformBuffer } from "core/Materials/uniformBuffer";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { RegisterMaterialPlugin } from "core/Materials/materialPluginManager";
import type { Camera } from "core/Cameras/camera";
import { Matrix } from "core/Maths/math.vector";
import type { Engine } from "core/Engines/engine";

export type WebXRDepthUsage = "cpu" | "gpu";
export type WebXRDepthDataFormat = "ushort" | "float" | "luminance-alpha";

/**
 * Options for Depth Sensing feature
 */
export interface IWebXRDepthSensingOptions {
    /**
     *  The desired depth sensing usage for the session
     */
    usagePreference: WebXRDepthUsage[];
    /**
     * The desired depth sensing data format for the session
     */
    dataFormatPreference: WebXRDepthDataFormat[];

    /**
     * Depth sensing will be enabled on all materials per default, if the GPU variant is enabled.
     * If you just want to use the texture or the CPU variant instead set this to true.
     */
    disableDepthSensingOnMaterials?: boolean;

    /**
     * If set to true the occluded pixels will not be discarded but the pixel color will be changed based on the occlusion factor
     * Enabling this will lead to worse performance but slightly better outcome.
     * It is possible we will change this in the future to look even better.
     */
    useToleranceFactorForDepthSensing?: boolean;

    /**
     * If set to true the texture will be set to be used for visualization.
     * In this case it will probably NOT work correctly on the materials.
     * So be aware that, for the time being, you can only use one or the other.
     */
    prepareTextureForVisualization?: boolean;
}

type GetDepthInMetersType = (x: number, y: number) => number;

class DepthSensingMaterialDefines extends MaterialDefines {
    /**
     * Is the feature enabled
     */
    DEPTH_SENSING = false;

    /**
     * Is the texture type provided as a texture array
     */
    DEPTH_SENSING_TEXTURE_ARRAY = false;

    /**
     * Is the texture type provided as Alpha-Luminance (unpacked differently on the shader)
     */
    DEPTH_SENSING_TEXTURE_AL = false;

    /**
     * Should the shader discard the pixel if the depth is less than the asset depth
     * Will lead to better performance. the other variant is to change the color based on a tolerance factor
     */
    DEPTH_SENSING_DISCARD = true;
}

let isPluginEnabled = false;
let depthTexture: Nullable<RawTexture> = null;
let alphaLuminanceTexture = false;
const screenSize = { width: 512, height: 512 };
const shaderViewport = { x: 0, y: 0, width: 1, height: 1 };
let globalRawValueToMeters = 1;
let viewIndex = 0;
let enableDiscard = true;
const uvTransform = Matrix.Identity();
const managedMaterialPlugins: WebXRDepthSensingMaterialPlugin[] = [];

/**
 * @internal
 */
class WebXRDepthSensingMaterialPlugin extends MaterialPluginBase {
    private _varColorName: string;
    private _isEnabled = false;

    /** @internal */
    protected _markAllDefinesAsDirty(): void {
        this._enable(this._isEnabled);
        this.markAllDefinesAsDirty();
    }

    /**
     * Gets whether the mesh debug plugin is enabled in the material.
     */
    public get isEnabled(): boolean {
        return this._isEnabled;
    }
    /**
     * Sets whether the mesh debug plugin is enabled in the material.
     * @param value enabled
     */
    public set isEnabled(value: boolean) {
        if (this._isEnabled === value) {
            return;
        }
        this._isEnabled = value;
        this._markAllDefinesAsDirty();
    }

    /**
     * Gets a boolean indicating that the plugin is compatible with a given shader language.
     * @param shaderLanguage The shader language to use.
     * @returns true if the plugin is compatible with the shader language
     */
    public override isCompatible(shaderLanguage: ShaderLanguage): boolean {
        switch (shaderLanguage) {
            case ShaderLanguage.GLSL:
                return true;
            default:
                // no webgpu for webxr yet, however - if this is not true the plugin fails to load.
                // webxr is currently only supported on webgl, and the plugin is disabled per default.
                return true;
        }
    }

    constructor(material: Material) {
        super(material, "DepthSensing", 222, new DepthSensingMaterialDefines());
        this._varColorName = material instanceof PBRBaseMaterial ? "finalColor" : "color";
        managedMaterialPlugins.push(this);
    }

    /**
     * Prepare the defines
     * @param defines the defines
     */
    public override prepareDefines(defines: DepthSensingMaterialDefines) {
        defines.DEPTH_SENSING = !!depthTexture && isPluginEnabled;
        defines.DEPTH_SENSING_TEXTURE_ARRAY = depthTexture?.is2DArray ?? false;
        defines.DEPTH_SENSING_TEXTURE_AL = alphaLuminanceTexture;
        defines.DEPTH_SENSING_DISCARD = enableDiscard;
    }

    public override getUniforms() {
        return {
            // first, define the UBO with the correct type and size.
            ubo: [
                { name: "ds_invScreenSize", size: 2, type: "vec2" },
                { name: "ds_rawValueToMeters", size: 1, type: "float" },
                { name: "ds_viewIndex", size: 1, type: "float" },
                { name: "ds_shaderViewport", size: 4, type: "vec4" },
                { name: "ds_uvTransform", size: 16, type: "mat4" },
            ],
            // now, on the fragment shader, add the uniform itself in case uniform buffers are not supported by the engine
            fragment: `#ifdef DEPTH_SENSING
                uniform vec2 ds_invScreenSize;
                uniform float ds_rawValueToMeters;
                uniform float ds_viewIndex;
                uniform vec4 ds_shaderViewport;
                uniform mat4 ds_uvTransform;
                #endif
                `,
        };
    }

    public override getSamplers(samplers: string[]): void {
        samplers.push("ds_depthSampler");
    }

    public override bindForSubMesh(uniformBuffer: UniformBuffer) {
        if (isPluginEnabled && depthTexture) {
            uniformBuffer.updateFloat2("ds_invScreenSize", 1 / screenSize.width, 1 / screenSize.height);
            uniformBuffer.updateFloat("ds_rawValueToMeters", globalRawValueToMeters);
            uniformBuffer.updateFloat("ds_viewIndex", viewIndex);
            uniformBuffer.updateFloat4("ds_shaderViewport", shaderViewport.x, shaderViewport.y, shaderViewport.width, shaderViewport.height);
            uniformBuffer.setTexture("ds_depthSampler", depthTexture);
            uniformBuffer.updateMatrix("ds_uvTransform", uvTransform);
        }
    }

    public override getClassName() {
        return "DepthSensingMaterialPlugin";
    }

    public override getCustomCode(shaderType: string): Nullable<{ [pointName: string]: string }> {
        return shaderType === "vertex"
            ? {
                  CUSTOM_VERTEX_MAIN_BEGIN: `
                #ifdef DEPTH_SENSING
                #ifdef MULTIVIEW
                    ds_viewIndexMultiview = float(gl_ViewID_OVR);
                #endif
                #endif
                `,
                  CUSTOM_VERTEX_DEFINITIONS: `
                #ifdef DEPTH_SENSING
                #ifdef MULTIVIEW
                    varying float ds_viewIndexMultiview;
                #endif
                #endif
                `,
              }
            : {
                  CUSTOM_FRAGMENT_DEFINITIONS: `
                    #ifdef DEPTH_SENSING
                        #ifdef DEPTH_SENSING_TEXTURE_ARRAY
                            uniform highp sampler2DArray ds_depthSampler;
                        #else
                            uniform sampler2D ds_depthSampler;
                        #endif
                        #ifdef MULTIVIEW
                            varying float ds_viewIndexMultiview;
                        #endif
                    #endif
                  `,
                  CUSTOM_FRAGMENT_MAIN_BEGIN: `
#ifdef DEPTH_SENSING
    #ifdef MULTIVIEW
        float ds_viewIndexSet = ds_viewIndexMultiview;
        vec2 ds_compensation = vec2(0.0, 0.0);
    #else
        float ds_viewIndexSet = ds_viewIndex;
        vec2 ds_compensation = vec2(ds_viewIndexSet, 0.0);
    #endif
    vec2 ds_baseUv = gl_FragCoord.xy * ds_invScreenSize;
    #ifdef DEPTH_SENSING_TEXTURE_ARRAY
        vec2 ds_uv = ds_baseUv - ds_compensation;
        vec3 ds_depthUv = vec3((ds_uvTransform * vec4(ds_uv, 0.0, 1.0)).xy, ds_viewIndexSet);
    #else
        vec2 ds_depthUv = (ds_uvTransform * vec4(ds_baseUv.x, 1.0 - ds_baseUv.y, 0.0, 1.0)).xy;
    #endif
    #ifdef DEPTH_SENSING_TEXTURE_AL
        // from alpha-luminance - taken from the explainer
        vec2 ds_alphaLuminance = texture(ds_depthSampler, ds_depthUv).ra;
        float ds_cameraDepth = dot(ds_alphaLuminance, vec2(255.0, 256.0 * 255.0));
    #else
        float ds_cameraDepth = texture(ds_depthSampler, ds_depthUv).r;
    #endif

    ds_cameraDepth = ds_cameraDepth * ds_rawValueToMeters;

    float ds_assetDepth = gl_FragCoord.z;
    #ifdef DEPTH_SENSING_DISCARD
    if(ds_cameraDepth < ds_assetDepth) {
        discard;
    }
    #endif
#endif  
                  `,
                  CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
#ifdef DEPTH_SENSING
    #ifndef DEPTH_SENSING_DISCARD
        const float ds_depthTolerancePerM = 0.005;
        float ds_occlusion = clamp(1.0 - 0.5 * (ds_cameraDepth - ds_assetDepth) / (ds_depthTolerancePerM * ds_assetDepth) +
            0.5, 0.0, 1.0);
        ${this._varColorName} *= (1.0 - ds_occlusion);
    #endif
#endif                  
                  `,
              };
    }

    public override dispose(_forceDisposeTextures?: boolean): void {
        const index = managedMaterialPlugins.indexOf(this);
        if (index !== -1) {
            managedMaterialPlugins.splice(index, 1);
        }
        super.dispose(_forceDisposeTextures);
    }
}

/**
 * WebXR Feature for WebXR Depth Sensing Module
 * @since 5.49.1
 */
export class WebXRDepthSensing extends WebXRAbstractFeature {
    private _width: Nullable<number> = null;
    private _height: Nullable<number> = null;
    private _rawValueToMeters: Nullable<number> = null;
    private _textureType: Nullable<string> = null;
    private _normDepthBufferFromNormView: Nullable<XRRigidTransform> = null;
    private _cachedDepthBuffer: Nullable<ArrayBuffer> = null;
    private _cachedWebGLTexture: Nullable<WebGLTexture> = null;
    private _cachedDepthImageTexture: Nullable<RawTexture> = null;
    private _onCameraObserver: Nullable<Observer<Camera>> = null;

    /**
     * Width of depth data. If depth data is not exist, returns null.
     */
    public get width(): Nullable<number> {
        return this._width;
    }

    /**
     * Height of depth data. If depth data is not exist, returns null.
     */
    public get height(): Nullable<number> {
        return this._height;
    }

    /**
     * Scale factor by which the raw depth values must be multiplied in order to get the depths in meters.
     */
    public get rawValueToMeters(): Nullable<number> {
        return this._rawValueToMeters;
    }

    /**
     * An XRRigidTransform that needs to be applied when indexing into the depth buffer.
     */
    public get normDepthBufferFromNormView(): Nullable<XRRigidTransform> {
        return this._normDepthBufferFromNormView;
    }

    /**
     * Describes which depth-sensing usage ("cpu" or "gpu") is used.
     */
    public get depthUsage(): WebXRDepthUsage {
        switch (this._xrSessionManager.session.depthUsage) {
            case "cpu-optimized":
                return "cpu";
            case "gpu-optimized":
                return "gpu";
        }
    }

    /**
     * Describes which depth sensing data format ("ushort" or "float") is used.
     */
    public get depthDataFormat(): WebXRDepthDataFormat {
        switch (this._xrSessionManager.session.depthDataFormat) {
            case "luminance-alpha":
                return "ushort";
            case "float32":
                return "float";
            case "unsigned-short":
                return "ushort";
        }
    }

    /**
     * Latest cached InternalTexture which containing depth buffer information.
     * This can be used when the depth usage is "gpu".
     * @deprecated This will be removed in the future. Use latestDepthImageTexture
     */
    public get latestInternalTexture(): Nullable<InternalTexture> {
        if (!this._cachedWebGLTexture) {
            return null;
        }

        return this._getInternalTextureFromDepthInfo();
    }

    /**
     * cached depth buffer
     */
    public get latestDepthBuffer(): Nullable<ArrayBufferView> {
        if (!this._cachedDepthBuffer) {
            return null;
        }

        return this.depthDataFormat === "float" ? new Float32Array(this._cachedDepthBuffer) : new Uint16Array(this._cachedDepthBuffer);
    }

    /**
     * Event that notify when `DepthInformation.getDepthInMeters` is available.
     * `getDepthInMeters` method needs active XRFrame (not available for cached XRFrame)
     */
    public onGetDepthInMetersAvailable: Observable<GetDepthInMetersType> = new Observable<GetDepthInMetersType>();

    /**
     * Latest cached Texture of depth image which is made from the depth buffer data.
     */
    public get latestDepthImageTexture(): Nullable<RawTexture> {
        return this._cachedDepthImageTexture;
    }

    /**
     * XRWebGLBinding which is used for acquiring WebGLDepthInformation
     */
    private _glBinding?: XRWebGLBinding;

    /**
     * The module's name
     */
    public static readonly Name = WebXRFeatureName.DEPTH_SENSING;

    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version
     */
    public static readonly Version = 1;

    /**
     * Creates a new instance of the depth sensing feature
     * @param _xrSessionManager the WebXRSessionManager
     * @param options options for WebXR Depth Sensing Feature
     */
    constructor(
        _xrSessionManager: WebXRSessionManager,
        public readonly options: IWebXRDepthSensingOptions
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "depth-sensing";

        // https://immersive-web.github.io/depth-sensing/
        Tools.Warn("depth-sensing is an experimental and unstable feature.");
        enableDiscard = !options.useToleranceFactorForDepthSensing;
    }

    /**
     * attach this feature
     * Will usually be called by the features manager
     * @param force should attachment be forced (even when already attached)
     * @returns true if successful.
     */
    public override attach(force?: boolean | undefined): boolean {
        if (!super.attach(force)) {
            return false;
        }

        const isBothDepthUsageAndFormatNull = this._xrSessionManager.session.depthDataFormat == null || this._xrSessionManager.session.depthUsage == null;
        if (isBothDepthUsageAndFormatNull) {
            return false;
        }

        this._glBinding = new XRWebGLBinding(this._xrSessionManager.session, (this._xrSessionManager.scene.getEngine() as ThinEngine)._gl);

        isPluginEnabled = !this.options.disableDepthSensingOnMaterials;
        if (isPluginEnabled) {
            for (const plugin of managedMaterialPlugins) {
                plugin.isEnabled = true;
            }
            this._onCameraObserver = this._xrSessionManager.scene.onBeforeCameraRenderObservable.add((camera) => {
                if (!isPluginEnabled) {
                    return;
                }
                // make sure this is a webxr camera
                if (camera.outputRenderTarget) {
                    const viewport = camera.rigCameras.length > 0 ? camera.rigCameras[0].viewport : camera.viewport;
                    screenSize.width = camera.outputRenderTarget.getRenderWidth() / (camera.rigParent ? camera.rigParent.rigCameras.length || 1 : 1);
                    screenSize.height = camera.outputRenderTarget.getRenderHeight();
                    shaderViewport.x = viewport.x;
                    shaderViewport.y = viewport.y;
                    shaderViewport.width = viewport.width;
                    shaderViewport.height = viewport.height;

                    // find the viewIndex
                    if (camera.rigParent) {
                        // should use the viewIndexes array!
                        viewIndex = camera.isLeftCamera ? 0 : 1;
                    }
                }
            });
        }

        return true;
    }

    public override detach() {
        isPluginEnabled = false;
        depthTexture = null;
        this._cachedWebGLTexture = null;
        this._cachedDepthBuffer = null;
        for (const plugin of managedMaterialPlugins) {
            plugin.isEnabled = false;
        }
        if (this._onCameraObserver) {
            this._xrSessionManager.scene.onBeforeCameraRenderObservable.remove(this._onCameraObserver);
        }
        return super.detach();
    }

    /**
     * Dispose this feature and all of the resources attached
     */
    public override dispose(): void {
        this._cachedDepthImageTexture?.dispose();
        this.onGetDepthInMetersAvailable.clear();
        // cleanup
        if (this._onCameraObserver) {
            this._xrSessionManager.scene.onBeforeCameraRenderObservable.remove(this._onCameraObserver);
        }
        for (const plugin of managedMaterialPlugins) {
            plugin.dispose();
        }
        managedMaterialPlugins.length = 0;
    }

    protected _onXRFrame(_xrFrame: XRFrame): void {
        const referenceSPace = this._xrSessionManager.referenceSpace;
        const pose = _xrFrame.getViewerPose(referenceSPace);
        if (pose == null) {
            return;
        }
        for (const view of pose.views) {
            switch (this.depthUsage) {
                case "cpu":
                    this._updateDepthInformationAndTextureCPUDepthUsage(_xrFrame, view, this.depthDataFormat);
                    break;
                case "gpu":
                    if (!this._glBinding) {
                        break;
                    }
                    this._updateDepthInformationAndTextureWebGLDepthUsage(this._glBinding, view, this.depthDataFormat);
                    break;
                default:
                    Tools.Error("Unknown depth usage");
                    this.detach();
                    break;
            }
        }
    }

    private _updateDepthInformationAndTextureCPUDepthUsage(frame: XRFrame, view: XRView, dataFormat: WebXRDepthDataFormat): void {
        const depthInfo = frame.getDepthInformation(view);
        if (depthInfo === null) {
            return;
        }

        const { data, width, height, rawValueToMeters, getDepthInMeters, normDepthBufferFromNormView } = depthInfo as XRCPUDepthInformation;

        this._width = width;
        this._height = height;
        this._rawValueToMeters = rawValueToMeters;
        this._cachedDepthBuffer = data;
        globalRawValueToMeters = rawValueToMeters;
        alphaLuminanceTexture = dataFormat === "luminance-alpha";
        uvTransform.fromArray(normDepthBufferFromNormView.matrix);

        // to avoid Illegal Invocation error, bind `this`
        this.onGetDepthInMetersAvailable.notifyObservers(getDepthInMeters.bind(depthInfo));

        if (!this._cachedDepthImageTexture) {
            this._cachedDepthImageTexture = RawTexture.CreateRTexture(
                null,
                width,
                height,
                this._xrSessionManager.scene,
                false,
                false,
                Texture.NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_FLOAT
            );
            depthTexture = this._cachedDepthImageTexture;
        }

        let float32Array: Float32Array | null = null;
        switch (dataFormat) {
            case "ushort":
            case "luminance-alpha":
                float32Array = Float32Array.from(new Uint16Array(data));

                break;
            case "float":
                float32Array = new Float32Array(data);
                break;

            default:
                break;
        }
        if (float32Array) {
            if (this.options.prepareTextureForVisualization) {
                float32Array = float32Array.map((val) => val * rawValueToMeters);
            }
            this._cachedDepthImageTexture.update(float32Array);
        }
    }

    private _updateDepthInformationAndTextureWebGLDepthUsage(webglBinding: XRWebGLBinding, view: XRView, dataFormat: WebXRDepthDataFormat): void {
        const depthInfo = webglBinding.getDepthInformation(view);
        if (depthInfo === null) {
            return;
        }
        const { texture, width, height, textureType, rawValueToMeters, normDepthBufferFromNormView } = depthInfo as XRWebGLDepthInformation;

        globalRawValueToMeters = rawValueToMeters;
        alphaLuminanceTexture = dataFormat === "luminance-alpha";
        uvTransform.fromArray(normDepthBufferFromNormView.matrix);

        if (this._cachedWebGLTexture) {
            return;
        }

        this._width = width;
        this._height = height;
        this._cachedWebGLTexture = texture;
        this._textureType = textureType;

        const scene = this._xrSessionManager.scene;
        const internalTexture = this._getInternalTextureFromDepthInfo();

        if (!this._cachedDepthImageTexture) {
            this._cachedDepthImageTexture = RawTexture.CreateRTexture(
                null,
                width,
                height,
                scene,
                false,
                true,
                Texture.NEAREST_SAMPLINGMODE,
                dataFormat === "float" ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_UNSIGNED_BYTE
            );
        }

        this._cachedDepthImageTexture._texture = internalTexture;
        depthTexture = this._cachedDepthImageTexture;
        this._xrSessionManager.scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    /**
     * Extends the session init object if needed
     * @returns augmentation object for the xr session init object.
     */
    public getXRSessionInitExtension(): Promise<Partial<XRSessionInit>> {
        const isDepthUsageDeclared = this.options.usagePreference != null && this.options.usagePreference.length !== 0;
        const isDataFormatDeclared = this.options.dataFormatPreference != null && this.options.dataFormatPreference.length !== 0;

        return new Promise((resolve) => {
            if (isDepthUsageDeclared && isDataFormatDeclared) {
                const usages: XRDepthUsage[] = this.options.usagePreference.map((usage) => {
                    switch (usage) {
                        case "cpu":
                            return "cpu-optimized";
                        case "gpu":
                            return "gpu-optimized";
                    }
                });
                const dataFormats: XRDepthDataFormat[] = this.options.dataFormatPreference.map((format) => {
                    switch (format) {
                        case "luminance-alpha":
                            return "luminance-alpha";
                        case "float":
                            return "float32";
                        case "ushort":
                            return "unsigned-short";
                    }
                });

                resolve({
                    depthSensing: {
                        usagePreference: usages,
                        dataFormatPreference: dataFormats,
                    },
                });
            } else {
                resolve({});
            }
        });
    }

    private _getInternalTextureFromDepthInfo(): InternalTexture {
        const engine = this._xrSessionManager.scene.getEngine();
        const dataFormat = this.depthDataFormat;
        const textureType = this._textureType;
        if (!this._width || !this._height || !this._cachedWebGLTexture) {
            throw new Error("Depth information is not available");
        }
        const internalTexture = (engine as Engine).wrapWebGLTexture(
            this._cachedWebGLTexture,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            this._width || 256,
            this._height || 256
        );
        internalTexture.isCube = false;
        internalTexture.invertY = false;
        internalTexture._useSRGBBuffer = false;
        internalTexture.format = dataFormat === "luminance-alpha" ? Constants.TEXTUREFORMAT_LUMINANCE_ALPHA : Constants.TEXTUREFORMAT_RGBA;
        internalTexture.generateMipMaps = false;
        internalTexture.type =
            dataFormat === "float" ? Constants.TEXTURETYPE_FLOAT : dataFormat === "ushort" ? Constants.TEXTURETYPE_UNSIGNED_SHORT : Constants.TEXTURETYPE_UNSIGNED_BYTE;
        internalTexture._cachedWrapU = Constants.TEXTURE_WRAP_ADDRESSMODE;
        internalTexture._cachedWrapV = Constants.TEXTURE_WRAP_ADDRESSMODE;
        internalTexture._hardwareTexture = new WebGLHardwareTexture(this._cachedWebGLTexture, (engine as ThinEngine)._gl);
        internalTexture.is2DArray = textureType === "texture-array";

        return internalTexture;
    }
}

WebXRFeaturesManager.AddWebXRFeature(
    WebXRDepthSensing.Name,
    (xrSessionManager, options) => {
        return () => new WebXRDepthSensing(xrSessionManager, options);
    },
    WebXRDepthSensing.Version,
    false
);

RegisterMaterialPlugin("WebXRDepthSensingMaterialPlugin", (material) => new WebXRDepthSensingMaterialPlugin(material));
