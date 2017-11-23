module INSPECTOR{
    
    export class GUITab extends PropertyTab {
                
        constructor(tabbar:TabBar, inspector:Inspector) {
            super(tabbar, 'GUI', inspector); 
        }

        /* Overrides super */
        protected _getTree() : Array<TreeItem> {
            let arr = [];

            // Recursive method building the tree panel
            let createNode = (obj: BABYLON.GUI.Control) => {
                let descendants = (obj as BABYLON.GUI.Container).children;

                if (descendants && descendants.length > 0) {
                    let node = new TreeItem(this, new GUIAdapter(obj));
                    for (let child of descendants) {     
                        let n = createNode(child);
                        node.add(n); 
                    }
                    node.update();
                    return node;
                } else {
                    return new TreeItem(this, new GUIAdapter(obj));
                }
            };
            
            // get all textures from the first scene
            let instances = this._inspector.scene;
            for (let tex of instances.textures) {
                //only get GUI's textures
                if (tex instanceof BABYLON.GUI.AdvancedDynamicTexture) {
                    let node = createNode(tex._rootContainer);
                    arr.push(node);
                }
            }
            return arr;
        }
    }
}