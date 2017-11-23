module INSPECTOR {
    
    /**
     * A property is a link between a data (string) and an object.
     */
    export class Property {
        
        /** The property name */
        private _property   : string;
        /** The obj this property refers to */
        private _obj        : any;
        
        constructor(prop:string, obj:any) {
            this._property = prop;
            this._obj = obj;
        }
        
        public get name() : string {
            return this._property;
        }
        
        public get value() : any {
            return this._obj[this._property];
        }
        public set value(newValue:any) {
            this._obj[this._property] = newValue;
        }
        
        public get type() :string {
            return Helpers.GET_TYPE(this.value);
        }
        
        public get obj() : any {
            return this._obj;
        }
        public set obj(newObj : any)  {
            this._obj = newObj;
        }
        
    }
}