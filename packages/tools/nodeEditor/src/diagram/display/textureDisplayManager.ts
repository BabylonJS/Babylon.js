import type { IDisplayManager } from "./displayManager";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import { TextureBlock } from "core/Materials/Node/Blocks/Dual/textureBlock";
import type { RefractionBlock } from "core/Materials/Node/Blocks/PBR/refractionBlock";
import { ReflectionTextureBlock } from "core/Materials/Node/Blocks/Dual/reflectionTextureBlock";
import { TextureLineComponent } from "../../sharedComponents/textureLineComponent";
import { CurrentScreenBlock } from "core/Materials/Node/Blocks/Dual/currentScreenBlock";
import { ParticleTextureBlock } from "core/Materials/Node/Blocks/Particle/particleTextureBlock";
import { ReflectionBlock } from "core/Materials/Node/Blocks/PBR/reflectionBlock";

export class TextureDisplayManager implements IDisplayManager {
    private _previewCanvas: HTMLCanvasElement;
    private _previewImage: HTMLImageElement;

    public getHeaderClass() {
        return "";
    }

    public shouldDisplayPortLabels(): boolean {
        return true;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        return block.name;
    }

    public getBackgroundColor(block: NodeMaterialBlock): string {
        return block.getClassName() === "RefractionBlock" || block.getClassName() === "ReflectionBlock" ? "#6174FA" : "#323232";
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        const textureBlock = block as TextureBlock | ReflectionTextureBlock | RefractionBlock | CurrentScreenBlock;

        if (!this._previewCanvas) {
            contentArea.classList.add("texture-block");
            if (block instanceof TextureBlock) {
                contentArea.classList.add("regular-texture-block");
            }
            if (block instanceof ReflectionTextureBlock || block instanceof ReflectionBlock) {
                contentArea.classList.add("reflection-block");
            }
            if (block instanceof CurrentScreenBlock || block instanceof ParticleTextureBlock) {
                contentArea.classList.add("reduced-texture-block");
            }

            this._previewCanvas = contentArea.ownerDocument!.createElement("canvas");
            this._previewImage = contentArea.ownerDocument!.createElement("img");
            contentArea.appendChild(this._previewImage);
            this._previewImage.classList.add("empty");
        }

        if (textureBlock.texture) {
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
                    this._previewImage.classList.remove("empty");
                }
            );
        } else {
            this._previewImage.classList.add("empty");
        }
    }
}
