import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { SubMesh } from "../../Meshes/subMesh";
import type { UniformBuffer } from "../uniformBuffer";
import type { MaterialDefines } from "../materialDefines";
import { Color3 } from "../../Maths/math.color";
import { MaterialPluginBase } from "../materialPluginBase";
import { RegisterClass } from "../../Misc/typeStore";
import type { GaussianSplattingMaterial } from "./gaussianSplattingMaterial";

/**
 * Plugin for GaussianSplattingMaterial that replaces per-splat colors with a
 * solid color per compound-mesh part. Each part index maps to a single Color3
 * value, which is looked up in a uniform array in the fragment shader.
 * @experimental
 */
export class GaussianSplatSolidColorPlugin extends MaterialPluginBase {
    private _partColors: Map<number, Color3>;
    private _maxPartCount: number;

    /**
     * Creates a new GaussianSplatSolidColorPlugin.
     * @param material The GaussianSplattingMaterial to attach the plugin to.
     * @param partColors A map from part index to the solid Color3 for that part.
     * @param maxPartCount The maximum number of parts supported (default 256). This determines the size of the uniform array.
     */
    constructor(material: GaussianSplattingMaterial, partColors: Map<number, Color3>, maxPartCount = 256) {
        super(material, "GaussianSplatSolidColor", 200, { SOLID_SPLAT: false });

        this._partColors = partColors;
        this._maxPartCount = maxPartCount;
        this._enable(true);
    }

    /**
     * Updates the part colors dynamically.
     * @param partColors A map from part index to the solid Color3 for that part.
     */
    public updatePartColors(partColors: Map<number, Color3>): void {
        this._partColors = partColors;
    }

    // --- Plugin overrides ---

    /**
     * @returns the class name
     */
    public override getClassName(): string {
        return "GaussianSplatSolidColorPlugin";
    }

    /**
     * Sets the SOLID_SPLAT define so the injected shader code is active.
     * @param defines the defines to update
     * @param _scene the current scene
     * @param _mesh the mesh being rendered
     */
    public override prepareDefines(defines: MaterialDefines, _scene: Scene, _mesh: AbstractMesh): void {
        defines["SOLID_SPLAT"] = true;
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
     * In the vertex shader a varying is added to pass the part index to the
     * fragment shader. In the fragment shader the part index is used to look
     * up a solid color from the `partColors` uniform array and the original
     * gaussian alpha is preserved.
     * @param shaderType "vertex" or "fragment"
     * @returns null or a map of injection point names to code strings
     */
    public override getCustomCode(shaderType: string): Nullable<{ [pointName: string]: string }> {
        const maxPartCount = this._maxPartCount ?? 256;

        if (shaderType === "vertex") {
            return {
                // Add varying declaration for partIndex after existing varyings
                "!varying vec2 vPosition;": `varying vec2 vPosition;\nvarying float vPartIndex;`,
                // Set vPartIndex after reading the splat data
                "!vPosition=position.xy;": `vPosition=position.xy;\nvPartIndex=float(splat.partIndex);`,
            };
        } else if (shaderType === "fragment") {
            return {
                // Add varying and uniform declarations after existing varyings
                "!varying vec2 vPosition;": `varying vec2 vPosition;\nvarying float vPartIndex;\nuniform vec3 partColors[${maxPartCount}];`,
                // Replace gl_FragColor assignment to use the per-part solid color while preserving alpha
                "!gl_FragColor=gaussianColor\\(vColor\\);": `int partIdx=int(vPartIndex+0.5);gl_FragColor=vec4(partColors[partIdx],gaussianColor(vColor).w);`,
            };
        }
        return null;
    }

    /**
     * Binds the `partColors` uniform array each frame.
     * @param uniformBuffer the uniform buffer to write to
     * @param _scene the current scene
     * @param _engine the current engine
     * @param _subMesh the submesh being rendered
     */
    public override bindForSubMesh(uniformBuffer: UniformBuffer, _scene: Scene, _engine: AbstractEngine, _subMesh: SubMesh): void {
        const colorArray: number[] = [];
        for (let i = 0; i < this._maxPartCount; i++) {
            const color = this._partColors.get(i) ?? new Color3(0, 0, 0);
            colorArray.push(color.r, color.g, color.b);
        }

        uniformBuffer.updateArray("partColors", colorArray);
    }
}

RegisterClass("BABYLON.GaussianSplatSolidColorPlugin", GaussianSplatSolidColorPlugin);
