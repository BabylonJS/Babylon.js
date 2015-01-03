declare module BABYLON {
    class MultiMaterial extends Material {
        public subMaterials: Material[];
        constructor(name: string, scene: Scene);
        public getSubMaterial(index: any): Material;
        public isReady(mesh?: AbstractMesh): boolean;
    }
}
