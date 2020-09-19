import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
import { Scene } from '../../../scene';

/**
 * Operations supported by the Wave block
 */
export enum WaveBlockKind {
    /** SawTooth */
    SawTooth,
    /** Square */
    Square,
    /** Triangle */
    Triangle
}

/**
 * Block used to apply wave operation to floats
 */
export class WaveBlock extends NodeMaterialBlock {

    /**
     * Gets or sets the kibnd of wave to be applied by the block
     */
    public kind = WaveBlockKind.SawTooth;

    /**
     * Creates a new WaveBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];

        this._inputs[0].excludedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "WaveBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let output = this._outputs[0];

        switch (this.kind) {
            case WaveBlockKind.SawTooth: {
                state.compilationString += this._declareOutput(output, state) + ` = ${this.input.associatedVariableName} - floor(0.5 + ${this.input.associatedVariableName});\r\n`;
                break;
            }
            case WaveBlockKind.Square: {
                state.compilationString += this._declareOutput(output, state) + ` = 1.0 - 2.0 * round(fract(${this.input.associatedVariableName}));\r\n`;
                break;
            }
            case WaveBlockKind.Triangle: {
                state.compilationString += this._declareOutput(output, state) + ` = 2.0 * abs(2.0 * (${this.input.associatedVariableName} - floor(0.5 + ${this.input.associatedVariableName}))) - 1.0;\r\n`;
                break;
            }
        }

        return this;
    }

    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.kind = this.kind;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.kind = serializationObject.kind;
    }
}

_TypeStore.RegisteredTypes["BABYLON.WaveBlock"] = WaveBlock;