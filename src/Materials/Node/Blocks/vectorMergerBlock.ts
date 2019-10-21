import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { _TypeStore } from '../../../Misc/typeStore';

/**
 * Block used to create a Vector2/3/4 out of individual inputs (one for each component)
 */
export class VectorMergerBlock extends NodeMaterialBlock {
    /**
     * Create a new VectorMergerBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("x", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("y", NodeMaterialBlockConnectionPointTypes.Float);
        this.registerInput("z", NodeMaterialBlockConnectionPointTypes.Float, true);
        this.registerInput("w", NodeMaterialBlockConnectionPointTypes.Float, true);

        this.registerOutput("xyzw", NodeMaterialBlockConnectionPointTypes.Vector4);
        this.registerOutput("xyz", NodeMaterialBlockConnectionPointTypes.Vector3);
        this.registerOutput("xy", NodeMaterialBlockConnectionPointTypes.Vector2);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "VectorMergerBlock";
    }

    /**
     * Gets the x component (input)
     */
    public get x(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the y component (input)
     */
    public get y(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the z component (input)
     */
    public get z(): NodeMaterialConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the w component (input)
     */
    public get w(): NodeMaterialConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the xyzw component (output)
     */
    public get xyzw(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the xyz component (output)
     */
    public get xyz(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the xy component (output)
     */
    public get xy(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let xInput = this.x;
        let yInput = this.y;
        let zInput = this.z;
        let wInput = this.w;

        let v4Output = this._outputs[0];
        let v3Output = this._outputs[1];
        let v2Output = this._outputs[2];

        if (v4Output.hasEndpoints) {
            state.compilationString += this._declareOutput(v4Output, state) + ` = vec4(${this._writeVariable(xInput)}, ${this._writeVariable(yInput)}, ${zInput.isConnected ? this._writeVariable(zInput) : "0.0"}, ${zInput.isConnected ? this._writeVariable(wInput) : "0.0"});\r\n`;
        } else if (v3Output.hasEndpoints) {
            state.compilationString += this._declareOutput(v3Output, state) + ` = vec3(${this._writeVariable(xInput)}, ${this._writeVariable(yInput)}, ${zInput.isConnected ? this._writeVariable(zInput) : "0.0"});\r\n`;
        } else if (v2Output.hasEndpoints) {
            state.compilationString += this._declareOutput(v2Output, state) + ` = vec2(${this._writeVariable(xInput)}, ${this._writeVariable(yInput)});\r\n`;
        }

        return this;
    }
}

_TypeStore.RegisteredTypes["BABYLON.VectorMergerBlock"] = VectorMergerBlock;