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
        this.registerInput("seed", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("offsetX", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("offsetY", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("offsetZ", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Vector3);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector2);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
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
    * Gets the offset X input component
    */
    public get offsetX(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
    * Gets the offset Y input component
    */
     public get offsetY(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
    * Gets the offset Z input component
    */
     public get offsetZ(): NodeMaterialConnectionPoint {
        return this._inputs[3];
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

        float cloudRandom(in float p) { p = fract(p * 0.011); p *= p + 7.5; p *= p + p; return fract(p); }

        // Based on Morgan McGuire @morgan3d
        // https://www.shadertoy.com/view/4dS3Wd
        float cloudNoise(in vec2 st) {
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
        }

        float cloudNoise(in vec3 x) {
            const vec3 step = vec3(110, 241, 171);

            vec3 i = floor(x);
            vec3 f = fract(x);

            float n = dot(i, step);

            vec3 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix( cloudRandom(n + dot(step, vec3(0, 0, 0))), cloudRandom(n + dot(step, vec3(1, 0, 0))), u.x),
                           mix( cloudRandom(n + dot(step, vec3(0, 1, 0))), cloudRandom(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
                       mix(mix( cloudRandom(n + dot(step, vec3(0, 0, 1))), cloudRandom(n + dot(step, vec3(1, 0, 1))), u.x),
                           mix( cloudRandom(n + dot(step, vec3(0, 1, 1))), cloudRandom(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
        }`;

        let fractalBrownianString = `
        float fbm(in vec2 st) {
            // Initial values
            float value = 0.0;
            float amplitude = .5;
            float frequency = 0.;

            // Loop of octaves
            for (int i = 0; i < OCTAVES; i++) {
                value += amplitude * cloudNoise(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        float fbm(in vec3 x) {
            // Initial values
            float value = 0.0;
            float amplitude = 0.5;
            for (int i = 0; i < OCTAVES; ++i) {
                value += amplitude * cloudNoise(x);
                x = x * 2.0;
                amplitude *= 0.5;
            }
            return value;
        }`;

        const fbmNewName = `fbm${this.octaves}`;
        state._emitFunction('CloudBlockCode', functionString, '// CloudBlockCode');
        state._emitFunction('CloudBlockCodeFBM' + this.octaves, fractalBrownianString.replace(/fbm/gi, fbmNewName).replace(/OCTAVES/gi, (this.octaves | 0).toString()), '// CloudBlockCode FBM');

        const localVariable = state._getFreeVariableName("st");
        const seedType = this.seed.connectedPoint?.type === NodeMaterialBlockConnectionPointTypes.Vector2 ? "vec2" : "vec3";

        state.compilationString += `${seedType} ${localVariable} = ${this.seed.associatedVariableName};\r\n`;
        if (this.offsetX.isConnected) {
            state.compilationString += `${localVariable}.x += 0.1 * ${this.offsetX.associatedVariableName};\r\n`;
        }
        if (this.offsetY.isConnected) {
            state.compilationString += `${localVariable}.y += 0.1 * ${this.offsetY.associatedVariableName};\r\n`;
        }
        if (this.offsetZ.isConnected && seedType === "vec3") {
            state.compilationString += `${localVariable}.z += 0.1 * ${this.offsetZ.associatedVariableName};\r\n`;
        }
        state.compilationString += this._declareOutput(this._outputs[0], state) + ` = vec3(0.0) + ${fbmNewName}(${localVariable});\r\n`;

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
