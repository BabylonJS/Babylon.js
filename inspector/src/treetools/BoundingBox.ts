module INSPECTOR{

    /** Any object implementing this interface should 
     * provide methods to toggle its bounding box
     */
    export interface IToolBoundingBox {
        isBoxVisible   : () => boolean,
        setBoxVisible  : (b:boolean) => void;
    }
    /**
     * Checkbox to display/hide the primitive
     */
    export class BoundingBox extends AbstractTreeTool{

        private _obj : IToolBoundingBox;

        constructor(obj:IToolBoundingBox) {
            super (); 
            this._obj = obj;
            this._elem.classList.add('fa-square-o');
            this._on = this._obj.isBoxVisible();
            this._check();
        }

        // For a checkbox, set visible/invisible the corresponding prim
        protected action() {     
            super.action();
            // update object and gui according to the new status
            this._check();
        }

        private _check() {
             if (this._on) {
                // set icon eye
                this._elem.classList.add('active');
            }else {
                // set icon eye-slash
                this._elem.classList.remove('active');
            }
            this._obj.setBoxVisible(this._on);
        }
    }
}