/** This file must only contain pure code and pure imports */

import { type Nullable } from "../../types";
import { type Scene } from "../../scene";
import { type AbstractEngine } from "../../Engines/abstractEngine";
import { type SubMesh } from "../../Meshes/subMesh";
import { type UniformBuffer } from "../uniformBuffer";
import { MaterialDefines } from "../materialDefines";
import { MaterialPluginBase } from "../materialPluginBase.pure";
import { ShaderLanguage } from "../shaderLanguage";
import { RegisterClass } from "../../Misc/typeStore";
import { type Vector3 } from "../../Maths/math.vector";
import { Logger } from "../../Misc/logger";
import { type GaussianSplattingMaterial, GetGaussianSplattingMaxPartCount } from "./gaussianSplattingMaterial.pure";
import { RawTexture } from "../Textures/rawTexture";
import { Constants } from "../../Engines/constants";

/** @internal */
class GaussianSplattingDebugDefines extends MaterialDefines {
    /** Defines whether any debug feature is active */
    GS_DBG_ENABLED: boolean = false;
    /** Defines whether world-space clipping box is enabled (0: off, 1: on) */
    GS_DBG_CLIP: number = 0;
    /** Defines whether opacity culling is enabled (0: off, 1: on) */
    GS_DBG_CULL_OPACITY: number = 0;
    /** Defines whether size culling is enabled (0: off, 1: on) */
    GS_DBG_CULL_SIZE: number = 0;
    /** Defines whether per-splat opacity scaling is enabled (0: off, 1: on) */
    GS_DBG_OPACITY_SCALE: number = 0;
    /** Defines whether opacity saturation (flat disk) is enabled (0: off, 1: on) */
    GS_DBG_OPACITY_SATURATE: number = 0;
    /** Defines whether the DC (base) SH color is included (0: off, 1: on) */
    GS_DBG_SH_DC: number = 1;
    /** Defines whether SH band 1 contribution is included (0: off, 1: on) */
    GS_DBG_SH_ORDER1: number = 1;
    /** Defines whether SH band 2 contribution is included (0: off, 1: on) */
    GS_DBG_SH_ORDER2: number = 1;
    /** Defines whether SH band 3 contribution is included (0: off, 1: on) */
    GS_DBG_SH_ORDER3: number = 1;
    /** Defines whether SH band 4 contribution is included (0: off, 1: on) */
    GS_DBG_SH_ORDER4: number = 1;
}

/**
 * Per-part debug options for compound Gaussian splat meshes.
 * Each field is optional; unset fields fall back to the global setting on the plugin,
 * and if that is also unset, a neutral value is used (no culling, full SH, etc.).
 */
export interface IGaussianSplattingDebugOptions {
    /** World-space axis-aligned clipping box, or null to disable. */
    clippingBox: Nullable<{ min: Vector3; max: Vector3 }>;
    /** Opacity culling range [0..1], or null to disable. */
    opacityCulling: Nullable<{ min: number; max: number }>;
    /** Size culling range, or null to disable. */
    sizeCulling: Nullable<{ min: number; max: number }>;
    /** Scalar opacity multiplier. 1.0 = no change. */
    opacityScale: number;
    /** When true, replaces Gaussian falloff with flat disk opacity. */
    opacitySaturate: boolean;
    /** Include the DC (base) SH color. */
    shDc: boolean;
    /** Include SH band 1 contribution. */
    shOrder1: boolean;
    /** Include SH band 2 contribution. */
    shOrder2: boolean;
    /** Include SH band 3 contribution. */
    shOrder3: boolean;
    /** Include SH band 4 contribution. */
    shOrder4: boolean;
}

/**
 * Debug plugin for GaussianSplattingMaterial.
 * Provides runtime controls for clipping, opacity/size culling, opacity scaling,
 * opacity saturation, and per-SH-order toggling. All features are gated behind
 * the GS_DBG_ENABLED shader define — when every option is at its default value
 * the define is absent and the shader compiles to identical code as without the plugin.
 *
 * In compound mode (partCount \> 0), per-part overrides can be set via setPartOptions().
 * Global settings act as defaults; per-part settings override them for that part index.
 */
