
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometry } from "core/Meshes/Node/nodeGeometry";
import { SetPositionsBlock } from "core/Meshes/Node/Blocks/setPositionsBlock";
import { SetNormalsBlock } from "core/Meshes/Node/Blocks/setNormalsBlock";
import { ComputeNormalsBlock } from "core/Meshes/Node/Blocks/computeNormalsBlock";
import { RandomBlock } from "core/Meshes/Node/Blocks/randomBlock";
import { GeometryOutputBlock } from "core/Meshes/Node/Blocks/geometryOutputBlock";
import { BoxBlock } from "core/Meshes/Node/Blocks/Sources/boxBlock";
import { PlaneBlock } from "core/Meshes/Node/Blocks/Sources/planeBlock";
import { SphereBlock } from "core/Meshes/Node/Blocks/Sources/sphereBlock";
import { MergeGeometryBlock } from "core/Meshes/Node/Blocks/mergeGeometryBlock";
import { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { MathBlock, MathBlockOperations } from "core/Meshes/Node/Blocks/mathBlock";
import { NodeGeometryContextualSources } from "core/Meshes/Node/Enums/nodeGeometryContextualSources";
import { GeometryElbowBlock } from "core/Meshes/Node/Blocks/geometryElbowBlock";

export class BlockTools {
    public static GetBlockFromString(data: string, nodeGeometry: NodeGeometry) {
        switch (data) {
            case "ComputeNormalsBlock":
                return new ComputeNormalsBlock("Compute normals");
            case "SetPositionsBlock":
                return new SetPositionsBlock("Set positions");
            case "SetNormalsBlock":
                return new SetNormalsBlock("Set normals");
            case "RandomBlock":
                return new RandomBlock("Random");    
            case "GeometryOutputBlock":
                return new GeometryOutputBlock("Output"); 
            case "BoxBlock":
                return new BoxBlock("Box");   
            case "SphereBlock":
                return new SphereBlock("Sphere");                   
            case "PlaneBlock":
                return new PlaneBlock("Plane");                   
            case "ElbowBlock":
                return new GeometryElbowBlock("");    
            case "MergeGeometryBlock":
                return new MergeGeometryBlock("Merge");    
            case "PositionsBlock": {
                const block = new GeometryInputBlock("Positions");
                block.contextualValue = NodeGeometryContextualSources.Positions;
                return block;
            }
            case "NormalsBlock": {
                const block = new GeometryInputBlock("Normals");
                block.contextualValue = NodeGeometryContextualSources.Normals;
                return block;
            }
            case "AddBlock": {
                const block = new MathBlock("Add");
                block.operation = MathBlockOperations.Add;
                return block;
            }       
            case "SubtractBlock": {
                const block = new MathBlock("Subtract");
                block.operation = MathBlockOperations.Subtract;
                return block;
            }       
            case "MultiplyBlock": {
                const block = new MathBlock("Multiply");
                block.operation = MathBlockOperations.Multiply;
                return block;
            }    
            case "DivideBlock": {
                const block = new MathBlock("Divide");
                block.operation = MathBlockOperations.Divide;
                return block;
            }                                       
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
