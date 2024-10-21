import { Observable } from "core/Misc/observable";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
/**
 * Block used to trigger an observable when traversed
 * It can also be used to execute a function when traversed
 */
export class GeometryInterceptorBlock extends NodeGeometryBlock {
    /**
     * Observable triggered when the block is traversed
     */
    public onInterceptionObservable = new Observable<any>(undefined, true);

    /**
     * Custom function to execute when traversed
     */
    public customFunction?: (value: any, state: NodeGeometryBuildState) => any;

    /**
     * Creates a new GeometryInterceptorBlock
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
        return "GeometryInterceptorBlock";
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
            let value = input.getConnectedValue(state);

            if (this.customFunction) {
                value = this.customFunction(value, state);
            }

            this.onInterceptionObservable.notifyObservers(value);

            return value;
        };
    }
}

RegisterClass("BABYLON.GeometryInterceptorBlock", GeometryInterceptorBlock);
