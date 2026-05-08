/** This file must only contain pure code and pure imports */

import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import { type NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { type NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * Block used as a pass through
 */
export class GeometryElbowBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryElbowBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }

    /**
     * Gets the time spent to build this block (in ms)
     */
    public override get buildExecutionTime() {
        return -1;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryElbowBlock";
    }

    /**
     * Gets the input component
     */
    public get input(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];
        const input = this._inputs[0];

        output._storedFunction = (state) => {
            return input.getConnectedValue(state);
        };
    }
}

let _Registered = false;
/**
 * Register side effects for geometryElbowBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterGeometryElbowBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.GeometryElbowBlock", GeometryElbowBlock);
}
