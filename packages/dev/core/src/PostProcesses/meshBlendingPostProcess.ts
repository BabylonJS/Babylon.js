import { type Camera } from "../Cameras/camera.pure";
import { Constants } from "../Engines/constants";
import { type Effect } from "../Materials/effect.pure";
import { type BaseTexture } from "../Materials/Textures/baseTexture.pure";
import { type InternalTexture } from "../Materials/Textures/internalTexture";
import { type Scene } from "../scene.pure";
import { type Nullable } from "../types";
import { PostProcess, type PostProcessOptions } from "./postProcess.pure";
import {
    type IMeshBlendConfiguration,
    type MeshBlendDebugMode,
    MeshBlendDepthType,
    type MeshBlendQuality,
    type MeshBlendRadiusDefinitions,
    ThinMeshBlendingPostProcess,
    _ValidateMeshBlendConfiguration,
} from "./thinMeshBlendingPostProcess";

const _ClassicEffectWrapperOwners = new WeakSet<ThinMeshBlendingPostProcess>();

/**
 * Options used to create a mesh-blending post process.
 */
export interface IMeshBlendingPostProcessOptions extends PostProcessOptions, IMeshBlendConfiguration {
    /** Optional caller-owned thin mesh-blending effect wrapper. A wrapper can be attached to only one classic post process at a time. */
    effectWrapper?: ThinMeshBlendingPostProcess;
    /**
     * The packed R8UI mesh-blending tag texture.
     */
    meshBlendTagTexture: BaseTexture;
    /**
     * The view-depth or screen-depth texture aligned with the packed tag texture.
     */
    depthTexture: BaseTexture;
    /**
     * Optional linear base-color/albedo geometry texture aligned with SceneColor.
     *
     * When omitted, shadow estimation is compiled out.
     */
    baseColorTexture?: BaseTexture;
}

/**
 * Visually blends SceneColor across validated contacts between opaque or alpha-tested meshes.
 *
 * This WebGL2 and WebGPU effect does not change geometry, collision queries, depth, normals, or shadow geometry.
 * Transparent rendering is caller-controlled. Applications assign explicit group IDs from 1 through 63;
 * group 0 disables blending, and surfaces with the same nonzero group are treated as one logical object.
 *
 * The classic wrapper consumes caller-owned geometry textures and does not enable, configure, or dispose
 * a GeometryBufferRenderer. The tag, depth, and SceneColor inputs are required; optional base color enables
 * shadow estimation. All provided geometry inputs must have the same physical dimensions and sample count and
 * are single-sampled. Overlapping transparent surfaces can make SceneColor inconsistent with the single-layer
 * geometry inputs; compositing transparent content after this effect remains the recommended configuration.
 *
 * Four configurable radius classes combine world-space radii with physical-pixel minimums, for both
 * perspective and orthographic cameras. Quality variants trade search work for seam quality. Stable search
 * noise is internal and frame invariant. This implementation does not use temporal accumulation or require TAA.
 *
 * The classic wrapper is runtime-only because its geometry textures are caller-owned resources. It cannot
 * be serialized, parsed, or cloned; use the FrameGraph/NRGE path when a serializable graph is required.
 * @see https://meshblend.lervik.com/
 * @see https://www.jacktollenaar.top/articles/meshblending.html
 * @see https://www.jacktollenaar.top/articles/meshblending2.html
 * @see https://bottosson.github.io/posts/oklab/
 * @see https://playground.babylonjs.com/?version=preview#XVZTSI#3
 * @see https://playground.babylonjs.com/?version=preview#O05LI8#6
 */
export class MeshBlendingPostProcess extends PostProcess {
    declare protected _effectWrapper: ThinMeshBlendingPostProcess;

    private _meshBlendTagTexture: BaseTexture;
    private _depthTexture: BaseTexture;
    private _baseColorTexture: Nullable<BaseTexture>;
    private readonly _ownsEffectWrapper: boolean;
    private readonly _usesExternalEffectWrapper: boolean;

