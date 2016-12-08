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
                    
            // Returns true if the id of the given object starts and ends with '###'
            let shouldExcludeThisPrim = (obj:BABYLON.Prim2DBase) : boolean => {
                return (obj.id && obj.id.indexOf('###') == 0 && obj.id.lastIndexOf('###', 0) === 0);
            }
            
            // Recursive method building the tree panel
            let createNode = (obj : BABYLON.Prim2DBase) => {
                if (obj.children && obj.children.length > 0) {
                    let node = new TreeItem(this, new Canvas2DAdapter(obj));
                    for (let child of obj.children) {     
                        if (!shouldExcludeThisPrim(child)) {  
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
                let c2d : BABYLON.Canvas2D = inst as BABYLON.Canvas2D;
                let nodes = createNode(c2d);
                arr.push(nodes);
            }
            return arr;
        }
    }
    
}