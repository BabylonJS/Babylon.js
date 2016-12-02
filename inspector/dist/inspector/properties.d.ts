declare module INSPECTOR {
    const PROPERTIES: {
        format: (obj: any) => any;
        'Vector2': {
            properties: string[];
            format: (vec: BABYLON.Vector2) => string;
        };
        'Vector3': {
            properties: string[];
            format: (vec: BABYLON.Vector3) => string;
        };
        'Color3': {
            properties: string[];
            format: (color: BABYLON.Color3) => string;
        };
        'Quaternion': {
            properties: string[];
        };
        'Size': {
            properties: string[];
            format: (size: BABYLON.Size) => string;
        };
        'Texture': {
            properties: string[];
        };
        'ArcRotateCamera': {
            properties: string[];
        };
        'Scene': {
            properties: string[];
        };
        'Mesh': {
            properties: string[];
            format: (m: BABYLON.Mesh) => string;
        };
        'StandardMaterial': {
            properties: string[];
            format: (mat: BABYLON.StandardMaterial) => string;
        };
        'PrimitiveAlignment': {
            properties: string[];
        };
        'PrimitiveThickness': {
            properties: string[];
        };
        'BoundingInfo2D': {
            properties: string[];
        };
        'SolidColorBrush2D': {
            properties: string[];
        };
        'GradientColorBrush2D': {
            properties: string[];
        };
        'PBRMaterial': {
            properties: string[];
        };
    };
}
