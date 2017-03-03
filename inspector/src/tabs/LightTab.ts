module INSPECTOR{
    
    export class LightTab extends PropertyTab {
                
        constructor(tabbar:TabBar, inspector:Inspector) {
            super(tabbar, 'Light', inspector); 
        }

        /* Overrides super */
        protected _getTree() : Array<TreeItem> {
            let arr = [];
                        
            // get all lights from the first scene
            let instances = this._inspector.scene;
            for (let light of instances.lights) {
                arr.push(new TreeItem(this, new LightAdapter(light)));
            }
            return arr;
        }  
    }
    
}