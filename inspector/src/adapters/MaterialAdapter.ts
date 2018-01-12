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
            return Helpers.GetAllLinesProperties(this._obj);
        }
        
        /** No tools for a material adapter */
        public getTools() : Array<AbstractTreeTool> {
            return [];
        }
    }
}