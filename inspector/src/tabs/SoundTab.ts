module INSPECTOR {

    export class SoundTab extends PropertyTab {

        constructor(tabbar: TabBar, inspector: Inspector) {
            super(tabbar, 'Audio', inspector);
        }
        /* Overrides super */
        protected _getTree(): Array<TreeItem> {
            let arr = new Array<TreeItem>();

            // get all cameras from the first scene
            let instances = this._inspector.scene;
            for (let sounds of instances.soundTracks) {
                let sound = sounds.soundCollection;
                sound.forEach(element => {
                    arr.push(new TreeItem(this, new SoundAdapter(element)));
                });

            }
            return arr;
        }

    }

}