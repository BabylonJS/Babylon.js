import { type AbstractEngine } from "../Engines/abstractEngine.pure";
import { type AbstractMesh } from "../Meshes/abstractMesh.pure";
import { Mesh } from "../Meshes/mesh.pure";
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
 * The material families supported by {@link DitheredTileFadeMaterialPlugin}.
 */
export type DitheredTileFadeSupportedMaterial = StandardMaterial | PBRBaseMaterial;

/**
 * Defines a normalized interval in the 8x8 Bayer threshold domain.
 */
export interface IDitheredTileFadeBounds {
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
const DepthPrePassInjectionPoint = "!#include<depthPrePass>";

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
 * Applies an opaque, screen-space dithered fade for independently loaded tile LOD meshes that share a Standard or PBR material.
 *
 * The plugin keeps depth writing and the material's alpha mode unchanged. It affects the material color and integrated
 * prepass outputs, but not standalone depth, shadow, picking, outline, or custom passes. Tile renderers using those passes
 * must provide equivalent pass-specific coverage or exclude fading tiles from them.
 *
 * Hardware instances and thin instances are not supported because their batch has only one material bind. Use independently
 * loaded `Mesh` objects for tile LODs.
 *
 * Per-mesh bounds are runtime state. Material cloning and serialization do not copy them; use {@link copyToMaterial} to
 * copy the enabled state to a cloned material and then configure bounds for the cloned tile meshes.
 * @see https://playground.babylonjs.com/#UKLI2N#0
 */
export class DitheredTileFadeMaterialPlugin extends MaterialPluginBase {
    /**
     * The name used to register the plugin on a material.
     */
    public static readonly Name = "DitheredTileFade";

    private _meshBounds = new WeakMap<Mesh, IDitheredTileFadeBounds>();
    private _isEnabled = true;
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
        this._isEnabled = value;
    }

