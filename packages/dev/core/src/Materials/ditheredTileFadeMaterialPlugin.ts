import { type AbstractEngine } from "../Engines/abstractEngine.pure";
import { type AbstractMesh } from "../Meshes/abstractMesh.pure";
import { InstancedMesh, RegisterInstancedMesh } from "../Meshes/instancedMesh.pure";
import { Mesh } from "../Meshes/mesh.pure";
import { type SubMesh } from "../Meshes/subMesh.pure";
import { RegisterThinInstanceMesh } from "../Meshes/thinInstanceMesh.pure";
import { type Scene } from "../scene.pure";
import { type Nullable } from "../types";
import { Vector4 } from "../Maths/math.vector.pure";
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
 * The mesh types that can store independent dithered tile fade bounds.
 */
export type DitheredTileFadeMesh = Mesh | InstancedMesh;

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
 * Applies an opaque, screen-space dithered fade for tile LOD meshes that share a Standard or PBR material.
 *
 * The plugin keeps depth writing and the material's alpha mode unchanged. It affects the material color and integrated
 * prepass outputs, but not standalone depth, shadow, picking, outline, or custom passes. Tile renderers using those passes
 * must provide equivalent pass-specific coverage or exclude fading tiles from them.
 *
 * Per-mesh bounds are runtime state. Material cloning and serialization do not copy them; use {@link copyToMaterial} to
 * copy the enabled state to a cloned material and then configure bounds for the cloned tile meshes.
 * @see https://playground.babylonjs.com/#HI17VI#0
 */
export class DitheredTileFadeMaterialPlugin extends MaterialPluginBase {
    /**
     * The name used to register the plugin on a material.
     */
    public static readonly Name = "DitheredTileFade";

    private _meshBounds = new WeakMap<AbstractMesh, IDitheredTileFadeBounds>();
    private _instancedBufferSources = new WeakSet<Mesh>();
    private _thinInstanceFadeBuffers = new WeakMap<Mesh, Float32Array>();
    private _generation = 1;
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
     * @param mesh The tile mesh or hardware instance whose draw calls use the bounds.
     * @param lowerBound The inclusive lower bound in the range [0, 1].
     * @param upperBound The exclusive upper bound in the range [0, 1].
     * @remarks Bounds are independent. A lower bound greater than or equal to the upper bound intentionally produces an empty interval.
     */
    public setFadeBounds(mesh: DitheredTileFadeMesh, lowerBound: number, upperBound: number): void {
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

        this._updateInstancedFadeBounds(mesh, lowerBound, upperBound, true);
    }

    /**
     * Sets the normalized inclusive lower Bayer interval bound for a mesh.
     * @param mesh The tile mesh or hardware instance whose draw calls use the bound.
     * @param lowerBound The inclusive lower bound in the range [0, 1].
     */
    public setFadeLowerBound(mesh: DitheredTileFadeMesh, lowerBound: number): void {
        this.setFadeBounds(mesh, lowerBound, this._meshBounds.get(mesh)?.upperBound ?? 1);
    }

    /**
     * Sets the normalized exclusive upper Bayer interval bound for a mesh.
     * @param mesh The tile mesh or hardware instance whose draw calls use the bound.
     * @param upperBound The exclusive upper bound in the range [0, 1].
     */
    public setFadeUpperBound(mesh: DitheredTileFadeMesh, upperBound: number): void {
        this.setFadeBounds(mesh, this._meshBounds.get(mesh)?.lowerBound ?? 0, upperBound);
    }

    /**
     * Copies a mesh's current bounds without allocating.
     * @param mesh The mesh whose bounds are queried.
     * @param result The object that receives the bounds.
     * @returns True when the mesh has explicit bounds. Otherwise false is returned with the source mesh's bounds for a hardware instance, or [0, 1].
     */
    public getFadeBoundsToRef(mesh: DitheredTileFadeMesh, result: IDitheredTileFadeBounds): boolean {
        this._validateMesh(mesh);
        const explicitBounds = this._meshBounds.get(mesh);
        const bounds = explicitBounds ?? (mesh instanceof InstancedMesh ? this._meshBounds.get(mesh.sourceMesh) : undefined);
        result.lowerBound = bounds?.lowerBound ?? 0;
        result.upperBound = bounds?.upperBound ?? 1;
        return explicitBounds !== undefined;
    }

