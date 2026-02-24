import { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";
import { ParticleTextureSourceBlock } from "core/Particles/Node/Blocks/particleSourceTextureBlock";
import { UpdateDirectionBlock } from "core/Particles/Node/Blocks/Update/updateDirectionBlock";
import { UpdatePositionBlock } from "core/Particles/Node/Blocks/Update/updatePositionBlock";
import { SystemBlock } from "core/Particles/Node/Blocks/systemBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleContextualSources } from "core/Particles/Node/Enums/nodeParticleContextualSources";
import { ParticleMathBlock, ParticleMathBlockOperations } from "core/Particles/Node/Blocks/particleMathBlock";
import { ParticleNumberMathBlock, ParticleNumberMathBlockOperations } from "core/Particles/Node/Blocks/particleNumberMathBlock";
import { ParticleVectorMathBlock, ParticleVectorMathBlockOperations } from "core/Particles/Node/Blocks/particleVectorMathBlock";
import { UpdateColorBlock } from "core/Particles/Node/Blocks/Update/updateColorBlock";
import { ParticleLerpBlock } from "core/Particles/Node/Blocks/particleLerpBlock";
import { UpdateScaleBlock } from "core/Particles/Node/Blocks/Update/updateScaleBlock";
import { UpdateSizeBlock } from "core/Particles/Node/Blocks/Update/updateSizeBlock";
import { ParticleGradientValueBlock } from "core/Particles/Node/Blocks/particleGradientValueBlock";
import { ParticleGradientBlock } from "core/Particles/Node/Blocks/particleGradientBlock";
import { ParticleConverterBlock } from "core/Particles/Node/Blocks/particleConverterBlock";
import { ParticleTrigonometryBlock, ParticleTrigonometryBlockOperations } from "core/Particles/Node/Blocks/particleTrigonometryBlock";
import { ParticleRandomBlock } from "core/Particles/Node/Blocks/particleRandomBlock";
import { ParticleDebugBlock } from "core/Particles/Node/Blocks/particleDebugBlock";
import { ParticleElbowBlock } from "core/Particles/Node/Blocks/particleElbowBlock";
import { ParticleTeleportInBlock } from "core/Particles/Node/Blocks/Teleport/particleTeleportInBlock";
import { ParticleTeleportOutBlock } from "core/Particles/Node/Blocks/Teleport/particleTeleportOutBlock";
import { UpdateAngleBlock } from "core/Particles/Node/Blocks/Update/updateAngleBlock";
import { UpdateAgeBlock } from "core/Particles/Node/Blocks/Update/updateAgeBlock";
import { NodeParticleSystemSources } from "core/Particles/Node/Enums/nodeParticleSystemSources";
import { BasicPositionUpdateBlock } from "core/Particles/Node/Blocks/Update/basicPositionUpdateBlock";
import { ParticleTriggerBlock } from "core/Particles/Node/Blocks/Triggers/particleTriggerBlock";
import { SetupSpriteSheetBlock } from "core/Particles/Node/Blocks/Emitters/setupSpriteSheetBlock";
import { BasicSpriteUpdateBlock } from "core/Particles/Node/Blocks/Update/basicSpriteUpdateBlock";
import { UpdateSpriteCellIndexBlock } from "core/Particles/Node/Blocks/Update/updateSpriteCellIndexBlock";
import { UpdateFlowMapBlock } from "core/Particles/Node/Blocks/Update/updateFlowMapBlock";
import { UpdateNoiseBlock } from "core/Particles/Node/Blocks/Update/updateNoiseBlock";
import { ParticleConditionBlock, ParticleConditionBlockTests } from "core/Particles/Node/Blocks/Conditions/particleConditionBlock";
import { CreateParticleBlock } from "core/Particles/Node/Blocks/Emitters/createParticleBlock";
import { BoxShapeBlock } from "core/Particles/Node/Blocks/Emitters/boxShapeBlock";
import { ConeShapeBlock } from "core/Particles/Node/Blocks/Emitters/coneShapeBlock";
import { CylinderShapeBlock } from "core/Particles/Node/Blocks/Emitters/cylinderShapeBlock";
import { CustomShapeBlock } from "core/Particles/Node/Blocks/Emitters/customShapeBlock";
import { MeshShapeBlock } from "core/Particles/Node/Blocks/Emitters/meshShapeBlock";
import { PointShapeBlock } from "core/Particles/Node/Blocks/Emitters/pointShapeBlock";
import { SphereShapeBlock } from "core/Particles/Node/Blocks/Emitters/sphereShapeBlock";
import { UpdateAttractorBlock } from "core/Particles/Node/Blocks/Update/updateAttractorBlock";
import { AlignAngleBlock } from "core/Particles/Node/Blocks/Update/alignAngleBlock";
import { BasicColorUpdateBlock } from "core/Particles/Node/Blocks/Update/basicColorUpdateBlock";
import { ParticleLocalVariableBlock } from "core/Particles/Node/Blocks/particleLocalVariableBlock";
import { ParticleVectorLengthBlock } from "core/Particles/Node/Blocks/particleVectorLengthBlock";
import { ParticleFloatToIntBlock } from "core/Particles/Node/Blocks/particleFloatToIntBlock";
import { ParticleClampBlock } from "core/Particles/Node/Blocks/particleClampBlock";
import { ParticleNLerpBlock } from "core/Particles/Node/Blocks/particleNLerpBlock";
import { ParticleSmoothStepBlock } from "core/Particles/Node/Blocks/particleSmoothStepBlock";
import { ParticleStepBlock } from "core/Particles/Node/Blocks/particleStepBlock";

/**
 * Static class for BlockTools
 */
export class BlockTools {
    public static GetBlockFromString(data: string) {
        switch (data) {
            case "NLerpBlock":
                return new ParticleNLerpBlock("NLerp");
            case "StepBlock":
                return new ParticleStepBlock("Step");
            case "SmoothStepBlock":
                return new ParticleSmoothStepBlock("SmoothStep");
            case "ClampBlock":
                return new ParticleClampBlock("Clamp");
            case "LocalVariableBlock":
                return new ParticleLocalVariableBlock("Local variable");
            case "VectorLengthBlock":
                return new ParticleVectorLengthBlock("Vector length");
            case "AlignAngleBlock":
                return new AlignAngleBlock("Align angle");
            case "CreateParticleBlock":
                return new CreateParticleBlock("Create particle");
            case "EqualBlock": {
                const block = new ParticleConditionBlock("Equal");
                block.test = ParticleConditionBlockTests.Equal;
                return block;
            }
            case "NotEqualBlock": {
                const block = new ParticleConditionBlock("Not equal");
                block.test = ParticleConditionBlockTests.NotEqual;
                return block;
            }
            case "LessThanBlock": {
                const block = new ParticleConditionBlock("Less than");
                block.test = ParticleConditionBlockTests.LessThan;
                return block;
            }
            case "LessOrEqualBlock": {
                const block = new ParticleConditionBlock("Less or equal");
                block.test = ParticleConditionBlockTests.LessOrEqual;
                return block;
            }
            case "GreaterThanBlock": {
                const block = new ParticleConditionBlock("Greater than");
                block.test = ParticleConditionBlockTests.GreaterThan;
                return block;
            }
            case "GreaterOrEqualBlock": {
                const block = new ParticleConditionBlock("Greater or equal");
                block.test = ParticleConditionBlockTests.GreaterOrEqual;
                return block;
            }
            case "XorBlock": {
                const block = new ParticleConditionBlock("Xor");
                block.test = ParticleConditionBlockTests.Xor;
                return block;
            }
            case "OrBlock": {
                const block = new ParticleConditionBlock("Or");
                block.test = ParticleConditionBlockTests.Or;
                return block;
            }
            case "AndBlock": {
                const block = new ParticleConditionBlock("And");
                block.test = ParticleConditionBlockTests.And;
                return block;
            }
            case "UpdateSpriteCellIndexBlock":
                return new UpdateSpriteCellIndexBlock("Update sprite cell index");
            case "BasicSpriteUpdateBlock":
                return new BasicSpriteUpdateBlock("Basic sprite update");
            case "SetupSpriteSheetBlock":
                return new SetupSpriteSheetBlock("Setup sprite sheet");
            case "TriggerBlock":
                return new ParticleTriggerBlock("Trigger");
            case "BasicPositionUpdateBlock":
                return new BasicPositionUpdateBlock("Basic position update");
            case "BasicColorUpdateBlock":
                return new BasicColorUpdateBlock("Basic color update");
            case "TeleportInBlock":
                return new ParticleTeleportInBlock("Teleport In");
            case "TeleportOutBlock":
                return new ParticleTeleportOutBlock("Teleport Out");
            case "ElbowBlock":
                return new ParticleElbowBlock("");
            case "DebugBlock":
                return new ParticleDebugBlock("Debug");
            case "ConverterBlock":
                return new ParticleConverterBlock("Converter");
            case "GradientBlock":
                return new ParticleGradientBlock("Gradient");
            case "GradientValueBlock":
                return new ParticleGradientValueBlock("Gradient value");
            case "LerpBlock":
                return new ParticleLerpBlock("Lerp");
            case "UpdatePositionBlock":
                return new UpdatePositionBlock("Update position");
            case "UpdateDirectionBlock":
                return new UpdateDirectionBlock("Update direction");
            case "UpdateColorBlock":
                return new UpdateColorBlock("Update color");
            case "UpdateScaleBlock":
                return new UpdateScaleBlock("Update scale");
            case "UpdateSizeBlock":
                return new UpdateSizeBlock("Update size");
            case "UpdateAngleBlock":
                return new UpdateAngleBlock("Update angle");
            case "UpdateAgeBlock":
                return new UpdateAgeBlock("Update age");
            case "UpdateFlowMapBlock":
                return new UpdateFlowMapBlock("Update flow map");
            case "UpdateNoiseBlock":
                return new UpdateNoiseBlock("Update noise");
            case "UpdateAttractorBlock":
                return new UpdateAttractorBlock("Update attractor");
            case "SystemBlock":
                return new SystemBlock("System");
            case "TextureBlock":
                return new ParticleTextureSourceBlock("Texture");
            case "BoxShapeBlock":
                return new BoxShapeBlock("Box shape");
            case "ConeShapeBlock":
                return new ConeShapeBlock("Cone shape");
            case "CustomShapeBlock":
                return new CustomShapeBlock("Custom shape");
            case "CylinderShapeBlock":
                return new CylinderShapeBlock("Cylinder shape");
            case "MeshShapeBlock":
                return new MeshShapeBlock("Mesh shape");
            case "PointShapeBlock":
                return new PointShapeBlock("Point shape");
            case "SphereShapeBlock":
                return new SphereShapeBlock("Sphere shape");
            case "PositionBlock": {
                const block = new ParticleInputBlock("Position");
                block.contextualValue = NodeParticleContextualSources.Position;
                return block;
            }
            case "DirectionBlock": {
                const block = new ParticleInputBlock("Direction");
                block.contextualValue = NodeParticleContextualSources.Direction;
                return block;
            }
            case "DirectionScaleBlock": {
                const block = new ParticleInputBlock("Direction scale");
                block.contextualValue = NodeParticleContextualSources.DirectionScale;
                return block;
            }
            case "ScaledDirectionBlock": {
                const block = new ParticleInputBlock("Scaled direction");
                block.contextualValue = NodeParticleContextualSources.ScaledDirection;
                return block;
            }
            case "ScaleBlock": {
                const block = new ParticleInputBlock("Scale");
                block.contextualValue = NodeParticleContextualSources.Scale;
                return block;
            }
            case "SizeBlock": {
                const block = new ParticleInputBlock("Size");
                block.contextualValue = NodeParticleContextualSources.Size;
                return block;
            }
            case "ColorBlock": {
                const block = new ParticleInputBlock("Color");
                block.contextualValue = NodeParticleContextualSources.Color;
                return block;
            }
            case "InitialColorBlock": {
                const block = new ParticleInputBlock("Initial Color");
                block.contextualValue = NodeParticleContextualSources.InitialColor;
                return block;
            }
            case "InitialDirectionBlock": {
                const block = new ParticleInputBlock("Initial Direction");
                block.contextualValue = NodeParticleContextualSources.InitialDirection;
                return block;
            }
            case "ColorDeadBlock": {
                const block = new ParticleInputBlock("Color Dead");
                block.contextualValue = NodeParticleContextualSources.ColorDead;
                return block;
            }
            case "AgeBlock": {
                const block = new ParticleInputBlock("Age");
                block.contextualValue = NodeParticleContextualSources.Age;
                return block;
            }
            case "LifetimeBlock": {
                const block = new ParticleInputBlock("Lifetime");
                block.contextualValue = NodeParticleContextualSources.Lifetime;
                return block;
            }
            case "AngleBlock": {
                const block = new ParticleInputBlock("Angle");
                block.contextualValue = NodeParticleContextualSources.Angle;
                return block;
            }
            case "AgeGradientBlock": {
                const block = new ParticleInputBlock("Age gradient");
                block.contextualValue = NodeParticleContextualSources.AgeGradient;
                return block;
            }
            case "SpriteCellEndBlock": {
                const block = new ParticleInputBlock("Sprite cell end");
                block.contextualValue = NodeParticleContextualSources.SpriteCellEnd;
                return block;
            }
            case "SpriteCellIndexBlock": {
                const block = new ParticleInputBlock("Sprite cell index");
                block.contextualValue = NodeParticleContextualSources.SpriteCellIndex;
                return block;
            }
            case "SpriteCellStartBlock": {
                const block = new ParticleInputBlock("Sprite cell start");
                block.contextualValue = NodeParticleContextualSources.SpriteCellStart;
                return block;
            }
            case "ColorStepBlock": {
                const block = new ParticleInputBlock("Color Step");
                block.contextualValue = NodeParticleContextualSources.ColorStep;
                return block;
            }
            case "ScaledColorStepBlock": {
                const block = new ParticleInputBlock("Scaled Color Step");
                block.contextualValue = NodeParticleContextualSources.ScaledColorStep;
                return block;
            }
            case "LocalPositionUpdatedBlock": {
                const block = new ParticleInputBlock("Local Position Updated");
                block.contextualValue = NodeParticleContextualSources.LocalPositionUpdated;
                return block;
            }
            case "TimeBlock": {
                const block = new ParticleInputBlock("Time");
                block.systemSource = NodeParticleSystemSources.Time;
                return block;
            }
            case "DeltaBlock": {
                const block = new ParticleInputBlock("Delta");
                block.systemSource = NodeParticleSystemSources.Delta;
                return block;
            }
            case "EmitterPositionBlock": {
                const block = new ParticleInputBlock("Emitter position");
                block.systemSource = NodeParticleSystemSources.Emitter;
                return block;
            }
            case "CameraPositionBlock": {
                const block = new ParticleInputBlock("Camera position");
                block.systemSource = NodeParticleSystemSources.CameraPosition;
                return block;
            }
            case "AddBlock": {
                const block = new ParticleMathBlock("Add");
                block.operation = ParticleMathBlockOperations.Add;
                return block;
            }
            case "SubtractBlock": {
                const block = new ParticleMathBlock("Subtract");
                block.operation = ParticleMathBlockOperations.Subtract;
                return block;
            }
            case "MultiplyBlock": {
                const block = new ParticleMathBlock("Multiply");
                block.operation = ParticleMathBlockOperations.Multiply;
                return block;
            }
            case "DivideBlock": {
                const block = new ParticleMathBlock("Divide");
                block.operation = ParticleMathBlockOperations.Divide;
                return block;
            }
            case "MinBlock": {
                const block = new ParticleMathBlock("Min");
                block.operation = ParticleMathBlockOperations.Min;
                return block;
            }
            case "MaxBlock": {
                const block = new ParticleMathBlock("Max");
                block.operation = ParticleMathBlockOperations.Max;
                return block;
            }
            case "ModuloBlock": {
                const block = new ParticleNumberMathBlock("Modulo");
                block.operation = ParticleNumberMathBlockOperations.Modulo;
                return block;
            }
            case "PowBlock": {
                const block = new ParticleNumberMathBlock("Pow");
                block.operation = ParticleNumberMathBlockOperations.Pow;
                return block;
            }
            case "DotBlock": {
                const block = new ParticleVectorMathBlock("Dot");
                block.operation = ParticleVectorMathBlockOperations.Dot;
                return block;
            }
            case "DistanceBlock": {
                const block = new ParticleVectorMathBlock("Distance");
                block.operation = ParticleVectorMathBlockOperations.Distance;
                return block;
            }
            case "ToDegreesBlock": {
                const block = new ParticleTrigonometryBlock("To degrees");
                block.operation = ParticleTrigonometryBlockOperations.ToDegrees;
                return block;
            }
            case "ToRadiansBlock": {
                const block = new ParticleTrigonometryBlock("To radians");
                block.operation = ParticleTrigonometryBlockOperations.ToRadians;
                return block;
            }
            case "AbsBlock": {
                const block = new ParticleTrigonometryBlock("Abs");
                block.operation = ParticleTrigonometryBlockOperations.Abs;
                return block;
            }
            case "ArcCosBlock": {
                const block = new ParticleTrigonometryBlock("ArcCos");
                block.operation = ParticleTrigonometryBlockOperations.ArcCos;
                return block;
            }
            case "ArcSinBlock": {
                const block = new ParticleTrigonometryBlock("ArcSin");
                block.operation = ParticleTrigonometryBlockOperations.ArcSin;
                return block;
            }
            case "ArcTanBlock": {
                const block = new ParticleTrigonometryBlock("ArcTan");
                block.operation = ParticleTrigonometryBlockOperations.ArcTan;
                return block;
            }
            case "CosBlock": {
                const block = new ParticleTrigonometryBlock("Cos");
                block.operation = ParticleTrigonometryBlockOperations.Cos;
                return block;
            }
            case "ExpBlock": {
                const block = new ParticleTrigonometryBlock("Exp");
                block.operation = ParticleTrigonometryBlockOperations.Exp;
                return block;
            }
            case "Exp2Block": {
                const block = new ParticleTrigonometryBlock("Exp2");
                block.operation = ParticleTrigonometryBlockOperations.Exp2;
                return block;
            }
            case "LogBlock": {
                const block = new ParticleTrigonometryBlock("Log");
                block.operation = ParticleTrigonometryBlockOperations.Log;
                return block;
            }
            case "SinBlock": {
                const block = new ParticleTrigonometryBlock("Sin");
                block.operation = ParticleTrigonometryBlockOperations.Sin;
                return block;
            }
            case "SignBlock": {
                const block = new ParticleTrigonometryBlock("Sign");
                block.operation = ParticleTrigonometryBlockOperations.Sign;
                return block;
            }
            case "TanBlock": {
                const block = new ParticleTrigonometryBlock("Tan");
                block.operation = ParticleTrigonometryBlockOperations.Tan;
                return block;
            }
            case "SqrtBlock": {
                const block = new ParticleTrigonometryBlock("Sqrt");
                block.operation = ParticleTrigonometryBlockOperations.Sqrt;
                return block;
            }
            case "NegateBlock": {
                const block = new ParticleTrigonometryBlock("Negate");
                block.operation = ParticleTrigonometryBlockOperations.Negate;
                return block;
            }
            case "OneMinusBlock": {
                const block = new ParticleTrigonometryBlock("OneMinus");
                block.operation = ParticleTrigonometryBlockOperations.OneMinus;
                return block;
            }
            case "ReciprocalBlock": {
                const block = new ParticleTrigonometryBlock("Reciprocal");
                block.operation = ParticleTrigonometryBlockOperations.Reciprocal;
                return block;
            }
            case "RoundBlock": {
                const block = new ParticleTrigonometryBlock("Round");
                block.operation = ParticleTrigonometryBlockOperations.Round;
                return block;
            }
            case "FloorBlock": {
                const block = new ParticleTrigonometryBlock("Floor");
                block.operation = ParticleTrigonometryBlockOperations.Floor;
                return block;
            }
            case "FractBlock": {
                const block = new ParticleTrigonometryBlock("Fract");
                block.operation = ParticleTrigonometryBlockOperations.Fract;
                return block;
            }
            case "CeilingBlock": {
                const block = new ParticleTrigonometryBlock("Ceiling");
                block.operation = ParticleTrigonometryBlockOperations.Ceiling;
                return block;
            }
            case "RandomBlock": {
                return new ParticleRandomBlock("Random");
            }
            case "FloatToIntBlock": {
                return new ParticleFloatToIntBlock("Float to Int");
            }
        }

        return null;
    }

    public static GetColorFromConnectionNodeType(type: NodeParticleBlockConnectionPointTypes) {
        let color = "#964848";
        switch (type) {
            case NodeParticleBlockConnectionPointTypes.Int:
                color = "#51b0e5";
                break;
            case NodeParticleBlockConnectionPointTypes.Float:
            case NodeParticleBlockConnectionPointTypes.FloatGradient:
                color = "#cb9e27";
                break;
            case NodeParticleBlockConnectionPointTypes.Vector2:
            case NodeParticleBlockConnectionPointTypes.Vector2Gradient:
                color = "#16bcb1";
                break;
            case NodeParticleBlockConnectionPointTypes.Vector3:
            case NodeParticleBlockConnectionPointTypes.Vector3Gradient:
                color = "#b786cb";
                break;
            case NodeParticleBlockConnectionPointTypes.Color4:
            case NodeParticleBlockConnectionPointTypes.Color4Gradient:
                color = "#be5126";
                break;
            case NodeParticleBlockConnectionPointTypes.Matrix:
                color = "#591990";
                break;
            case NodeParticleBlockConnectionPointTypes.Particle:
                color = "#84995c";
                break;
            case NodeParticleBlockConnectionPointTypes.Texture:
                color = "#f28e0a";
                break;
            case NodeParticleBlockConnectionPointTypes.System:
                color = "#f20a2e";
                break;
        }

        return color;
    }

    public static GetConnectionNodeTypeFromString(type: string) {
        switch (type) {
            case "Int":
                return NodeParticleBlockConnectionPointTypes.Int;
            case "Float":
                return NodeParticleBlockConnectionPointTypes.Float;
            case "Vector2":
                return NodeParticleBlockConnectionPointTypes.Vector2;
            case "Vector3":
                return NodeParticleBlockConnectionPointTypes.Vector3;
            case "Color4":
                return NodeParticleBlockConnectionPointTypes.Color4;
            case "Matrix":
                return NodeParticleBlockConnectionPointTypes.Matrix;
        }

        return NodeParticleBlockConnectionPointTypes.AutoDetect;
    }

    public static GetStringFromConnectionNodeType(type: NodeParticleBlockConnectionPointTypes) {
        switch (type) {
            case NodeParticleBlockConnectionPointTypes.Int:
                return "Int";
            case NodeParticleBlockConnectionPointTypes.Float:
                return "Float";
            case NodeParticleBlockConnectionPointTypes.Vector2:
                return "Vector2";
            case NodeParticleBlockConnectionPointTypes.Vector3:
                return "Vector3";
            case NodeParticleBlockConnectionPointTypes.Color4:
                return "Color4";
            case NodeParticleBlockConnectionPointTypes.Matrix:
                return "Matrix";
        }

        return "";
    }
}
