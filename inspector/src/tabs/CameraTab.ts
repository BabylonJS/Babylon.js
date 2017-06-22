module INSPECTOR{
    
    export class CameraTab extends PropertyTab {
                
        constructor(tabbar:TabBar, inspector:Inspector) {
            super(tabbar, 'Camera', inspector); 
        }
    /* Overrides super */
        protected _getTree() : Array<TreeItem> {
            let arr = [];
                        
            // get all cameras from the first scene
            let instances = this._inspector.scene;
            for (let camera of instances.cameras) {
                arr.push(new TreeItem(this, new CameraAdapter(camera)));
            }
            return arr;
        }

    }
    
}