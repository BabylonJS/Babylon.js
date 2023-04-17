/* eslint-disable @typescript-eslint/naming-convention */
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { MeshAttributeExistsBlock } from "core/Materials/Node/Blocks/meshAttributeExistsBlock";
import { MeshAttributeExistsBlockTypes } from "core/Materials/Node/Blocks/meshAttributeExistsBlock";

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
            case MeshAttributeExistsBlockTypes.VertexColor:
                attributeName = "Color";
                break;
            case MeshAttributeExistsBlockTypes.Normal:
                attributeName = "Normal";
                break;
            case MeshAttributeExistsBlockTypes.Tangent:
                attributeName = "Tangent";
                break;
            case MeshAttributeExistsBlockTypes.UV1:
                attributeName = "UV";
                break;
            case MeshAttributeExistsBlockTypes.UV2:
                attributeName = "UV2";
                break;
            case MeshAttributeExistsBlockTypes.UV3:
                attributeName = "UV3";
                break;
            case MeshAttributeExistsBlockTypes.UV4:
                attributeName = "UV4";
                break;
            case MeshAttributeExistsBlockTypes.UV5:
                attributeName = "UV5";
                break;
            case MeshAttributeExistsBlockTypes.UV6:
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
