/* eslint-disable @typescript-eslint/naming-convention */
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialSystemValues } from "core/Materials/Node/Enums/nodeMaterialSystemValues";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { AnimatedInputBlockTypes } from "core/Materials/Node/Blocks/Input/animatedInputBlockTypes";
import type { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import type { Color3 } from "core/Maths/math.color";
import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as styles from "./inputDisplayManager.module.scss";

const inputNameToAttributeValue: { [name: string]: string } = {
    position2d: "position",
    particle_uv: "uv",
    particle_color: "color",
    particle_texturemask: "textureMask",
    particle_positionw: "positionW",
    postprocess_uv: "uv",
};

const inputNameToAttributeName: { [name: string]: string } = {
    position2d: "screen",
    particle_uv: "particle",
    particle_color: "particle",
    particle_texturemask: "particle",
    particle_positionw: "particle",
    postprocess_uv: "screen",
};

export class InputDisplayManager implements IDisplayManager {
    public getHeaderClass(nodeData: INodeData) {
        const inputBlock = nodeData.data as InputBlock;

        if (inputBlock.isConstant) {
            return styles["constant"];
        }

        if (inputBlock.visibleInInspector) {
            return styles["inspector"];
        }

        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(nodeData: INodeData): string {
        const inputBlock = nodeData.data as InputBlock;
        let name = `${inputBlock.name} (${InputDisplayManager.GetBaseType(inputBlock.output.type)})`;

        if (inputBlock.isAttribute) {
            name = InputDisplayManager.GetBaseType(inputBlock.output.type);
        }

        return name;
    }

    public static GetBaseType(type: NodeMaterialBlockConnectionPointTypes): string {
        return NodeMaterialBlockConnectionPointTypes[type];
    }

    public getBackgroundColor(nodeData: INodeData): string {
        let color = "";
        const inputBlock = nodeData.data as InputBlock;

        switch (inputBlock.type) {
            case NodeMaterialBlockConnectionPointTypes.Color3:
            case NodeMaterialBlockConnectionPointTypes.Color4: {
                if (inputBlock.value) {
                    color = (inputBlock.value as Color3).toHexString();
                    break;
                }
            }
            // eslint-disable-next-line no-fallthrough
            default:
                color = BlockTools.GetColorFromConnectionNodeType(inputBlock.type);
                break;
        }

        return color;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        let value = "";
        const inputBlock = nodeData.data as InputBlock;

        if (inputBlock.isAttribute) {
            const attrVal = inputNameToAttributeValue[inputBlock.name] ?? inputBlock.name;
            const attrName = inputNameToAttributeName[inputBlock.name] ?? "mesh";
            value = attrName + "." + attrVal;
        } else if (inputBlock.isSystemValue) {
            switch (inputBlock.systemValue) {
                case NodeMaterialSystemValues.World:
                    value = "World";
                    break;
                case NodeMaterialSystemValues.WorldView:
                    value = "World x View";
                    break;
                case NodeMaterialSystemValues.WorldViewProjection:
                    value = "World x View x Projection";
                    break;
                case NodeMaterialSystemValues.View:
                    value = "View";
                    break;
                case NodeMaterialSystemValues.ViewProjection:
                    value = "View x Projection";
                    break;
                case NodeMaterialSystemValues.Projection:
                    value = "Projection";
                    break;
                case NodeMaterialSystemValues.CameraPosition:
                    value = "Camera position";
                    break;
                case NodeMaterialSystemValues.FogColor:
                    value = "Fog color";
                    break;
                case NodeMaterialSystemValues.DeltaTime:
                    value = "Delta time";
                    break;
                case NodeMaterialSystemValues.CameraParameters:
                    value = "Camera parameters";
                    break;
                case NodeMaterialSystemValues.MaterialAlpha:
                    value = "Material alpha";
                    break;
            }
        } else {
            switch (inputBlock.type) {
                case NodeMaterialBlockConnectionPointTypes.Float:
                    if (inputBlock.animationType !== AnimatedInputBlockTypes.None) {
                        value = AnimatedInputBlockTypes[inputBlock.animationType];
                    } else {
                        value = inputBlock.value.toFixed(4);
                    }
                    break;
                case NodeMaterialBlockConnectionPointTypes.Vector2: {
                    const vec2Value = inputBlock.value as Vector2;
                    value = `(${vec2Value.x.toFixed(2)}, ${vec2Value.y.toFixed(2)})`;
                    break;
                }
                case NodeMaterialBlockConnectionPointTypes.Vector3: {
                    const vec3Value = inputBlock.value as Vector3;
                    value = `(${vec3Value.x.toFixed(2)}, ${vec3Value.y.toFixed(2)}, ${vec3Value.z.toFixed(2)})`;
                    break;
                }
                case NodeMaterialBlockConnectionPointTypes.Vector4: {
                    if (inputBlock.animationType !== AnimatedInputBlockTypes.None) {
                        value = AnimatedInputBlockTypes[inputBlock.animationType];
                    } else {
                        const vec4Value = inputBlock.value as Vector4;
                        value = `(${vec4Value.x.toFixed(2)}, ${vec4Value.y.toFixed(2)}, ${vec4Value.z.toFixed(2)}, ${vec4Value.w.toFixed(2)})`;
                    }
                    break;
                }
            }
        }

        contentArea.innerHTML = value;
        contentArea.classList.add(styles["input-block"]);
    }
}
