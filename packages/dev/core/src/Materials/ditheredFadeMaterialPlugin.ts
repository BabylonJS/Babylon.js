import { type AbstractEngine } from "../Engines/abstractEngine.pure";
import { type AbstractMesh } from "../Meshes/abstractMesh.pure";
import { type SubMesh } from "../Meshes/subMesh.pure";
import { type Scene } from "../scene.pure";
import { type Nullable } from "../types";
import { MaterialPluginBase } from "./materialPluginBase.pure";
import { type MaterialDefines } from "./materialDefines";
import { PBRBaseMaterial } from "./PBR/pbrBaseMaterial.pure";
import { ShaderLanguage } from "./shaderLanguage";
import { StandardMaterial } from "./standardMaterial.pure";
import { type UniformBuffer } from "./uniformBuffer";

/**
 * The material families supported by {@link DitheredFadeMaterialPlugin}.
 */
export type DitheredFadeSupportedMaterial = StandardMaterial | PBRBaseMaterial;

/**
 * Defines a normalized interval in the 8x8 Bayer threshold domain.
 */
export interface IDitheredFadeBounds {
    /**
     * The inclusive lower bound.
     */
    lowerBound: number;

    /**
     * The exclusive upper bound.
     */
    upperBound: number;
}

let GlslShaderLoadPromise: Promise<void> | undefined;
let WgslShaderLoadPromise: Promise<void> | undefined;

async function _LoadGlslShaderIncludeAsync(): Promise<void> {
    await import("../Shaders/ShadersInclude/bayerDitherFunctions");
}

async function _LoadWgslShaderIncludeAsync(): Promise<void> {
    await import("../ShadersWGSL/ShadersInclude/bayerDitherFunctions");
}

async function _LoadShaderIncludeAsync(shaderLanguage: ShaderLanguage): Promise<void> {
    if (shaderLanguage === ShaderLanguage.WGSL) {
        WgslShaderLoadPromise ??= _LoadWgslShaderIncludeAsync();
        await WgslShaderLoadPromise;
        return;
    }

    GlslShaderLoadPromise ??= _LoadGlslShaderIncludeAsync();
    await GlslShaderLoadPromise;
}

/**
 * Applies an opaque, screen-space dithered fade independently to meshes that share a Standard or PBR material.
 *
 * The plugin keeps depth writing and the material's alpha mode unchanged. It only affects the material's own
 * color/depth-prepass shader; standalone depth, shadow, and custom shader passes are not modified.
 * @see https://playground.babylonjs.com/#2Z4X94#0
 */
export class DitheredFadeMaterialPlugin extends MaterialPluginBase {
    /**
     * The name used to register the plugin on a material.
     */
    public static readonly Name = "DitheredFade";

    private _meshBounds = new WeakMap<AbstractMesh, IDitheredFadeBounds>();
    private _isEnabled = true;
    private _isDisposed = false;
    private _shaderIncludeReady = false;
    private _shaderIncludeError: unknown;

    /**
     * Gets whether configured fades are applied. Disabling the plugin makes every mesh fully visible without discarding its stored bounds.
     */
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    /**
     * Sets whether configured fades are applied. This uniform-only change does not recompile the material.
     */
    public set isEnabled(value: boolean) {
        this._checkNotDisposed();
        this._isEnabled = value;
    }

    /**
     * Creates and attaches a dithered fade plugin.
     * @param material The Standard or PBR material that the plugin will extend.
     * @throws If the material is unsupported or already has a dithered fade plugin. Use {@link GetOrCreate} when reuse is intended.
     */
    public constructor(material: DitheredFadeSupportedMaterial) {
        super(material, DitheredFadeMaterialPlugin.Name, 190, undefined, DitheredFadeMaterialPlugin._ValidateNewPlugin(material), false, true);

        this.registerForExtraEvents = true;
        this.doNotSerialize = true;
        void this._loadShaderIncludeAsync(material.shaderLanguage);
        this._enable(true);
    }

