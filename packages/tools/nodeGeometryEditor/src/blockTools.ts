import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import { SetPositionsBlock } from "core/Meshes/Node/Blocks/setPositionsBlock";
import { SetNormalsBlock } from "core/Meshes/Node/Blocks/setNormalsBlock";
import { SetColorsBlock } from "core/Meshes/Node/Blocks/setColorsBlock";
import { SetTangentsBlock } from "core/Meshes/Node/Blocks/setTangentsBlock";
import { ComputeNormalsBlock } from "core/Meshes/Node/Blocks/computeNormalsBlock";
import { RandomBlock } from "core/Meshes/Node/Blocks/randomBlock";
import { GeometryOutputBlock } from "core/Meshes/Node/Blocks/geometryOutputBlock";
import { BoxBlock } from "core/Meshes/Node/Blocks/Sources/boxBlock";
import { PlaneBlock } from "core/Meshes/Node/Blocks/Sources/planeBlock";
import { SphereBlock } from "core/Meshes/Node/Blocks/Sources/sphereBlock";
import { CylinderBlock } from "core/Meshes/Node/Blocks/Sources/cylinderBlock";
import { CapsuleBlock } from "core/Meshes/Node/Blocks/Sources/capsuleBlock";
import { IcoSphereBlock } from "core/Meshes/Node/Blocks/Sources/icoSphereBlock";
import { RotationXBlock } from "core/Meshes/Node/Blocks/Matrices/rotationXBlock";
import { RotationYBlock } from "core/Meshes/Node/Blocks/Matrices/rotationYBlock";
import { RotationZBlock } from "core/Meshes/Node/Blocks/Matrices/rotationZBlock";
import { ScalingBlock } from "core/Meshes/Node/Blocks/Matrices/scalingBlock";
import { TranslationBlock } from "core/Meshes/Node/Blocks/Matrices/translationBlock";
import { MeshBlock } from "core/Meshes/Node/Blocks/Sources/meshBlock";
import { TorusBlock } from "core/Meshes/Node/Blocks/Sources/torusBlock";
import { DiscBlock } from "core/Meshes/Node/Blocks/Sources/discBlock";
import { MergeGeometryBlock } from "core/Meshes/Node/Blocks/mergeGeometryBlock";
import { VectorConverterBlock } from "core/Meshes/Node/Blocks/vectorConverterBlock";
import { NormalizeVectorBlock } from "core/Meshes/Node/Blocks/normalizeVectorBlock";
import { GeometryTransformBlock } from "core/Meshes/Node/Blocks/geometryTransformBlock";
import { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { MathBlock, MathBlockOperations } from "core/Meshes/Node/Blocks/mathBlock";
import { NodeGeometryContextualSources } from "core/Meshes/Node/Enums/nodeGeometryContextualSources";
import { GeometryTrigonometryBlock, GeometryTrigonometryBlockOperations } from "core/Meshes/Node/Blocks/geometryTrigonometryBlock";
import { GeometryElbowBlock } from "core/Meshes/Node/Blocks/geometryElbowBlock";

export class BlockTools {
    public static GetBlockFromString(data: string) {
        switch (data) {
            case "NormalizeBlock":
                return new NormalizeVectorBlock("Normalize");
            case "MeshBlock":
                return new MeshBlock("Mesh");
            case "VectorConverterBlock":
                return new VectorConverterBlock("Converter");
            case "TranslationBlock":
                return new TranslationBlock("Translation");
            case "ScalingBlock":
                return new ScalingBlock("Scaling");
            case "RotationXBlock":
                return new RotationXBlock("Rotation X");
            case "RotationYBlock":
                return new RotationYBlock("Rotation Y");
            case "RotationZBlock":
                return new RotationZBlock("Rotation Z");
            case "ComputeNormalsBlock":
                return new ComputeNormalsBlock("Compute normals");
            case "SetPositionsBlock":
                return new SetPositionsBlock("Set positions");
            case "SetNormalsBlock":
                return new SetNormalsBlock("Set normals");
            case "SetColorsBlock":
                return new SetColorsBlock("Set colors");
            case "SetTangentsBlock":
                return new SetTangentsBlock("Set tangents");
            case "RandomBlock":
                return new RandomBlock("Random");
            case "GeometryOutputBlock":
                return new GeometryOutputBlock("Output");
            case "DiscBlock":
                return new DiscBlock("Disc");
            case "IcoSphereBlock":
                return new IcoSphereBlock("IcoSphere");
            case "BoxBlock":
                return new BoxBlock("Box");
            case "TorusBlock":
                return new TorusBlock("Torus");
            case "SphereBlock":
                return new SphereBlock("Sphere");
            case "CylinderBlock":
                return new CylinderBlock("Cylinder");
            case "CapsuleBlock":
                return new CapsuleBlock("Capsule");
            case "PlaneBlock":
                return new PlaneBlock("Plane");
            case "ElbowBlock":
                return new GeometryElbowBlock("");
            case "MergeBlock":
                return new MergeGeometryBlock("Merge");
            case "TransformBlock":
                return new GeometryTransformBlock("Transform");
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
            case "ColorsBlock": {
                const block = new GeometryInputBlock("Colors");
                block.contextualValue = NodeGeometryContextualSources.Colors;
                return block;
            }      
            case "TangentsBlock": {
                const block = new GeometryInputBlock("Tangents");
                block.contextualValue = NodeGeometryContextualSources.Tangents;
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
            case "AbsBlock": {
                const block = new GeometryTrigonometryBlock("Abs");
                block.operation = GeometryTrigonometryBlockOperations.Abs;
                return block;
            }
            case "ArcCosBlock": {
                const block = new GeometryTrigonometryBlock("ArcCos");
                block.operation = GeometryTrigonometryBlockOperations.ArcCos;
                return block;
            }
            case "ArcSinBlock": {
                const block = new GeometryTrigonometryBlock("ArcSin");
                block.operation = GeometryTrigonometryBlockOperations.ArcSin;
                return block;
            }
            case "ArcTanBlock": {
                const block = new GeometryTrigonometryBlock("ArcTan");
                block.operation = GeometryTrigonometryBlockOperations.ArcTan;
                return block;
            }
            case "CosBlock": {
                const block = new GeometryTrigonometryBlock("Cos");
                block.operation = GeometryTrigonometryBlockOperations.Cos;
                return block;
            }
            case "ExpBlock": {
                const block = new GeometryTrigonometryBlock("Exp");
                block.operation = GeometryTrigonometryBlockOperations.Exp;
                return block;
            }
            case "LogBlock": {
                const block = new GeometryTrigonometryBlock("Log");
                block.operation = GeometryTrigonometryBlockOperations.Log;
                return block;
            }
            case "SinBlock": {
                const block = new GeometryTrigonometryBlock("Sin");
                block.operation = GeometryTrigonometryBlockOperations.Sin;
                return block;
            }
            case "SignBlock": {
                const block = new GeometryTrigonometryBlock("Sign");
                block.operation = GeometryTrigonometryBlockOperations.Sign;
                return block;
            }
            case "TanBlock": {
                const block = new GeometryTrigonometryBlock("Tan");
                block.operation = GeometryTrigonometryBlockOperations.Tan;
                return block;
            }
            case "SqrtBlock": {
                const block = new GeometryTrigonometryBlock("Sqrt");
                block.operation = GeometryTrigonometryBlockOperations.Sqrt;
                return block;
            }
            case "NegateBlock": {
                const block = new GeometryTrigonometryBlock("Negate");
                block.operation = GeometryTrigonometryBlockOperations.Negate;
                return block;
            }
            case "OneMinusBlock": {
                const block = new GeometryTrigonometryBlock("OneMinus");
                block.operation = GeometryTrigonometryBlockOperations.OneMinus;
                return block;
            }
            case "ReciprocalBlock": {
                const block = new GeometryTrigonometryBlock("Reciprocal");
                block.operation = GeometryTrigonometryBlockOperations.Reciprocal;
                return block;
            }
            case "MinBlock": {
                const block = new MathBlock("Min");
                block.operation = MathBlockOperations.Min;
                return block;
            }
            case "MaxBlock": {
                const block = new MathBlock("Max");
                block.operation = MathBlockOperations.Max;
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
            case NodeGeometryBlockConnectionPointTypes.Matrix:
                color = "#591990";
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
            case "Matrix":
                return NodeGeometryBlockConnectionPointTypes.Matrix;
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
            case NodeGeometryBlockConnectionPointTypes.Matrix:
                return "Matrix";
        }

        return "";
    }
}
