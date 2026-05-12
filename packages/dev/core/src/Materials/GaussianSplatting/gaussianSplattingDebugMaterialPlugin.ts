import { type Nullable } from "../../types";
import { type Scene } from "../../scene";
import { type AbstractEngine } from "../../Engines/abstractEngine";
import { type SubMesh } from "../../Meshes/subMesh";
import { type UniformBuffer } from "../uniformBuffer";
import { MaterialDefines } from "../materialDefines";
import { MaterialPluginBase } from "../materialPluginBase";
import { ShaderLanguage } from "../shaderLanguage";
import { RegisterClass } from "../../Misc/typeStore";
import { Vector3 } from "../../Maths/math.vector";
import { type GaussianSplattingMaterial } from "./gaussianSplattingMaterial";

/** @internal */
class GaussianSplattingDebugDefines extends MaterialDefines {
    // Master gate — present when any feature is non-default; absent otherwise
    GS_DBG_ENABLED: boolean = false;
    // Feature flags (0 = off, 1 = on)
    GS_DBG_CLIP: number = 0;
    GS_DBG_CULL_OPACITY: number = 0;
    GS_DBG_CULL_SIZE: number = 0;
    GS_DBG_OPACITY_SCALE: number = 0;
    GS_DBG_OPACITY_SATURATE: number = 0;
    // SH toggles — default 1 (all on); set to 0 to suppress the contribution
    GS_DBG_SH_DC: number = 1;
    GS_DBG_SH_ORDER1: number = 1;
    GS_DBG_SH_ORDER2: number = 1;
    GS_DBG_SH_ORDER3: number = 1;
    GS_DBG_SH_ORDER4: number = 1;
}

/**
 * Debug plugin for GaussianSplattingMaterial.
 * Provides runtime controls for clipping, opacity/size culling, opacity scaling,
 * opacity saturation, and per-SH-order toggling. All features are gated behind
 * the GS_DBG_ENABLED shader define — when every option is at its default value
 * the define is absent and the shader compiles to identical code as without the plugin.
 */
export class GaussianSplattingDebugMaterialPlugin extends MaterialPluginBase {
    private _clippingBox: Nullable<{ min: Vector3; max: Vector3 }> = null;
    private _opacityCulling: Nullable<{ min: number; max: number }> = null;
    private _sizeCulling: Nullable<{ min: number; max: number }> = null;
    private _opacityScale: number = 1.0;
    private _opacitySaturate: boolean = false;
    private _shDC: boolean = true;
    private _shOrder1: boolean = true;
    private _shOrder2: boolean = true;
    private _shOrder3: boolean = true;
    private _shOrder4: boolean = true;

    /**
     * Creates a new GaussianSplattingDebugMaterialPlugin.
     * @param material The GaussianSplattingMaterial to attach the plugin to.
     */
    constructor(material: GaussianSplattingMaterial) {
        super(material, "GaussianSplattingDebug", 200, new GaussianSplattingDebugDefines(), true, true);
    }

    private _isAnyFeatureActive(): boolean {
        return (
            this._clippingBox !== null ||
            this._opacityCulling !== null ||
            this._sizeCulling !== null ||
            this._opacityScale !== 1.0 ||
            this._opacitySaturate ||
            !this._shDC ||
            !this._shOrder1 ||
            !this._shOrder2 ||
            !this._shOrder3 ||
            !this._shOrder4
        );
    }

    private _markDirty(): void {
        this.markAllDefinesAsDirty();
    }

    // ----- Public API -----

    /**
     * World-space axis-aligned clipping box. Splats outside are not rendered.
     * Set to null to disable clipping.
     * Example: `{ min: new Vector3(-2,-2,-2), max: new Vector3(2,2,2) }`
     */
    public get clippingBox(): Nullable<{ min: Vector3; max: Vector3 }> {
        return this._clippingBox;
    }
    public set clippingBox(value: Nullable<{ min: Vector3; max: Vector3 }>) {
        this._clippingBox = value;
        this._markDirty();
    }

