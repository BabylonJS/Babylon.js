import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";

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
    public getClassName() {
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

    protected _buildBlock(state: NodeMaterialBuildState) {
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
                    vec2 lattice = vec2(x,y);
                    vec2 randomOffset = voronoiRandom(lattice + g, offset);
                    float d = distance(lattice + randomOffset, f);
                    if(d < res.x)
                    {
                        res = vec3(d, randomOffset.x, randomOffset.y);
                        outValue = res.x;
                        cells = res.y;
                    }
                }
            }
        }
        `;

        state._emitFunction("voronoi", functionString, "// Voronoi");

        const tempOutput = state._getFreeVariableName("tempOutput");
        const tempCells = state._getFreeVariableName("tempCells");

        state.compilationString += `float ${tempOutput} = 0.0;\r\n`;
        state.compilationString += `float ${tempCells} = 0.0;\r\n`;
        state.compilationString += `voronoi(${this.seed.associatedVariableName}, ${this.offset.associatedVariableName}, ${this.density.associatedVariableName}, ${tempOutput}, ${tempCells});\r\n`;

        if (this.output.hasEndpoints) {
            state.compilationString += this._declareOutput(this.output, state) + ` = ${tempOutput};\r\n`;
        }

        if (this.cells.hasEndpoints) {
            state.compilationString += this._declareOutput(this.cells, state) + ` = ${tempCells};\r\n`;
        }

        return this;
    }
}

RegisterClass("BABYLON.VoronoiNoiseBlock", VoronoiNoiseBlock);
