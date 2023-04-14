import { NodeMaterialBlock } from "../nodeMaterialBlock";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";
import type { NodeMaterialBuildState } from "../nodeMaterialBuildState";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { RegisterClass } from "../../../Misc/typeStore";
import { InputBlock } from "./Input/inputBlock";
import { MorphTargetsBlock } from "./Vertex/morphTargetsBlock";
import { PropertyTypeForEdition, editableInPropertyPage } from "../nodeMaterialDecorator";
import type { Scene } from "core/scene";

export enum AttributeFallbackBlockTypes {
    None,
    Normal,
    Tangent,
    VertexColor,
    UV1,
    UV2,
    UV3,
    UV4,
    UV5,
    UV6,
}

/**
 * Block used to check if Mesh attribute of specified type exists
 * and provide an alternative fallback input for to use in such case
 */
export class MeshAttributeExistsBlock extends NodeMaterialBlock {
    /**
     * Creates a new MeshAttributeExistsBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("input", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("fallback", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);

        // Try to auto determine attributeType
        this._inputs[0].onConnectionObservable.add((other) => {
            if (this.attributeType) {
                // But only if not already specified
                return;
            }
            const sourceBlock = other.ownerBlock;
            if (sourceBlock instanceof InputBlock && sourceBlock.isAttribute) {
                switch (sourceBlock.name) {
                    case "color":
                        this.attributeType = AttributeFallbackBlockTypes.VertexColor;
                        break;
                    case "normal":
                        this.attributeType = AttributeFallbackBlockTypes.Normal;
                        break;
                    case "tangent":
                        this.attributeType = AttributeFallbackBlockTypes.Tangent;
                        break;
                    case "uv":
                        this.attributeType = AttributeFallbackBlockTypes.UV1;
                        break;
                    case "uv2":
                        this.attributeType = AttributeFallbackBlockTypes.UV2;
                        break;
                    case "uv3":
                        this.attributeType = AttributeFallbackBlockTypes.UV3;
                        break;
                    case "uv4":
                        this.attributeType = AttributeFallbackBlockTypes.UV4;
                        break;
                    case "uv5":
                        this.attributeType = AttributeFallbackBlockTypes.UV5;
                        break;
                    case "uv6":
                        this.attributeType = AttributeFallbackBlockTypes.UV6;
                        break;
                }
            } else if (sourceBlock instanceof MorphTargetsBlock) {
                switch (this.input.connectedPoint?.name) {
                    case "normalOutput":
                        this.attributeType = AttributeFallbackBlockTypes.Normal;
                        break;
                    case "tangentOutput":
                        this.attributeType = AttributeFallbackBlockTypes.Tangent;
                        break;
                    case "uvOutput":
                        this.attributeType = AttributeFallbackBlockTypes.UV1;
                        break;
                }
            }
        });
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "MeshAttributeExistsBlock";
    }

    /**
     * Defines which mesh attribute to use
     */
    @editableInPropertyPage("Attribute lookup", PropertyTypeForEdition.List, undefined, {
        notifiers: { update: true },
        options: [
            { label: "(None)", value: AttributeFallbackBlockTypes.None },
            { label: "Normal", value: AttributeFallbackBlockTypes.Normal },
            { label: "Tangent", value: AttributeFallbackBlockTypes.Tangent },
            { label: "Vertex Color", value: AttributeFallbackBlockTypes.VertexColor },
            { label: "UV1", value: AttributeFallbackBlockTypes.UV1 },
            { label: "UV2", value: AttributeFallbackBlockTypes.UV2 },
            { label: "UV3", value: AttributeFallbackBlockTypes.UV3 },
            { label: "UV4", value: AttributeFallbackBlockTypes.UV4 },
            { label: "UV5", value: AttributeFallbackBlockTypes.UV5 },
            { label: "UV6", value: AttributeFallbackBlockTypes.UV6 },
        ],
    })
    public attributeType = AttributeFallbackBlockTypes.None;

    /**
     * Gets the input component
     */
    public get input(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the fallback component when speciefied attribute doesn't exist
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
        switch (this.attributeType) {
            case AttributeFallbackBlockTypes.VertexColor:
                attributeDefine = "VERTEXCOLOR_NME";
                break;
            case AttributeFallbackBlockTypes.Normal:
                attributeDefine = "NORMAL";
                break;
            case AttributeFallbackBlockTypes.Tangent:
                attributeDefine = "TANGENT";
                break;
            case AttributeFallbackBlockTypes.UV1:
                attributeDefine = "UV1";
                break;
            case AttributeFallbackBlockTypes.UV2:
                attributeDefine = "UV2";
                break;
            case AttributeFallbackBlockTypes.UV3:
                attributeDefine = "UV3";
                break;
            case AttributeFallbackBlockTypes.UV4:
                attributeDefine = "UV4";
                break;
            case AttributeFallbackBlockTypes.UV5:
                attributeDefine = "UV5";
                break;
            case AttributeFallbackBlockTypes.UV6:
                attributeDefine = "UV6";
                break;
        }

        const output = this._declareOutput(this.output, state);
        if (attributeDefine) {
            state.compilationString += `#ifdef ${attributeDefine}\r\n`;
        }

        state.compilationString += `${output} = ${this.input.associatedVariableName};\r\n`;

        if (attributeDefine) {
            state.compilationString += `#else\r\n`;
            state.compilationString += `${output} = ${this.fallback.associatedVariableName};\r\n`;
            state.compilationString += `#endif\r\n`;
        }
        return this;
    }

    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.attributeType = this.attributeType;

        return serializationObject;
    }

    public _deserialize(serializationObject: any, scene: Scene, rootUrl: string) {
        super._deserialize(serializationObject, scene, rootUrl);

        this.attributeType = serializationObject.attributeType ?? AttributeFallbackBlockTypes.None;
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.attributeType = ${this.attributeType};\r\n`;

        return codeString;
    }
}

RegisterClass("BABYLON.MeshAttributeExistsBlock", MeshAttributeExistsBlock);
