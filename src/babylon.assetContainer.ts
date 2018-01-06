module BABYLON {
    export class SceneAssetContainer {
        public scene: Scene;

        // Objects
        public cameras = new Array<Camera>();
        public lights = new Array<Light>();
        public meshes = new Array<AbstractMesh>();
        public skeletons = new Array<Skeleton>();
        public particleSystems = new Array<ParticleSystem>();
        public animations = new Array<Animation>();
        public multiMaterials = new Array<MultiMaterial>();
        public materials = new Array<Material>();
        public morphTargetManagers = new Array<MorphTargetManager>();
        public geometries = new Array<Geometry>();
        public transformNodes = new Array<TransformNode>();
        public lensFlareSystems = new Array<LensFlareSystem>();
        public shadowGenerators = new Array<ShadowGenerator>();
        public actionManagers = new Array<ActionManager>();
        
        constructor(scene:Scene){
            this.scene = scene;
        }
        
        addAllToScene(){
            // TODO
        }
        removeAllFromScene(){
            // TODO
        }
    }
}