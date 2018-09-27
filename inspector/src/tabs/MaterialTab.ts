import { MaterialAdapter } from "../adapters/MaterialAdapter";
import { Inspector } from "../Inspector";
import { TreeItem } from "../tree/TreeItem";
import { PropertyTab } from "./PropertyTab";
import { TabBar } from "./TabBar";

export class MaterialTab extends PropertyTab {

    constructor(tabbar: TabBar, inspector: Inspector) {
        super(tabbar, 'Material', inspector);
    }

    /* Overrides super */
    protected _getTree(): Array<TreeItem> {
        let arr = [];

        // get all meshes from the first scene
        let instances = this._inspector.scene;
        for (let mat of instances.materials) {
            arr.push(new TreeItem(this, new MaterialAdapter(mat)));
        }
        return arr;
    }
}
