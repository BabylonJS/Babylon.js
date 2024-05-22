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
        // Adapted from https://www.shadertoy.com/view/MslGD8
        let functionString = `vec2 voronoiRandom(vec2 p){
            p = vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));
            return fract(sin(p)*18.5453);
        }
        `;

        if (state.shaderLanguage === ShaderLanguage.WGSL) {
            functionString = state._babylonSLtoWGSL(functionString);
        }

        state._emitFunction("voronoiRandom", functionString, "// Voronoi random generator");

        functionString = `void voronoi(vec2 seed, float offset, float density, out float outValue, out float cells){
            vec2 n = floor(seed * density);
            vec2 f = fract(seed * density);
            vec3 m = vec3( 8.0 );
            for( int j=-1; j<=1; j++ ){
                for( int i=-1; i<=1; i++ ){
                    vec2  g = vec2( float(i), float(j) );
                    vec2  o = voronoiRandom( n + g);
                    vec2  r = g - f + (0.5+0.5*sin(offset+6.2831*o));
                    float d = dot( r, r );
                    if( d<m.x ){
                        m = vec3( d, o );
                        outValue = m.x;
                        cells = m.y;
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
