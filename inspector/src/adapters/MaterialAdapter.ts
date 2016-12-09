module INSPECTOR {
    
    export class MaterialAdapter 
        extends Adapter {

        constructor(obj:BABYLON.Material) {
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
            let propToDisplay = [];
            // The if is there to work with the min version of babylon
            if (this._obj instanceof BABYLON.StandardMaterial) {
                propToDisplay =  PROPERTIES['StandardMaterial'].properties;
            } else if (this._obj instanceof BABYLON.PBRMaterial) {
                propToDisplay =  PROPERTIES['PBRMaterial'].properties;
            }

            for (let dirty of propToDisplay) {
                let infos = new Property(dirty, this._obj);
                propertiesLines.push(new PropertyLine(infos));
            }
            return propertiesLines; 
        }
        
        /** No tools for a material adapter */
        public getTools() : Array<AbstractTreeTool> {
            return [];
        }

        /** Overrides super.highlight.
         * Highlighting a material outlines all meshes linked to this material
         */
        public highlight(b:boolean) {
            let material = this.actualObject as BABYLON.Material;
            let meshes = material.getBindedMeshes();
            for (let mesh of meshes) {
                mesh.renderOutline = b;
                mesh.outlineWidth = 0.25;
                mesh.outlineColor = BABYLON.Color3.Yellow();
            }
        }
    }
}