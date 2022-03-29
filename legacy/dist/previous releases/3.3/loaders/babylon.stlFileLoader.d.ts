
declare module BABYLON {
    class STLFileLoader implements ISceneLoaderPlugin {
        solidPattern: RegExp;
        facetsPattern: RegExp;
        normalPattern: RegExp;
        vertexPattern: RegExp;
        name: string;
        extensions: ISceneLoaderPluginExtensions;
        importMesh(meshesNames: any, scene: Scene, data: any, rootUrl: string, meshes: Nullable<AbstractMesh[]>, particleSystems: Nullable<IParticleSystem[]>, skeletons: Nullable<Skeleton[]>): boolean;
        load(scene: Scene, data: any, rootUrl: string): boolean;
        loadAssetContainer(scene: Scene, data: string, rootUrl: string, onError?: (message: string, exception?: any) => void): AssetContainer;
        private isBinary;
        private parseBinary;
        private parseASCII;
    }
}
