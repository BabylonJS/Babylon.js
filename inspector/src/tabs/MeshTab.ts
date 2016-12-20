module INSPECTOR{
    
    export class MeshTab extends PropertyTab {
                
        constructor(tabbar:TabBar, inspector:Inspector) {
            super(tabbar, 'Mesh', inspector); 
        }

        /* Overrides super */
        protected _getTree() : Array<TreeItem> {
            let arr = [];
            
            // get all meshes from the first scene
            let instances = this._inspector.scene;
            for (let mesh of instances.meshes) {
                if (!Helpers.IsSystemName(mesh.name)){
                    arr.push(new TreeItem(this, new MeshAdapter(mesh)));
                }
            }
            return arr;
        }  
    }
    
}