    /**
     * Gets the compile-time quality variant.
     */
    public get quality(): MeshBlendQuality {
        return this._effectWrapper.quality;
    }

    public set quality(value: MeshBlendQuality) {
        this._effectWrapper.quality = value;
    }

    /**
     * The packed R8UI mesh-blending tag texture used by the effect.
     */
    public get meshBlendTagTexture(): BaseTexture {
        return this._meshBlendTagTexture;
    }

    public set meshBlendTagTexture(value: BaseTexture) {
        MeshBlendingPostProcess._ValidateMeshBlendTagTexture(value);
        MeshBlendingPostProcess._ValidateInputTextureDimensions(value, this._depthTexture, this._baseColorTexture);
        this._meshBlendTagTexture = value;
        this._validateInputDimensions();
    }

    /**
     * The depth texture used for position reconstruction and contact validation.
     */
    public get depthTexture(): BaseTexture {
        return this._depthTexture;
    }

    public set depthTexture(value: BaseTexture) {
        MeshBlendingPostProcess._ValidateDepthTexture(value, this.depthType);
        MeshBlendingPostProcess._ValidateInputTextureDimensions(this._meshBlendTagTexture, value, this._baseColorTexture);
        this._depthTexture = value;
        this._validateInputDimensions();
    }

    /**
     * The optional linear base-color/albedo geometry texture used by the shadow-transfer heuristic.
     *
     * Setting null compiles shadow estimation out.
     */
    public get baseColorTexture(): Nullable<BaseTexture> {
        return this._baseColorTexture;
    }

    public set baseColorTexture(value: Nullable<BaseTexture>) {
        if (value) {
            MeshBlendingPostProcess._ValidateBaseColorTexture(value);
        }
        MeshBlendingPostProcess._ValidateInputTextureDimensions(this._meshBlendTagTexture, this._depthTexture, value);
        this._baseColorTexture = value;
        this._effectWrapper.hasBaseColorTexture = !!value;
        this._validateInputDimensions();
    }

    /**
     * Gets the representation stored in the depth texture.
     */
    public get depthType(): MeshBlendDepthType {
        return this._effectWrapper.depthType;
    }

    public set depthType(value: MeshBlendDepthType) {
        if (this._depthTexture) {
            MeshBlendingPostProcess._ValidateDepthTexture(this._depthTexture, value);
        }
        this._effectWrapper.depthType = value;
    }

    /**
     * Gets the four configurable radius definitions indexed by packed radius class.
     */
    public get radiusClasses(): MeshBlendRadiusDefinitions {
        return this._effectWrapper.radiusClasses;
    }

    /**
     * Gets the compiled debug visualization.
     */
    public get debugMode(): MeshBlendDebugMode {
        return this._effectWrapper.debugMode;
    }

    public set debugMode(value: MeshBlendDebugMode) {
        this._effectWrapper.debugMode = value;
    }

    /** Contact-slope narrowing factor. A value of 1 disables narrowing. */
    public get slopeFactor(): number {
        return this._effectWrapper.slopeFactor;
    }

    public set slopeFactor(value: number) {
        this._effectWrapper.slopeFactor = value;
    }

    /**
     * Applies shared mesh-blending configuration.
     * @param options Values to apply. Omitted values retain their current settings.
     */
    public configure(options?: IMeshBlendConfiguration): void {
        if (options?.depthType !== undefined) {
            MeshBlendingPostProcess._ValidateDepthTexture(this._depthTexture, options.depthType);
        }
        this._effectWrapper.configure(options);
    }