export class GaussianSplattingDebugMaterialPlugin extends MaterialPluginBase {
    private _clippingBox: Nullable<{ min: Vector3; max: Vector3 }> = null;
    private _opacityCulling: Nullable<{ min: number; max: number }> = null;
    private _sizeCulling: Nullable<{ min: number; max: number }> = null;
    private _opacityScale: number = 1.0;
    private _opacitySaturate: boolean = false;
    private _shDc: boolean = true;
    private _shOrder1: boolean = true;
    private _shOrder2: boolean = true;
    private _shOrder3: boolean = true;
    private _shOrder4: boolean = true;

    // Per-part state (only populated when partCount > 0)
    private _partCount: number = 0;
    private _partClippingBoxes: Array<Nullable<{ min: Vector3; max: Vector3 }>> = [];
    private _partOpacityCullings: Array<Nullable<{ min: number; max: number }>> = [];
    private _partSizeCullings: Array<Nullable<{ min: number; max: number }>> = [];
    private _partOpacityScales: Array<Nullable<number>> = [];
    private _partOpacitySaturates: Array<Nullable<boolean>> = [];
    private _partShDcs: Array<Nullable<boolean>> = [];
    private _partShOrder1s: Array<Nullable<boolean>> = [];
    private _partShOrder2s: Array<Nullable<boolean>> = [];
    private _partShOrder3s: Array<Nullable<boolean>> = [];
    private _partShOrder4s: Array<Nullable<boolean>> = [];

