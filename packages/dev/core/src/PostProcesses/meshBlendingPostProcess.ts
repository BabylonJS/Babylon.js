import { type Camera } from "../Cameras/camera.pure";
import { type AbstractEngine } from "../Engines/abstractEngine.pure";
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

/**
 * Options used to create a mesh-blending post process.
 */
export interface IMeshBlendingPostProcessOptions extends PostProcessOptions, IMeshBlendConfiguration {
    /** Optional caller-owned thin mesh-blending effect wrapper. */
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
    /**
     * The world-space normal geometry texture aligned with SceneColor.
     *
     * Signed normals are expected by default. Set worldNormalTextureIsUnsigned when the texture stores normals encoded in [0, 1].
     */
    worldNormalTexture: BaseTexture;
    /**
     * Optional user-owned artistic-noise texture. The post process never disposes it.
     */
    noiseTexture?: BaseTexture;
}

/**
 * Visually blends SceneColor across validated contacts between opaque or alpha-tested meshes.
 *
 * This WebGL2 and WebGPU effect does not change geometry, collision queries, depth, normals, or shadow geometry.
 * Transparent rendering is caller-controlled. Applications assign explicit group IDs from 1 through 63;
 * group 0 disables blending, and surfaces with the same nonzero group are treated as one logical object.
 *
 * The classic wrapper consumes caller-owned geometry textures and does not enable, configure, or dispose
 * a GeometryBufferRenderer. The tag, depth, world-normal, and SceneColor inputs are required; optional base
 * color enables shadow estimation. All provided geometry inputs must have the same physical dimensions and
 * sample count; the independently sized artistic-noise texture is excluded from this constraint. Mesh-blending
 * geometry inputs are single-sampled. Overlapping transparent surfaces can make SceneColor
 * inconsistent with the single-layer geometry inputs; compositing transparent content after this effect remains
 * the recommended configuration.
 *
 * Four configurable radius classes combine world-space radii with physical-pixel minimums, for both
 * perspective and orthographic cameras. Quality variants trade search work for seam quality. Stable
 * search noise is internal and frame invariant; optional artistic noise is user-owned and world-space.
 * This implementation does not use temporal accumulation or require TAA.
 *
 * The classic wrapper is runtime-only because its geometry textures are caller-owned resources. It cannot
 * be serialized, parsed, or cloned; use the FrameGraph/NRGE path when a serializable graph is required.
 * @see https://meshblend.lervik.com/
 * @see https://www.jacktollenaar.top/articles/meshblending.html
 * @see https://www.jacktollenaar.top/articles/meshblending2.html
 * @see https://bottosson.github.io/posts/oklab/
 * @see https://playground.babylonjs.com/?version=preview#XVZTSI#0
 * @see https://playground.babylonjs.com/?version=preview#O05LI8#2
 */
export class MeshBlendingPostProcess extends PostProcess {
    declare protected _effectWrapper: ThinMeshBlendingPostProcess;

