import type { SmartFilter, AnyInputBlock } from "smart-filters";
import { ConnectionPointType } from "smart-filters";

export class BlockTools {
    /**
     * Gets a color to use for a connection node based on its type.
     * @param type - The connection node type
     * @returns The color to use
     */
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

    /**
     * Gets the connection node type from a string.
     * @param blockType - The block type as a string
     * @returns  The connection node type
     */
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

    /**
     * Gets a string from a connection node type.
     * @param type - The connection node type
     * @returns The string representation of the connection node type
     */
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
     * @param smartFilter - The smart filter to get the input blocks from
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