    /**
     * Creates a mesh-blending post process.
     * @param name The name of the post process.
     * @param scene The scene containing the camera.
     * @param camera The camera to attach the post process to.
     * @param options The post-process and input-texture options.
     */
    constructor(name: string, scene: Scene, camera: Camera, options: IMeshBlendingPostProcessOptions) {
        const sceneEngine = scene.getEngine();
        if (camera.getScene() !== scene) {
            throw new Error("MeshBlendingPostProcess: scene and camera must belong to the same scene");
        }
        if (options.engine !== undefined && options.engine !== sceneEngine) {
            throw new Error("MeshBlendingPostProcess: options.engine must match the scene engine");
        }
        if (options.effectWrapper !== undefined && !(options.effectWrapper instanceof ThinMeshBlendingPostProcess)) {
            throw new TypeError("MeshBlendingPostProcess: effectWrapper must be a ThinMeshBlendingPostProcess");
        }
        if (options.effectWrapper !== undefined && options.effectWrapper.options.engine !== sceneEngine) {
            throw new Error("MeshBlendingPostProcess: effectWrapper must use the scene engine");
        }
        if (options.effectWrapper !== undefined && _ClassicEffectWrapperOwners.has(options.effectWrapper)) {
            throw new Error("MeshBlendingPostProcess: effectWrapper is already attached to another classic mesh-blending post process");
        }
        const depthType = options.depthType ?? options.effectWrapper?.depthType ?? MeshBlendDepthType.View;
        MeshBlendingPostProcess._ValidateInputs(options, depthType);

        const ownsEffectWrapper = options.effectWrapper === undefined;
        const effectWrapper = options.effectWrapper ?? new ThinMeshBlendingPostProcess(name, sceneEngine, options);
        effectWrapper.hasBaseColorTexture = !!options.baseColorTexture;

        super(name, ThinMeshBlendingPostProcess.FragmentUrl, {
            ...options,
            camera,
            engine: sceneEngine,
            effectWrapper,
            uniforms: ThinMeshBlendingPostProcess.Uniforms,
            samplers: ThinMeshBlendingPostProcess.Samplers,
            textureType: options.textureType ?? Constants.TEXTURETYPE_UNSIGNED_BYTE,
        });

        this._ownsEffectWrapper = ownsEffectWrapper;
        this._usesExternalEffectWrapper = !ownsEffectWrapper;
        if (this._usesExternalEffectWrapper) {
            _ClassicEffectWrapperOwners.add(effectWrapper);
        }
        this._meshBlendTagTexture = options.meshBlendTagTexture;
        this._depthTexture = options.depthTexture;
        this._baseColorTexture = options.baseColorTexture ?? null;

        this._effectWrapper.configure(options);
        this._effectWrapper.camera = camera;
        this.doNotSerialize = true;
        this._validateInputDimensions();

        this.onApply = (effect: Effect) => {
            this._validateInputDimensions(this.width, this.height, this.inputTexture.samples);
            this._effectWrapper.camera = this.getCamera();
            effect.setTexture("meshBlendTagSampler", this._meshBlendTagTexture);
            effect.setTexture("meshBlendDepthSampler", this._depthTexture);
            if (this._baseColorTexture) {
                effect.setTexture("meshBlendBaseColorSampler", this._baseColorTexture);
            }
        };
    }

    public override getClassName(): string {
        return "MeshBlendingPostProcess";
    }

    public override dispose(camera?: Camera): void {
        super.dispose(camera);
        if (this._usesExternalEffectWrapper) {
            _ClassicEffectWrapperOwners.delete(this._effectWrapper);
        }
        if (this._ownsEffectWrapper) {
            this._effectWrapper.dispose();
        }
    }

    /**
     * Classic mesh blending cannot be serialized because its geometry inputs are caller-owned runtime textures.
     * @throws Always throws because the classic wrapper is runtime-only.
     */
    public override serialize(): never {
        throw new Error("MeshBlendingPostProcess cannot be serialized; use the FrameGraph/NRGE path for serializable mesh blending");
    }

    /**
     * Classic mesh blending cannot be cloned because its geometry inputs are caller-owned runtime textures.
     * @returns Null.
     */
    public override clone(): null {
        return null;
    }