    /**
     * Gets the plugin already attached to a material, or creates and attaches one.
     * @param material The Standard or PBR material to extend.
     * @returns The material's dithered fade plugin.
     * @throws If the material is unsupported or another plugin uses the reserved plugin name.
     */
    public static GetOrCreate(material: DitheredFadeSupportedMaterial): DitheredFadeMaterialPlugin {
        DitheredFadeMaterialPlugin._ValidateMaterial(material);
        const existing = material.pluginManager?.getPlugin(DitheredFadeMaterialPlugin.Name);
        if (existing) {
            if (!(existing instanceof DitheredFadeMaterialPlugin)) {
                throw new Error(`The material "${material.name}" already has an incompatible plugin named "${DitheredFadeMaterialPlugin.Name}".`);
            }
            return existing;
        }
        return new DitheredFadeMaterialPlugin(material);
    }

    /**
     * Checks whether the plugin supports a shader language.
     * @param shaderLanguage The shader language to check.
     * @returns True for GLSL and WGSL.
     */
    public override isCompatible(shaderLanguage: ShaderLanguage): boolean {
        return shaderLanguage === ShaderLanguage.GLSL || shaderLanguage === ShaderLanguage.WGSL;
    }

    /**
     * Sets both normalized Bayer interval bounds for a mesh.
     * @param mesh The mesh whose draw calls use the bounds.
     * @param lowerBound The inclusive lower bound in the range [0, 1].
     * @param upperBound The exclusive upper bound in the range [0, 1].
     * @remarks Bounds are independent. A lower bound greater than or equal to the upper bound intentionally produces an empty interval.
     */
    public setFadeBounds(mesh: AbstractMesh, lowerBound: number, upperBound: number): void {
        this._checkNotDisposed();
        this._validateBound(lowerBound, "lowerBound");
        this._validateBound(upperBound, "upperBound");

        const bounds = this._meshBounds.get(mesh);
        if (bounds) {
            bounds.lowerBound = lowerBound;
            bounds.upperBound = upperBound;
        } else {
            this._meshBounds.set(mesh, { lowerBound, upperBound });
        }
    }

    /**
     * Sets the normalized inclusive lower Bayer interval bound for a mesh.
     * @param mesh The mesh whose draw calls use the bound.
     * @param lowerBound The inclusive lower bound in the range [0, 1].
     */
    public setFadeLowerBound(mesh: AbstractMesh, lowerBound: number): void {
        this._checkNotDisposed();
        this._validateBound(lowerBound, "lowerBound");

        const bounds = this._meshBounds.get(mesh);
        if (bounds) {
            bounds.lowerBound = lowerBound;
        } else {
            this._meshBounds.set(mesh, { lowerBound, upperBound: 1 });
        }
    }

    /**
     * Sets the normalized exclusive upper Bayer interval bound for a mesh.
     * @param mesh The mesh whose draw calls use the bound.
     * @param upperBound The exclusive upper bound in the range [0, 1].
     */
    public setFadeUpperBound(mesh: AbstractMesh, upperBound: number): void {
        this._checkNotDisposed();
        this._validateBound(upperBound, "upperBound");

        const bounds = this._meshBounds.get(mesh);
        if (bounds) {
            bounds.upperBound = upperBound;
        } else {
            this._meshBounds.set(mesh, { lowerBound: 0, upperBound });
        }
    }

    /**
     * Copies a mesh's current bounds without allocating.
     * @param mesh The mesh whose bounds are queried.
     * @param result The object that receives the bounds.
     * @returns True when the mesh has explicit bounds; otherwise false and the full [0, 1] interval is returned.
     */
    public getFadeBoundsToRef(mesh: AbstractMesh, result: IDitheredFadeBounds): boolean {
        const bounds = this._meshBounds.get(mesh);
        result.lowerBound = bounds?.lowerBound ?? 0;
        result.upperBound = bounds?.upperBound ?? 1;
        return bounds !== undefined;
    }

    /**
     * Removes a mesh's explicit bounds so it uses the fully visible [0, 1] interval.
     * @param mesh The mesh to reset.
     */
    public resetFade(mesh: AbstractMesh): void {
        this._checkNotDisposed();
        this._meshBounds.delete(mesh);
    }

    /**
     * Removes all explicit mesh bounds while keeping the plugin enabled.
     */
    public reset(): void {
        this._checkNotDisposed();
        this._meshBounds = new WeakMap();
    }

    /** @internal */
    public override isReadyForSubMesh(_defines: MaterialDefines, _scene: Scene, _engine: AbstractEngine, _subMesh: SubMesh): boolean {
        if (this._shaderIncludeError) {
            throw this._shaderIncludeError;
        }
        return this._shaderIncludeReady;
    }