    /**
     * Opacity culling range [0..1]. Splats whose stored opacity falls outside this
     * range are not rendered. Set to null to disable.
     */
    public get opacityCulling(): Nullable<{ min: number; max: number }> {
        return this._opacityCulling;
    }
    public set opacityCulling(value: Nullable<{ min: number; max: number }>) {
        this._opacityCulling = value;
        this._markDirty();
    }

    /**
     * Size culling range. Size is pow(|det(Σ)|, 1/6) of the 3D covariance matrix,
     * equal to the geometric mean of the principal radii. Use GaussianSplattingMesh.splatSizeRange
     * to find the asset's range. Set to null to disable.
     */
    public get sizeCulling(): Nullable<{ min: number; max: number }> {
        return this._sizeCulling;
    }
    public set sizeCulling(value: Nullable<{ min: number; max: number }>) {
        this._sizeCulling = value;
        this._markDirty();
    }

    /**
     * Scalar multiplier applied to every splat's opacity after all other modifiers.
     * 1.0 (default) = no change.
     */
    public get opacityScale(): number {
        return this._opacityScale;
    }
    public set opacityScale(value: number) {
        this._opacityScale = value;
        this._markDirty();
    }

    /**
     * When true, replaces the Gaussian spatial falloff with a flat uniform opacity,
     * making each splat appear as a solid disk with its raw alpha value.
     */
    public get opacitySaturate(): boolean {
        return this._opacitySaturate;
    }
    public set opacitySaturate(value: boolean) {
        this._opacitySaturate = value;
        this._markDirty();
    }

    /** Include the DC (base) color from colorsTexture. Default: true. */
    public get shDC(): boolean {
        return this._shDC;
    }
    public set shDC(value: boolean) {
        this._shDC = value;
        this._markDirty();
    }

    /** Include SH band 1 contribution. Default: true. */
    public get shOrder1(): boolean {
        return this._shOrder1;
    }
    public set shOrder1(value: boolean) {
        this._shOrder1 = value;
        this._markDirty();
    }

    /** Include SH band 2 contribution. Default: true. */
    public get shOrder2(): boolean {
        return this._shOrder2;
    }
    public set shOrder2(value: boolean) {
        this._shOrder2 = value;
        this._markDirty();
    }

    /** Include SH band 3 contribution. Default: true. */
    public get shOrder3(): boolean {
        return this._shOrder3;
    }
    public set shOrder3(value: boolean) {
        this._shOrder3 = value;
        this._markDirty();
    }

    /** Include SH band 4 contribution. Default: true. */
    public get shOrder4(): boolean {
        return this._shOrder4;
    }
    public set shOrder4(value: boolean) {
        this._shOrder4 = value;
        this._markDirty();
    }

    // ----- Plugin overrides -----

    /** @returns the class name */
    public override getClassName(): string {
        return "GaussianSplattingDebugMaterialPlugin";
    }

    /** @returns true for GLSL and WGSL */
    public override isCompatible(shaderLanguage: ShaderLanguage): boolean {
        switch (shaderLanguage) {
            case ShaderLanguage.GLSL:
            case ShaderLanguage.WGSL:
                return true;
            default:
                return false;
        }
    }

    /** Always ready — no async resources. */
    public override isReadyForSubMesh(_defines: MaterialDefines, _scene: Scene, _engine: AbstractEngine, _subMesh: SubMesh): boolean {
        return true;
    }

