 module INSPECTOR {
     
    export abstract class AbstractTreeTool {
        protected _elem: HTMLElement;
        /** Is the tool enabled ? */
        protected _on  : boolean = false;
        
        constructor() {
            this._elem = Inspector.DOCUMENT.createElement('i');
            this._elem.className = 'treeTool fa';
            this._addEvents();
        }    

        public toHtml() : HTMLElement {
            return this._elem;
        }

        protected _addEvents() {
            this._elem.addEventListener('click', (e) => {
                this.action();
                e.stopPropagation();
            });
        }

        /**
         * Action launched when clicked on this element
         * Should be overrided
         */
        protected action() {
            this._on = !this._on;
        }

    }
 }