    /**
     * Removes a mesh's explicit bounds. A hardware instance inherits its source mesh's bounds; a source mesh uses [0, 1].
     * @param mesh The mesh to reset.
     */
    public resetFade(mesh: DitheredTileFadeMesh): void {
        this._validateMesh(mesh);
        this._meshBounds.delete(mesh);
        this._updateInstancedFadeBounds(mesh, 0, 1, false);
    }

    /**
     * Sets normalized Bayer interval bounds for one thin instance.
     * @param mesh The source mesh containing the thin instance.
     * @param index The thin instance index.
     * @param lowerBound The inclusive lower bound in the range [0, 1].
     * @param upperBound The exclusive upper bound in the range [0, 1].
     * @param refresh Whether to immediately upload the updated attribute buffer.
     */
    public setThinInstanceFadeBounds(mesh: Mesh, index: number, lowerBound: number, upperBound: number, refresh = true): void {
        this._validateBound(lowerBound, "lowerBound");
        this._validateBound(upperBound, "upperBound");
        this._validateThinInstanceIndex(mesh, index);
        const buffer = this._ensureThinInstanceBuffer(mesh);
        const offset = index * 4;
        buffer[offset] = lowerBound;
        buffer[offset + 1] = upperBound;
        buffer[offset + 2] = 1;
        buffer[offset + 3] = this._generation;
        if (refresh) {
            this.commitThinInstanceFadeBounds(mesh);
        }
    }

    /**
     * Sets normalized Bayer interval bounds for all thin instances from packed lower/upper pairs.
     * @param mesh The source mesh containing the thin instances.
     * @param bounds Packed lower/upper pairs, with two values per thin instance.
     */
    public setThinInstanceFadeBoundsBuffer(mesh: Mesh, bounds: Float32Array): void {
        RegisterThinInstanceMesh();
        const instanceCount = mesh.thinInstanceCount;
        if (bounds.length !== instanceCount * 2) {
            throw new RangeError(`bounds must contain exactly ${instanceCount * 2} values.`);
        }

        for (let index = 0; index < instanceCount; index++) {
            const lowerBound = bounds[index * 2];
            const upperBound = bounds[index * 2 + 1];
            this._validateBound(lowerBound, `bounds[${index * 2}]`);
            this._validateBound(upperBound, `bounds[${index * 2 + 1}]`);
        }

        const attributeData = this._ensureThinInstanceBuffer(mesh);
        for (let index = 0; index < instanceCount; index++) {
            const attributeOffset = index * 4;
            attributeData[attributeOffset] = bounds[index * 2];
            attributeData[attributeOffset + 1] = bounds[index * 2 + 1];
            attributeData[attributeOffset + 2] = 1;
            attributeData[attributeOffset + 3] = this._generation;
        }

        this.commitThinInstanceFadeBounds(mesh);
    }

    /**
     * Uploads thin-instance fade changes after one or more setters used `refresh = false`.
     * @param mesh The source mesh whose fade attribute buffer changed.
     */
    public commitThinInstanceFadeBounds(mesh: Mesh): void {
        if (!this._thinInstanceFadeBuffers.has(mesh)) {
            throw new Error("No thin-instance fade buffer has been created for this mesh.");
        }
        mesh.thinInstanceBufferUpdated(this._getInstanceAttributeName());
    }

