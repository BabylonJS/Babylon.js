import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as localStyles from "./meshDisplayManager.module.scss";
import type { MeshSourceBlock } from "core/Particles/Node/Blocks/SolidParticle/meshSourceBlock";

export class MeshDisplayManager implements IDisplayManager {
    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        return nodeData.data.name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        return "#323232";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        const block = nodeData.data as MeshSourceBlock;
        contentArea.classList.add(localStyles["mesh-block"]);

        const meshName = block.customMeshName || "No mesh";
        contentArea.innerHTML = meshName;
    }
}
