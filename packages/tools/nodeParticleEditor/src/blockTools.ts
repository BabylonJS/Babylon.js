import { BoxEmitterBlock } from "core/Particles/Node/Blocks/Emitters/boxEmitterBlock";
import { PointEmitterBlock } from "core/Particles/Node/Blocks/Emitters/pointEmitterBlock";
import { SphereEmitterBlock } from "core/Particles/Node/Blocks/Emitters/sphereEmitterBlock";
import { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";
import { ParticleTextureSourceBlock } from "core/Particles/Node/Blocks/particleSourceTextureBlock";
import { RandomRangeBlock } from "core/Particles/Node/Blocks/randomRangeBlock";
import { UpdateDirectionBlock } from "core/Particles/Node/Blocks/Update/updateDirectionBlock";
import { UpdatePositionBlock } from "core/Particles/Node/Blocks/Update/updatePositionBlock";
import { SystemBlock } from "core/Particles/Node/Blocks/systemBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleContextualSources } from "core/Particles/Node/Enums/nodeParticleContextualSources";
import { ParticleMathBlock, ParticleMathBlockOperations } from "core/Particles/Node/Blocks/particleMathBlock";
import { UpdateColorBlock } from "core/Particles/Node/Blocks/Update/updateColorBlock";
import { ParticleLerpBlock } from "core/Particles/Node/Blocks/particleLerpBlock";
import { UpdateScaleBlock } from "core/Particles/Node/Blocks/Update/updateScaleBlock";
import { ParticleGradientEntryBlock } from "core/Particles/Node/Blocks/particleGradientEntryBlock";
import { ParticleGradientBlock } from "core/Particles/Node/Blocks/particleGradientBlock";
import { ParticleConverterBlock } from "core/Particles/Node/Blocks/particleConverterBlock";
import { CustomEmitterBlock } from "core/Particles/Node/Blocks/Emitters/customEmitterBlock";
import { ParticleTrigonometryBlock, ParticleTrigonometryBlockOperations } from "core/Particles/Node/Blocks/particleTrigonometryBlock";
import { ParticleRandomBlock } from "core/Particles/Node/Blocks/particleRandomBlock";
import { ParticleDebugBlock } from "core/Particles/Node/Blocks/particleDebugBlock";
import { ParticleElbowBlock } from "core/Particles/Node/Blocks/particleElbowBlock";
import { ParticleTeleportInBlock } from "core/Particles/Node/Blocks/Teleport/particleTeleportInBlock";
import { ParticleTeleportOutBlock } from "core/Particles/Node/Blocks/Teleport/particleTeleportOutBlock";
import { UpdateAngleBlock } from "core/Particles/Node/Blocks/Update/updateAngleBlock";
import { NodeParticleSystemSources } from "core/Particles/Node/Enums/nodeParticleSystemSources";
import { BasicUpdateBlock } from "core/Particles/Node/Blocks/Update/basicUpdateBlock";
import { BasicConditionBlock } from "core/Particles/Node/Blocks/Conditions/basicConditionBlock";

/**
 * Static class for BlockTools
 */
export class BlockTools {
    public static GetBlockFromString(data: string) {
        switch (data) {
            case "BasicConditionBlock":
                return new BasicConditionBlock("Basic condition");
            case "BasicUpdateBlock":
                return new BasicUpdateBlock("Basic update");
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
            case "GradientEntryBlock":
                return new ParticleGradientEntryBlock("Gradient entry");
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
            case "UpdateAngleBlock":
                return new UpdateAngleBlock("Update angle");
            case "SystemBlock":
                return new SystemBlock("System");
            case "TextureBlock":
                return new ParticleTextureSourceBlock("Texture");
            case "BoxEmitterBlock":
                return new BoxEmitterBlock("Box emitter");
            case "SphereEmitterBlock":
                return new SphereEmitterBlock("Sphere emitter");
            case "PointEmitterBlock":
                return new PointEmitterBlock("Point emitter");
            case "CustomEmitterBlock":
                return new CustomEmitterBlock("Custom emitter");
            case "RandomRangeBlock":
                return new RandomRangeBlock("Random range");
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
            case "ColorBlock": {
                const block = new ParticleInputBlock("Color");
                block.contextualValue = NodeParticleContextualSources.Color;
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
