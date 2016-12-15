 module INSPECTOR {

    export class Toolbar extends BasicElement {

        private _inspector: Inspector;
        private _tools : Array<AbstractTool> = []

        constructor (inspector:Inspector) {
            super();
            this._inspector = inspector;
            this._build(); 

            this._addTools();
        }
        
        // A toolbar cannot be updated
        public update() {};
        
        protected _build() {            
            this._div.className = 'toolbar';
        };

        private _addTools() {
            // Refresh
            this._tools.push(new RefreshTool(this._div, this._inspector));  
            // Display labels
            this._tools.push(new LabelTool(this._div, this._inspector));          
            // Pick object
            this._tools.push(new PickTool(this._div, this._inspector));
            
            // Add the popup mode only if the inspector is not in popup mode and if the brower is not edge
            // Edge is 
            if (!this._inspector.popupMode && !Helpers.IsBrowserEdge()) {
                this._tools.push(new PopupTool(this._div, this._inspector));
            }
            // Pause schedule
            this._tools.push(new PauseScheduleTool(this._div, this._inspector));
            
            // Pause schedule
            this._tools.push(new DisposeTool(this._div, this._inspector));
        }

        /** 
         * Returns the total width in pixel of the tabbar, 
         * that corresponds to the sum of the width of each tab + toolbar width
        */
        public getPixelWidth() : number {
            let sum = 0;
            for (let tool of this._tools) {
                sum += tool.getPixelWidth();
            }
            
            return sum;
        }
    }
 }