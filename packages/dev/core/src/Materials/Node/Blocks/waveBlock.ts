import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import type { Scene } from "../../../scene";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";

/**
 * Operations supported by the Wave block
 */
export const enum WaveBlockKind {
    /** SawTooth */
    SawTooth,
    /** Square */
    Square,
    /** Triangle */
    Triangle,
}

/**
 * Block used to apply wave operation to floats
 */
export class WaveBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the kibnd of wave to be applied by the block
     */
    @editableInPropertyPage("Kind", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "SawTooth", value: WaveBlockKind.SawTooth },
            { label: "Square", value: WaveBlockKind.Square },
            { label: "Triangle", value: WaveBlockKind.Triangle },
        ],
    })
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
    public override getClassName() {
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

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        switch (this.kind) {
            case WaveBlockKind.SawTooth: {
                state.compilationString += state._declareOutput(output) + ` = ${this.input.associatedVariableName} - floor(0.5 + ${this.input.associatedVariableName});\n`;
                break;
            }
            case WaveBlockKind.Square: {
                state.compilationString += state._declareOutput(output) + ` = 1.0 - 2.0 * round(fract(${this.input.associatedVariableName}));\n`;
                break;
            }
            case WaveBlockKind.Triangle: {
                state.compilationString +=
                    state._declareOutput(output) + ` = 2.0 * abs(2.0 * (${this.input.associatedVariableName} - floor(0.5 + ${this.input.associatedVariableName}))) - 1.0;\n`;
                break;
            }
        }

        return this;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.kind = this.kind;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.kind = serializationObject.kind;
    }
}

RegisterClass("BABYLON.WaveBlock", WaveBlock);