    /**
     * Creates and attaches a dithered fade plugin.
     * @param material The Standard or PBR material that the plugin will extend.
     * @throws If the material is unsupported or already has a dithered tile fade plugin. Use {@link GetOrCreate} when reuse is intended.
     */
    public constructor(material: DitheredTileFadeSupportedMaterial) {
        super(material, DitheredTileFadeMaterialPlugin.Name, 190, undefined, DitheredTileFadeMaterialPlugin._ValidateNewPlugin(material), false, true);

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
    public static GetOrCreate(material: DitheredTileFadeSupportedMaterial): DitheredTileFadeMaterialPlugin {
        DitheredTileFadeMaterialPlugin._ValidateMaterial(material);
        const existing = material.pluginManager?.getPlugin(DitheredTileFadeMaterialPlugin.Name);
        if (existing) {
            if (!(existing instanceof DitheredTileFadeMaterialPlugin)) {
                throw new Error(`The material "${material.name}" already has an incompatible plugin named "${DitheredTileFadeMaterialPlugin.Name}".`);
            }
            return existing;
        }
        return new DitheredTileFadeMaterialPlugin(material);
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
     * @param mesh The non-instanced tile mesh whose draw calls use the bounds.
     * @param lowerBound The inclusive lower bound in the range [0, 1].
     * @param upperBound The exclusive upper bound in the range [0, 1].
     * @remarks Bounds are independent. A lower bound greater than or equal to the upper bound intentionally produces an empty interval.
     */
    public setFadeBounds(mesh: Mesh, lowerBound: number, upperBound: number): void {
        this._validateMesh(mesh);
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
     * @param mesh The non-instanced tile mesh whose draw calls use the bound.
     * @param lowerBound The inclusive lower bound in the range [0, 1].
     */
    public setFadeLowerBound(mesh: Mesh, lowerBound: number): void {
        this._validateMesh(mesh);
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
     * @param mesh The non-instanced tile mesh whose draw calls use the bound.
     * @param upperBound The exclusive upper bound in the range [0, 1].
     */
    public setFadeUpperBound(mesh: Mesh, upperBound: number): void {
        this._validateMesh(mesh);
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
    public getFadeBoundsToRef(mesh: Mesh, result: IDitheredTileFadeBounds): boolean {
        this._validateMesh(mesh);
        const bounds = this._meshBounds.get(mesh);
        result.lowerBound = bounds?.lowerBound ?? 0;
        result.upperBound = bounds?.upperBound ?? 1;
        return bounds !== undefined;
    }

    /**
     * Removes a mesh's explicit bounds so it uses the fully visible [0, 1] interval.
     * @param mesh The mesh to reset.
     */
    public resetFade(mesh: Mesh): void {
        this._validateMesh(mesh);
        this._meshBounds.delete(mesh);
    }

    /**
     * Removes all explicit mesh bounds while keeping the plugin enabled.
     */
    public reset(): void {
        this._meshBounds = new WeakMap();
    }

    /**
     * Copies material-level configuration to another supported material.
     *
     * Per-mesh bounds are intentionally not copied because they belong to the source tile meshes.
     * @param material The destination material, including a material clone.
     * @returns The destination material's dithered tile fade plugin.
     */
    public copyToMaterial(material: DitheredTileFadeSupportedMaterial): DitheredTileFadeMaterialPlugin {
        const plugin = DitheredTileFadeMaterialPlugin.GetOrCreate(material);
        plugin.isEnabled = this._isEnabled;
        return plugin;
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

        const mesh = subMesh.getMesh();
        this._validateMesh(mesh);
        const bounds = this._meshBounds.get(mesh);
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

fn shouldDiscardDitheredTileFragment(position: vec2f, settings: vec3f) -> bool {
    let ditheredFadeSample = bayerDither8(floor(position)) / 64.0;
    return settings.z > 0.5 && (ditheredFadeSample < settings.x || ditheredFadeSample >= settings.y);
}
`,
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
if (shouldDiscardDitheredTileFragment(fragmentInputs.position.xy, uniforms.ditheredFadeSettings)) {
    discard;
}
`,
                [DepthPrePassInjectionPoint]: `
#ifdef DEPTHPREPASS
if (shouldDiscardDitheredTileFragment(fragmentInputs.position.xy, uniforms.ditheredFadeSettings)) {
    discard;
}
#endif
#include<depthPrePass>
`,
            };
        }

        return {
            CUSTOM_FRAGMENT_DEFINITIONS: `
#include<bayerDitherFunctions>
uniform vec3 ditheredFadeSettings;

bool shouldDiscardDitheredTileFragment(vec2 position, vec3 settings) {
    float ditheredFadeSample = bayerDither8(floor(position)) / 64.0;
    return settings.z > 0.5 && (ditheredFadeSample < settings.x || ditheredFadeSample >= settings.y);
}
`,
            CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
if (shouldDiscardDitheredTileFragment(gl_FragCoord.xy, ditheredFadeSettings)) {
    discard;
}
`,
            [DepthPrePassInjectionPoint]: `
#ifdef DEPTHPREPASS
if (shouldDiscardDitheredTileFragment(gl_FragCoord.xy, ditheredFadeSettings)) {
    discard;
}
#endif
#include<depthPrePass>
`,
        };
    }

    /**
     * Gets the class name.
     * @returns The class name.
     */
    public override getClassName(): string {
        return "DitheredTileFadeMaterialPlugin";
    }

    /**
     * Releases all weakly held runtime fade state and disables fading.
     *
     * The plugin remains attached to its material and can be reused through {@link GetOrCreate}.
     */
    public override dispose(): void {
        this._meshBounds = new WeakMap();
        this._isEnabled = false;
    }

    private static _ValidateNewPlugin(material: DitheredTileFadeSupportedMaterial): true {
        DitheredTileFadeMaterialPlugin._ValidateMaterial(material);
        if (material.pluginManager?.getPlugin(DitheredTileFadeMaterialPlugin.Name)) {
            throw new Error(`The material "${material.name}" already has a plugin named "${DitheredTileFadeMaterialPlugin.Name}". Use GetOrCreate to reuse it.`);
        }
        return true;
    }

    private static _ValidateMaterial(material: DitheredTileFadeSupportedMaterial): void {
        if (!(material instanceof StandardMaterial) && !(material instanceof PBRBaseMaterial)) {
            throw new TypeError("DitheredTileFadeMaterialPlugin supports only StandardMaterial and PBRBaseMaterial-derived materials.");
        }
    }

    private _validateMesh(mesh: AbstractMesh): asserts mesh is Mesh {
        if (!(mesh instanceof Mesh) || mesh.hasThinInstances || mesh.instances.length > 0) {
            throw new TypeError("DitheredTileFadeMaterialPlugin supports only non-instanced Mesh objects.");
        }
    }

    private _validateBound(value: number, name: string): void {
        if (!Number.isFinite(value) || value < 0 || value > 1) {
            throw new RangeError(`${name} must be a finite number in the range [0, 1].`);
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