    /**
     * Removes one thin instance's explicit bounds so it inherits the source mesh's bounds.
     * @param mesh The source mesh containing the thin instance.
     * @param index The thin instance index.
     * @param refresh Whether to immediately upload the updated attribute buffer.
     */
    public resetThinInstanceFade(mesh: Mesh, index: number, refresh = true): void {
        this._validateThinInstanceIndex(mesh, index);
        const buffer = this._ensureThinInstanceBuffer(mesh);
        const offset = index * 4;
        buffer[offset] = 0;
        buffer[offset + 1] = 1;
        buffer[offset + 2] = 0;
        buffer[offset + 3] = this._generation;
        if (refresh) {
            this.commitThinInstanceFadeBounds(mesh);
        }
    }

    /**
     * Removes all explicit mesh bounds while keeping the plugin enabled.
     */
    public reset(): void {
        this._meshBounds = new WeakMap();
        this._generation++;
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
        const bounds = this._meshBounds.get(mesh);
        effect.setFloat4("ditheredFadeSettings", bounds?.lowerBound ?? 0, bounds?.upperBound ?? 1, this._isEnabled ? 1 : 0, this._generation);
    }

    /**
     * Registers the per-instance fade attribute when a mesh is rendered as a hardware or thin instance batch.
     * @param attributes The attributes used to compile the material.
     * @param _scene The scene containing the mesh.
     * @param mesh The mesh being compiled.
     */
    public override getAttributes(attributes: string[], _scene: Scene, mesh: AbstractMesh): void {
        const source = mesh instanceof InstancedMesh ? mesh.sourceMesh : mesh;
        if (!(source instanceof Mesh)) {
            return;
        }

        if (source.instances.length > 0) {
            this._ensureInstancedBuffer(source);
        }
        if (source.hasThinInstances) {
            this._ensureThinInstanceBuffer(source);
        }
        if (source.instances.length > 0 || source.hasThinInstances) {
            attributes.push(this._getInstanceAttributeName());
        }
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
            const instanceAttributeName = this._getInstanceAttributeName();
            if (shaderType !== "vertex") {
                return null;
            }

            if (shaderLanguage === ShaderLanguage.WGSL) {
                return {
                    CUSTOM_VERTEX_DEFINITIONS: `
#ifdef INSTANCES
attribute ${instanceAttributeName}: vec4f;
#endif
varying vDitheredTileFade: vec4f;
`,
                    CUSTOM_VERTEX_MAIN_BEGIN: `
#ifdef INSTANCES
vertexOutputs.vDitheredTileFade = input.${instanceAttributeName};
#else
vertexOutputs.vDitheredTileFade = vec4f(0.0);
#endif
`,
                };
            }

            return {
                CUSTOM_VERTEX_DEFINITIONS: `
#ifdef INSTANCES
attribute vec4 ${instanceAttributeName};
#endif
varying vec4 vDitheredTileFade;
`,
                CUSTOM_VERTEX_MAIN_BEGIN: `
#ifdef INSTANCES
vDitheredTileFade = ${instanceAttributeName};
#else
vDitheredTileFade = vec4(0.0);
#endif
`,
            };
        }

