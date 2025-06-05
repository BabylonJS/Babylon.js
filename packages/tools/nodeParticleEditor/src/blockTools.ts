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

/**
 * Static class for BlockTools
 */
export class BlockTools {
    public static GetBlockFromString(data: string) {
        switch (data) {
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
            case "AgeGradientBlock": {
                const block = new ParticleInputBlock("Age gradient");
                block.contextualValue = NodeParticleContextualSources.AgeGradient;
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
