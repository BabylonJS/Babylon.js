module INSPECTOR {

    export class SoundAdapter
        extends Adapter
        implements ISoundInteractions {

        constructor(obj: BABYLON.Sound) {
            super(obj);
        }

        /** Returns the name displayed in the tree */
        public id(): string {
            let str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        }

        /** Returns the type of this object - displayed in the tree */
        public type(): string {
            return Helpers.GET_TYPE(this._obj);
        }

        /** Returns the list of properties to be displayed for this adapter */
        public getProperties(): Array<PropertyLine> {
            let propertiesLines: Array<PropertyLine> = [];
            let camToDisplay = [];
            // The if is there to work with the min version of babylon

            let soundProperties = PROPERTIES['Sound'].properties;


            for (let dirty of soundProperties) {
                let infos = new Property(dirty, this._obj);
                propertiesLines.push(new PropertyLine(infos));
            }
            return propertiesLines;
        }

        public getTools(): Array<AbstractTreeTool> {
            let tools = [];
            tools.push(new SoundInteractions(this));
            return tools;
        }

        public setPlaying(callback: Function) {
            if ((this._obj as BABYLON.Sound).isPlaying) {
                (this._obj as BABYLON.Sound).pause();
            }
            else {
                (this._obj as BABYLON.Sound).play();
            }
            (this._obj as BABYLON.Sound).onended = () => {
                callback();
            }
        }
    }
}