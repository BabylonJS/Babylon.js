module INSPECTOR {

    export class TextureAdapter
        extends Adapter {

        constructor(obj: BABYLON.BaseTexture) {
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
            // Not used in this tab
            return [];
        }

        public getTools(): Array<AbstractTreeTool> {
            let tools = new Array<AbstractTreeTool>();
            // tools.push(new CameraPOV(this));
            return tools;
        }

    }
}