    // Per-part debug LUT: MAX_PART_COUNT × 5 RGBA float texture (dbgPartData)
    private _dbgPartDataTexture: Nullable<RawTexture> = null;
    private _textureDirty: boolean = false;
    private _maxPartCount: number = 0;

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
            !this._shDc ||
            !this._shOrder1 ||
            !this._shOrder2 ||
            !this._shOrder3 ||
            !this._shOrder4 ||
            this._partClippingBoxes.some((b) => b !== null) ||
            this._partOpacityCullings.some((b) => b !== null) ||
            this._partSizeCullings.some((b) => b !== null) ||
            this._partOpacityScales.some((s) => s !== null) ||
            this._partOpacitySaturates.some((s) => s !== null) ||
            this._partShDcs.some((s) => s !== null) ||
            this._partShOrder1s.some((s) => s !== null) ||
            this._partShOrder2s.some((s) => s !== null) ||
            this._partShOrder3s.some((s) => s !== null) ||
            this._partShOrder4s.some((s) => s !== null)
        );
    }

    private _markDirty(): void {
        this.markAllDefinesAsDirty();
        this._textureDirty = true;
    }

    // ----- Public API -----

    /**
     * Number of parts in compound mode. Set automatically by GaussianSplattingDebugger.addMesh().
     * When 0 (non-compound), setPartOptions() logs an error.
     * @returns the part count
     */
    public get partCount(): number {
        return this._partCount;
    }
    public set partCount(count: number) {
        if (this._partCount !== count) {
            this._partCount = count;
            this._markDirty();
        }
    }

    /**
     * Sets per-part debug overrides for the given part index.
     * Only valid on compound meshes (partCount \> 0); logs an error otherwise.
     * @param partIndex The zero-based part index.
     * @param options Partial set of debug options to override for this part.
     */
    public setPartOptions(partIndex: number, options: Partial<IGaussianSplattingDebugOptions>): void {
        if (this._partCount === 0) {
            Logger.Error("GaussianSplattingDebugMaterialPlugin.setPartOptions: called on a non-compound mesh. partCount is 0.");
            return;
        }
        if (options.clippingBox !== undefined) {
            this._partClippingBoxes[partIndex] = options.clippingBox;
        }
        if (options.opacityCulling !== undefined) {
            this._partOpacityCullings[partIndex] = options.opacityCulling;
        }
        if (options.sizeCulling !== undefined) {
            this._partSizeCullings[partIndex] = options.sizeCulling;
        }
        if (options.opacityScale !== undefined) {
            this._partOpacityScales[partIndex] = options.opacityScale;
        }
        if (options.opacitySaturate !== undefined) {
            this._partOpacitySaturates[partIndex] = options.opacitySaturate;
        }
        if (options.shDc !== undefined) {
            this._partShDcs[partIndex] = options.shDc;
        }
        if (options.shOrder1 !== undefined) {
            this._partShOrder1s[partIndex] = options.shOrder1;
        }
        if (options.shOrder2 !== undefined) {
            this._partShOrder2s[partIndex] = options.shOrder2;
        }
        if (options.shOrder3 !== undefined) {
            this._partShOrder3s[partIndex] = options.shOrder3;
        }
        if (options.shOrder4 !== undefined) {
            this._partShOrder4s[partIndex] = options.shOrder4;
        }
        this._markDirty();
    }

    /**
     * Clears all per-part debug overrides for the given part index,
     * falling back to global settings.
     * @param partIndex The zero-based part index.
     */
    public clearPartOptions(partIndex: number): void {
        this._partClippingBoxes[partIndex] = null;
        this._partOpacityCullings[partIndex] = null;
        this._partSizeCullings[partIndex] = null;
        this._partOpacityScales[partIndex] = null;
        this._partOpacitySaturates[partIndex] = null;
        this._partShDcs[partIndex] = null;
        this._partShOrder1s[partIndex] = null;
        this._partShOrder2s[partIndex] = null;
        this._partShOrder3s[partIndex] = null;
        this._partShOrder4s[partIndex] = null;
        this._markDirty();
    }

    /**
     * Removes the per-part override slot at `removedIndex` and shifts all higher-indexed
     * slots down by one, keeping the arrays aligned with the compound mesh's new part layout.
     * Called automatically by GaussianSplattingDebugger when a part is removed.
     * @param removedIndex The original (pre-removal) part index that was removed.
     */
    public shiftPartOptions(removedIndex: number): void {
        const arrays = [
            this._partClippingBoxes,
            this._partOpacityCullings,
            this._partSizeCullings,
            this._partOpacityScales,
            this._partOpacitySaturates,
            this._partShDcs,
            this._partShOrder1s,
            this._partShOrder2s,
            this._partShOrder3s,
            this._partShOrder4s,
        ];
        for (const arr of arrays) {
            if (removedIndex < arr.length) {
                arr.splice(removedIndex, 1);
            }
        }
        this._markDirty();
    }

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
     * equal to the geometric mean of the principal radii. Use GaussianSplattingMeshBase.splatSizeRange
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
    public get shDc(): boolean {
        return this._shDc;
    }
    public set shDc(value: boolean) {
        this._shDc = value;
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

    /**
     * Adds the per-part debug data texture name to the sampler list so the effect can bind it.
     * @param samplers the sampler list to populate
     */
    public override getSamplers(samplers: string[]): void {
        samplers.push("dbgPartData");
    }

    /** @returns the class name of this plugin */
    public override getClassName(): string {
        return "GaussianSplattingDebugMaterialPlugin";
    }

    /**
     * @param shaderLanguage the shader language to check
     * @returns true for GLSL and WGSL
     */
    public override isCompatible(shaderLanguage: ShaderLanguage): boolean {
        switch (shaderLanguage) {
            case ShaderLanguage.GLSL:
            case ShaderLanguage.WGSL:
                return true;
            default:
                return false;
        }
    }

    /**
     * Always ready — no async resources.
     * @param _defines unused
     * @param _scene unused
     * @param _engine unused
     * @param _subMesh unused
     * @returns true
     */
    public override isReadyForSubMesh(_defines: MaterialDefines, _scene: Scene, _engine: AbstractEngine, _subMesh: SubMesh): boolean {
        return true;
    }

    /**
     * Sets shader defines from current property state. GS_DBG_ENABLED is set to true
     * only when at least one feature is non-default, ensuring zero overhead otherwise.
     * Sub-flags also check per-part arrays so compound-only overrides activate the correct
     * code paths even when the global setting is at its default.
     * @param defines the defines object
     */
    public override prepareDefines(defines: GaussianSplattingDebugDefines): void {
        defines.GS_DBG_ENABLED = this._isAnyFeatureActive();
        defines.GS_DBG_CLIP = this._clippingBox !== null || this._partClippingBoxes.some((b) => b !== null) ? 1 : 0;
        defines.GS_DBG_CULL_OPACITY = this._opacityCulling !== null || this._partOpacityCullings.some((b) => b !== null) ? 1 : 0;
        defines.GS_DBG_CULL_SIZE = this._sizeCulling !== null || this._partSizeCullings.some((b) => b !== null) ? 1 : 0;
        defines.GS_DBG_OPACITY_SCALE = this._opacityScale !== 1.0 || this._partOpacityScales.some((s) => s !== null) ? 1 : 0;
        defines.GS_DBG_OPACITY_SATURATE = this._opacitySaturate || this._partOpacitySaturates.some((s) => s !== null) ? 1 : 0;
        defines.GS_DBG_SH_DC = !this._shDc || this._partShDcs.some((s) => s !== null) ? 0 : 1;
        defines.GS_DBG_SH_ORDER1 = !this._shOrder1 || this._partShOrder1s.some((s) => s !== null) ? 0 : 1;
        defines.GS_DBG_SH_ORDER2 = !this._shOrder2 || this._partShOrder2s.some((s) => s !== null) ? 0 : 1;
        defines.GS_DBG_SH_ORDER3 = !this._shOrder3 || this._partShOrder3s.some((s) => s !== null) ? 0 : 1;
        defines.GS_DBG_SH_ORDER4 = !this._shOrder4 || this._partShOrder4s.some((s) => s !== null) ? 0 : 1;
    }

    /**
     * Returns shader code injections for the debug features.
     * @param shaderType "vertex" or "fragment"
     * @param shaderLanguage GLSL or WGSL
     * @returns map of injection-point name to injected code, or null
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
#if defined(GS_DBG_ENABLED) && GS_DBG_CLIP == 1 && !defined(IS_COMPOUND)
uniform vec3 dbgClipMin;
uniform vec3 dbgClipMax;
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_CULL_OPACITY == 1 && !defined(IS_COMPOUND)
uniform float dbgMinOpacity;
uniform float dbgMaxOpacity;
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_CULL_SIZE == 1 && !defined(IS_COMPOUND)
uniform float dbgMinSize;
uniform float dbgMaxSize;
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SCALE == 1 && !defined(IS_COMPOUND)
uniform float dbgOpacityScale;
#endif
#if defined(GS_DBG_ENABLED) && IS_COMPOUND
uniform sampler2D dbgPartData;
varying float vPartIndex;
#endif
`,
                CUSTOM_VERTEX_UPDATE: `
#if defined(GS_DBG_ENABLED) && GS_DBG_CLIP == 1 && !defined(IS_COMPOUND)
    if (worldPos.x < dbgClipMin.x || worldPos.x > dbgClipMax.x ||
        worldPos.y < dbgClipMin.y || worldPos.y > dbgClipMax.y ||
        worldPos.z < dbgClipMin.z || worldPos.z > dbgClipMax.z) {
        scale = vec2(0.0);
    }
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_CULL_OPACITY == 1 && !defined(IS_COMPOUND)
    if (splat.color.w < dbgMinOpacity || splat.color.w > dbgMaxOpacity) {
        scale = vec2(0.0);
    }
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_CULL_SIZE == 1 && !defined(IS_COMPOUND)
    {
        float _d0 = splat.covA.x; float _d1 = splat.covA.y; float _d2 = splat.covA.z;
        float _d3 = splat.covA.w; float _d4 = splat.covB.x; float _d5 = splat.covB.y;
        float _det = _d0*(_d3*_d5 - _d4*_d4) - _d1*(_d1*_d5 - _d4*_d2) + _d2*(_d1*_d4 - _d3*_d2);
        float _sz = pow(abs(_det), 1.0/6.0);
        if (_sz < dbgMinSize || _sz > dbgMaxSize) {
            scale = vec2(0.0);
        }
    }
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SCALE == 1 && !defined(IS_COMPOUND)
    vColor.w *= dbgOpacityScale;
#endif
#if defined(GS_DBG_ENABLED) && IS_COMPOUND
    {
        int _pIdx = int(splat.partIndex);
        vPartIndex = float(splat.partIndex);
        vec4 _row0 = texelFetch(dbgPartData, ivec2(_pIdx, 0), 0);
        vec4 _row1 = texelFetch(dbgPartData, ivec2(_pIdx, 1), 0);
        vec4 _row2 = texelFetch(dbgPartData, ivec2(_pIdx, 2), 0);
        vec3 _clipMin = _row0.xyz;
        vec3 _clipMax = vec3(_row0.w, _row1.xy);
        float _minOp = _row1.z;
        float _maxOp = _row1.w;
        float _minSz = _row2.x;
        float _maxSz = _row2.y;
        float _opSc  = _row2.z;
        #if GS_DBG_CLIP == 1
        if (worldPos.x < _clipMin.x || worldPos.x > _clipMax.x ||
            worldPos.y < _clipMin.y || worldPos.y > _clipMax.y ||
            worldPos.z < _clipMin.z || worldPos.z > _clipMax.z) {
            scale = vec2(0.0);
        }
        #endif
        #if GS_DBG_CULL_OPACITY == 1
        if (splat.color.w < _minOp || splat.color.w > _maxOp) {
            scale = vec2(0.0);
        }
        #endif
        #if GS_DBG_CULL_SIZE == 1
        {
            float _d0 = splat.covA.x; float _d1 = splat.covA.y; float _d2 = splat.covA.z;
            float _d3 = splat.covA.w; float _d4 = splat.covB.x; float _d5 = splat.covB.y;
            float _det = _d0*(_d3*_d5 - _d4*_d4) - _d1*(_d1*_d5 - _d4*_d2) + _d2*(_d1*_d4 - _d3*_d2);
            float _sz = pow(abs(_det), 1.0/6.0);
            if (_sz < _minSz || _sz > _maxSz) {
                scale = vec2(0.0);
            }
        }
        #endif
        #if GS_DBG_OPACITY_SCALE == 1
        vColor.w *= _opSc;
        #endif
    }
#endif
`,
            };
        } else if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: `
#if defined(GS_DBG_ENABLED) && IS_COMPOUND
uniform sampler2D dbgPartData;
varying float vPartIndex;
#endif
`,
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
#if defined(GS_DBG_ENABLED) && IS_COMPOUND
    if (texelFetch(dbgPartData, ivec2(int(vPartIndex + 0.5), 2), 0).w > 0.5) { finalColor.a = vColor.a; }
#elif defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SATURATE == 1
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
#if defined(GS_DBG_ENABLED) && GS_DBG_CLIP == 1 && !defined(IS_COMPOUND)
uniform dbgClipMin: vec3f;
uniform dbgClipMax: vec3f;
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_CULL_OPACITY == 1 && !defined(IS_COMPOUND)
uniform dbgMinOpacity: f32;
uniform dbgMaxOpacity: f32;
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_CULL_SIZE == 1 && !defined(IS_COMPOUND)
uniform dbgMinSize: f32;
uniform dbgMaxSize: f32;
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SCALE == 1 && !defined(IS_COMPOUND)
uniform dbgOpacityScale: f32;
#endif
#if defined(GS_DBG_ENABLED) && IS_COMPOUND
var dbgPartData: texture_2d<f32>;
varying vPartIndex: f32;
#endif
`,
                CUSTOM_VERTEX_UPDATE: `
#if defined(GS_DBG_ENABLED) && GS_DBG_CLIP == 1 && !defined(IS_COMPOUND)
    if (worldPos.x < uniforms.dbgClipMin.x || worldPos.x > uniforms.dbgClipMax.x ||
        worldPos.y < uniforms.dbgClipMin.y || worldPos.y > uniforms.dbgClipMax.y ||
        worldPos.z < uniforms.dbgClipMin.z || worldPos.z > uniforms.dbgClipMax.z) {
        scale = vec2f(0.0);
    }
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_CULL_OPACITY == 1 && !defined(IS_COMPOUND)
    if (splat.color.w < uniforms.dbgMinOpacity || splat.color.w > uniforms.dbgMaxOpacity) {
        scale = vec2f(0.0);
    }
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_CULL_SIZE == 1 && !defined(IS_COMPOUND)
    {
        let _d0 = splat.covA.x; let _d1 = splat.covA.y; let _d2 = splat.covA.z;
        let _d3 = splat.covA.w; let _d4 = splat.covB.x; let _d5 = splat.covB.y;
        let _det = _d0*(_d3*_d5 - _d4*_d4) - _d1*(_d1*_d5 - _d4*_d2) + _d2*(_d1*_d4 - _d3*_d2);
        let _sz = pow(abs(_det), 1.0/6.0);
        if (_sz < uniforms.dbgMinSize || _sz > uniforms.dbgMaxSize) {
            scale = vec2f(0.0);
        }
    }
#endif
#if defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SCALE == 1 && !defined(IS_COMPOUND)
    vertexOutputs.vColor.w *= uniforms.dbgOpacityScale;
#endif
#if defined(GS_DBG_ENABLED) && IS_COMPOUND
    {
        let _pIdx = i32(splat.partIndex);
        vertexOutputs.vPartIndex = f32(splat.partIndex);
        let _row0 = textureLoad(dbgPartData, vec2i(_pIdx, 0), 0);
        let _row1 = textureLoad(dbgPartData, vec2i(_pIdx, 1), 0);
        let _row2 = textureLoad(dbgPartData, vec2i(_pIdx, 2), 0);
        let _clipMin = _row0.xyz;
        let _clipMax = vec3f(_row0.w, _row1.xy);
        let _minOp = _row1.z;
        let _maxOp = _row1.w;
        let _minSz = _row2.x;
        let _maxSz = _row2.y;
        let _opSc  = _row2.z;
        #if GS_DBG_CLIP == 1
        if (worldPos.x < _clipMin.x || worldPos.x > _clipMax.x ||
            worldPos.y < _clipMin.y || worldPos.y > _clipMax.y ||
            worldPos.z < _clipMin.z || worldPos.z > _clipMax.z) {
            scale = vec2f(0.0);
        }
        #endif
        #if GS_DBG_CULL_OPACITY == 1
        if (splat.color.w < _minOp || splat.color.w > _maxOp) {
            scale = vec2f(0.0);
        }
        #endif
        #if GS_DBG_CULL_SIZE == 1
        {
            let _d0 = splat.covA.x; let _d1 = splat.covA.y; let _d2 = splat.covA.z;
            let _d3 = splat.covA.w; let _d4 = splat.covB.x; let _d5 = splat.covB.y;
            let _det = _d0*(_d3*_d5 - _d4*_d4) - _d1*(_d1*_d5 - _d4*_d2) + _d2*(_d1*_d4 - _d3*_d2);
            let _sz = pow(abs(_det), 1.0/6.0);
            if (_sz < _minSz || _sz > _maxSz) {
                scale = vec2f(0.0);
            }
        }
        #endif
        #if GS_DBG_OPACITY_SCALE == 1
        vertexOutputs.vColor.w *= _opSc;
        #endif
    }
#endif
`,
            };
        } else if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: `
#if defined(GS_DBG_ENABLED) && IS_COMPOUND
var dbgPartData: texture_2d<f32>;
varying vPartIndex: f32;
#endif
`,
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
#if defined(GS_DBG_ENABLED) && IS_COMPOUND
    if (textureLoad(dbgPartData, vec2i(i32(fragmentInputs.vPartIndex + 0.5), 2), 0).w > 0.5) {
        let _gsdbgA: f32 = -dot(fragmentInputs.vPosition, fragmentInputs.vPosition);
        if (_gsdbgA > -4.0) { finalColor.a = fragmentInputs.vColor.a; }
    }
#elif defined(GS_DBG_ENABLED) && GS_DBG_OPACITY_SATURATE == 1
    {
        let _gsdbgA: f32 = -dot(fragmentInputs.vPosition, fragmentInputs.vPosition);
        if (_gsdbgA > -4.0) {
            finalColor.a = fragmentInputs.vColor.a;
        }
    }
#endif
`,
            };
        }
        return null;
    }

    /**
     * Declares the non-compound scalar debug uniform names as external so the Effect can
     * resolve their locations. WGSL uniforms are declared inline in getCustomCode() injections.
     * @returns uniform descriptor with externalUniforms list
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

    private _buildTextureData(partCount: number): Float32Array {
        const maxPartCount = this._maxPartCount;
        const data = new Float32Array(maxPartCount * 5 * 4);
        for (let i = 0; i < maxPartCount; i++) {
            const r0 = i * 4;
            const r1 = (maxPartCount + i) * 4;
            const r2 = (maxPartCount * 2 + i) * 4;
            const r3 = (maxPartCount * 3 + i) * 4;
            const r4 = (maxPartCount * 4 + i) * 4;

            // Row 0: clipMin.xyz, clipMax.x  — Row 1: clipMax.yz, minOpacity, maxOpacity
            const box = i < partCount ? (this._partClippingBoxes[i] ?? this._clippingBox) : this._clippingBox;
            if (box) {
                data[r0] = box.min.x;
                data[r0 + 1] = box.min.y;
                data[r0 + 2] = box.min.z;
                data[r0 + 3] = box.max.x;
                data[r1] = box.max.y;
                data[r1 + 1] = box.max.z;
            } else {
                data[r0] = -1e9;
                data[r0 + 1] = -1e9;
                data[r0 + 2] = -1e9;
                data[r0 + 3] = 1e9;
                data[r1] = 1e9;
                data[r1 + 1] = 1e9;
            }
            const opCull = i < partCount ? (this._partOpacityCullings[i] ?? this._opacityCulling) : this._opacityCulling;
            data[r1 + 2] = opCull ? opCull.min : 0.0;
            data[r1 + 3] = opCull ? opCull.max : 1.0;

            // Row 2: minSize, maxSize, opacityScale, opacitySaturate
            const szCull = i < partCount ? (this._partSizeCullings[i] ?? this._sizeCulling) : this._sizeCulling;
            data[r2] = szCull ? szCull.min : 0.0;
            data[r2 + 1] = szCull ? szCull.max : 1e9;
            data[r2 + 2] = i < partCount ? (this._partOpacityScales[i] ?? this._opacityScale) : this._opacityScale;
            const sat = i < partCount ? (this._partOpacitySaturates[i] ?? this._opacitySaturate) : this._opacitySaturate;
            data[r2 + 3] = sat ? 1.0 : 0.0;

            // Row 3: shDc, shOrder1, shOrder2, shOrder3
            data[r3] = (i < partCount ? (this._partShDcs[i] ?? this._shDc) : this._shDc) ? 1.0 : 0.0;
            data[r3 + 1] = (i < partCount ? (this._partShOrder1s[i] ?? this._shOrder1) : this._shOrder1) ? 1.0 : 0.0;
            data[r3 + 2] = (i < partCount ? (this._partShOrder2s[i] ?? this._shOrder2) : this._shOrder2) ? 1.0 : 0.0;
            data[r3 + 3] = (i < partCount ? (this._partShOrder3s[i] ?? this._shOrder3) : this._shOrder3) ? 1.0 : 0.0;

            // Row 4: shOrder4, padding
            data[r4] = (i < partCount ? (this._partShOrder4s[i] ?? this._shOrder4) : this._shOrder4) ? 1.0 : 0.0;
        }
        return data;
    }

    private _updateOrCreateTexture(scene: Scene): void {
        if (!this._maxPartCount) {
            this._maxPartCount = GetGaussianSplattingMaxPartCount(scene.getEngine());
        }
        const data = this._buildTextureData(this._partCount);
        if (!this._dbgPartDataTexture) {
            this._dbgPartDataTexture = RawTexture.CreateRGBATexture(
                data,
                this._maxPartCount,
                5,
                scene,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                Constants.TEXTURETYPE_FLOAT
            );
        } else {
            this._dbgPartDataTexture.update(data);
        }
        this._textureDirty = false;
    }

    /**
     * Binds uniform values each frame. Scalar uniforms are uploaded for non-compound mode;
     * the per-part data texture is updated and bound for compound mode.
     * @param _uniformBuffer unused
     * @param _scene the current scene
     * @param _engine unused
     * @param subMesh the submesh being rendered
     */
    public override bindForSubMesh(_uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, subMesh: SubMesh): void {
        const effect = subMesh.effect;
        if (!effect) {
            return;
        }

        if (this._partCount > 0 && this._isAnyFeatureActive()) {
            // Compound mode: pack per-part data into a texture (only when the debug path is active)
            if (this._textureDirty || !this._dbgPartDataTexture) {
                this._updateOrCreateTexture(_scene);
            }
            if (this._dbgPartDataTexture) {
                effect.setTexture("dbgPartData", this._dbgPartDataTexture);
            }
        } else if (this._partCount === 0) {
            // Non-compound: upload scalar uniforms
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

    /**
     * Disposes the per-part data texture.
     * @param _forceDisposeTextures unused; the LUT texture is always disposed as it is owned by this plugin
     */
    public override dispose(_forceDisposeTextures?: boolean): void {
        this._dbgPartDataTexture?.dispose();
        this._dbgPartDataTexture = null;
    }
}

let _Registered = false;
/**
 * Register side effects for GaussianSplattingDebugMaterialPlugin.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterGaussianSplattingDebugMaterialPlugin(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.GaussianSplattingDebugMaterialPlugin", GaussianSplattingDebugMaterialPlugin);
}
