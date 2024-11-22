import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import styles from "./inputDisplayManager.module.scss";
import type { NodeRenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";

export class InputDisplayManager implements IDisplayManager {
    public getHeaderClass(_nodeData: INodeData) {
        return "";
    }

    public getHeaderText(nodeData: INodeData): string {
        return nodeData.data.name;
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public static GetBaseType(type: NodeRenderGraphBlockConnectionPointTypes): string {
        return NodeRenderGraphBlockConnectionPointTypes[type];
    }

    public getBackgroundColor(nodeData: INodeData): string {
        let color = "";
        const inputBlock = nodeData.data as NodeRenderGraphInputBlock;

        switch (inputBlock.type) {
            default:
                color = BlockTools.GetColorFromConnectionNodeType(inputBlock.type);
                break;
        }

        return color;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        let value = "";
        const inputBlock = nodeData.data as NodeRenderGraphInputBlock;

        switch (inputBlock.type) {
            case NodeRenderGraphBlockConnectionPointTypes.Texture:
            case NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment:
                value = `${inputBlock.isExternal ? "external" : "internal"}`;
                break;
        }

        contentArea.innerHTML = value;
        contentArea.classList.add(styles["input-block"]);
    }
}
