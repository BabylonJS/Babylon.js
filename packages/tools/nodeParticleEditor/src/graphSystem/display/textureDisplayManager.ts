import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as localStyles from "./textureDisplayManager.module.scss";
import type { NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";
import type { ParticleTextureSourceBlock } from "core/Particles/Node/Blocks/particleSourceTextureBlock";

export class TextureDisplayManager implements IDisplayManager {
    private _previewImage: HTMLImageElement;

    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        return (nodeData.data as NodeGeometryBlock).name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        return "#323232";
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        const block = nodeData.data as ParticleTextureSourceBlock;

        if (!this._previewImage) {
            contentArea.classList.add(localStyles["texture-block"]);

            this._previewImage = contentArea.ownerDocument.createElement("img");
            contentArea.appendChild(this._previewImage);
            this._previewImage.classList.add(localStyles.empty);
        }

        const url = block.textureDataUrl || block.url;
        if (url) {
            this._previewImage.src = url;
            this._previewImage.classList.remove(localStyles.empty);
        } else {
            this._previewImage.classList.add(localStyles.empty);
        }
    }
}
