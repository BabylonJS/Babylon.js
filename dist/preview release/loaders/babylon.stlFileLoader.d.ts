/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class STLFileLoader implements ISceneLoaderPlugin {
        solidPattern: RegExp;
        facetsPattern: RegExp;
        normalPattern: RegExp;
        vertexPattern: RegExp;
        extensions: string;
        importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]): boolean;
        load(scene: Scene, data: string, rootUrl: string): boolean;
        private parseSolid(mesh, solidData);
    }
}
