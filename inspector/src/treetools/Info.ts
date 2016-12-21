module INSPECTOR{

    /** Any object implementing this interface should 
     * provide methods to retrieve its info
     */
    export interface IToolInfo {
        getInfo  : () => string;
    }
    /**
     * Checkbox to display/hide the primitive
     */
    export class Info extends AbstractTreeTool{

        private _obj : IToolInfo;

        private _tooltip : Tooltip;

        constructor(obj:IToolInfo) {
            super (); 
            this._obj = obj;
            this._elem.classList.add('fa-info-circle');

            this._tooltip = new Tooltip(this._elem, this._obj.getInfo(), this._elem);
        }

        // Nothing to do on click
        protected action() {     
            super.action();
        }
    }
}