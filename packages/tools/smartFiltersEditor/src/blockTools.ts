import type { SmartFilter, AnyInputBlock } from "@babylonjs/smart-filters";
import { ConnectionPointType } from "@babylonjs/smart-filters";

export class BlockTools {
    public static GetColorFromConnectionNodeType(type: ConnectionPointType) {
        let color = "#880000";
        switch (type) {
            case ConnectionPointType.Boolean:
                color = "#51b0e5";
                break;
            case ConnectionPointType.Float:
                color = "#cb9e27";
                break;
            case ConnectionPointType.Color3:
                color = "#b786cb";
                break;
            case ConnectionPointType.Color4:
                color = "#be5126";
                break;
            case ConnectionPointType.Texture:
                color = "#f28e0a";
                break;
        }

        return color;
    }

    public static GetConnectionNodeTypeFromString(blockType: string) {
        switch (blockType) {
            case "Float":
                return ConnectionPointType.Float;
            case "Texture":
                return ConnectionPointType.Texture;
            case "Color3":
                return ConnectionPointType.Color3;
            case "Color4":
                return ConnectionPointType.Color4;
            case "Vector2":
                return ConnectionPointType.Vector2;
            case "WebCam":
                return ConnectionPointType.Texture;
            case "Boolean":
                return ConnectionPointType.Boolean;
        }

        // TODO AutoDetect...
        return ConnectionPointType.Float;
    }

    public static GetStringFromConnectionNodeType(type: ConnectionPointType) {
        switch (type) {
            case ConnectionPointType.Float:
                return "Float";
            case ConnectionPointType.Color3:
                return "Color3";
            case ConnectionPointType.Color4:
                return "Color4";
            case ConnectionPointType.Texture:
                return "Texture";
            case ConnectionPointType.Vector2:
                return "Vector2";
            case ConnectionPointType.Boolean:
                return "Boolean";
        }

        return "";
    }

    /**
     * Gets the list of all input blocks attached to the Smart Filter.
     * @returns The list of input blocks
     */
    public static GetInputBlocks(smartFilter: SmartFilter): AnyInputBlock[] {
        const blocks: AnyInputBlock[] = [];
        for (const block of smartFilter.attachedBlocks) {
            if (block.isInput) {
                blocks.push(block as AnyInputBlock);
            }
        }

        return blocks;
    }
}