        if (shaderLanguage === ShaderLanguage.WGSL) {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: `
#include<bayerDitherFunctions>
uniform ditheredFadeSettings: vec4f;
varying vDitheredTileFade: vec4f;

fn shouldDiscardDitheredTileFragment(position: vec2f, materialSettings: vec4f, instanceSettings: vec4f) -> bool {
    var bounds = materialSettings.xy;
#ifdef INSTANCES
    if (instanceSettings.z > 0.5 && instanceSettings.w == materialSettings.w) {
        bounds = instanceSettings.xy;
    }
#endif
    let ditheredFadeSample = bayerDither8(floor(position)) / 64.0;
    return materialSettings.z > 0.5 && (ditheredFadeSample < bounds.x || ditheredFadeSample >= bounds.y);
}
`,
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
if (shouldDiscardDitheredTileFragment(fragmentInputs.position.xy, uniforms.ditheredFadeSettings, fragmentInputs.vDitheredTileFade)) {
    discard;
}
`,
                [DepthPrePassInjectionPoint]: `
#ifdef DEPTHPREPASS
if (shouldDiscardDitheredTileFragment(fragmentInputs.position.xy, uniforms.ditheredFadeSettings, fragmentInputs.vDitheredTileFade)) {
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
uniform vec4 ditheredFadeSettings;
varying vec4 vDitheredTileFade;

bool shouldDiscardDitheredTileFragment(vec2 position, vec4 materialSettings, vec4 instanceSettings) {
    vec2 bounds = materialSettings.xy;
#ifdef INSTANCES
    if (instanceSettings.z > 0.5 && instanceSettings.w == materialSettings.w) {
        bounds = instanceSettings.xy;
    }
#endif
    float ditheredFadeSample = bayerDither8(floor(position)) / 64.0;
    return materialSettings.z > 0.5 && (ditheredFadeSample < bounds.x || ditheredFadeSample >= bounds.y);
}
`,
            CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
if (shouldDiscardDitheredTileFragment(gl_FragCoord.xy, ditheredFadeSettings, vDitheredTileFade)) {
    discard;
}
`,
            [DepthPrePassInjectionPoint]: `
#ifdef DEPTHPREPASS
if (shouldDiscardDitheredTileFragment(gl_FragCoord.xy, ditheredFadeSettings, vDitheredTileFade)) {
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
        this.reset();
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

    private _validateMesh(mesh: AbstractMesh): asserts mesh is DitheredTileFadeMesh {
        if (!(mesh instanceof Mesh) && !(mesh instanceof InstancedMesh)) {
            throw new TypeError("DitheredTileFadeMaterialPlugin supports only Mesh and InstancedMesh objects.");
        }
    }

    private _validateThinInstanceIndex(mesh: Mesh, index: number): void {
        RegisterThinInstanceMesh();
        if (!Number.isInteger(index) || index < 0 || index >= mesh.thinInstanceCount) {
            throw new RangeError(`index must identify one of the mesh's ${mesh.thinInstanceCount} thin instances.`);
        }
    }

    private _getInstanceAttributeName(): string {
        return `ditheredTileFade${this._material.uniqueId}`;
    }

    private _ensureInstancedBuffer(source: Mesh): void {
        if (this._instancedBufferSources.has(source)) {
            return;
        }

        RegisterInstancedMesh();
        source.registerInstancedBuffer(this._getInstanceAttributeName(), 4);
        this._instancedBufferSources.add(source);
    }

    private _ensureThinInstanceBuffer(source: Mesh): Float32Array {
        const requiredLength = source.thinInstanceCount * 4;
        const existingBuffer = this._thinInstanceFadeBuffers.get(source);
        if (existingBuffer && existingBuffer.length >= requiredLength) {
            return existingBuffer;
        }

        RegisterThinInstanceMesh();
        const buffer = new Float32Array(Math.max(requiredLength, 32 * 4));
        if (existingBuffer) {
            buffer.set(existingBuffer);
        }
        source.thinInstanceSetBuffer(this._getInstanceAttributeName(), buffer, 4, false);
        this._thinInstanceFadeBuffers.set(source, buffer);
        return buffer;
    }

    private _updateInstancedFadeBounds(mesh: DitheredTileFadeMesh, lowerBound: number, upperBound: number, configured: boolean): void {
        const source = mesh instanceof InstancedMesh ? mesh.sourceMesh : mesh;
        if (mesh instanceof InstancedMesh || source.instances.length > 0) {
            this._ensureInstancedBuffer(source);
            const current = mesh.instancedBuffers[this._getInstanceAttributeName()];
            if (current instanceof Vector4) {
                current.set(lowerBound, upperBound, configured ? 1 : 0, this._generation);
            } else {
                mesh.instancedBuffers[this._getInstanceAttributeName()] = new Vector4(lowerBound, upperBound, configured ? 1 : 0, this._generation);
            }
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
