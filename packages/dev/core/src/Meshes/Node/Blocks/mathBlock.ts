import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";

/**
 * Operations supported by the Math block
 */
export enum MathBlockOperations {
    /** Add */
    Add,
    /** Subtract */
    Subtract,
    /** Multiply */
    Multiply,
    /** Divide */
    Divide
}

/**
 * Block used to apply math functions
 */
export class MathBlock extends NodeGeometryBlock {
    /**
     * Gets or sets the operation applied by the block
     */
    public operation = MathBlockOperations.Add;

    /**
     * Create a new MathBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("left", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeGeometryBlockConnectionPointTypes.AutoDetect);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);        
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MathBlock";
    }    

    /**
     * Gets the left input component
     */
    public get left(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the positions input component
     */
    public get right(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }    

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }    

    protected _buildBlock(state: NodeGeometryBuildState) {
        let func:(state: NodeGeometryBuildState) => any;
        const left = this.left;
        const right = this.right;
        const isFloat = left.type === NodeGeometryBlockConnectionPointTypes.Float;

        switch (this.operation) {
            case MathBlockOperations.Add: {
                if (isFloat) {
                    func = (state) => {                    
                        return left.getConnectedValue(state) + right.getConnectedValue(state);
                    }
                } else {
                    func = (state) => {                    
                        return left.getConnectedValue(state).add(right.getConnectedValue(state));
                    }
                }
                break;
            }
            case MathBlockOperations.Subtract: {
                if (isFloat) {
                    func = (state) => {                    
                        return left.getConnectedValue(state) - right.getConnectedValue(state);
                    }
                } else {
                    func = (state) => {                    
                        return left.getConnectedValue(state).subtract(right.getConnectedValue(state));
                    }
                }
                break;
            }     
            case MathBlockOperations.Multiply: {
                if (isFloat) {
                    func = (state) => {                    
                        return left.getConnectedValue(state) * right.getConnectedValue(state);
                    }
                } else {
                    func = (state) => {                    
                        return left.getConnectedValue(state).multiply(right.getConnectedValue(state));
                    }
                }
                break;
            }    
            case MathBlockOperations.Divide: {
                if (isFloat) {
                    func = (state) => {                    
                        return left.getConnectedValue(state) / right.getConnectedValue(state);
                    }
                } else {
                    func = (state) => {                    
                        return left.getConnectedValue(state).divide(right.getConnectedValue(state));
                    }
                }
                break;
            }                           
        }

        this.output._storedFunction = (state) => {
            return func(state);
        }
    }

}

RegisterClass("BABYLON.MathBlock", MathBlock);
