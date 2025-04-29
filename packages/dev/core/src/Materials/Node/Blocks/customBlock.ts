import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import type { Scene } from "../../../scene";
import type { Nullable } from "../../../types";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointDirection } from "../nodeMaterialBlockConnectionPoint";
import { ImageSourceBlock } from "./Dual/imageSourceBlock";
import { NodeMaterialConnectionPointCustomObject } from "../nodeMaterialConnectionPointCustomObject";

/**
 * Custom block created from user-defined json
 */
export class CustomBlock extends NodeMaterialBlock {
    private _options: any;
    private _code: string;
    private _inputSamplers: string[];

    /**
     * Gets or sets the options for this custom block
     */
    public get options() {
        return this._options;
    }

    public set options(options: any) {
        this._deserializeOptions(options);
    }

    /**
     * Creates a new CustomBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "CustomBlock";
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let code = this._code;

        let functionName = this._options.functionName;

        // Replace the TYPE_XXX placeholders (if any)
        for (const input of this._inputs) {
            const rexp = new RegExp("\\{TYPE_" + input.name + "\\}", "gm");
            const type = state._getGLType(input.type);
            code = code.replace(rexp, type);
            functionName = functionName.replace(rexp, type);
        }
        for (const output of this._outputs) {
            const rexp = new RegExp("\\{TYPE_" + output.name + "\\}", "gm");
            const type = state._getGLType(output.type);
            code = code.replace(rexp, type);
            functionName = functionName.replace(rexp, type);
        }

        state._emitFunction(functionName, code, "");

        // Declare the output variables
        for (const output of this._outputs) {
            state.compilationString += state._declareOutput(output) + ";\n";
        }

        // Generate the function call
        state.compilationString += functionName + "(";

        let hasInput = false;
        for (let i = 0; i < this._inputs.length; i++) {
            const input = this._inputs[i];
            if (i > 0) {
                state.compilationString += ", ";
            }
            if (this._inputSamplers && this._inputSamplers.indexOf(input.name) !== -1) {
                state.compilationString += (input.connectedPoint?.ownerBlock as ImageSourceBlock)?.samplerName ?? input.associatedVariableName;
            } else {
                state.compilationString += input.associatedVariableName;
            }
            hasInput = true;
        }

        for (let i = 0; i < this._outputs.length; i++) {
            const output = this._outputs[i];
            if (i > 0 || hasInput) {
                state.compilationString += ", ";
            }
            state.compilationString += output.associatedVariableName;
        }

        state.compilationString += ");\n";

        return this;
    }

    protected override _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.options = ${JSON.stringify(this._options)};\n`;

        return codeString;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.options = this._options;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        this._deserializeOptions(serializationObject.options);

        super._deserialize(serializationObject, scene, rootUrl);
    }

    private _deserializeOptions(options: any) {
        this._options = options;
        this._code = options.code.join("\n") + "\n";
        this.name = this.name || options.name;
        this.target = (<any>NodeMaterialBlockTargets)[options.target];

        if (options.inParameters) {
            for (let i = 0; i < options.inParameters.length; i++) {
                const input = options.inParameters[i];
                const type = (<any>NodeMaterialBlockConnectionPointTypes)[input.type];
                if (input.type === "sampler2D" || input.type === "samplerCube") {
                    this._inputSamplers = this._inputSamplers || [];
                    this._inputSamplers.push(input.name);
                    this.registerInput(
                        input.name,
                        NodeMaterialBlockConnectionPointTypes.Object,
                        true,
                        NodeMaterialBlockTargets.VertexAndFragment,
                        new NodeMaterialConnectionPointCustomObject(input.name, this, NodeMaterialConnectionPointDirection.Input, ImageSourceBlock, "ImageSourceBlock")
                    );
                } else {
                    this.registerInput(input.name, type);
                }

                Object.defineProperty(this, input.name, {
                    get: function () {
                        return this._inputs[i];
                    },
                    enumerable: true,
                    configurable: true,
                });
            }
        }

        if (options.outParameters) {
            for (let i = 0; i < options.outParameters.length; i++) {
                const output = options.outParameters[i];

                this.registerOutput(output.name, (<any>NodeMaterialBlockConnectionPointTypes)[output.type]);

                Object.defineProperty(this, output.name, {
                    get: function () {
                        return this._outputs[i];
                    },
                    enumerable: true,
                    configurable: true,
                });

                if (output.type === "BasedOnInput") {
                    this._outputs[i]._typeConnectionSource = this._findInputByName(output.typeFromInput)![0];
                }
            }
        }

        if (options.inLinkedConnectionTypes) {
            for (const connection of options.inLinkedConnectionTypes) {
                this._linkConnectionTypes(this._findInputByName(connection.input1)![1], this._findInputByName(connection.input2)![1]);
            }
        }
    }

    private _findInputByName(name: string): Nullable<[NodeMaterialConnectionPoint, number]> {
        if (!name) {
            return null;
        }

        for (let i = 0; i < this._inputs.length; i++) {
            if (this._inputs[i].name === name) {
                return [this._inputs[i], i];
            }
        }

        return null;
    }
}

RegisterClass("BABYLON.CustomBlock", CustomBlock);