    private _meshBlendTagTexture: BaseTexture;
    private _depthTexture: BaseTexture;
    private _baseColorTexture: Nullable<BaseTexture>;
    private _worldNormalTexture: BaseTexture;
    private readonly _ownsEffectWrapper: boolean;

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
        MeshBlendingPostProcess._ValidateInputTextureDimensions(value, this._depthTexture, this._baseColorTexture, this._worldNormalTexture);
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
        MeshBlendingPostProcess._ValidateInputTextureDimensions(this._meshBlendTagTexture, value, this._baseColorTexture, this._worldNormalTexture);
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
        MeshBlendingPostProcess._ValidateInputTextureDimensions(this._meshBlendTagTexture, this._depthTexture, value, this._worldNormalTexture);
        this._baseColorTexture = value;
        this._effectWrapper.hasBaseColorTexture = !!value;
        this._validateInputDimensions();
    }

    /**
     * The world-space normal geometry texture used for triplanar projection.
     */
    public get worldNormalTexture(): BaseTexture {
        return this._worldNormalTexture;
    }

    public set worldNormalTexture(value: BaseTexture) {
        MeshBlendingPostProcess._ValidateWorldNormalTexture(value);
        MeshBlendingPostProcess._ValidateInputTextureDimensions(this._meshBlendTagTexture, this._depthTexture, this._baseColorTexture, value);
        this._worldNormalTexture = value;
        this._validateInputDimensions();
    }

    /**
     * Gets or sets the optional user-owned artistic-noise texture.
     *
     * Setting null disables artistic noise without changing the configured controls.
     */
    public get noiseTexture(): Nullable<BaseTexture> {
        return this._effectWrapper.noiseTexture;
    }

    public set noiseTexture(value: Nullable<BaseTexture>) {
        if (value) {
            MeshBlendingPostProcess._ValidateNoiseTexture(value);
        }
        this._effectWrapper.noiseTexture = value;
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
     * Whether worldNormalTexture stores components encoded from [-1, 1] to [0, 1].
     */
    public get worldNormalTextureIsUnsigned(): boolean {
        return this._effectWrapper.worldNormalTextureIsUnsigned;
    }

    public set worldNormalTextureIsUnsigned(value: boolean) {
        this._effectWrapper.worldNormalTextureIsUnsigned = value;
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

    /** Artistic-noise strength. A value of 0 skips artistic-noise sampling. */
    public get noiseFactor(): number {
        return this._effectWrapper.noiseFactor;
    }

    public set noiseFactor(value: number) {
        this._effectWrapper.noiseFactor = value;
    }

    /** Controls how strongly artistic noise fades toward the exact seam. */
    public get noiseFade(): number {
        return this._effectWrapper.noiseFade;
    }

    public set noiseFade(value: number) {
        this._effectWrapper.noiseFade = value;
    }

    /** Bias added to the centered artistic-noise signal. */
    public get noiseOffset(): number {
        return this._effectWrapper.noiseOffset;
    }

    public set noiseOffset(value: number) {
        this._effectWrapper.noiseOffset = value;
    }

    /** Number of artistic-noise tiles across the selected radius class. */
    public get noiseTileSize(): number {
        return this._effectWrapper.noiseTileSize;
    }

    public set noiseTileSize(value: number) {
        this._effectWrapper.noiseTileSize = value;
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
        const engine: AbstractEngine = options.engine ?? scene.getEngine();
        if (options.effectWrapper !== undefined && !(options.effectWrapper instanceof ThinMeshBlendingPostProcess)) {
            throw new TypeError("MeshBlendingPostProcess: effectWrapper must be a ThinMeshBlendingPostProcess");
        }
        MeshBlendingPostProcess._ValidateInputs(options);

        const ownsEffectWrapper = options.effectWrapper === undefined;
        const effectWrapper = options.effectWrapper ?? new ThinMeshBlendingPostProcess(name, engine, options);
        effectWrapper.hasBaseColorTexture = !!options.baseColorTexture;

        super(name, ThinMeshBlendingPostProcess.FragmentUrl, {
            ...options,
            camera,
            engine,
            effectWrapper,
            uniforms: ThinMeshBlendingPostProcess.Uniforms,
            samplers: ThinMeshBlendingPostProcess.Samplers,
            textureType: options.textureType ?? Constants.TEXTURETYPE_UNSIGNED_BYTE,
        });

        this._ownsEffectWrapper = ownsEffectWrapper;
        this._meshBlendTagTexture = options.meshBlendTagTexture;
        this._depthTexture = options.depthTexture;
        this._baseColorTexture = options.baseColorTexture ?? null;
        this._worldNormalTexture = options.worldNormalTexture;

        this._effectWrapper.configure(options);
        this._effectWrapper.noiseTexture = options.noiseTexture ?? null;
        this._effectWrapper.camera = camera;
        this._validateInputDimensions();

        this.onApply = (effect: Effect) => {
            this._validateInputDimensions(this.width, this.height, this.inputTexture.samples);
            this._effectWrapper.camera = this.getCamera();
            effect.setTexture("meshBlendTagSampler", this._meshBlendTagTexture);
            effect.setTexture("meshBlendDepthSampler", this._depthTexture);
            if (this._baseColorTexture) {
                effect.setTexture("meshBlendBaseColorSampler", this._baseColorTexture);
            }
            effect.setTexture("meshBlendWorldNormalSampler", this._worldNormalTexture);
        };
    }

    public override getClassName(): string {
        return "MeshBlendingPostProcess";
    }

    public override dispose(camera?: Camera): void {
        super.dispose(camera);
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

    private static _ValidateInputs(options: IMeshBlendingPostProcessOptions): void {
        _ValidateMeshBlendConfiguration(options);
        MeshBlendingPostProcess._ValidateMeshBlendTagTexture(options.meshBlendTagTexture);
        MeshBlendingPostProcess._ValidateDepthTexture(options.depthTexture, options.depthType ?? MeshBlendDepthType.View);
        if (options.baseColorTexture) {
            MeshBlendingPostProcess._ValidateBaseColorTexture(options.baseColorTexture);
        }
        MeshBlendingPostProcess._ValidateWorldNormalTexture(options.worldNormalTexture);
        if (options.noiseTexture) {
            MeshBlendingPostProcess._ValidateNoiseTexture(options.noiseTexture);
        }
        MeshBlendingPostProcess._ValidateInputTextureDimensions(options.meshBlendTagTexture, options.depthTexture, options.baseColorTexture, options.worldNormalTexture);
    }

    private static _ValidateInputTextureDimensions(
        meshBlendTagTexture: BaseTexture,
        depthTexture: BaseTexture,
        baseColorTexture: Nullable<BaseTexture> | undefined,
        worldNormalTexture: BaseTexture
    ): void {
        const tagInternalTexture = meshBlendTagTexture.getInternalTexture();
        const depthInternalTexture = depthTexture.getInternalTexture();
        const baseColorInternalTexture = baseColorTexture?.getInternalTexture();
        const worldNormalInternalTexture = worldNormalTexture.getInternalTexture();
        if (!tagInternalTexture || !depthInternalTexture || !worldNormalInternalTexture) {
            return;
        }

        if (
            tagInternalTexture.width !== depthInternalTexture.width ||
            tagInternalTexture.height !== depthInternalTexture.height ||
            (baseColorInternalTexture !== null &&
                baseColorInternalTexture !== undefined &&
                (tagInternalTexture.width !== baseColorInternalTexture.width || tagInternalTexture.height !== baseColorInternalTexture.height)) ||
            tagInternalTexture.width !== worldNormalInternalTexture.width ||
            tagInternalTexture.height !== worldNormalInternalTexture.height
        ) {
            throw new Error(
                "MeshBlendingPostProcess: meshBlendTagTexture, depthTexture, worldNormalTexture, and baseColorTexture when provided must have matching physical dimensions"
            );
        }
        const inputSamples = tagInternalTexture.samples || 1;
        if (
            (depthInternalTexture.samples || 1) !== inputSamples ||
            (baseColorInternalTexture !== null && baseColorInternalTexture !== undefined && (baseColorInternalTexture.samples || 1) !== inputSamples) ||
            (worldNormalInternalTexture.samples || 1) !== inputSamples
        ) {
            throw new Error("MeshBlendingPostProcess: meshBlendTagTexture, depthTexture, worldNormalTexture, and baseColorTexture when provided must have matching sample counts");
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

    private static _ValidateWorldNormalTexture(texture: BaseTexture): void {
        const internalTexture = texture.getInternalTexture();
        if (!internalTexture) {
            return;
        }
        MeshBlendingPostProcess._Validate2DTexture(internalTexture, "worldNormalTexture");

        const validFormat = internalTexture.format === Constants.TEXTUREFORMAT_RGB || internalTexture.format === Constants.TEXTUREFORMAT_RGBA;
        const validType =
            internalTexture.type === Constants.TEXTURETYPE_UNSIGNED_BYTE ||
            internalTexture.type === Constants.TEXTURETYPE_HALF_FLOAT ||
            internalTexture.type === Constants.TEXTURETYPE_FLOAT ||
            internalTexture.type === Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV ||
            internalTexture.type === Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV;
        if (!validFormat || !validType) {
            throw new Error("MeshBlendingPostProcess: worldNormalTexture must use a non-integer RGB or RGBA color format");
        }
        if (internalTexture.generateMipMaps || internalTexture.samples > 1) {
            throw new Error("MeshBlendingPostProcess: worldNormalTexture must not use mipmaps and must be single-sampled");
        }
    }

    private static _ValidateNoiseTexture(texture: BaseTexture): void {
        const internalTexture = texture.getInternalTexture();
        if (!internalTexture) {
            return;
        }
        MeshBlendingPostProcess._Validate2DTexture(internalTexture, "noiseTexture");

        const validFormat =
            internalTexture.format === Constants.TEXTUREFORMAT_RED ||
            internalTexture.format === Constants.TEXTUREFORMAT_RG ||
            internalTexture.format === Constants.TEXTUREFORMAT_RGB ||
            internalTexture.format === Constants.TEXTUREFORMAT_RGBA;
        const validType =
            internalTexture.type === Constants.TEXTURETYPE_UNSIGNED_BYTE ||
            internalTexture.type === Constants.TEXTURETYPE_HALF_FLOAT ||
            internalTexture.type === Constants.TEXTURETYPE_FLOAT;
        if (!validFormat || !validType) {
            throw new Error("MeshBlendingPostProcess: noiseTexture must be a non-integer 2D color texture");
        }
        if (internalTexture.samples > 1) {
            throw new Error("MeshBlendingPostProcess: noiseTexture must be single-sampled");
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
        MeshBlendingPostProcess._ValidateWorldNormalTexture(this._worldNormalTexture);
        const noiseTexture = this.noiseTexture;
        if (noiseTexture) {
            MeshBlendingPostProcess._ValidateNoiseTexture(noiseTexture);
        }

        const tagTexture = this._meshBlendTagTexture?.getInternalTexture();
        const depthTexture = this._depthTexture?.getInternalTexture();
        const baseColorTexture = this._baseColorTexture?.getInternalTexture();
        const worldNormalTexture = this._worldNormalTexture?.getInternalTexture();
        if (!tagTexture || !depthTexture || !worldNormalTexture) {
            return;
        }

        MeshBlendingPostProcess._ValidateInputTextureDimensions(this._meshBlendTagTexture, this._depthTexture, this._baseColorTexture, this._worldNormalTexture);
        const inputSamples = tagTexture.samples || 1;
        if (renderWidth !== undefined && renderHeight !== undefined && renderWidth > 0 && renderHeight > 0) {
            if (
                tagTexture.width !== renderWidth ||
                tagTexture.height !== renderHeight ||
                (baseColorTexture !== null && baseColorTexture !== undefined && (baseColorTexture.width !== renderWidth || baseColorTexture.height !== renderHeight)) ||
                worldNormalTexture.width !== renderWidth ||
                worldNormalTexture.height !== renderHeight
            ) {
                throw new Error(
                    "MeshBlendingPostProcess: SceneColor, meshBlendTagTexture, depthTexture, worldNormalTexture, and baseColorTexture when provided must have matching physical dimensions"
                );
            }
            if ((renderSamples || 1) !== inputSamples) {
                throw new Error(
                    "MeshBlendingPostProcess: SceneColor, meshBlendTagTexture, depthTexture, worldNormalTexture, and baseColorTexture when provided must have matching sample counts"
                );
            }
        }
    }
}
