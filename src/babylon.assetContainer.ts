module BABYLON {
    export class AssetContainer {
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
        public sounds = new Array<Sound>();
        
        constructor(scene:Scene){
            this.scene = scene;
        }
        
        addAllToScene(){
            this.cameras.forEach((o)=>{
                this.scene.addCamera(o);
            });
            this.lights.forEach((o)=>{
                this.scene.addLight(o);
            });
            this.meshes.forEach((o)=>{
                this.scene.addMesh(o);
            });
            this.skeletons.forEach((o)=>{
                this.scene.addSkeleton(o);
            });
            this.particleSystems.forEach((o)=>{
                this.scene.addParticleSystem(o);
            });
            this.animations.forEach((o)=>{
                this.scene.addAnimation(o);
            });
            this.multiMaterials.forEach((o)=>{
                this.scene.addMultiMaterial(o);
            });
            this.materials.forEach((o)=>{
                this.scene.addMaterial(o);
            });
            this.morphTargetManagers.forEach((o)=>{
                this.scene.addMorphTargetManager(o);
            });
            this.geometries.forEach((o)=>{
                this.scene.addGeometry(o);
            });
            this.transformNodes.forEach((o)=>{
                this.scene.addTransformNode(o);
            });
            this.lensFlareSystems.forEach((o)=>{
                this.scene.addLensFlareSystem(o);
            });
            this.actionManagers.forEach((o)=>{
                this.scene.addActionManager(o);
            });
            this.sounds.forEach((o)=>{
                o.play();
                o.autoplay=true;
                this.scene.mainSoundTrack.AddSound(o)
            })
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
            this.sounds.forEach((o)=>{
                o.stop();
                o.autoplay = false
                this.scene.mainSoundTrack.RemoveSound(o)
            })
        }
    }
}