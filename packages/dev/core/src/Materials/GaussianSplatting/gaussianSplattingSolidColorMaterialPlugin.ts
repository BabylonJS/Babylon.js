import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { SubMesh } from "../../Meshes/subMesh";
import type { UniformBuffer } from "../uniformBuffer";
import type { MaterialDefines } from "../materialDefines";
import { serialize, expandToProperty } from "../../Misc/decorators";
import { Color3 } from "../../Maths/math.color";
import { MaterialPluginBase } from "../materialPluginBase";
import { ShaderLanguage } from "../shaderLanguage";
import { RegisterClass } from "../../Misc/typeStore";
import { GaussianSplattingMaxPartCount } from "./gaussianSplattingMaterial";
import type { GaussianSplattingMaterial } from "./gaussianSplattingMaterial";

/**
 * Plugin for GaussianSplattingMaterial that replaces per-splat colors with a
 * solid color per compound-mesh part. Each part index maps to a single Color3
 * value, which is looked up in a uniform array in the fragment shader.
 */
export class GaussianSplattingSolidColorMaterialPlugin extends MaterialPluginBase {
    private _partColors: Color3[];
    private _maxPartCount: number;
    private _isEnabled = true;
    /**
     * Whether the solid-color override is active. When false, splats
     * render with their original per-splat colors.
     * Toggled via a shader uniform so no recompilation is required.
     */
    @serialize()
    @expandToProperty("_onIsEnabledChanged")
    public isEnabled = true;

    /** @internal */
    public _onIsEnabledChanged(): void {
        // Intentional no-op: isEnabled is applied via a uniform in
        // bindForSubMesh, so no dirty-marking or recompilation is needed.
    }

    /**
     * Creates a new GaussianSplatSolidColorPlugin.
     * @param material The GaussianSplattingMaterial to attach the plugin to.
     * @param partColors A map from part index to the solid Color3 for that part.
     * @param maxPartCount The maximum number of parts supported. This determines the size of the uniform array.
     */
    constructor(material: GaussianSplattingMaterial, partColors: Color3[], maxPartCount = GaussianSplattingMaxPartCount) {
        super(material, "GaussianSplatSolidColor", 200);

        this._partColors = partColors;
        this._maxPartCount = maxPartCount;
        this._enable(true);
    }

    /**
     * Updates the part colors dynamically.
     * @param partColors A map from part index to the solid Color3 for that part.
     */
    public updatePartColors(partColors: Color3[]): void {
        this._partColors = partColors;
    }

    // --- Plugin overrides ---

    /**
     * @returns the class name
     */
    public override getClassName(): string {
        return "GaussianSplattingSolidColorMaterialPlugin";
    }

    /**
     * Indicates this plugin supports both GLSL and WGSL.
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
     * Always ready — no textures or async resources to wait on.
     * @param _defines the defines
     * @param _scene the scene
     * @param _engine the engine
     * @param _subMesh the submesh
     * @returns true
     */
    public override isReadyForSubMesh(_defines: MaterialDefines, _scene: Scene, _engine: AbstractEngine, _subMesh: SubMesh): boolean {
        return true;
    }

    /**
     * Returns custom shader code fragments to inject solid-color rendering.
     *
     * @param shaderType "vertex" or "fragment"
     * @param shaderLanguage the shader language to use (default: GLSL)
     * @returns null or a map of injection point names to code strings
     */
    public override getCustomCode(shaderType: string, shaderLanguage = ShaderLanguage.GLSL): Nullable<{ [pointName: string]: string }> {
        const maxPartCount = this._maxPartCount ?? GaussianSplattingMaxPartCount;

        if (shaderLanguage === ShaderLanguage.WGSL) {
            return this._getCustomCodeWGSL(shaderType, maxPartCount);
        }
        return this._getCustomCodeGLSL(shaderType, maxPartCount);
    }

    private _getCustomCodeGLSL(shaderType: string, maxPartCount: number): Nullable<{ [pointName: string]: string }> {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_DEFINITIONS: `varying float vPartIndex;`,
                CUSTOM_VERTEX_UPDATE: `
#if IS_COMPOUND
    vPartIndex = float(splat.partIndex);
#else
    vPartIndex = 0.0;
#endif
                `,
            };
        } else if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: `
varying float vPartIndex;
uniform float solidColorEnabled;
uniform vec3 partColors[${maxPartCount}];
                `,
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
if (solidColorEnabled > 0.5) {
    int partIdx = int(vPartIndex + 0.5);
    finalColor = vec4(partColors[partIdx], finalColor.w);
}
                `,
            };
        }
        return null;
    }

    private _getCustomCodeWGSL(shaderType: string, maxPartCount: number): Nullable<{ [pointName: string]: string }> {
        if (shaderType === "vertex") {
            return {
                CUSTOM_VERTEX_DEFINITIONS: `varying vPartIndex: f32;`,
                CUSTOM_VERTEX_UPDATE: `
#if IS_COMPOUND
    vertexOutputs.vPartIndex = f32(splat.partIndex);
#else
    vertexOutputs.vPartIndex = 0.0;
#endif
                `,
            };
        } else if (shaderType === "fragment") {
            return {
                CUSTOM_FRAGMENT_DEFINITIONS: `
varying vPartIndex: f32;
uniform solidColorEnabled: f32;
uniform partColors: array<vec3f, ${maxPartCount}>;
                `,
                CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR: `
if (uniforms.solidColorEnabled > 0.5) {
    var partIdx: i32 = i32(fragmentInputs.vPartIndex + 0.5);
    finalColor = vec4f(uniforms.partColors[partIdx], finalColor.w);
}
                `,
            };
        }
        return null;
    }

    /**
     * Registers the plugin uniforms with the engine so that
     * the Effect can resolve their locations.
     * @returns uniform descriptions
     */
    public override getUniforms(): {
        ubo?: Array<{ name: string; size?: number; type?: string; arraySize?: number }>;
        vertex?: string;
        fragment?: string;
        externalUniforms?: string[];
    } {
        return {
            externalUniforms: ["partColors", "solidColorEnabled"],
        };
    }

    /**
     * Binds the plugin uniforms each frame.
     * @param _uniformBuffer the uniform buffer (unused — we bind directly on the effect)
     * @param _scene the current scene
     * @param _engine the current engine
     * @param subMesh the submesh being rendered
     */
    public override bindForSubMesh(_uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, subMesh: SubMesh): void {
        const effect = subMesh.effect;
        if (!effect) {
            return;
        }

        effect.setFloat("solidColorEnabled", this._isEnabled ? 1.0 : 0.0);

        const colorArray: number[] = [];
        for (let i = 0; i < this._maxPartCount; i++) {
            const color = this._partColors[i] ?? new Color3(0, 0, 0);
            colorArray.push(color.r, color.g, color.b);
        }

        effect.setArray3("partColors", colorArray);
    }
}

RegisterClass("BABYLON.GaussianSplattingSolidColorMaterialPlugin", GaussianSplattingSolidColorMaterialPlugin);
