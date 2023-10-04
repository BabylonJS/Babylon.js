import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";

/**
 * Defines a block used to debug values going through it
 */
export class DebugBlock extends NodeGeometryBlock {
    /**
     * Gets the log entries
     */
    public log: string[] = [];

    /**
     * Create a new DebugBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isDebug = true;

        this.registerInput("input", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the time spent to build this block (in ms)
     */
    public get buildExecutionTime() {
        return 0;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "DebugBlock";
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

    protected _buildBlock(state: NodeGeometryBuildState) {
        if (!this.input.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.log = [];
        const func = (state: NodeGeometryBuildState) => {
            const input = this.input.getConnectedValue(state);

            if (input === null || input === undefined) {
                this.log.push("null");
                return input;
            }

            this.log.push(input.toString());

            return input;
        };

        if (this.output.isConnected) {
            this.output._storedFunction = func;
        } else {
            this.output._storedValue = func(state);
        }
    }
}

RegisterClass("BABYLON.DebugBlock", DebugBlock);
