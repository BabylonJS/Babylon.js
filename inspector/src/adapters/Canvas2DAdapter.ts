module INSPECTOR {
    
    export class Canvas2DAdapter 
        extends Adapter 
        implements IToolVisible, IToolDebug {
        
        constructor(obj:any) {
            super(obj);
        }
        
        /** Returns the name displayed in the tree */
        public id() : string {
            let str = '';
            if (this._obj.id) {
                str = this._obj.id;
            } // otherwise nothing displayed        
            return str;
        }
        
        /** Returns the type of this object - displayed in the tree */
        public type() : string{
            return Helpers.GET_TYPE(this._obj);
        }
        
        /** Returns the list of properties to be displayed for this adapter */
        public getProperties() : Array<PropertyLine> {
            let propertiesLines = [];
            if (this._obj.propDic) {
                let dico = this._obj.propDic as BABYLON.StringDictionary<BABYLON.Prim2DPropInfo>;
                dico.forEach((name, propInfo) => {
                    let property = new Property(name, this.actualObject);
                    propertiesLines.push(new PropertyLine(property));
                });
            }            
            // TODO REMOVE THIS WHEN PROPERTIES WILL BE DECORATED
            let toAddDirty = [
                'actualZOffset', 'isSizeAuto', 'layoutArea', 'layoutAreaPos', 'contentArea', 
                'marginOffset', 'paddingOffset', 'isPickable', 'isContainer', 'boundingInfo', 
                'levelBoundingInfo', 'isSizedByContent', 'isPositionAuto', 'actualScale', 'layoutBoundingInfo', 
                '_cachedTexture'];
            for (let dirty of toAddDirty) {
                let infos = new Property(dirty, this.actualObject);
                propertiesLines.push(new PropertyLine(infos));
            }
            return propertiesLines; 
        }

        public getTools() : Array<AbstractTreeTool> {
            let tools = [];
            tools.push(new Checkbox(this));
            tools.push(new DebugArea(this));   
            return tools;
        }

        /// TOOLS ///
        public setVisible(b:boolean) {
            this._obj.levelVisible = b;
        }
        public isVisible():boolean{
            return this._obj.levelVisible;
        }
        /** Overrides super */
        public debug(b:boolean) {
            this._obj["displayDebugAreas"] = b;
        }
        /** Overrides super.highlight */
        public highlight(b:boolean) {
        }
        
        
    }
}