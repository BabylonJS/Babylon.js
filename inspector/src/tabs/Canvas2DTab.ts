module INSPECTOR{
    
    export class Canvas2DTab extends PropertyTab {
                
        constructor(tabbar:TabBar, inspector:Inspector) {
            super(tabbar, 'Canvas2D', inspector); 
        }

        /* Overrides */
        protected _getTree() : Array<TreeItem> {
            let arr = [];
            
            // get all canvas2D
            let instances = BABYLON.Canvas2D.instances || [];
           
            // Recursive method building the tree panel
            let createNode = (obj : BABYLON.Prim2DBase) => {
                if (obj.children && obj.children.length > 0) {
                    let node = new TreeItem(this, new Canvas2DAdapter(obj));
                    for (let child of obj.children) {     
                        if (!Helpers.IsSystemName(child.id)) {  
                            let n = createNode(child);
                            node.add(n); 
                        }
                    }
                    node.update();
                    return node;
                } else {
                    return new TreeItem(this, new Canvas2DAdapter(obj));
                }
            };
            
            for (let inst of instances) {
                if (Helpers.IsSystemName(inst.id)) {
                    continue;
                }
                let c2d : BABYLON.Canvas2D = inst as BABYLON.Canvas2D;
                let nodes = createNode(c2d);
                arr.push(nodes);
            }
            return arr;
        }
    }
    
}