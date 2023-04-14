/* eslint-disable @typescript-eslint/naming-convention */
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { MeshAttributeExistsBlock } from "core/Materials/Node/Blocks/meshAttributeExistsBlock";
import { AttributeFallbackBlockTypes } from "core/Materials/Node/Blocks/meshAttributeExistsBlock";

/**
 *
 */
export class MeshAttributeExistsDisplayManager implements IDisplayManager {
    public getHeaderClass(nodeData: INodeData) {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        const block = nodeData.data as MeshAttributeExistsBlock;
        let name = block.name;

        let attributeName;

        switch (block.attributeType) {
            case AttributeFallbackBlockTypes.VertexColor:
                attributeName = "Color";
                break;
            case AttributeFallbackBlockTypes.Normal:
                attributeName = "Normal";
                break;
            case AttributeFallbackBlockTypes.Tangent:
                attributeName = "Tangent";
                break;
            case AttributeFallbackBlockTypes.UV1:
                attributeName = "UV";
                break;
            case AttributeFallbackBlockTypes.UV2:
                attributeName = "UV2";
                break;
            case AttributeFallbackBlockTypes.UV3:
                attributeName = "UV3";
                break;
            case AttributeFallbackBlockTypes.UV4:
                attributeName = "UV4";
                break;
            case AttributeFallbackBlockTypes.UV5:
                attributeName = "UV5";
                break;
            case AttributeFallbackBlockTypes.UV6:
                attributeName = "UV6";
                break;
        }

        if (attributeName) {
            name += ` (${attributeName})`;
        }

        return name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        return "";
    }

    public updatePreviewContent(): void {}
}
