import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';

export class StringTools {
    /**
     * Gets the base math type of node material block connection point.
     * @param type Type to parse.
     */
    public static GetBaseType(type: NodeMaterialBlockConnectionPointTypes): string {
        switch (type) {
            case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3:
            case NodeMaterialBlockConnectionPointTypes.Vector4OrColor4:
            case NodeMaterialBlockConnectionPointTypes.Vector3OrVector4:
            case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3OrVector4OrColor4:
                return "Vector";
            case NodeMaterialBlockConnectionPointTypes.Color3:
            case NodeMaterialBlockConnectionPointTypes.Color3OrColor4:
            case NodeMaterialBlockConnectionPointTypes.Color4: {
                return "Color";
            }
            default: {
                return NodeMaterialBlockConnectionPointTypes[type];
            }
        }
    }
}