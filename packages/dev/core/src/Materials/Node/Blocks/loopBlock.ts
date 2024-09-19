import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import type { Scene } from "core/scene";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
/**
 * Block used to repeat code
 */
export class LoopBlock extends NodeMaterialBlock {
    /**
     * Gets or sets the source range
     */
    @editableInPropertyPage("Iterations", PropertyTypeForEdition.Int)
    public iterations = 4;

    /**
     * Creates a new LoopBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);
        this.registerOutput("index", NodeMaterialBlockConnectionPointTypes.Int);
        this.registerOutput("loopID", NodeMaterialBlockConnectionPointTypes.Object);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._outputs[0]._forPostBuild = true;

        this._outputs[2]._redirectedSource = this._inputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "LoopBlock";
    }

    /**
     * Gets the main input component
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

    /**
     * Gets the index component which will be incremented at each iteration
     */
    public get index(): NodeMaterialConnectionPoint {
        return this._outputs[1];
    }

    /**
     * Gets the loop ID component
     */
    public get loopID(): NodeMaterialConnectionPoint {
        return this._outputs[2];
    }

    protected override _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        const output = this._outputs[0];

        const indexName = state._getFreeVariableName("index");

        const decl = state.shaderLanguage === ShaderLanguage.WGSL ? "var" : "int";

        // Declare storage variable and store initial value
        state.compilationString += state._declareOutput(output) + ` = ${this.input.associatedVariableName};\n`;

        // Loop
        state.compilationString += `for (${decl} ${indexName} = 0; ${indexName} < ${this.iterations}; ${indexName}++){\n`;

        return this;
    }

    protected override _postBuildBlock(state: NodeMaterialBuildState) {
        super._postBuildBlock(state);

        state.compilationString += `}\n`;

        return this;
    }

    protected override _dumpPropertiesCode() {
        return super._dumpPropertiesCode() + `${this._codeVariableName}.iterations = ${this.iterations};\n`;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.iterations = this.iterations;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.iterations = serializationObject.iterations;
    }
}

RegisterClass("BABYLON.LoopBlock", LoopBlock);
