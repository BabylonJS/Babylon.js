import { FlowGraphConnectionType } from "core/FlowGraph/flowGraphConnection";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
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
            case FlowGraphTypes.Integer:
                return "#cb9e27";
            case FlowGraphTypes.Boolean:
                return "#a1124e";
            case FlowGraphTypes.String:
                return "#47A7E4";
            case FlowGraphTypes.Vector2:
                return "#16bcb1";
            case FlowGraphTypes.Vector3:
                return "#b786cb";
            case FlowGraphTypes.Vector4:
            case FlowGraphTypes.Quaternion:
                return "#be5126";
            case FlowGraphTypes.Matrix:
            case FlowGraphTypes.Matrix2D:
            case FlowGraphTypes.Matrix3D:
                return "#591990";
            case FlowGraphTypes.Color3:
                return "#b786cb";
            case FlowGraphTypes.Color4:
                return "#be5126";
            case FlowGraphTypes.Object:
                return "#6174FA";
            default:
                return "#999";
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
