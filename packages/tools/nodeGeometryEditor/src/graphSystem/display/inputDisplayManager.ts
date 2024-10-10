import type { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import styles from "./inputDisplayManager.modules.scss";
import type { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryContextualSources } from "core/Meshes/Node/Enums/nodeGeometryContextualSources";
import type { Nullable } from "core/types";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import type { NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";

const predicate = (b: NodeGeometryBlock) => !!(b as any).getExecutionIndex;

export class InputDisplayManager implements IDisplayManager {
    private _hasHighlights = false;

    public getHeaderClass(nodeData: INodeData) {
        const inputBlock = nodeData.data as GeometryInputBlock;

        if (inputBlock.isContextual) {
            return styles["contextual"];
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
                case NodeGeometryContextualSources.VertexID:
                    value = "VertexID";
                    break;
                case NodeGeometryContextualSources.GeometryID:
                    value = "GeometryID";
                    break;
                case NodeGeometryContextualSources.LoopID:
                    value = "LoopID";
                    break;
                case NodeGeometryContextualSources.InstanceID:
                    value = "InstanceID";
                    break;
                case NodeGeometryContextualSources.CollectionID:
                    value = "CollectionID";
                    break;
                case NodeGeometryContextualSources.FaceID:
                    value = "FaceID";
                    break;
                case NodeGeometryContextualSources.Tangents:
                    value = "Tangents";
                    break;
                case NodeGeometryContextualSources.UV:
                    value = "UV";
                    break;
                case NodeGeometryContextualSources.UV2:
                    value = "UV2";
                    break;
                case NodeGeometryContextualSources.UV3:
                    value = "UV3";
                    break;
                case NodeGeometryContextualSources.UV4:
                    value = "UV4";
                    break;
                case NodeGeometryContextualSources.UV5:
                    value = "UV5";
                    break;
                case NodeGeometryContextualSources.UV6:
                    value = "UV6";
                    break;
                case NodeGeometryContextualSources.Colors:
                    value = "Colors";
                    break;
                case NodeGeometryContextualSources.LatticeID:
                    value = "LatticeID";
                    break;
                case NodeGeometryContextualSources.LatticeControl:
                    value = "LatticeControl";
                    break;
            }
        } else {
            switch (inputBlock.type) {
                case NodeGeometryBlockConnectionPointTypes.Int:
                    value = inputBlock.value.toFixed(0);
                    break;
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

    public onSelectionChanged(nodeData: INodeData, selectedData: Nullable<INodeData>, manager: StateManager): void {
        const block = nodeData.data as GeometryInputBlock;
        if (!block.isContextual) {
            return;
        }
        const contextGenerationBlock = block.getDescendantOfPredicate(predicate);

        if (selectedData !== nodeData) {
            if (this._hasHighlights) {
                let removeHighlight: boolean;

                if (selectedData && selectedData.data.getClassName() === "GeometryInputBlock") {
                    const otherSelection = selectedData.data as GeometryInputBlock;
                    const otherContextGenerationBlock = otherSelection.getDescendantOfPredicate(predicate);

                    removeHighlight = contextGenerationBlock !== otherContextGenerationBlock;
                } else {
                    removeHighlight = true;
                }

                if (removeHighlight) {
                    manager.onHighlightNodeObservable.notifyObservers({ data: contextGenerationBlock, active: false });
                }
                this._hasHighlights = false;
            }
            return;
        }
        if (contextGenerationBlock) {
            manager.onHighlightNodeObservable.notifyObservers({ data: contextGenerationBlock, active: true });
            this._hasHighlights = true;
        }
    }

    public onDispose(nodeData: INodeData, manager: StateManager) {
        const block = nodeData.data as GeometryInputBlock;
        if (!block.isContextual) {
            return;
        }

        const contextGenerationBlock = block.getDescendantOfPredicate(predicate);

        if (contextGenerationBlock) {
            manager.onHighlightNodeObservable.notifyObservers({ data: contextGenerationBlock, active: false });
        }
    }
}
