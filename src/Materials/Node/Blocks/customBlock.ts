import { NodeMaterialBlock } from '../nodeMaterialBlock';
import { NodeMaterialBlockConnectionPointTypes } from '../Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialBuildState } from '../nodeMaterialBuildState';
import { NodeMaterialBlockTargets } from '../Enums/nodeMaterialBlockTargets';
import { _TypeStore } from '../../../Misc/typeStore';
import { Scene } from '../../../scene';
/**
 * Custom block created from user-defined json
 */
export class CustomBlock extends NodeMaterialBlock {
    private _compilationString: string;
    private _options: any;

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

        let compilationString = this._compilationString;

        this._outputs.forEach((output) => {
            compilationString = compilationString.replace(`{${output.name}}`, this._declareOutput(output, state));
        });

        this._inputs.forEach((input) => {
            compilationString = compilationString.replace(`{${input.name}}`, input.associatedVariableName);
        });

        state.compilationString += compilationString;

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
        this._compilationString = options.main.join("\r\n") + "\r\n";
        this.name = options.name;
        this.target = (<any> NodeMaterialBlockTargets)[options.target];

        options.inputs.forEach((input: any) => {
            this.registerInput(input.name, (<any> NodeMaterialBlockConnectionPointTypes)[input.connectionType]);
        });

        options.outputs.forEach((output: any, index: number) => {
            this.registerOutput(output.name, (<any> NodeMaterialBlockConnectionPointTypes)[output.connectionType]);

            if (output.connectionType === "BasedOnInput") {
                this._outputs[index]._typeConnectionSource = this.findInputByName(output.connectionTypeSource);
            }
        });
    }

    /**
     * Finds the desired input by name
     * @param name defines the name to search for
     * @returns the input if found, otherwise returns null
     */
    public findInputByName (name: string) {
        if (!name) {
            return null;
        }

        for (var i = 0; i < this._inputs.length; i++) {
            if (this._inputs[i].name === name) {
                return this._inputs[i];
            }
        }

        return null;
    }
}

_TypeStore.RegisteredTypes["BABYLON.CustomBlock"] = CustomBlock;