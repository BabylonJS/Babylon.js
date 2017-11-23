module INSPECTOR {
    /** Any object implementing this interface should 
     * provide methods to toggle a debug area
     */
    export interface IToolDebug {
        debug  : (b:boolean) => void;
    }

    export class DebugArea extends AbstractTreeTool {

        private _obj : IToolDebug;

        constructor(obj:IToolDebug) {
            super();
            this._obj = obj;
            this._elem.classList.add('fa-wrench');
        }

        protected action() {     
            super.action(); 
            if (this._on) {
                // set icon activated
                this._elem.classList.add('active');
            }else {
                // set icon deactivated
                this._elem.classList.remove('active');
            }
            this._obj.debug(this._on);
        }
    }
}