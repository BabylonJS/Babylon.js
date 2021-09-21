import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
import { Scene } from '../../../scene';
import { NodeMaterialConnectionPoint } from '../nodeMaterialBlockConnectionPoint';
import { Nullable } from "../../../types";
/**
 * Custom block created from user-defined json
 */
 export class CustomBlock extends NodeMaterialBlock {    
    private _options: any;
    private _code: string;

    /**
     * Creates a new CustomBlock
     * @param options defines the options used to create the block
     */
    public constructor(options: any) {
        super("emptyCustomBlock");

        if (options) {
            this._deserializeCustomBlock(options);
        }
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "CustomBlock";
    }

    /**
     * Builds the block's compilaton string
     * @returns the current block
     */
    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let code = this._code;

        let functionName = this._options.functionName;

        // Replace the TYPE_XXX placeholders (if any)
        this._inputs.forEach((input) => {
            const rexp = new RegExp("\\{TYPE_" + input.name + "\\}", "gm");
            const type = state._getGLType(input.type);
            code = code.replace(rexp, type);
            functionName = functionName.replace(rexp, type);
        });
        this._outputs.forEach((output) => {
            const rexp = new RegExp("\\{TYPE_" + output.name + "\\}", "gm");
            const type = state._getGLType(output.type);
            code = code.replace(rexp, type);
            functionName = functionName.replace(rexp, type);
        });

        state._emitFunction(functionName, code, "");

        // Declare the output variables
        this._outputs.forEach((output) => {
            state.compilationString += this._declareOutput(output, state) + ";\r\n";
        });

        // Generate the function call
        state.compilationString += functionName + "(";

        let hasComma = false;
        this._inputs.forEach((input, index) => {
            if (index > 0) {
                state.compilationString += ", ";
                hasComma = true;
            }
            state.compilationString += input.associatedVariableName;
        });

        this._outputs.forEach((output, index) => {
            if (index > 0 || hasComma) {
                state.compilationString += ", ";
            }
            state.compilationString += output.associatedVariableName;
        });

        state.compilationString += ");\r\n";

        return this;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        let serializationObject = super.serialize();

        serializationObject.options = this._options;

        return serializationObject;
    }

    /**
     * Deserializes this block from a JSON representation
     * @hidden
     */
    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        this._deserializeCustomBlock(serializationObject.options);

        super._deserialize(serializationObject, scene, rootUrl);
    }

    /**
     * Deserializes this block from a user-defined JSON representation
     * @param options defines the options used to create the block
     */
    private _deserializeCustomBlock(options: any) {
        this._options = options;
        this._code = options.code.join("\r\n") + "\r\n";
        this.name = options.name;
        this.target = (<any> NodeMaterialBlockTargets)[options.target];

        options.inParameters?.forEach((input: any) => {
            const type = (<any> NodeMaterialBlockConnectionPointTypes)[input.type];
            this.registerInput(input.name, type);
        });

        options.outParameters?.forEach((output: any, index: number) => {
            this.registerOutput(output.name, (<any> NodeMaterialBlockConnectionPointTypes)[output.type]);

            if (output.type === "BasedOnInput") {
                this._outputs[index]._typeConnectionSource = this.findInputByName(output.typeFromInput)![0];
            }
        });

        options.inLinkedConnectionTypes?.forEach((connection: any, index: number) => {
            this._linkConnectionTypes(this.findInputByName(connection.input1)![1], this.findInputByName(connection.input2)![1]);
        });
    }

    /**
     * Finds the desired input by name
     * @param name defines the name to search for
     * @returns the input if found, otherwise returns null
     */
    public findInputByName(name: string): Nullable<[NodeMaterialConnectionPoint, number]> {
        if (!name) {
            return null;
        }

        for (var i = 0; i < this._inputs.length; i++) {
            if (this._inputs[i].name === name) {
                return [this._inputs[i], i];
            }
        }

        return null;
    }
}

_TypeStore.RegisteredTypes["BABYLON.CustomBlock"] = CustomBlock;