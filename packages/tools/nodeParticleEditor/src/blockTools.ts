import { ParticleTextureSourceBlock } from "core/Particles";
import { SystemBlock } from "core/Particles/Node/Blocks/systemBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";

/**
 * Static class for BlockTools
 */
export class BlockTools {
    public static GetBlockFromString(data: string) {
        switch (data) {
            case "SystemBlock":
                return new SystemBlock("System");
            case "TextureBlock":
                return new ParticleTextureSourceBlock("Texture");
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
                color = "#cb9e27";
                break;
            case NodeParticleBlockConnectionPointTypes.Vector2:
                color = "#16bcb1";
                break;
            case NodeParticleBlockConnectionPointTypes.Vector3:
                color = "#b786cb";
                break;
            case NodeParticleBlockConnectionPointTypes.Vector4:
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
            case "Vector4":
                return NodeParticleBlockConnectionPointTypes.Vector4;
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
            case NodeParticleBlockConnectionPointTypes.Vector4:
                return "Vector4";
            case NodeParticleBlockConnectionPointTypes.Matrix:
                return "Matrix";
        }

        return "";
    }
}
