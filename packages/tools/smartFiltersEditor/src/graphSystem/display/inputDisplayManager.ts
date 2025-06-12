/* eslint-disable @typescript-eslint/naming-convention */
import { BlockTools } from "../../blockTools.js";
import type { IDisplayManager } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as styles from "../../assets/styles/graphSystem/display/inputDisplayManager.module.scss";
import { ConnectionPointType } from "@babylonjs/smart-filters";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import type { AnyInputBlock } from "@babylonjs/smart-filters";
import { getTextureInputBlockEditorData } from "../getEditorData.js";

export class InputDisplayManager implements IDisplayManager {
    public getHeaderClass(_nodeData: INodeData) {
        return styles["constant"]!;
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public getHeaderText(nodeData: INodeData): string {
        const inputBlock = nodeData.data as AnyInputBlock;
        const name = `${inputBlock.name} (${InputDisplayManager.GetBaseType(inputBlock.type)})`;
        return name;
    }

    public static GetBaseType(type: ConnectionPointType): string {
        return ConnectionPointType[type]!;
    }

    public getBackgroundColor(nodeData: INodeData): string {
        let color = "";
        const inputBlock = nodeData.data as AnyInputBlock;

        switch (inputBlock.type) {
            case ConnectionPointType.Color3: {
                const inputColor = inputBlock.runtimeValue.value;
                const color3 = new Color3(inputColor.r, inputColor.g, inputColor.b);
                color = color3.toHexString();
                break;
            }
            case ConnectionPointType.Color4: {
                const inputColor = inputBlock.runtimeValue.value;
                const color4 = new Color4(inputColor.r, inputColor.g, inputColor.b, inputColor.a);
                color = color4.toHexString();
                break;
            }
            default:
                color = BlockTools.GetColorFromConnectionNodeType(inputBlock.type);
                break;
        }

        return color;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        let value = "";
        const inputBlock = nodeData.data as AnyInputBlock;

        switch (inputBlock.type) {
            case ConnectionPointType.Boolean:
                value = inputBlock.runtimeValue.value ? "True" : "False";
                break;
            case ConnectionPointType.Float:
                value = inputBlock.runtimeValue.value.toFixed(4);
                break;
            case ConnectionPointType.Texture: {
                if (inputBlock.editorData?.urlTypeHint === "video") {
                    value = "Video";
                } else {
                    const style =
                        getTextureInputBlockEditorData(inputBlock).flipY === false
                            ? "transform: scaleY(-1); z-index: -1;"
                            : "";
                    const src = inputBlock.editorData?.url || inputBlock.runtimeValue.value?.getInternalTexture()?.url;
                    value = src ? `<img src="${src}" style="${style}" class="texture-input-preview"/>` : "";
                }
                break;
            }
            case ConnectionPointType.Vector2:
                value = `(${inputBlock.runtimeValue.value.x.toFixed(4)}, ${inputBlock.runtimeValue.value.y.toFixed(4)})`;
        }

        contentArea.innerHTML = value;
        contentArea.classList.add(styles["input-block"]!);
    }
}