    private static _ValidateInputs(options: IMeshBlendingPostProcessOptions, depthType: MeshBlendDepthType): void {
        _ValidateMeshBlendConfiguration(options);
        MeshBlendingPostProcess._ValidateMeshBlendTagTexture(options.meshBlendTagTexture);
        MeshBlendingPostProcess._ValidateDepthTexture(options.depthTexture, depthType);
        if (options.baseColorTexture) {
            MeshBlendingPostProcess._ValidateBaseColorTexture(options.baseColorTexture);
        }
        MeshBlendingPostProcess._ValidateInputTextureDimensions(options.meshBlendTagTexture, options.depthTexture, options.baseColorTexture);
    }

    private static _ValidateInputTextureDimensions(meshBlendTagTexture: BaseTexture, depthTexture: BaseTexture, baseColorTexture: Nullable<BaseTexture> | undefined): void {
        const tagInternalTexture = meshBlendTagTexture.getInternalTexture();
        const depthInternalTexture = depthTexture.getInternalTexture();
        const baseColorInternalTexture = baseColorTexture?.getInternalTexture();
        if (!tagInternalTexture || !depthInternalTexture) {
            return;
        }

        if (
            tagInternalTexture.width !== depthInternalTexture.width ||
            tagInternalTexture.height !== depthInternalTexture.height ||
            (baseColorInternalTexture !== null &&
                baseColorInternalTexture !== undefined &&
                (tagInternalTexture.width !== baseColorInternalTexture.width || tagInternalTexture.height !== baseColorInternalTexture.height))
        ) {
            throw new Error("MeshBlendingPostProcess: meshBlendTagTexture, depthTexture, and baseColorTexture when provided must have matching physical dimensions");
        }
        const inputSamples = tagInternalTexture.samples || 1;
        if (
            (depthInternalTexture.samples || 1) !== inputSamples ||
            (baseColorInternalTexture !== null && baseColorInternalTexture !== undefined && (baseColorInternalTexture.samples || 1) !== inputSamples)
        ) {
            throw new Error("MeshBlendingPostProcess: meshBlendTagTexture, depthTexture, and baseColorTexture when provided must have matching sample counts");
        }
    }

    private static _ValidateMeshBlendTagTexture(texture: BaseTexture): void {
        const internalTexture = texture.getInternalTexture();
        if (!internalTexture) {
            return;
        }
        MeshBlendingPostProcess._Validate2DTexture(internalTexture, "meshBlendTagTexture");
        if (internalTexture.type !== Constants.TEXTURETYPE_UNSIGNED_BYTE || internalTexture.format !== Constants.TEXTUREFORMAT_RED_INTEGER) {
            throw new Error("MeshBlendingPostProcess: meshBlendTagTexture must use TEXTURETYPE_UNSIGNED_BYTE with TEXTUREFORMAT_RED_INTEGER");
        }
        if (internalTexture.generateMipMaps || internalTexture.samplingMode !== Constants.TEXTURE_NEAREST_SAMPLINGMODE || internalTexture.samples > 1) {
            throw new Error("MeshBlendingPostProcess: meshBlendTagTexture must use nearest sampling without mipmaps and must be single-sampled");
        }
    }

