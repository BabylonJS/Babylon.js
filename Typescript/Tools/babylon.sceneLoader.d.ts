/// <reference path="../babylon.d.ts" />
declare module BABYLON {
    function loadCubeTexture(rootUrl: string, parsedTexture: JSON, scene: Scene): CubeTexture;
    function loadTexture(rootUrl: string, parsedTexture: JSON, scene: Scene): Texture;
    function parseSkeleton(parsedSkeleton: JSON, scene: Scene): Skeleton;
    function parseMaterial(parsedMaterial: JSON, scene: Scene, rootUrl: string): Material;
    function parseMaterialById(id: number, parsedData: JSON, scene: Scene, rootUrl: string): Material;
    function parseMultiMaterial(parsedMultiMaterial: JSON, scene: Scene): MultiMaterial;
    function parseParticleSystem(parsedParticleSystem: JSON, scene: Scene, rootUrl: string): ParticleSystem;
    function parseShadowGenerator(parsedShadowGenerator: JSON, scene: Scene): ShadowGenerator;
    function parseAnimation(parsedAnimation: JSON): Animation;
    function parseLight(parsedLight: JSON, scene: Scene): Light;
    function parseMesh(parsedMesh: JSON, scene: Scene, rootUrl: string): Mesh;
    function isDescendantOf(mesh: Mesh, name: string, hierarchyIds: number[]): boolean;

    class SceneLoader {
        _ImportGeometry(parsedGeometry, mesh): void;
        ImportMesh(meshName: string, rootUrl: string, sceneFilename: string, scene: Scene, then: Function): void;
        Load(rootUrl: string, sceneFilename: string, engine: Engine, then: Function, progressCallback: Function): void;
    }
}