import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../nodeMaterialDecorator";
import type { Scene } from "../../../scene";
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
        this.registerInput("chaos", NodeMaterialBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("offsetX", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("offsetY", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("offsetZ", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.Float);

        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector2);
        this._inputs[0].acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Vector3);
        this._linkConnectionTypes(0, 1);
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
     * Gets the chaos input component
     */
    public get chaos(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the offset X input component
     */
    public get offsetX(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the offset Y input component
     */
    public get offsetY(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the offset Z input component
     */
    public get offsetZ(): NodeMaterialConnectionPoint {
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

        const functionString = `

        float cloudRandom(in float p) { p = fract(p * 0.011); p *= p + 7.5; p *= p + p; return fract(p); }

        // Based on Morgan McGuire @morgan3d
        // https://www.shadertoy.com/view/4dS3Wd
        float cloudNoise(in vec2 x, in vec2 chaos) {
            vec2 step = chaos * vec2(75., 120.) + vec2(75., 120.);

            vec2 i = floor(x);
            vec2 f = fract(x);

            float n = dot(i, step);

            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(
                    mix(cloudRandom(n + dot(step, vec2(0, 0))), cloudRandom(n + dot(step, vec2(1, 0))), u.x),
                    mix(cloudRandom(n + dot(step, vec2(0, 1))), cloudRandom(n + dot(step, vec2(1, 1))), u.x),
                    u.y
                );
        }

        float cloudNoise(in vec3 x, in vec3 chaos) {
            vec3 step = chaos * vec3(60., 120., 75.) + vec3(60., 120., 75.);

            vec3 i = floor(x);
            vec3 f = fract(x);

            float n = dot(i, step);

            vec3 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(mix( cloudRandom(n + dot(step, vec3(0, 0, 0))), cloudRandom(n + dot(step, vec3(1, 0, 0))), u.x),
                           mix( cloudRandom(n + dot(step, vec3(0, 1, 0))), cloudRandom(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
                       mix(mix( cloudRandom(n + dot(step, vec3(0, 0, 1))), cloudRandom(n + dot(step, vec3(1, 0, 1))), u.x),
                           mix( cloudRandom(n + dot(step, vec3(0, 1, 1))), cloudRandom(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
        }`;

        const fractalBrownianString = `
        float fbm(in vec2 st, in vec2 chaos) {
            // Initial values
            float value = 0.0;
            float amplitude = .5;
            float frequency = 0.;

            // Loop of octaves
            for (int i = 0; i < OCTAVES; i++) {
                value += amplitude * cloudNoise(st, chaos);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        float fbm(in vec3 x, in vec3 chaos) {
            // Initial values
            float value = 0.0;
            float amplitude = 0.5;
            for (int i = 0; i < OCTAVES; ++i) {
                value += amplitude * cloudNoise(x, chaos);
                x = x * 2.0;
                amplitude *= 0.5;
            }
            return value;
        }`;

        const fbmNewName = `fbm${this.octaves}`;
        state._emitFunction("CloudBlockCode", functionString, "// CloudBlockCode");
        state._emitFunction(
            "CloudBlockCodeFBM" + this.octaves,
            fractalBrownianString.replace(/fbm/gi, fbmNewName).replace(/OCTAVES/gi, (this.octaves | 0).toString()),
            "// CloudBlockCode FBM"
        );

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

        let chaosValue = "";
        if (this.chaos.isConnected) {
            chaosValue = this.chaos.associatedVariableName;
        } else {
            chaosValue = this.seed.connectedPoint?.type === NodeMaterialBlockConnectionPointTypes.Vector2 ? "vec2(0., 0.)" : "vec3(0., 0., 0.)";
        }

        state.compilationString += this._declareOutput(this._outputs[0], state) + ` = ${fbmNewName}(${localVariable}, ${chaosValue});\r\n`;

        return this;
    }

    protected _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.octaves = ${this.octaves};\r\n`;
        return codeString;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.octaves = this.octaves;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.octaves = serializationObject.octaves;
    }
}

RegisterClass("BABYLON.CloudBlock", CloudBlock);
