import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import { TextureBlock } from "core/Materials/Node/Blocks/Dual/textureBlock";
import { RefractionBlock } from "core/Materials/Node/Blocks/PBR/refractionBlock";
import { ReflectionTextureBlock } from "core/Materials/Node/Blocks/Dual/reflectionTextureBlock";
import { TextureLineComponent } from "../../sharedComponents/textureLineComponent";
import { CurrentScreenBlock } from "core/Materials/Node/Blocks/Dual/currentScreenBlock";
import { ParticleTextureBlock } from "core/Materials/Node/Blocks/Particle/particleTextureBlock";
import { ReflectionBlock } from "core/Materials/Node/Blocks/PBR/reflectionBlock";
import { TriPlanarBlock } from "core/Materials/Node/Blocks/triPlanarBlock";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as localStyles from "./textureDisplayManager.module.scss";
import * as commonStyles from "./common.module.scss";

export class TextureDisplayManager implements IDisplayManager {
    private _previewCanvas: HTMLCanvasElement;
    private _previewImage: HTMLImageElement;

    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(nodeData: INodeData): string {
        return (nodeData.data as NodeMaterialBlock).name;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        const block = nodeData.data as NodeMaterialBlock;

        switch (block.getClassName()) {
            case "RefractionBlock":
            case "ReflectionBlock":
                return "#6174FA";
            default:
                return "#323232";
        }
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        const block = nodeData.data as NodeMaterialBlock;
        const textureBlock = block as TextureBlock | ReflectionTextureBlock | RefractionBlock | CurrentScreenBlock | TriPlanarBlock;

        if (!this._previewCanvas) {
            contentArea.classList.add(commonStyles["texture-block"]);
            if (block instanceof TextureBlock) {
                contentArea.classList.add(localStyles["regular-texture-block"]);
            }
            if (block instanceof ReflectionTextureBlock || block instanceof ReflectionBlock) {
                contentArea.classList.add(localStyles["reflection-block"]);
            }
            if (block instanceof CurrentScreenBlock || block instanceof ParticleTextureBlock) {
                contentArea.classList.add(localStyles["reduced-texture-block"]);
            }
            if (block instanceof TriPlanarBlock) {
                contentArea.classList.add(localStyles["triplanar-texture-block"]);
            }
            if (block instanceof RefractionBlock) {
                contentArea.classList.add(localStyles["refraction-texture-block"]);
            }

            this._previewCanvas = contentArea.ownerDocument.createElement("canvas");
            this._previewImage = contentArea.ownerDocument.createElement("img");
            contentArea.appendChild(this._previewImage);
            this._previewImage.classList.add(commonStyles.empty);
        }

        if (textureBlock.texture) {
            contentArea.classList.remove(localStyles["hidden"]);
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            TextureLineComponent.UpdatePreview(
                this._previewCanvas,
                textureBlock.texture,
                140,
                {
                    face: 0,
                    displayRed: true,
                    displayAlpha: true,
                    displayBlue: true,
                    displayGreen: true,
                },
                () => {
                    this._previewImage.src = this._previewCanvas.toDataURL("image/png");
                    this._previewImage.classList.remove(commonStyles.empty);
                }
            );
        } else {
            contentArea.classList.add(localStyles["hidden"]);
        }
    }
}
