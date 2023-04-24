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

export enum MeshAttributeExistsBlockTypes {
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
                        this.attributeType = MeshAttributeExistsBlockTypes.VertexColor;
                        break;
                    case "normal":
                        this.attributeType = MeshAttributeExistsBlockTypes.Normal;
                        break;
                    case "tangent":
                        this.attributeType = MeshAttributeExistsBlockTypes.Tangent;
                        break;
                    case "uv":
                        this.attributeType = MeshAttributeExistsBlockTypes.UV1;
                        break;
                    case "uv2":
                        this.attributeType = MeshAttributeExistsBlockTypes.UV2;
                        break;
                    case "uv3":
                        this.attributeType = MeshAttributeExistsBlockTypes.UV3;
                        break;
                    case "uv4":
                        this.attributeType = MeshAttributeExistsBlockTypes.UV4;
                        break;
                    case "uv5":
                        this.attributeType = MeshAttributeExistsBlockTypes.UV5;
                        break;
                    case "uv6":
                        this.attributeType = MeshAttributeExistsBlockTypes.UV6;
                        break;
                }
            } else if (sourceBlock instanceof MorphTargetsBlock) {
                switch (this.input.connectedPoint?.name) {
                    case "normalOutput":
                        this.attributeType = MeshAttributeExistsBlockTypes.Normal;
                        break;
                    case "tangentOutput":
                        this.attributeType = MeshAttributeExistsBlockTypes.Tangent;
                        break;
                    case "uvOutput":
                        this.attributeType = MeshAttributeExistsBlockTypes.UV1;
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
            { label: "(None)", value: MeshAttributeExistsBlockTypes.None },
            { label: "Normal", value: MeshAttributeExistsBlockTypes.Normal },
            { label: "Tangent", value: MeshAttributeExistsBlockTypes.Tangent },
            { label: "Vertex Color", value: MeshAttributeExistsBlockTypes.VertexColor },
            { label: "UV1", value: MeshAttributeExistsBlockTypes.UV1 },
            { label: "UV2", value: MeshAttributeExistsBlockTypes.UV2 },
            { label: "UV3", value: MeshAttributeExistsBlockTypes.UV3 },
            { label: "UV4", value: MeshAttributeExistsBlockTypes.UV4 },
            { label: "UV5", value: MeshAttributeExistsBlockTypes.UV5 },
            { label: "UV6", value: MeshAttributeExistsBlockTypes.UV6 },
        ],
    })
    public attributeType = MeshAttributeExistsBlockTypes.None;

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
            case MeshAttributeExistsBlockTypes.VertexColor:
                attributeDefine = "VERTEXCOLOR_NME";
                break;
            case MeshAttributeExistsBlockTypes.Normal:
                attributeDefine = "NORMAL";
                break;
            case MeshAttributeExistsBlockTypes.Tangent:
                attributeDefine = "TANGENT";
                break;
            case MeshAttributeExistsBlockTypes.UV1:
                attributeDefine = "UV1";
                break;
            case MeshAttributeExistsBlockTypes.UV2:
                attributeDefine = "UV2";
                break;
            case MeshAttributeExistsBlockTypes.UV3:
                attributeDefine = "UV3";
                break;
            case MeshAttributeExistsBlockTypes.UV4:
                attributeDefine = "UV4";
                break;
            case MeshAttributeExistsBlockTypes.UV5:
                attributeDefine = "UV5";
                break;
            case MeshAttributeExistsBlockTypes.UV6:
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

        this.attributeType = serializationObject.attributeType ?? MeshAttributeExistsBlockTypes.None;
    }

    protected _dumpPropertiesCode() {
        let codeString = super._dumpPropertiesCode();

        codeString += `${this._codeVariableName}.attributeType = ${this.attributeType};\r\n`;

        return codeString;
    }
}

RegisterClass("BABYLON.MeshAttributeExistsBlock", MeshAttributeExistsBlock);
