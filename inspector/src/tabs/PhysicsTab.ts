module INSPECTOR{
    
    export class PhysicsTab extends PropertyTab {

        public viewer:BABYLON.Debug.PhysicsViewer;
        
        constructor(tabbar:TabBar, inspector:Inspector) {
            super(tabbar, 'Physics', inspector); 
        }

        /* Overrides super */
        protected _getTree() : Array<TreeItem> {
            let arr = new Array<TreeItem>();

            let scene = this._inspector.scene;
            
            if(!scene.isPhysicsEnabled()){
                return arr;
            }

            if(!this.viewer){
                this.viewer = new BABYLON.Debug.PhysicsViewer(scene);
            }

            for (let mesh of scene.meshes) {
                if (mesh.physicsImpostor) {
                    arr.push(new TreeItem(this, new PhysicsImpostorAdapter(mesh.physicsImpostor, this.viewer)));
                }
            }
            return arr;
        }
        
    }
}