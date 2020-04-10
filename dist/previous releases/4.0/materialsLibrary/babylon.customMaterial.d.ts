
declare module BABYLON {
    class CustomShaderStructure {
        FragmentStore: string;
        VertexStore: string;
        constructor();
    }
    class ShaderSpecialParts {
        constructor();
        Fragment_Begin: string;
        Fragment_Definitions: string;
        Fragment_MainBegin: string;
        Fragment_Custom_Diffuse: string;
        Fragment_Custom_Alpha: string;
        Fragment_Before_FragColor: string;
        Vertex_Begin: string;
        Vertex_Definitions: string;
        Vertex_MainBegin: string;
        Vertex_Before_PositionUpdated: string;
        Vertex_Before_NormalUpdated: string;
    }
    class CustomMaterial extends StandardMaterial {
        static ShaderIndexer: number;
        CustomParts: ShaderSpecialParts;
        _isCreatedShader: boolean;
        _createdShaderName: string;
        _customUniform: string[];
        _newUniforms: string[];
        _newUniformInstances: any[];
        _newSamplerInstances: Texture[];
        FragmentShader: string;
        VertexShader: string;
        AttachAfterBind(mesh: Mesh, effect: Effect): void;
        ReviewUniform(name: string, arr: string[]): string[];
        Builder(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: StandardMaterialDefines): string;
        constructor(name: string, scene: Scene);
        AddUniform(name: string, kind: string, param: any): CustomMaterial;
        Fragment_Begin(shaderPart: string): CustomMaterial;
        Fragment_Definitions(shaderPart: string): CustomMaterial;
        Fragment_MainBegin(shaderPart: string): CustomMaterial;
        Fragment_Custom_Diffuse(shaderPart: string): CustomMaterial;
        Fragment_Custom_Alpha(shaderPart: string): CustomMaterial;
        Fragment_Before_FragColor(shaderPart: string): CustomMaterial;
        Vertex_Begin(shaderPart: string): CustomMaterial;
        Vertex_Definitions(shaderPart: string): CustomMaterial;
        Vertex_MainBegin(shaderPart: string): CustomMaterial;
        Vertex_Before_PositionUpdated(shaderPart: string): CustomMaterial;
        Vertex_Before_NormalUpdated(shaderPart: string): CustomMaterial;
    }
}
