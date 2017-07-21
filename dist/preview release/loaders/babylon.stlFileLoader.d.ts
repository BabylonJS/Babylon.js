
declare module BABYLON {
    class STLFileLoader implements ISceneLoaderPlugin {
        solidPattern: RegExp;
        facetsPattern: RegExp;
        normalPattern: RegExp;
        vertexPattern: RegExp;
        name: string;
        extensions: ISceneLoaderPluginExtensions;
        importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: AbstractMesh[], particleSystems: ParticleSystem[], skeletons: Skeleton[]): boolean;
        load(scene: Scene, data: any, rootUrl: string): boolean;
        private isBinary(data);
        private parseBinary(mesh, data);
        private parseASCII(mesh, solidData);
    }
}