    private static _ValidateDepthTexture(texture: BaseTexture, depthType: MeshBlendDepthType): void {
        const internalTexture = texture.getInternalTexture();
        if (!internalTexture) {
            return;
        }
        MeshBlendingPostProcess._Validate2DTexture(internalTexture, "depthTexture");

        const validFormat =
            internalTexture.format === Constants.TEXTUREFORMAT_RED ||
            internalTexture.format === Constants.TEXTUREFORMAT_RG ||
            internalTexture.format === Constants.TEXTUREFORMAT_RGBA;
        const validType =
            internalTexture.type === Constants.TEXTURETYPE_FLOAT ||
            internalTexture.type === Constants.TEXTURETYPE_HALF_FLOAT ||
            (depthType === MeshBlendDepthType.Screen && internalTexture.type === Constants.TEXTURETYPE_UNSIGNED_BYTE);

        if (!validFormat || !validType) {
            throw new Error(
                `MeshBlendingPostProcess: ${depthType === MeshBlendDepthType.View ? "view" : "screen"} depthTexture must use a floating-point color format${
                    depthType === MeshBlendDepthType.Screen ? " or normalized unsigned bytes" : ""
                }`
            );
        }
        if (internalTexture.generateMipMaps || internalTexture.samples > 1) {
            throw new Error("MeshBlendingPostProcess: depthTexture must not use mipmaps and must be single-sampled");
        }
    }

    private static _ValidateBaseColorTexture(texture: BaseTexture): void {
        const internalTexture = texture.getInternalTexture();
        if (!internalTexture) {
            return;
        }
        MeshBlendingPostProcess._Validate2DTexture(internalTexture, "baseColorTexture");

        const validFormat = internalTexture.format === Constants.TEXTUREFORMAT_RGB || internalTexture.format === Constants.TEXTUREFORMAT_RGBA;
        const validType =
            internalTexture.type === Constants.TEXTURETYPE_UNSIGNED_BYTE ||
            internalTexture.type === Constants.TEXTURETYPE_HALF_FLOAT ||
            internalTexture.type === Constants.TEXTURETYPE_FLOAT;
        if (!validFormat || !validType) {
            throw new Error("MeshBlendingPostProcess: baseColorTexture must use a non-integer RGB or RGBA color format");
        }
        if (internalTexture.generateMipMaps || internalTexture.samples > 1) {
            throw new Error("MeshBlendingPostProcess: baseColorTexture must not use mipmaps and must be single-sampled");
        }
    }

    private static _Validate2DTexture(internalTexture: InternalTexture, name: string): void {
        if (internalTexture.isCube || internalTexture.is3D || internalTexture.is2DArray) {
            throw new Error(`MeshBlendingPostProcess: ${name} must be a 2D texture`);
        }
    }

    private _validateInputDimensions(renderWidth?: number, renderHeight?: number, renderSamples?: number): void {
        MeshBlendingPostProcess._ValidateMeshBlendTagTexture(this._meshBlendTagTexture);
        MeshBlendingPostProcess._ValidateDepthTexture(this._depthTexture, this.depthType);
        if (this._baseColorTexture) {
            MeshBlendingPostProcess._ValidateBaseColorTexture(this._baseColorTexture);
        }

        const tagTexture = this._meshBlendTagTexture?.getInternalTexture();
        const depthTexture = this._depthTexture?.getInternalTexture();
        const baseColorTexture = this._baseColorTexture?.getInternalTexture();
        if (!tagTexture || !depthTexture) {
            return;
        }

        MeshBlendingPostProcess._ValidateInputTextureDimensions(this._meshBlendTagTexture, this._depthTexture, this._baseColorTexture);
        const inputSamples = tagTexture.samples || 1;
        if (renderWidth !== undefined && renderHeight !== undefined && renderWidth > 0 && renderHeight > 0) {
            if (
                tagTexture.width !== renderWidth ||
                tagTexture.height !== renderHeight ||
                (baseColorTexture !== null && baseColorTexture !== undefined && (baseColorTexture.width !== renderWidth || baseColorTexture.height !== renderHeight))
            ) {
                throw new Error(
                    "MeshBlendingPostProcess: SceneColor, meshBlendTagTexture, depthTexture, and baseColorTexture when provided must have matching physical dimensions"
                );
            }
            if ((renderSamples || 1) !== inputSamples) {
                throw new Error("MeshBlendingPostProcess: SceneColor, meshBlendTagTexture, depthTexture, and baseColorTexture when provided must have matching sample counts");
            }
        }
    }
}
