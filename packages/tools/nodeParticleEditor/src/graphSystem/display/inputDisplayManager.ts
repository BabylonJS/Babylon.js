import type { Vector2, Vector3 } from "core/Maths/math.vector";
import { BlockTools } from "../../blockTools";
import type { IDisplayManager } from "shared-ui-components/nodeGraphSystem/interfaces/displayManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import * as styles from "./inputDisplayManager.module.scss";
import type { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleContextualSources } from "core/Particles/Node/Enums/nodeParticleContextualSources";
import type { Color4 } from "core/Maths/math.color";
import { NodeParticleSystemSources } from "core/Particles/Node/Enums/nodeParticleSystemSources";

export class InputDisplayManager implements IDisplayManager {
    public getHeaderClass(nodeData: INodeData) {
        const inputBlock = nodeData.data as ParticleInputBlock;

        if (inputBlock.isContextual) {
            return styles["contextual"];
        } else if (inputBlock.isSystemSource) {
            return styles["system"];
        }

        return "";
    }

    public getHeaderText(nodeData: INodeData): string {
        return nodeData.data.name;
    }

    public shouldDisplayPortLabels(): boolean {
        return false;
    }

    public static GetBaseType(type: NodeParticleBlockConnectionPointTypes): string {
        return NodeParticleBlockConnectionPointTypes[type];
    }

    public getBackgroundColor(nodeData: INodeData): string {
        let color = "";
        const inputBlock = nodeData.data as ParticleInputBlock;

        switch (inputBlock.type) {
            case NodeParticleBlockConnectionPointTypes.Color4: {
                if (inputBlock.value) {
                    color = inputBlock.value.toHexString();
                    break;
                }
            }
            // eslint-disable-next-line no-fallthrough
            default:
                color = BlockTools.GetColorFromConnectionNodeType(inputBlock.type);
                break;
        }

        return color;
    }

    public updatePreviewContent(nodeData: INodeData, contentArea: HTMLDivElement): void {
        let value = "";
        const inputBlock = nodeData.data as ParticleInputBlock;
        if (inputBlock.isSystemSource) {
            switch (inputBlock.systemSource) {
                case NodeParticleSystemSources.Time:
                    value = "Time";
                    break;
                case NodeParticleSystemSources.Delta:
                    value = "Delta";
                    break;
                case NodeParticleSystemSources.Emitter:
                    value = "Emitter";
                    break;
            }
        } else if (inputBlock.isContextual) {
            switch (inputBlock.contextualValue) {
                case NodeParticleContextualSources.Position:
                    value = "Position";
                    break;
                case NodeParticleContextualSources.Direction:
                    value = "Direction";
                    break;
                case NodeParticleContextualSources.ScaledDirection:
                    value = "Scaled Direction";
                    break;
                case NodeParticleContextualSources.Scale:
                    value = "Scale";
                    break;
                case NodeParticleContextualSources.Age:
                    value = "Age";
                    break;
                case NodeParticleContextualSources.Lifetime:
                    value = "Lifetime";
                    break;
                case NodeParticleContextualSources.Angle:
                    value = "Angle";
                    break;
                case NodeParticleContextualSources.AgeGradient:
                    value = "Age gradient";
                    break;
                case NodeParticleContextualSources.Color:
                    value = "Color";
                    break;
                case NodeParticleContextualSources.SpriteCellEnd:
                    value = "Sprite Cell End";
                    break;
                case NodeParticleContextualSources.SpriteCellIndex:
                    value = "Sprite Cell Index";
                    break;
                case NodeParticleContextualSources.SpriteCellStart:
                    value = "Sprite Cell Start";
                    break;
            }
        } else {
            switch (inputBlock.type) {
                case NodeParticleBlockConnectionPointTypes.Int:
                    value = inputBlock.value.toFixed(0);
                    break;
                case NodeParticleBlockConnectionPointTypes.Float:
                    value = inputBlock.value.toFixed(4);
                    break;
                case NodeParticleBlockConnectionPointTypes.Vector2: {
                    const vec2Value = inputBlock.value as Vector2;
                    value = `(${vec2Value.x.toFixed(2)}, ${vec2Value.y.toFixed(2)})`;
                    break;
                }
                case NodeParticleBlockConnectionPointTypes.Vector3: {
                    const vec3Value = inputBlock.value as Vector3;
                    value = `(${vec3Value.x.toFixed(2)}, ${vec3Value.y.toFixed(2)}, ${vec3Value.z.toFixed(2)})`;
                    break;
                }
                case NodeParticleBlockConnectionPointTypes.Color4: {
                    const col4Value = inputBlock.value as Color4;
                    value = `(${col4Value.r.toFixed(2)}, ${col4Value.g.toFixed(2)}, ${col4Value.b.toFixed(2)}, ${col4Value.a.toFixed(2)})`;
                    break;
                }
            }
        }
        contentArea.innerHTML = value;
        contentArea.classList.add(styles["input-block"]);
    }
}
