import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import { InputBlock } from "./Input/inputBlock";
import { MorphTargetsBlock } from "./Vertex/morphTargetsBlock";
/**
 * Block used to define a default fallback value for Mesh attributes in case they don't exist
 */
export class MeshAttributeFallbackBlock extends NodeMaterialBlock {
    /**
     * Creates a new MeshAttributeFallbackBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("attribute", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("fallback", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MeshAttributeFallbackBlock";
    }

    /**
     * Gets the attribute input component
     */
    public get attribute(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the fallback input component
     */
    public get fallback(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock(state: NodeMaterialBuildState) {
        super._buildBlock(state);

        let attributeDefine: null | string = null;
        const sourceBlock = this.attribute?.sourceBlock;
        if (sourceBlock instanceof InputBlock && sourceBlock.isAttribute) {
            switch (sourceBlock.name) {
                case "color":
                    attributeDefine = "VERTEXCOLOR_NME";
                    break;
                case "normal":
                    attributeDefine = "NORMAL";
                    break;
                case "tangent":
                    attributeDefine = "TANGENT";
                    break;
                case "uv":
                    attributeDefine = "UV1";
                    break;
                case "uv2":
                    attributeDefine = "UV2";
                    break;
                case "uv3":
                    attributeDefine = "UV3";
                    break;
                case "uv4":
                    attributeDefine = "UV4";
                    break;
                case "uv5":
                    attributeDefine = "UV5";
                    break;
                case "uv6":
                    attributeDefine = "UV6";
                    break;
            }
        } else if (sourceBlock instanceof MorphTargetsBlock) {
            switch (this.attribute.connectedPoint?.name) {
                case "normalOutput":
                    attributeDefine = "NORMAL";
                    break;
                case "tangentOutput":
                    attributeDefine = "TANGENT";
                    break;
                case "uvOutput":
                    attributeDefine = "UV1";
                    break;
            }
        }

        const output = this._declareOutput(this.output, state);
        if (attributeDefine) {
            state.compilationString += `#ifdef ${attributeDefine}\r\n`;
        }

        state.compilationString += `${output} = ${this.attribute.associatedVariableName};\r\n`;

        if (attributeDefine) {
            state.compilationString += `#else\r\n`;
            state.compilationString += `${output} = ${this.fallback.associatedVariableName};\r\n`;
            state.compilationString += `#endif\r\n`;
        }
        return this;
    }
}

RegisterClass("BABYLON.MeshAttributeFallbackBlock", MeshAttributeFallbackBlock);
