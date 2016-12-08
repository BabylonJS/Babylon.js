module INSPECTOR {
    
    export interface IHighlight {
        highlight : (b:boolean) => void
    }

    export abstract class Adapter implements IHighlight {
        
        protected _obj      : any;
        // a unique name for this adapter, to retrieve its own key in the local storage
        private static _name: string = BABYLON.Geometry.RandomId();
        
        constructor(obj:any) {
            this._obj = obj;
        }
        

        /** Returns the name displayed in the tree */
        public abstract id()           : string;
        
        /** Returns the type of this object - displayed in the tree */
        public abstract type()         : string;
        
        /** Returns the list of properties to be displayed for this adapter */
        public abstract getProperties(): Array<PropertyLine>;
        
        /** Returns the actual object behind this adapter */
        public get actualObject()      : any {
            return this._obj; 
        }
        
        /** Returns true if the given object correspond to this  */
        public correspondsTo(obj:any) {
            return obj === this._obj;
        }

        /** Returns the adapter unique name */
        public get name(): string {
            return Adapter._name;
        }

        /** Returns the list of tools available for this adapter */
        public abstract getTools() : Array<AbstractTreeTool>;

        /** Should be overriden in subclasses */
        public highlight(b:boolean) {};
    }
}