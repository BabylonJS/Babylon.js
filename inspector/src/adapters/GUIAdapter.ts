module INSPECTOR {
    
    export class GUIAdapter 
        extends Adapter 
        implements IToolVisible {

        constructor(obj: BABYLON.GUI.Control) {
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
            return Helpers.GetAllLinesProperties(this._obj);
        }

        public getTools(): Array<AbstractTreeTool> {
            let tools = [];
            tools.push(new Checkbox(this));
            return tools;
        }

        public setVisible(b: boolean){
            (this._obj as BABYLON.GUI.Control).isVisible = b;
        }

        public isVisible(): boolean{
            return (this._obj as BABYLON.GUI.Control).isVisible;
        }
    }
}