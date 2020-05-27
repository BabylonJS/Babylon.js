import { IDisplayManager } from './displayManager';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { NodeMaterialSystemValues } from 'babylonjs/Materials/Node/Enums/nodeMaterialSystemValues';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { AnimatedInputBlockTypes } from 'babylonjs/Materials/Node/Blocks/Input/animatedInputBlockTypes';
import { Vector2, Vector3, Vector4 } from 'babylonjs/Maths/math.vector';
import { Color3 } from 'babylonjs/Maths/math.color';
import { BlockTools } from '../../blockTools';
import { StringTools } from '../../stringTools';

const inputNameToAttributeValue: { [name: string] : string } = {
    "position2d" : "position",
    "particle_uv" : "uv",
    "particle_color" : "color",
    "particle_texturemask": "textureMask",
    "particle_positionw" : "positionW",
};

const inputNameToAttributeName: { [name: string] : string } = {
    "position2d" : "postprocess",
    "particle_uv" : "particle",
    "particle_color" : "particle",
    "particle_texturemask": "particle",
    "particle_positionw": "particle",
};

export class InputDisplayManager implements IDisplayManager {
    public getHeaderClass(block: NodeMaterialBlock) {
        let inputBlock = block as InputBlock;

        if (inputBlock.isConstant) {
            return "constant";
        }

        if (inputBlock.visibleInInspector) {
            return "inspector";
        }

        return "";
    }

    public shouldDisplayPortLabels(block: NodeMaterialBlock): boolean {
        return false;
    }

    public getHeaderText(block: NodeMaterialBlock): string {
        let inputBlock = block as InputBlock;
        let name = `${inputBlock.name} (${StringTools.GetBaseType(inputBlock.output.type)})`;

        if (inputBlock.isAttribute) {
            name = StringTools.GetBaseType(inputBlock.output.type);
        }

        return name;
    }

    public getBackgroundColor(block: NodeMaterialBlock): string {
        let color = "";
        let inputBlock = block as InputBlock;

        switch (inputBlock.type) {
            case NodeMaterialBlockConnectionPointTypes.Color3:
            case NodeMaterialBlockConnectionPointTypes.Color4: {
                if (inputBlock.value) {
                    color = (inputBlock.value as Color3).toHexString();
                    break;
                }
            }
            default:
                color = BlockTools.GetColorFromConnectionNodeType(inputBlock.type);
                break;
        }

        return color;
    }

    public updatePreviewContent(block: NodeMaterialBlock, contentArea: HTMLDivElement): void {
        let value = "";
        let inputBlock = block as InputBlock;

        if (inputBlock.isAttribute) {
            const attrVal = inputNameToAttributeValue[inputBlock.name] ?? inputBlock.name;
            const attrName = inputNameToAttributeName[inputBlock.name] ?? 'mesh';
            value = attrName + "." + attrVal;
        } else if (inputBlock.isSystemValue) {
            switch (inputBlock.systemValue) {
                case NodeMaterialSystemValues.World:
                    value = "World";
                    break;
                case NodeMaterialSystemValues.WorldView:
                    value = "World x View";
                    break;
                case NodeMaterialSystemValues.WorldViewProjection:
                    value = "World x View x Projection";
                    break;
                case NodeMaterialSystemValues.View:
                    value = "View";
                    break;
                case NodeMaterialSystemValues.ViewProjection:
                    value = "View x Projection";
                    break;
                case NodeMaterialSystemValues.Projection:
                    value = "Projection";
                    break;
                case NodeMaterialSystemValues.CameraPosition:
                    value = "Camera position";
                    break;
                case NodeMaterialSystemValues.FogColor:
                    value = "Fog color";
                    break;
                case NodeMaterialSystemValues.DeltaTime:
                    value = "Delta time";
                    break;
            }
        } else {
            switch (inputBlock.type) {
                case NodeMaterialBlockConnectionPointTypes.Float:
                    if (inputBlock.animationType !== AnimatedInputBlockTypes.None) {
                        value = AnimatedInputBlockTypes[inputBlock.animationType];
                    } else {
                        value = inputBlock.value.toFixed(2);
                    }
                    break;
                case NodeMaterialBlockConnectionPointTypes.Vector2:
                    let vec2Value = inputBlock.value as Vector2;
                    value = `(${vec2Value.x.toFixed(2)}, ${vec2Value.y.toFixed(2)})`;
                    break;
                case NodeMaterialBlockConnectionPointTypes.Vector3:
                    let vec3Value = inputBlock.value as Vector3;
                    value = `(${vec3Value.x.toFixed(2)}, ${vec3Value.y.toFixed(2)}, ${vec3Value.z.toFixed(2)})`;
                    break;
                case NodeMaterialBlockConnectionPointTypes.Vector4:
                    let vec4Value = inputBlock.value as Vector4;
                    value = `(${vec4Value.x.toFixed(2)}, ${vec4Value.y.toFixed(2)}, ${vec4Value.z.toFixed(2)}, ${vec4Value.w.toFixed(2)})`;
                    break;
            }
        }

        contentArea.innerHTML = value;
        contentArea.classList.add("input-block");
    }
}