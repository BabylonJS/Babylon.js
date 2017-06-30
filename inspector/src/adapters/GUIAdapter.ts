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
            let propertiesLines: Array<PropertyLine> = [];

            for (let dirty of PROPERTIES['Control'].properties) {
                let infos = new Property(dirty, this._obj);
                propertiesLines.push(new PropertyLine(infos));
            }

            if(this._obj instanceof BABYLON.GUI.Button){
                for (let dirty of PROPERTIES['Button'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.ColorPicker){
                for (let dirty of PROPERTIES['ColorPicker'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.Checkbox){
                for (let dirty of PROPERTIES['Checkbox'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.Ellipse){
                for (let dirty of PROPERTIES['Ellipse'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.Image){
                for (let dirty of PROPERTIES['Image'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.Line){
                for (let dirty of PROPERTIES['Line'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.RadioButton){
                for (let dirty of PROPERTIES['RadioButton'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.Rectangle){
                for (let dirty of PROPERTIES['Rectangle'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.Slider){
                for (let dirty of PROPERTIES['Slider'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.StackPanel){
                for (let dirty of PROPERTIES['StackPanel'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.TextBlock){
                for (let dirty of PROPERTIES['TextBlock'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            if(this._obj instanceof BABYLON.GUI.Container){
                for (let dirty of PROPERTIES['Container'].properties) {
                    let infos = new Property(dirty, this._obj);
                    propertiesLines.push(new PropertyLine(infos));
                }
            }

            return propertiesLines;
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