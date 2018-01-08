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
            this.cameras.forEach((o)=>{
                this.scene.removeCamera(o);
            });
            this.lights.forEach((o)=>{
                this.scene.removeLight(o);
            });
            this.meshes.forEach((o)=>{
                this.scene.removeMesh(o);
            });
            this.skeletons.forEach((o)=>{
                this.scene.removeSkeleton(o);
            });
            this.particleSystems.forEach((o)=>{
                this.scene.removeParticleSystem(o);
            });
            this.particleSystems.forEach((o)=>{
                this.scene.removeParticleSystem(o);
            });
            this.animations.forEach((o)=>{
                this.scene.removeAnimation(o);
            });
            this.multiMaterials.forEach((o)=>{
                this.scene.removeMultiMaterial(o);
            });
            this.materials.forEach((o)=>{
                this.scene.removeMaterial(o);
            });
            this.morphTargetManagers.forEach((o)=>{
                this.scene.removeMorphTargetManager(o);
            });
            this.geometries.forEach((o)=>{
                this.scene.removeGeometry(o);
            });
            this.transformNodes.forEach((o)=>{
                this.scene.removeTransformNode(o);
            });
            this.lensFlareSystems.forEach((o)=>{
                this.scene.removeLensFlareSystem(o);
            });
            this.actionManagers.forEach((o)=>{
                this.scene.removeActionManager(o);
            });
            // TODO, do shadow generators need to be removed somehow?
        }
    }
}