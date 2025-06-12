import type { INodeData } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import { ConnectionPointType, type AnyInputBlock } from "@babylonjs/smart-filters";
import { InputDisplayManager } from "../graphSystem/display/inputDisplayManager.js";
import { WebCamInputBlockName } from "./editorBlocks/blockNames.js";
import type { WebCamInputBlock } from "./editorBlocks/webCamInputBlock/webCamInputBlock.js";

/**
 * Optional override of the InputDisplayManager to provide custom display for particular blocks if desired.
 */
export class CustomInputDisplayManager extends InputDisplayManager {
    /**
     * Returns preview content for custom input blocks, or null if no custom content is needed.
     * @param nodeData - The node data to display
     * @param contentArea - The content area to update
     * @returns
     */
    public override updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        super.updatePreviewContent(nodeData, contentArea);

        let value = "";
        const inputBlock = nodeData.data as AnyInputBlock;

        if (inputBlock.type === ConnectionPointType.Texture && inputBlock.name === WebCamInputBlockName) {
            const webCamInputBlock = inputBlock as WebCamInputBlock;
            value = webCamInputBlock.webcamSource?.label ?? "Default";
            contentArea.innerHTML = value;
        } else {
            return super.updatePreviewContent(nodeData, contentArea);
        }
    }
}
