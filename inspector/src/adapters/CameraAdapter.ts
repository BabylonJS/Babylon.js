module INSPECTOR {
    
    export class CameraAdapter 
        extends Adapter 
         implements ICameraPOV{
        
        constructor(obj:BABYLON.Camera) {
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
        
        public getTools() : Array<AbstractTreeTool> {
            let tools = [];
            // tools.push(new Checkbox(this));
            tools.push(new CameraPOV(this));
            return tools;
        }

        public setPOV() {
           (this._obj as BABYLON.Camera).getScene().activeCamera = this._obj;
        }
        
    }
}