    /**
     * Sets shader defines from current property state. GS_DBG_ENABLED is set to true
     * only when at least one feature is non-default, ensuring zero overhead otherwise.
     * @param defines the defines object
     */
    public override prepareDefines(defines: GaussianSplattingDebugDefines): void {
        defines.GS_DBG_ENABLED = this._isAnyFeatureActive();
        defines.GS_DBG_CLIP = this._clippingBox !== null ? 1 : 0;
        defines.GS_DBG_CULL_OPACITY = this._opacityCulling !== null ? 1 : 0;
        defines.GS_DBG_CULL_SIZE = this._sizeCulling !== null ? 1 : 0;
        defines.GS_DBG_OPACITY_SCALE = this._opacityScale !== 1.0 ? 1 : 0;
        defines.GS_DBG_OPACITY_SATURATE = this._opacitySaturate ? 1 : 0;
        defines.GS_DBG_SH_DC = this._shDC ? 1 : 0;
        defines.GS_DBG_SH_ORDER1 = this._shOrder1 ? 1 : 0;
        defines.GS_DBG_SH_ORDER2 = this._shOrder2 ? 1 : 0;
        defines.GS_DBG_SH_ORDER3 = this._shOrder3 ? 1 : 0;
        defines.GS_DBG_SH_ORDER4 = this._shOrder4 ? 1 : 0;
    }

    /**
     * Returns shader code injections for the debug features.
     * @param shaderType "vertex" or "fragment"
     * @param shaderLanguage GLSL or WGSL
     */
    public override getCustomCode(shaderType: string, shaderLanguage = ShaderLanguage.GLSL): Nullable<{ [pointName: string]: string }> {
        if (shaderLanguage === ShaderLanguage.WGSL) {
            return this._getCustomCodeWGSL(shaderType);
        }
        return this._getCustomCodeGLSL(shaderType);
    }

    private _getCustomCodeGLSL(shaderType: string): Nullable<{ [pointName: string]: string }> {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_DEFINITIONS: `
#if defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SCALE == 1
uniform float dbgOpacityScale;
#endif
`,
                CUSTOM_VERTEX_UPDATE: `
#if defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SCALE == 1
    vColor.w *= dbgOpacityScale;
#endif
`,
            };
        } else if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
#if defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SATURATE == 1
    finalColor.a = vColor.a;
#endif
`,
            };
        }
        return null;
    }

    private _getCustomCodeWGSL(shaderType: string): Nullable<{ [pointName: string]: string }> {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_DEFINITIONS: `
#if defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SCALE == 1
uniform dbgOpacityScale: f32;
#endif
`,
                CUSTOM_VERTEX_UPDATE: `
#if defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SCALE == 1
    vertexOutputs.vColor.w *= uniforms.dbgOpacityScale;
#endif
`,
            };
        } else if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
#if defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SATURATE == 1
    finalColor.a = fragmentInputs.vColor.a;
#endif
`,
            };
        }
        return null;
    }

    /**
     * Declares debug uniforms as external so the Effect can resolve their locations.
     */
    public override getUniforms(): {
        ubo?: Array<{ name: string; size?: number; type?: string; arraySize?: number }>;
        vertex?: string;
        fragment?: string;
        externalUniforms?: string[];
    } {
        return {
            externalUniforms: ["dbgClipMin", "dbgClipMax", "dbgMinOpacity", "dbgMaxOpacity", "dbgMinSize", "dbgMaxSize", "dbgOpacityScale"],
        };
    }

    /**
     * Binds uniform values each frame. Only active features are uploaded.
     * @param _uniformBuffer unused
     * @param _scene unused
     * @param _engine unused
     * @param subMesh the submesh being rendered
     */
    public override bindForSubMesh(_uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, subMesh: SubMesh): void {
        const effect = subMesh.effect;
        if (!effect) {
            return;
        }
        if (this._clippingBox) {
            effect.setVector3("dbgClipMin", this._clippingBox.min);
            effect.setVector3("dbgClipMax", this._clippingBox.max);
        }
        if (this._opacityCulling) {
            effect.setFloat("dbgMinOpacity", this._opacityCulling.min);
            effect.setFloat("dbgMaxOpacity", this._opacityCulling.max);
        }
        if (this._sizeCulling) {
            effect.setFloat("dbgMinSize", this._sizeCulling.min);
            effect.setFloat("dbgMaxSize", this._sizeCulling.max);
        }
        if (this._opacityScale !== 1.0) {
            effect.setFloat("dbgOpacityScale", this._opacityScale);
        }
    }
}

RegisterClass("BABYLON.GaussianSplattingDebugMaterialPlugin", GaussianSplattingDebugMaterialPlugin);
