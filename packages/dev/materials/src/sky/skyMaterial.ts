/* eslint-disable @typescript-eslint/naming-convention */
import { type Nullable } from "core/types";
import { serializeAsVector3, serialize } from "core/Misc/decorators";
import { SerializationHelper } from "core/Misc/decorators.serialization";
import { type Matrix, Vector3, Quaternion, TmpVectors } from "core/Maths/math.vector";
import { type IAnimatable } from "core/Animations/animatable.interface";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { MaterialDefines } from "core/Materials/materialDefines";
import { PushMaterial } from "core/Materials/pushMaterial";
import { Constants } from "core/Engines/constants";
import { MaxHalfFloat } from "core/Misc/halfFloat";
import { VertexBuffer } from "core/Buffers/buffer";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type SubMesh } from "core/Meshes/subMesh";
import { type Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { RegisterClass } from "core/Misc/typeStore";
import { _ShaderImportLoader } from "core/Misc/shaderImportLoader";
import { type IEffectCreationOptions } from "core/Materials/effect";

import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { AddClipPlaneUniforms, BindClipPlane } from "core/Materials/clipPlaneMaterialHelper";
import { BindFogParameters, BindLogDepth, PrepareDefinesForAttributes, PrepareDefinesForMisc } from "core/Materials/materialHelper.functions";

/** @internal */
class SkyMaterialDefines extends MaterialDefines {
    public CLIPPLANE = false;
    public CLIPPLANE2 = false;
    public CLIPPLANE3 = false;
    public CLIPPLANE4 = false;
    public CLIPPLANE5 = false;
    public CLIPPLANE6 = false;
    public POINTSIZE = false;
    public FOG = false;
    public VERTEXCOLOR = false;
    public VERTEXALPHA = false;
    public IMAGEPROCESSINGPOSTPROCESS = false;
    public SKIPFINALCOLORCLAMP = false;
    public DITHER = false;
    public LOGARITHMICDEPTH = false;
    public SKY_RAW_HDR_OUTPUT = false;

    constructor() {
        super();
        this.rebuild();
    }
}

/**
 * Max value the sky shader may write before the bound render target stores it as +Inf (which would
 * corrupt anything reading the texture back, e.g. an IBL CDF). Derived from the RT's texture type:
 * half-float caps at its 65504 ceiling; float is effectively unbounded (a huge finite +Inf guard);
 * anything else (8-bit LDR, or the default framebuffer when no RT is bound) is [0,1]. Only used when
 * `rawHdrOutput` is enabled.
 * @param textureType the bound render target's texture type (Constants.TEXTURETYPE_*), or undefined
 * @returns the maximum color value that can be stored without overflowing to +Inf
 * @internal
 */
export function _MaxColorValueForRenderTarget(textureType: number | undefined): number {
    switch (textureType) {
        case Constants.TEXTURETYPE_HALF_FLOAT:
            return MaxHalfFloat;
        case Constants.TEXTURETYPE_FLOAT:
            return 3.0e38;
        default:
            return 1.0;
    }
}

/**
 * This is the sky material which allows to create dynamic and texture free effects for skyboxes.
 * @see https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat
 */
export class SkyMaterial extends PushMaterial {
    /**
     * Defines the overall luminance of sky in interval ]0, 1[.
     */
    @serialize()
    public luminance: number = 1.0;

    /**
     * Defines the amount (scattering) of haze as opposed to molecules in atmosphere.
     */
    @serialize()
    public turbidity: number = 10.0;

    /**
     * Defines the sky appearance (light intensity).
     */
    @serialize()
    public rayleigh: number = 2.0;

    /**
     * Defines the mieCoefficient in interval [0, 0.1] which affects the property .mieDirectionalG.
     */
    @serialize()
    public mieCoefficient: number = 0.005;

    /**
     * Defines the amount of haze particles following the Mie scattering theory.
     */
    @serialize()
    public mieDirectionalG: number = 0.8;

    /**
     * Defines the distance of the sun according to the active scene camera.
     */
    @serialize()
    public distance: number = 500;

    /**
     * Defines the sun inclination, in interval [-0.5, 0.5]. When the inclination is not 0, the sun is said
     * "inclined".
     */
    @serialize()
    public inclination: number = 0.49;

    /**
     * Defines the solar azimuth in interval [0, 1]. The azimuth is the angle in the horizontal plan between
     * an object direction and a reference direction.
     */
    @serialize()
    public azimuth: number = 0.25;

    /**
     * Defines the sun position in the sky on (x,y,z). If the property .useSunPosition is set to false, then
     * the property is overridden by the inclination and the azimuth and can be read at any moment.
     */
    @serializeAsVector3()
    public sunPosition: Vector3 = new Vector3(0, 100, 0);

    /**
     * Defines if the sun position should be computed (inclination and azimuth) according to the given
     * .sunPosition property.
     */
    @serialize()
    public useSunPosition: boolean = false;

    /**
     * Defines an offset vector used to get a horizon offset.
     * @example skyMaterial.cameraOffset.y = camera.globalPosition.y // Set horizon relative to 0 on the Y axis
     */
    @serializeAsVector3()
    public cameraOffset: Vector3 = Vector3.Zero();

    /**
     * Defines the vector the skyMaterial should consider as up. (default is Vector3(0, 1, 0) as returned by Vector3.Up())
     */
    @serializeAsVector3()
    public up: Vector3 = Vector3.Up();

    /**
     * Defines if sky should be dithered.
     */
    @serialize()
    public dithering: boolean = false;

    /**
     * When enabled, the material emits scene-referred linear HDR: `luminance` acts as a plain linear
     * gain (no filmic tonemap), the output is clamped to the bound render target's max representable
     * value rather than [0, 1] (so a bright sun cannot overflow to +Inf), and no sRGB encode is
     * applied. Enable this to bake the sky into an HDR (float / half-float) render target — e.g. an
     * IBL environment cube — where the full dynamic range of the sun disc must be preserved. The
     * clamp ceiling follows whatever target is bound at draw time (65504 for half-float, effectively
     * unbounded for float); if the sky is drawn to an LDR target or the default framebuffer it falls
     * back to [0, 1], so this flag is only meaningful when rendering into a float/half-float target.
     * When disabled, the material produces tonemapped, display-referred output for direct viewing.
     */
    @serialize()
    public rawHdrOutput: boolean = false;

    /**
     * Cloud cover over the sun in [0, 1] (0 = clear direct sun, default; 1 = sun fully hidden). This
     * softens only the *sun disc* — the sky dome color itself is unchanged (there is no overcast
     * graying or whitening of the sky). At 0 the sun is a sharp solar disc; above 0 a physically-
     * based single-scattering cloud model attenuates the direct beam (Beer–Lambert) and redistributes
     * the removed energy into a dual-lobe Henyey–Greenstein aureole, energy-conserving as it broadens
     * (thin cloud → tight silver lining; heavy cloud → broad, directionless glow). See the sun-disc
     * branch in sky.fragment for the model + references.
     */
    @serialize()
    public cloudiness: number = 0;

    // Private members
    private _cameraPosition: Vector3 = Vector3.Zero();
    private _skyOrientation: Quaternion = new Quaternion();

    private static readonly _ShaderLoader = /*#__PURE__*/ new _ShaderImportLoader(
        () => [import("./sky.vertex"), import("./sky.fragment")],
        () => [import("./wgsl/sky.vertex"), import("./wgsl/sky.fragment")]
    );

    /**
     * Instantiates a new sky material.
     * This material allows to create dynamic and texture free
     * effects for skyboxes by taking care of the atmosphere state.
     * @see https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat
     * @param name Define the name of the material in the scene
     * @param scene Define the scene the material belong to
     * @param forceGLSL Use the GLSL code generation for the shader (even on WebGPU). Default is false
     */
    constructor(name: string, scene?: Scene, forceGLSL = false) {
        super(name, scene, undefined, forceGLSL);
    }

    /**
     * Specifies if the material will require alpha blending
     * @returns a boolean specifying if alpha blending is needed
     */
    public override needAlphaBlending(): boolean {
        return this.alpha < 1.0;
    }

    /**
     * Specifies if this material should be rendered in alpha test mode
     * @returns false as the sky material doesn't need alpha testing.
     */
    public override needAlphaTesting(): boolean {
        return false;
    }

    /**
     * Get the texture used for alpha test purpose.
     * @returns null as the sky material has no texture.
     */
    public override getAlphaTestTexture(): Nullable<BaseTexture> {
        return null;
    }

    /**
     * Get if the submesh is ready to be used and all its information available.
     * Child classes can use it to update shaders
     * @param mesh defines the mesh to check
     * @param subMesh defines which submesh to check
     * @returns a boolean indicating that the submesh is ready or not
     */
    public override isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh): boolean {
        const drawWrapper = subMesh._drawWrapper;

        if (this.isFrozen) {
            if (drawWrapper.effect && drawWrapper._wasPreviouslyReady) {
                return true;
            }
        }

        if (!subMesh.materialDefines) {
            subMesh.materialDefines = new SkyMaterialDefines();
        }

        const defines = <SkyMaterialDefines>subMesh.materialDefines;
        const scene = this.getScene();

        if (this._isReadyForSubMesh(subMesh)) {
            return true;
        }

        PrepareDefinesForMisc(
            mesh,
            scene,
            this._useLogarithmicDepth,
            this.pointsCloud,
            this.fogEnabled,
            false,
            defines,
            undefined,
            undefined,
            undefined,
            this._isVertexOutputInvariant
        );

        // Attribs
        PrepareDefinesForAttributes(mesh, defines, true, false);

        if (defines.IMAGEPROCESSINGPOSTPROCESS !== scene.imageProcessingConfiguration.applyByPostProcess) {
            defines.markAsMiscDirty();
        }

        if (defines.DITHER !== this.dithering) {
            defines.markAsMiscDirty();
        }

        if (defines.SKY_RAW_HDR_OUTPUT !== this.rawHdrOutput) {
            defines.markAsMiscDirty();
        }

        // Get correct effect
        if (defines.isDirty) {
            defines.markAsProcessed();

            scene.resetCachedMaterial();

            // Fallbacks
            const fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            defines.IMAGEPROCESSINGPOSTPROCESS = scene.imageProcessingConfiguration.applyByPostProcess;
            defines.DITHER = this.dithering;
            defines.SKY_RAW_HDR_OUTPUT = this.rawHdrOutput;

            //Attributes
            const attribs = [VertexBuffer.PositionKind];

            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }

            const shaderName = "sky";

            const uniforms = [
                "world",
                "viewProjection",
                "view",
                "vFogInfos",
                "vFogColor",
                "logarithmicDepthConstant",
                "pointSize",
                "luminance",
                "turbidity",
                "rayleigh",
                "mieCoefficient",
                "mieDirectionalG",
                "sunPosition",
                "cameraPosition",
                "cameraOffset",
                "up",
                "cloudiness",
                "maxColorValue",
            ];
            AddClipPlaneUniforms(uniforms);
            const join = defines.toString();
            subMesh.setEffect(
                scene.getEngine().createEffect(
                    shaderName,
                    <IEffectCreationOptions>{
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: [],
                        samplers: [],
                        defines: join,
                        fallbacks: fallbacks,
                        onCompiled: this.onCompiled,
                        onError: this.onError,
                        shaderLanguage: this._shaderLanguage,
                        extraInitializationsAsync: SkyMaterial._ShaderLoader.getLoadCallback(this._shaderLanguage),
                    },
                    scene.getEngine()
                ),
                defines,
                this._materialContext
            );
        }

        if (!subMesh.effect || !subMesh.effect.isReady()) {
            return false;
        }

        defines._renderId = scene.getRenderId();
        drawWrapper._wasPreviouslyReady = true;

        return true;
    }

    /**
     * Binds the submesh to this material by preparing the effect and shader to draw
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh containing the submesh
     * @param subMesh defines the submesh to bind the material to
     */
    public override bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
        const scene = this.getScene();

        const defines = <SkyMaterialDefines>subMesh.materialDefines;
        if (!defines) {
            return;
        }

        const effect = subMesh.effect;
        if (!effect) {
            return;
        }
        this._activeEffect = effect;

        // Matrices
        this.bindOnlyWorldMatrix(world);
        this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

        if (this._mustRebind(scene, effect, subMesh)) {
            BindClipPlane(effect, this, scene);

            // Point size
            if (this.pointsCloud) {
                this._activeEffect.setFloat("pointSize", this.pointSize);
            }

            // Log. depth
            if (this._useLogarithmicDepth) {
                BindLogDepth(defines, effect, scene);
            }
        }

        // View
        if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
            this._activeEffect.setMatrix("view", scene.getViewMatrix());
        }

        // Fog
        BindFogParameters(scene, mesh, this._activeEffect);

        // Sky
        const camera = scene.activeCamera;
        if (camera) {
            const cameraWorldMatrix = camera.getWorldMatrix();
            this._cameraPosition.x = cameraWorldMatrix.m[12];
            this._cameraPosition.y = cameraWorldMatrix.m[13];
            this._cameraPosition.z = cameraWorldMatrix.m[14];
            this._activeEffect.setVector3("cameraPosition", TmpVectors.Vector3[0].copyFrom(this._cameraPosition).subtractInPlace(scene.floatingOriginOffset));
        }

        this._activeEffect.setVector3("cameraOffset", this.cameraOffset);

        this._activeEffect.setVector3("up", this.up);

        if (this.luminance > 0) {
            this._activeEffect.setFloat("luminance", this.luminance);
        }

        this._activeEffect.setFloat("turbidity", this.turbidity);
        this._activeEffect.setFloat("rayleigh", this.rayleigh);
        this._activeEffect.setFloat("mieCoefficient", this.mieCoefficient);
        this._activeEffect.setFloat("mieDirectionalG", this.mieDirectionalG);
        this._activeEffect.setFloat("cloudiness", this.cloudiness);

        if (this.rawHdrOutput) {
            // Match the clamp ceiling to the render target the sky is drawn into (read at bind time,
            // since the same material may bake into a half-float cube yet also draw to an LDR view).
            const currentRenderTarget = scene.getEngine()._currentRenderTarget;
            this._activeEffect.setFloat("maxColorValue", _MaxColorValueForRenderTarget(currentRenderTarget?.texture?.type));
        }

        if (!this.useSunPosition) {
            const theta = Math.PI * (this.inclination - 0.5);
            const phi = 2 * Math.PI * (this.azimuth - 0.5);

            this.sunPosition.x = this.distance * Math.cos(phi) * Math.cos(theta);
            this.sunPosition.y = this.distance * Math.sin(-theta);
            this.sunPosition.z = this.distance * Math.sin(phi) * Math.cos(theta);

            Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, this.up, this._skyOrientation);
            this.sunPosition.rotateByQuaternionToRef(this._skyOrientation, this.sunPosition);
        }

        this._activeEffect.setVector3("sunPosition", this.sunPosition);

        this._afterBind(mesh, this._activeEffect, subMesh);
    }

    /**
     * Get the list of animatables in the material.
     * @returns the list of animatables object used in the material
     */
    public override getAnimatables(): IAnimatable[] {
        return [];
    }

    /**
     * Disposes the material
     * @param forceDisposeEffect specifies if effects should be forcefully disposed
     */
    public override dispose(forceDisposeEffect?: boolean): void {
        super.dispose(forceDisposeEffect);
    }

    /**
     * Makes a duplicate of the material, and gives it a new name
     * @param name defines the new name for the duplicated material
     * @returns the cloned material
     */
    public override clone(name: string): SkyMaterial {
        return SerializationHelper.Clone<SkyMaterial>(() => new SkyMaterial(name, this.getScene()), this);
    }

    /**
     * Serializes this material in a JSON representation
     * @returns the serialized material object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.customType = "BABYLON.SkyMaterial";
        return serializationObject;
    }

    /**
     * Gets the current class name of the material e.g. "SkyMaterial"
     * Mainly use in serialization.
     * @returns the class name
     */
    public override getClassName(): string {
        return "SkyMaterial";
    }

    /**
     * Creates a sky material from parsed material data
     * @param source defines the JSON representation of the material
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a new sky material
     */
    public static override Parse(source: any, scene: Scene, rootUrl: string): SkyMaterial {
        return SerializationHelper.Parse(() => new SkyMaterial(source.name, scene), source, scene, rootUrl);
    }
}

RegisterClass("BABYLON.SkyMaterial", SkyMaterial);
