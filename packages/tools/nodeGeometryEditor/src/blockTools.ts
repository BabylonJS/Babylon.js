import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import { SetPositionsBlock } from "core/Meshes/Node/Blocks/Set/setPositionsBlock";
import { SetNormalsBlock } from "core/Meshes/Node/Blocks/Set/setNormalsBlock";
import { SetColorsBlock } from "core/Meshes/Node/Blocks/Set/setColorsBlock";
import { SetTangentsBlock } from "core/Meshes/Node/Blocks/Set/setTangentsBlock";
import { SetUVsBlock } from "core/Meshes/Node/Blocks/Set/setUVsBlock";
import { ComputeNormalsBlock } from "core/Meshes/Node/Blocks/computeNormalsBlock";
import { RandomBlock } from "core/Meshes/Node/Blocks/randomBlock";
import { NoiseBlock } from "core/Meshes/Node/Blocks/noiseBlock";
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
import { AlignBlock } from "core/Meshes/Node/Blocks/Matrices/alignBlock";
import { TranslationBlock } from "core/Meshes/Node/Blocks/Matrices/translationBlock";
import { MeshBlock } from "core/Meshes/Node/Blocks/Sources/meshBlock";
import { GridBlock } from "core/Meshes/Node/Blocks/Sources/gridBlock";
import { TorusBlock } from "core/Meshes/Node/Blocks/Sources/torusBlock";
import { DiscBlock } from "core/Meshes/Node/Blocks/Sources/discBlock";
import { NullBlock } from "core/Meshes/Node/Blocks/Sources/nullBlock";
import { MergeGeometryBlock } from "core/Meshes/Node/Blocks/mergeGeometryBlock";
import { VectorConverterBlock } from "core/Meshes/Node/Blocks/vectorConverterBlock";
import { NormalizeVectorBlock } from "core/Meshes/Node/Blocks/normalizeVectorBlock";
import { GeometryTransformBlock } from "core/Meshes/Node/Blocks/geometryTransformBlock";
import { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { MathBlock, MathBlockOperations } from "core/Meshes/Node/Blocks/mathBlock";
import { NodeGeometryContextualSources } from "core/Meshes/Node/Enums/nodeGeometryContextualSources";
import { GeometryTrigonometryBlock, GeometryTrigonometryBlockOperations } from "core/Meshes/Node/Blocks/geometryTrigonometryBlock";
import { GeometryElbowBlock } from "core/Meshes/Node/Blocks/geometryElbowBlock";
import { SetMaterialIDBlock } from "core/Meshes/Node/Blocks/Set/setMaterialIDBlock";
import { InstantiateOnVerticesBlock } from "core/Meshes/Node/Blocks/Instances/instantiateOnVerticesBlock";
import { InstantiateOnFacesBlock } from "core/Meshes/Node/Blocks/Instances/instantiateOnFacesBlock";
import { InstantiateOnVolumeBlock } from "core/Meshes/Node/Blocks/Instances/instantiateOnVolumeBlock";
import { InstantiateBlock } from "core/Meshes/Node/Blocks/Instances/instantiateBlock";
import { DebugBlock } from "core/Meshes/Node/Blocks/debugBlock";
import { TeleportInBlock } from "core/Meshes/Node/Blocks/Teleport/teleportInBlock";
import { TeleportOutBlock } from "core/Meshes/Node/Blocks/Teleport/teleportOutBlock";
import { MapRangeBlock } from "core/Meshes/Node/Blocks/mapRangeBlock";
import { GeometryOptimizeBlock } from "core/Meshes/Node/Blocks/geometryOptimizeBlock";
import { IntFloatConverterBlock } from "core/Meshes/Node/Blocks/intFloatConverterBlock";
import { ConditionBlock, ConditionBlockTests } from "core/Meshes/Node/Blocks/conditionBlock";
import { InstantiateLinearBlock } from "core/Meshes/Node/Blocks//Instances/instantiateLinearBlock";
import { InstantiateRadialBlock } from "core/Meshes/Node/Blocks/Instances/instantiateRadialBlock";
import { GeometryCollectionBlock } from "core/Meshes/Node/Blocks/geometryCollectionBlock";
import { GeometryInfoBlock } from "core/Meshes/Node/Blocks/geometryInfoBlock";
import { MappingBlock } from "core/Meshes/Node/Blocks/mappingBlock";
import { MatrixComposeBlock } from "core/Meshes/Node/Blocks/matrixComposeBlock";
import { GeometryTextureBlock } from "core/Meshes/Node/Blocks/Textures/geometryTextureBlock";
import { GeometryTextureFetchBlock } from "core/Meshes/Node/Blocks/Textures/geometryTextureFetchBlock";
import { BoundingBlock } from "core/Meshes/Node/Blocks/boundingBlock";
import { BooleanGeometryBlock } from "core/Meshes/Node/Blocks/booleanGeometryBlock";
import { GeometryArcTan2Block } from "core/Meshes/Node/Blocks/geometryArcTan2Block";
import { GeometryLerpBlock } from "core/Meshes/Node/Blocks/geometryLerpBlock";
import { GeometryNLerpBlock } from "core/Meshes/Node/Blocks/geometryNLerpBlock";
import { GeometrySmoothStepBlock } from "core/Meshes/Node/Blocks/geometrySmoothStepBlock";
import { GeometryStepBlock } from "core/Meshes/Node/Blocks/geometryStepBlock";
import { GeometryModBlock } from "core/Meshes/Node/Blocks/geometryModBlock";
import { GeometryPowBlock } from "core/Meshes/Node/Blocks/geometryPowBlock";
import { GeometryClampBlock } from "core/Meshes/Node/Blocks/geometryClampBlock";
import { GeometryCrossBlock } from "core/Meshes/Node/Blocks/geometryCrossBlock";
import { GeometryCurveBlock } from "core/Meshes/Node/Blocks/geometryCurveBlock";
import { GeometryDesaturateBlock } from "core/Meshes/Node/Blocks/geometryDesaturateBlock";

/**
 * Static class for BlockTools
 */
export class BlockTools {
    public static GetBlockFromString(data: string) {
        switch (data) {
            case "DesaturateBlock":
                return new GeometryDesaturateBlock("Desaturate");
            case "CurveBlock":
                return new GeometryCurveBlock("Curve");
            case "CrossBlock":
                return new GeometryCrossBlock("Cross");
            case "ClampBlock":
                return new GeometryClampBlock("Clamp");
            case "BooleanBlock":
                return new BooleanGeometryBlock("Boolean");
            case "TextureFetchBlock":
                return new GeometryTextureFetchBlock("Texture Fetch");
            case "TextureBlock":
                return new GeometryTextureBlock("Texture");
            case "BoundingBlock":
                return new BoundingBlock("Bounding");
            case "MatrixComposeBlock":
                return new MatrixComposeBlock("Matrix Compose");
            case "GeometryInfoBlock":
                return new GeometryInfoBlock("Geometry Info");
            case "CollectionBlock":
                return new GeometryCollectionBlock("Collection");
            case "OptimizeBlock":
                return new GeometryOptimizeBlock("Optimize");
            case "NullBlock":
                return new NullBlock("Null");
            case "TeleportInBlock":
                return new TeleportInBlock("Teleport In");
            case "TeleportOutBlock":
                return new TeleportOutBlock("Teleport Out");
            case "DebugBlock":
                return new DebugBlock("Debug");
            case "IntFloatConverterBlock":
                return new IntFloatConverterBlock("Int/Float converter");
            case "EqualBlock": {
                const block = new ConditionBlock("Equal");
                block.test = ConditionBlockTests.Equal;
                return block;
            }
            case "NotEqualBlock": {
                const block = new ConditionBlock("Not equal");
                block.test = ConditionBlockTests.NotEqual;
                return block;
            }
            case "LessThanBlock": {
                const block = new ConditionBlock("Less than");
                block.test = ConditionBlockTests.LessThan;
                return block;
            }
            case "LessOrEqualBlock": {
                const block = new ConditionBlock("Less or equal");
                block.test = ConditionBlockTests.LessOrEqual;
                return block;
            }
            case "GreaterThanBlock": {
                const block = new ConditionBlock("Greater than");
                block.test = ConditionBlockTests.GreaterThan;
                return block;
            }
            case "GreaterOrEqualBlock": {
                const block = new ConditionBlock("Greater or equal");
                block.test = ConditionBlockTests.GreaterOrEqual;
                return block;
            }
            case "XorBlock": {
                const block = new ConditionBlock("Xor");
                block.test = ConditionBlockTests.Xor;
                return block;
            }
            case "OrBlock": {
                const block = new ConditionBlock("Or");
                block.test = ConditionBlockTests.Or;
                return block;
            }
            case "AndBlock": {
                const block = new ConditionBlock("And");
                block.test = ConditionBlockTests.And;
                return block;
            }
            case "LerpBlock":
                return new GeometryLerpBlock("Lerp");
            case "NLerpBlock":
                return new GeometryNLerpBlock("NLerp");
            case "SmoothStepBlock":
                return new GeometrySmoothStepBlock("SmoothStep");
            case "StepBlock":
                return new GeometryStepBlock("Step");
            case "MappingBlock":
                return new MappingBlock("Mapping");
            case "SetMaterialIDBlock":
                return new SetMaterialIDBlock("Set material ID");
            case "InstantiateOnVolumeBlock":
                return new InstantiateOnVolumeBlock("Instantiate on volume");
            case "InstantiateOnFacesBlock":
                return new InstantiateOnFacesBlock("Instantiate on faces");
            case "InstantiateOnVerticesBlock":
                return new InstantiateOnVerticesBlock("Instantiate on vertices");
            case "InstantiateBlock":
                return new InstantiateBlock("Instantiate");
            case "MapRangeBlock":
                return new MapRangeBlock("Map Range");
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
            case "AlignBlock":
                return new AlignBlock("Align");
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
            case "SetUVsBlock":
                return new SetUVsBlock("Set UVs");
            case "NoiseBlock":
                return new NoiseBlock("Noise");
            case "RandomBlock":
                return new RandomBlock("Random");
            case "GeometryOutputBlock":
                return new GeometryOutputBlock("Output");
            case "GridBlock":
                return new GridBlock("Grid");
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
            case "ModBlock":
                return new GeometryModBlock("Mod");
            case "PowBlock":
                return new GeometryPowBlock("Pow");
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
            case "UVsBlock": {
                const block = new GeometryInputBlock("UVs");
                block.contextualValue = NodeGeometryContextualSources.UV;
                return block;
            }
            case "VertexIDBlock": {
                const block = new GeometryInputBlock("Vertex ID");
                block.contextualValue = NodeGeometryContextualSources.VertexID;
                return block;
            }
            case "LoopIDBlock": {
                const block = new GeometryInputBlock("Loop ID");
                block.contextualValue = NodeGeometryContextualSources.LoopID;
                return block;
            }
            case "InstanceIDBlock": {
                const block = new GeometryInputBlock("Instance ID");
                block.contextualValue = NodeGeometryContextualSources.InstanceID;
                return block;
            }
            case "GeometryIDBlock": {
                const block = new GeometryInputBlock("Geometry ID");
                block.contextualValue = NodeGeometryContextualSources.GeometryID;
                return block;
            }
            case "CollectionIDBlock": {
                const block = new GeometryInputBlock("Collection ID");
                block.contextualValue = NodeGeometryContextualSources.CollectionID;
                return block;
            }
            case "FaceIDBlock": {
                const block = new GeometryInputBlock("Face ID");
                block.contextualValue = NodeGeometryContextualSources.FaceID;
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
            case "ToDegreesBlock": {
                const block = new GeometryTrigonometryBlock("To degrees");
                block.operation = GeometryTrigonometryBlockOperations.ToDegrees;
                return block;
            }
            case "ToRadiansBlock": {
                const block = new GeometryTrigonometryBlock("To radians");
                block.operation = GeometryTrigonometryBlockOperations.ToRadians;
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
            case "ArcTan2Block": {
                return new GeometryArcTan2Block("ArcTan2");
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
            case "Exp2Block": {
                const block = new GeometryTrigonometryBlock("Exp2");
                block.operation = GeometryTrigonometryBlockOperations.Exp2;
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
            case "RoundBlock": {
                const block = new GeometryTrigonometryBlock("Round");
                block.operation = GeometryTrigonometryBlockOperations.Round;
                return block;
            }
            case "FloorBlock": {
                const block = new GeometryTrigonometryBlock("Floor");
                block.operation = GeometryTrigonometryBlockOperations.Floor;
                return block;
            }
            case "FractBlock": {
                const block = new GeometryTrigonometryBlock("Fract");
                block.operation = GeometryTrigonometryBlockOperations.Fract;
                return block;
            }
            case "CeilingBlock": {
                const block = new GeometryTrigonometryBlock("Ceiling");
                block.operation = GeometryTrigonometryBlockOperations.Ceiling;
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
            case "InstantiateLinearBlock": {
                return new InstantiateLinearBlock("Instantiate Linear");
            }
            case "InstantiateRadialBlock": {
                return new InstantiateRadialBlock("Instantiate Radial");
            }
        }

        return null;
    }

    public static GetColorFromConnectionNodeType(type: NodeGeometryBlockConnectionPointTypes) {
        let color = "#880000";
        switch (type) {
            case NodeGeometryBlockConnectionPointTypes.Int:
                color = "#51b0e5";
                break;
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
                color = "#84995c";
                break;
            case NodeGeometryBlockConnectionPointTypes.Texture:
                color = "#f28e0a";
                break;
        }

        return color;
    }

    public static GetConnectionNodeTypeFromString(type: string) {
        switch (type) {
            case "Int":
                return NodeGeometryBlockConnectionPointTypes.Int;
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
            case NodeGeometryBlockConnectionPointTypes.Int:
                return "Int";
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
