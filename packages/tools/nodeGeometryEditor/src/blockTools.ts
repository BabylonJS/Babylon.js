
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometry } from "core/Meshes/Node/nodeGeometry";
import { SetPositionsBlock } from "core/Meshes/Node/Blocks/setPositionsBlock";
import { RandomBlock } from "core/Meshes/Node/Blocks/randomBlock";
import { GeometryOutputBlock } from "core/Meshes/Node/Blocks/geometryOutputBlock";
import { BoxBlock } from "core/Meshes/Node/Blocks/Sources/boxBlock";
import { PlaneBlock } from "core/Meshes/Node/Blocks/Sources/planeBlock";

export class BlockTools {
    public static GetBlockFromString(data: string, nodeGeometry: NodeGeometry) {
        switch (data) {
            case "SetPositionsBlock":
                return new SetPositionsBlock("Set positions");
            case "RandomBlock":
                return new RandomBlock("Random");    
            case "GeometryOutputBlock":
                return new GeometryOutputBlock("Output"); 
            case "BoxBlock":
                return new BoxBlock("Box");   
            case "PlaneBlock":
                return new PlaneBlock("Plane");                                              
        }

        return null;
    }

    public static GetColorFromConnectionNodeType(type: NodeGeometryBlockConnectionPointTypes) {
        let color = "#880000";
        switch (type) {
            case NodeGeometryBlockConnectionPointTypes.Float:
                color = "#cb9e27";
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector2:
                color = "#16bcb1";
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector3:
                color = "#b786cb";
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector4:
                color = "#be5126";
                break;
            case NodeGeometryBlockConnectionPointTypes.Geometry:
                color = "#6174FA";
                break;
        }

        return color;
    }

    public static GetConnectionNodeTypeFromString(type: string) {
        switch (type) {
            case "Float":
                return NodeGeometryBlockConnectionPointTypes.Float;
            case "Vector2":
                return NodeGeometryBlockConnectionPointTypes.Vector2;
            case "Vector3":
                return NodeGeometryBlockConnectionPointTypes.Vector3;
            case "Vector4":
                return NodeGeometryBlockConnectionPointTypes.Vector4;
        }

        return NodeGeometryBlockConnectionPointTypes.AutoDetect;
    }

    public static GetStringFromConnectionNodeType(type: NodeGeometryBlockConnectionPointTypes) {
        switch (type) {
            case NodeGeometryBlockConnectionPointTypes.Float:
                return "Float";
            case NodeGeometryBlockConnectionPointTypes.Vector2:
                return "Vector2";
            case NodeGeometryBlockConnectionPointTypes.Vector3:
                return "Vector3";
            case NodeGeometryBlockConnectionPointTypes.Vector4:
                return "Vector4";
        }

        return "";
    }
}
