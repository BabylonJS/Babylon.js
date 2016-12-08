module INSPECTOR{
    
    export class MeshTab extends PropertyTab {
                
        constructor(tabbar:TabBar, inspector:Inspector) {
            super(tabbar, 'Mesh', inspector); 
        }

        /* Overrides super */
        protected _getTree() : Array<TreeItem> {
            let arr = [];
            
            // Returns true if the id of the given object starts and ends with '###'
            let shouldExcludeThisMesh = (obj:BABYLON.AbstractMesh) : boolean => {
                return (obj.name && obj.name.indexOf('###') == 0 && obj.name.lastIndexOf('###', 0) === 0);
            };
            
            // get all meshes from the first scene
            let instances = this._inspector.scene;
            for (let mesh of instances.meshes) {
                if (!shouldExcludeThisMesh(mesh)){
                    arr.push(new TreeItem(this, new MeshAdapter(mesh)));
                }
            }
            return arr;
        }  
    }
    
}