module BABYLON.Debug {

    export class PhysicsViewer {
        
        protected _impostors:Array<PhysicsImpostor> = [];
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
                if(this._impostors[i].isDisposed){
                    this.hideImpostor(this._impostors[i--]);
                }else{
                    plugin.syncMeshWithImpostor(this._meshes[i], this._impostors[i]);
                }
            }

        }

        public showImpostor(impostor:PhysicsImpostor):void{

            for (var i = 0; i < this._numMeshes; i++){
                if(this._impostors[i] == impostor){
                    return;
                }
            }

            var debugMesh = this._physicsEnginePlugin.getDebugMesh(impostor, this._scene);

            if(debugMesh){
                this._impostors[this._numMeshes] = impostor;
                this._meshes[this._numMeshes] = debugMesh;

                if(this._numMeshes === 0){
                    this._renderFunction = this._updateDebugMeshes.bind(this);
                    this._scene.registerBeforeRender(this._renderFunction);
                }

                this._numMeshes++;
            }

        }

        public hideImpostor(impostor:PhysicsImpostor){

            var removed = false;

            for (var i = 0; i < this._numMeshes; i++){
                if(this._impostors[i] == impostor){
                    this._scene.removeMesh(this._meshes[i]);
                    this._meshes[i].dispose();
                    this._numMeshes--;
                    if(this._numMeshes > 0){
                        this._meshes[i] = this._meshes[this._numMeshes];
                        this._impostors[i] = this._impostors[this._numMeshes];
                        this._meshes[this._numMeshes] = null;
                        this._impostors[this._numMeshes] = null;
                    }else{
                        this._meshes[0] = null;
                        this._impostors[0] = null;
                    }
                    removed = true;
                    break;
                }
            }

            if(removed && this._numMeshes === 0){
                this._scene.unregisterBeforeRender(this._renderFunction);
            }

        }

        public dispose(){
            
            for (var i = 0; i < this._numMeshes; i++){
                this.hideImpostor(this._impostors[i]);
            }

            this._impostors.length = 0;
            this._scene = null;
            this._physicsEnginePlugin = null;
            
        }

    }
}
