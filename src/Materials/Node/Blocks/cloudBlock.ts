import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { RegisterClass } from '../../../Misc/typeStore';
import { editableInPropertyPage, PropertyTypeForEdition } from '../nodeMaterialDecorator';
import { Scene } from '../../../scene';
/**
 * block used to Generate Fractal Brownian Motion Clouds
 */
export class CloudBlock extends NodeMaterialBlock {
    /** Gets or sets the number of octaves */
    @editableInPropertyPage("Octaves", PropertyTypeForEdition.Int)
    public octaves = 6.0;

    /**
     * Creates a new CloudBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);
        this.registerInput("seed", NodeMaterialBlockConnectionPointTypes.Vector2);
        this.registerInput("gain", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("lacunarity", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("timeX", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("timeY", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "CloudBlock";
    }

    /**
     * Gets the seed input component
     */
    public get seed(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the gain input component
     */
    public get gain(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
    * Gets the lacunarity input component
    */
    public get lacunarity(): NodeMaterialConnectionPoint {
       return this._inputs[2];
    }

    /**
    * Gets the time X input component
    */
    public get timeX(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
    * Gets the time Y input component
    */
     public get timeY(): NodeMaterialConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        if (!this.seed.isConnected) {
            return;
        }

        if (!this._outputs[0].hasEndpoints) {
            return;
        }

        let functionString = `float cloudRandom (in vec2 st) {
            return fract(sin(dot(st.xy,
                                 vec2(12.9898,78.233)))*
                43758.5453123);
        }

        // Based on Morgan McGuire @morgan3d
        // https://www.shadertoy.com/view/4dS3Wd
        float fbmNoise (in vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);

            // Four corners in 2D of a tile
            float a = cloudRandom(i);
            float b = cloudRandom(i + vec2(1.0, 0.0));
            float c = cloudRandom(i + vec2(0.0, 1.0));
            float d = cloudRandom(i + vec2(1.0, 1.0));

            vec2 u = f * f * (3.0 - 2.0 * f);

            return mix(a, b, u.x) +
                    (c - a)* u.y * (1.0 - u.x) +
                    (d - b) * u.x * u.y;
        }`;

        let fractalBrownianString = `float fbm (in vec2 st, in float gain, in float lacunarity) {
            // Initial values
            float value = 0.0;
            float amplitude = .5;
            float frequency = 0.;

            // Loop of octaves
            for (int i = 0; i < OCTAVES; i++) {
                value += amplitude * fbmNoise(st);
                st *= lacunarity;
                amplitude *= gain;
            }
            return value;
        }`;

        const fbmNewName = `fbm${this.octaves}`;
        state._emitFunction('CloudBlockCode', functionString, '// CloudBlockCode');
        state._emitFunction('CloudBlockCodeFBM' + this.octaves, fractalBrownianString.replace("fbm", fbmNewName).replace("OCTAVES", (this.octaves | 0).toString()), '// CloudBlockCode FBM');

        const localVariable = state._getFreeVariableName("st");

        state.compilationString += `vec2 ${localVariable} = ${this.seed.associatedVariableName};\r\n`;
        if (this.timeX.isConnected) {
            state.compilationString += `${localVariable}.x += 0.1 * ${this.timeX.associatedVariableName};\r\n`;
        }
        if (this.timeY.isConnected) {
            state.compilationString += `${localVariable}.y += 0.1 * ${this.timeY.associatedVariableName};\r\n`;
        }
        state.compilationString += this._declareOutput(this._outputs[0], state) + ` = vec3(0.0) + ${fbmNewName}(${localVariable}, ${this.gain.isConnected ? this.gain.associatedVariableName : "0.5"}, ${this.lacunarity.isConnected ? this.lacunarity.associatedVariableName : "2.0"});\r\n`;

        return this;
    }

    protected _dumpPropertiesCode() {
        var codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.octaves = ${this.octaves};\r\n`;
        return codeString;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.octaves = this.octaves;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.octaves = serializationObject.octaves;
    }
}

RegisterClass("BABYLON.CloudBlock", CloudBlock);