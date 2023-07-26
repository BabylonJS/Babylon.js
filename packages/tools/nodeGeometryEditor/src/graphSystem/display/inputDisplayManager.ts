/* eslint-disable @typescript-eslint/naming-convention */
import type { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import styles from "./inputDisplayManager.modules.scss";
import type { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryContextualSources } from "core/Meshes/Node/Enums/nodeGeometryContextualSources";

export class InputDisplayManager implements IDisplayManager {
    public getHeaderClass(nodeData: INodeData) {
        const inputBlock = nodeData.data as GeometryInputBlock;

        if (inputBlock.isContextual) {
            return styles["contextual"];
        }

        if (inputBlock.visibleInInspector) {
            return styles["inspector"];
        }

        return "";
    }

    public getHeaderText(nodeData: INodeData): string {
        return nodeData.data.name;
    }    

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public static GetBaseType(type: NodeGeometryBlockConnectionPointTypes): string {
        return NodeGeometryBlockConnectionPointTypes[type];
    }

    public getBackgroundColor(nodeData: INodeData): string {
        let color = "";
        const inputBlock = nodeData.data as GeometryInputBlock;

        switch (inputBlock.type) {
            default:
                color = BlockTools.GetColorFromConnectionNodeType(inputBlock.type);
                break;
        }

        return color;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        let value = "";
        const inputBlock = nodeData.data as GeometryInputBlock;

        if (inputBlock.isContextual) {
            switch (inputBlock.contextualValue) {
                case NodeGeometryContextualSources.Positions:
                    value = "Positions";
                    break;
                case NodeGeometryContextualSources.Normals:
                    value = "Normals";
                    break;                                  
            }
        } else {
            switch (inputBlock.type) {
                case NodeGeometryBlockConnectionPointTypes.Float:
                    value = inputBlock.value.toFixed(4);
                    break;
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    const vec2Value = inputBlock.value as Vector2;
                    value = `(${vec2Value.x.toFixed(2)}, ${vec2Value.y.toFixed(2)})`;
                    break;
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    const vec3Value = inputBlock.value as Vector3;
                    value = `(${vec3Value.x.toFixed(2)}, ${vec3Value.y.toFixed(2)}, ${vec3Value.z.toFixed(2)})`;
                    break;
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    const vec4Value = inputBlock.value as Vector4;
                    value = `(${vec4Value.x.toFixed(2)}, ${vec4Value.y.toFixed(2)}, ${vec4Value.z.toFixed(2)}, ${vec4Value.w.toFixed(2)})`;
                    break;
                }
            }
        }

        contentArea.innerHTML = value;
        contentArea.classList.add(styles["input-block"]);
    }
}
