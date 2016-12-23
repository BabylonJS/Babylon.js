module INSPECTOR {
    
    export class LightAdapter 
        extends Adapter 
        implements IToolVisible{

        private static _PROPERTIES = [
            'position',
            'diffuse', 
            'intensity', 
            'radius', 
            'range', 
            'specular'
        ];
        
        constructor(obj:BABYLON.Light) {
            super(obj);
        }
        
        /** Returns the name displayed in the tree */
        public id() : string {
            let str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        }
        
        /** Returns the type of this object - displayed in the tree */
        public type() : string{
            return Helpers.GET_TYPE(this._obj);
        }
        
        /** Returns the list of properties to be displayed for this adapter */
        public getProperties() : Array<PropertyLine> {
           let propertiesLines : Array<PropertyLine> = [];
                
            for (let dirty of LightAdapter._PROPERTIES) {
                let infos = new Property(dirty, this._obj);
                propertiesLines.push(new PropertyLine(infos));
            }
            return propertiesLines; 
        }
        
        public getTools() : Array<AbstractTreeTool> {
            let tools = [];
            tools.push(new Checkbox(this));
            return tools;
        }
        
        public setVisible(b:boolean) {
            this._obj.setEnabled(b);
        }        
        public isVisible() : boolean {
            return this._obj.isEnabled(); 
        }

        /** Returns some information about this mesh */
        // public getInfo() : string {
        //     return `${(this._obj as BABYLON.AbstractMesh).getTotalVertices()} vertices`;
        // }
        
        /** Overrides super.highlight */
        public highlight(b:boolean) {
            this.actualObject.renderOutline = b;
			this.actualObject.outlineWidth = 0.25;
			this.actualObject.outlineColor = BABYLON.Color3.Yellow();
        }
    }
}