import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * block used to Generate a Voronoi Noise Pattern
 */
export class VoronoiNoiseBlock extends NodeMaterialBlock {
    /**
     * Creates a new VoronoiNoiseBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("seed", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("offset", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("density", NodeMaterialBlockConnectionPointTypes.Float);

        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerOutput("cells", NodeMaterialBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "VoronoiNoiseBlock";
    }

    /**
     * Gets the seed input component
     */
    public get seed(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the offset input component
     */
    public get offset(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the density input component
     */
    public get density(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the output component
     */
    public get cells(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (!this.seed.isConnected) {
            return;
        }

        let functionString = `vec2 voronoiRandom(vec2 seed, float offset){
            mat2 m = mat2(15.27, 47.63, 99.41, 89.98);
            vec2 uv = fract(sin(m * seed) * 46839.32);
            return vec2(sin(uv.y * offset) * 0.5 + 0.5, cos(uv.x * offset) * 0.5 + 0.5);
        }
        `;

        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            functionString = state._babylonSLtoWGSL(functionString);
        }

        state._emitFunction("voronoiRandom", functionString, "// Voronoi random generator");

        functionString = `void voronoi(vec2 seed, float offset, float density, out float outValue, out float cells){
            vec2 g = floor(seed * density);
            vec2 f = fract(seed * density);
            float t = 8.0;
            vec3 res = vec3(8.0, 0.0, 0.0);

            for(int y=-1; y<=1; y++)
            {
                for(int x=-1; x<=1; x++)
                {
                    vec2 lattice = vec2(float(x),float(y));
                    vec2 randomOffset = voronoiRandom(lattice + g, offset);
                    float d = distance(lattice + randomOffset, f);
                    if(d < res.x)
                    {
                        res = vec3(d, randomOffset.x, randomOffset.y);
                        [*]outValue = res.x;
                        [*]cells = res.y;
                    }
                }
            }
        }
        `;

        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            functionString = state._babylonSLtoWGSL(functionString);
        } else {
            functionString = state._babylonSLtoGLSL(functionString);
        }

        state._emitFunction("voronoi", functionString, "// Voronoi");

        const tempOutput = state._getFreeVariableName("tempOutput");
        const tempCells = state._getFreeVariableName("tempCells");
        const ref = state.shaderLanguage === ShaderLanguage.WGSL ? "&" : "";

        state.compilationString += `${state._declareLocalVar(tempOutput, NodeMaterialBlockConnectionPointTypes.Float)} = 0.0;\n`;
        state.compilationString += `${state._declareLocalVar(tempCells, NodeMaterialBlockConnectionPointTypes.Float)} = 0.0;\n`;
        state.compilationString += `voronoi(${this.seed.associatedVariableName}, ${this.offset.associatedVariableName}, ${this.density.associatedVariableName}, ${ref}${tempOutput}, ${ref}${tempCells});\n`;

        if (this.output.hasEndpoints) {
            state.compilationString += state._declareOutput(this.output) + ` = ${tempOutput};\n`;
        }

        if (this.cells.hasEndpoints) {
            state.compilationString += state._declareOutput(this.cells) + ` = ${tempCells};\n`;
        }

        return this;
    }
}

RegisterClass("BABYLON.VoronoiNoiseBlock", VoronoiNoiseBlock);
