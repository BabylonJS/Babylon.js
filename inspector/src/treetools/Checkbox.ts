module INSPECTOR{

    /** Any object implementing this interface should 
     * provide methods to toggle its visibility
     */
    export interface IToolVisible {
        isVisible   : () => boolean,
        setVisible  : (b:boolean) => void;
    }
    /**
     * Checkbox to display/hide the primitive
     */
    export class Checkbox extends AbstractTreeTool{

        private _obj : IToolVisible;

        constructor(obj:IToolVisible) {
            super (); 
            this._obj = obj;
            this._elem.classList.add('fa-eye');
            this._on = this._obj.isVisible();
            this._check(true);
        }

        // For a checkbox, set visible/invisible the corresponding prim
        protected action() {     
            super.action();
            // update object and gui according to the new status
            this._check();
        }

        private _check(dontEnable?:boolean) {
             if (this._on) {
                // set icon eye
                this._elem.classList.add('fa-eye');
                this._elem.classList.add('active');
                this._elem.classList.remove('fa-eye-slash');
            }else {
                // set icon eye-slash
                this._elem.classList.remove('fa-eye');
                this._elem.classList.remove('active');
                this._elem.classList.add('fa-eye-slash');
            }
            if (!dontEnable) {
                this._obj.setVisible(this._on);
            }
        }
    }
}