    /**
     * Uploads the current mesh's bounds for every draw, including shared and frozen materials.
     * @param _uniformBuffer The material uniform buffer.
     * @param _scene The scene being rendered.
     * @param _engine The engine being used.
     * @param subMesh The submesh being bound.
     */
    public override hardBindForSubMesh(_uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, subMesh: SubMesh): void {
        const effect = subMesh.effect;
        if (!effect) {
            return;
        }

        const bounds = this._meshBounds.get(subMesh.getMesh());
        effect.setFloat3("ditheredFadeSettings", bounds?.lowerBound ?? 0, bounds?.upperBound ?? 1, this._isEnabled ? 1 : 0);
    }

    /**
     * Gets the uniforms used by the plugin.
     * @returns The external uniform names.
     */
    public override getUniforms(): { externalUniforms: string[] } {
        return {
            externalUniforms: ["ditheredFadeSettings"],
        };
    }

    /**
     * Gets the shader code injected by the plugin.
     * @param shaderType The shader stage being customized.
     * @param shaderLanguage The material shader language.
     * @returns Fragment customizations, or null for the vertex stage.
     */
    public override getCustomCode(shaderType: string, shaderLanguage = ShaderLanguage.GLSL): Nullable<{ [pointName: string]: string }> {
        if (shaderType !== "fragment") {
            return null;
        }

        if (shaderLanguage === ShaderLanguage.WGSL) {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: `
#include<bayerDitherFunctions>
uniform ditheredFadeSettings: vec3f;
`,
                CUSTOM_FRAGMENT_MAIN_BEGIN: `
if (uniforms.ditheredFadeSettings.z > 0.5) {
    let ditheredFadeSample = bayerDither8(floor(fragmentInputs.position.xy)) / 64.0;
    if (ditheredFadeSample < uniforms.ditheredFadeSettings.x || ditheredFadeSample >= uniforms.ditheredFadeSettings.y) {
        discard;
    }
}
`,
            };
        }

        return {
            CUSTOM_FRAGMENT_DEFINITIONS: `
#include<bayerDitherFunctions>
uniform vec3 ditheredFadeSettings;
`,
            CUSTOM_FRAGMENT_MAIN_BEGIN: `
if (ditheredFadeSettings.z > 0.5) {
    float ditheredFadeSample = bayerDither8(floor(gl_FragCoord.xy)) / 64.0;
    if (ditheredFadeSample < ditheredFadeSettings.x || ditheredFadeSample >= ditheredFadeSettings.y) {
        discard;
    }
}
`,
        };
    }

    /**
     * Gets the class name.
     * @returns The class name.
     */
    public override getClassName(): string {
        return "DitheredFadeMaterialPlugin";
    }

    /**
     * Releases all weakly held runtime fade state.
     */
    public override dispose(): void {
        this._meshBounds = new WeakMap();
        this._isEnabled = false;
        this._isDisposed = true;
    }

    private static _ValidateNewPlugin(material: DitheredFadeSupportedMaterial): true {
        DitheredFadeMaterialPlugin._ValidateMaterial(material);
        if (material.pluginManager?.getPlugin(DitheredFadeMaterialPlugin.Name)) {
            throw new Error(`The material "${material.name}" already has a plugin named "${DitheredFadeMaterialPlugin.Name}". Use GetOrCreate to reuse it.`);
        }
        return true;
    }

    private static _ValidateMaterial(material: DitheredFadeSupportedMaterial): void {
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRBaseMaterial)) {
            throw new TypeError("DitheredFadeMaterialPlugin supports only StandardMaterial and PBRBaseMaterial-derived materials.");
        }
    }

    private _validateBound(value: number, name: string): void {
        if (!Number.isFinite(value) || value < 0 || value > 1) {
            throw new RangeError(`${name} must be a finite number in the range [0, 1].`);
        }
    }

    private _checkNotDisposed(): void {
        if (this._isDisposed) {
            throw new Error("DitheredFadeMaterialPlugin has been disposed with its material.");
        }
    }

    private async _loadShaderIncludeAsync(shaderLanguage: ShaderLanguage): Promise<void> {
        try {
            await _LoadShaderIncludeAsync(shaderLanguage);
            this._shaderIncludeReady = true;
        } catch (error) {
            this._shaderIncludeError = error;
        }
    }
}
