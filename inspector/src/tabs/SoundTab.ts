import { SoundAdapter } from "../adapters/SoundAdapter";
import { Inspector } from "../Inspector";
import { TreeItem } from "../tree/TreeItem";
import { PropertyTab } from "./PropertyTab";
import { TabBar } from "./TabBar";

export class SoundTab extends PropertyTab {

    constructor(tabbar: TabBar, inspector: Inspector) {
        super(tabbar, 'Audio', inspector);
    }
    /* Overrides super */
    protected _getTree(): Array<TreeItem> {
        let arr = new Array<TreeItem>();

        // get all cameras from the first scene
        let instances = this._inspector.scene;
        if (instances.soundTracks) {
            for (let sounds of instances.soundTracks) {
                let sound = sounds.soundCollection;
                sound.forEach((element) => {
                    arr.push(new TreeItem(this, new SoundAdapter(element)));
                });

            }
        }
        return arr;
    }

}
