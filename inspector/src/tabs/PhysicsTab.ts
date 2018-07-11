import { PropertyTab } from "./PropertyTab";
import { TabBar } from "./TabBar";
import { Inspector } from "../Inspector";
import { TreeItem } from "../tree/TreeItem";
import { Debug } from "babylonjs";
import { PhysicsImpostorAdapter } from "../adapters/PhysicsImpostorAdapter";

export class PhysicsTab extends PropertyTab {

    public viewer: any;

    constructor(tabbar: TabBar, inspector: Inspector) {
        super(tabbar, 'Physics', inspector);
    }

    /* Overrides super */
    protected _getTree(): Array<TreeItem> {
        let arr = new Array<TreeItem>();

        let scene = this._inspector.scene;

        if (!scene.isPhysicsEnabled()) {
            return arr;
        }

        if (!this.viewer) {
            this.viewer = new Debug.PhysicsViewer(scene);
        }

        for (let mesh of scene.meshes) {
            if (mesh.physicsImpostor) {
                arr.push(new TreeItem(this, new PhysicsImpostorAdapter(mesh.physicsImpostor, this.viewer)));
            }
        }
        return arr;
    }

}