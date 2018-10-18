import { GUIAdapter } from "../adapters/GUIAdapter";
import { Inspector } from "../Inspector";
import { TreeItem } from "../tree/TreeItem";
import { PropertyTab } from "./PropertyTab";
import { TabBar } from "./TabBar";

export class GUITab extends PropertyTab {

    constructor(tabbar: TabBar, inspector: Inspector) {
        super(tabbar, 'GUI', inspector);
    }

    /* Overrides super */
    protected _getTree(): Array<TreeItem> {
        let arr: Array<TreeItem> = [];

        if (!Inspector.GUIObject) { return arr; }

        // Recursive method building the tree panel
        let createNode = (obj: import("babylonjs-gui").Control) => {
            let descendants = (obj as import("babylonjs-gui").Container).children;

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
            if (tex instanceof Inspector.GUIObject.AdvancedDynamicTexture) {
                let node = createNode((<import("babylonjs-gui").AdvancedDynamicTexture>tex)._rootContainer);
                arr.push(node);
            }
        }
        return arr;
    }
}
