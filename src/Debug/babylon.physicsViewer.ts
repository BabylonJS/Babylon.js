module BABYLON.Debug {

    export class PhysicsViewer {
        
        protected _imposters:Array<PhysicsImpostor> = [];
        protected _meshes:Array<AbstractMesh> = [];
        protected _scene:Scene;
        protected _numMeshes = 0;
        protected _physicsEnginePlugin:IPhysicsEnginePlugin;
        private _renderFunction: () => void;

        constructor(scene:Scene){

            this._scene = scene || Engine.LastCreatedScene;
            this._physicsEnginePlugin = this._scene.getPhysicsEngine().getPhysicsPlugin();

        }

        protected _updateDebugMeshes():void{

            var plugin = this._physicsEnginePlugin;

            for (var i = 0; i < this._numMeshes; i++){
                if(this._imposters[i].isDisposed){
                    this.hideImposter(this._imposters[i--]);
                }else{
                    plugin.syncMeshWithImposter(this._meshes[i], this._imposters[i]);
                }
            }

        }

        public showImposter(imposter:PhysicsImpostor):void{

            for (var i = 0; i < this._numMeshes; i++){
                if(this._imposters[i] == imposter){
                    return;
                }
            }

            var debugMesh = this._physicsEnginePlugin.getDebugMesh(imposter, this._scene);

            if(debugMesh){
                this._imposters[this._numMeshes] = imposter;
                this._meshes[this._numMeshes] = debugMesh;

                if(this._numMeshes == 0){
                    this._renderFunction = this._updateDebugMeshes.bind(this);
                    this._scene.registerBeforeRender(this._renderFunction);
                }

                this._numMeshes++;
            }

        }

        public hideImposter(imposter:PhysicsImpostor){

            var removed = false;

            for (var i = 0; i < this._numMeshes; i++){
                if(this._imposters[i] == imposter){
                    this._scene.removeMesh(this._meshes[i]);
                    this._meshes[i].dispose();
                    this._numMeshes--;
                    if(this._numMeshes > 0){
                        this._meshes[i] = this._meshes[this._numMeshes];
                        this._imposters[i] = this._imposters[this._numMeshes];
                        this._meshes[this._numMeshes] = null;
                        this._imposters[this._numMeshes] = null;
                    }else{
                        this._meshes[0] = null;
                        this._imposters[0] = null;
                    }
                    removed = true;
                    break;
                }
            }

            if(removed && this._numMeshes == 0){
                this._scene.registerBeforeRender(this._renderFunction);
            }

        }

        public dispose(){
            
            for (var i = 0; i < this._numMeshes; i++){
                this.hideImposter(this._imposters[i]);
            }

            this._imposters.length = 0;
            this._scene = null;
            this._physicsEnginePlugin = null;
            
        }

    }
}
