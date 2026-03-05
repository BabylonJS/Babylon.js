import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";

/**
 * Static class for BlockTools
 */
export class BlockTools {
    /**
     * Gets a color based on a FlowGraph data connection type
     * @param type the RichType typeName
     * @returns a hex color string
     */
    public static GetColorFromConnectionType(type: string): string {
        switch (type) {
            case FlowGraphTypes.Number:
                return "#84995c"; // green
            case FlowGraphTypes.Boolean:
                return "#a1124e"; // magenta
            case FlowGraphTypes.String:
                return "#47A7E4"; // blue
            case FlowGraphTypes.Vector2:
            case FlowGraphTypes.Vector3:
            case FlowGraphTypes.Vector4:
                return "#c0962d"; // gold
            case FlowGraphTypes.Matrix:
                return "#607d8b"; // blue-grey
            case FlowGraphTypes.Color3:
            case FlowGraphTypes.Color4:
                return "#e91e63"; // pink
            case FlowGraphTypes.Object:
                return "#6e6e6e"; // grey
            case FlowGraphTypes.Integer:
                return "#40916c"; // darker green
            default:
                return "#999"; // default grey
        }
    }

    /**
     * Gets a color for signal connections (execution flow)
     * @returns a hex color string
     */
    public static GetSignalColor(): string {
        return "#e0e0e0"; // white/light
    }

    /**
     * Gets a color from a FlowGraphConnectionType (Input/Output) for signals
     * @param connectionType the connection type
     * @returns a hex color string
     */
    public static GetColorFromFlowGraphConnectionType(connectionType: FlowGraphConnectionType): string {
        switch (connectionType) {
            case FlowGraphConnectionType.Input:
                return "#e0e0e0";
            case FlowGraphConnectionType.Output:
                return "#e0e0e0";
            default:
                return "#999";
        }
    }

    /**
     * Determines the color for a data connection based on its richType
     * @param connection the data connection
     * @returns a hex color string
     */
    public static GetColorForDataConnection(connection: FlowGraphDataConnection<any>): string {
        return BlockTools.GetColorFromConnectionType(connection.richType.typeName);
    }
}
