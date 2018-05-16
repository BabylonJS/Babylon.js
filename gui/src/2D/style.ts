/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Define a style used by control to automatically setup properties based on a template.
     * Only support font related properties so far
     */
    export class Style implements BABYLON.IDisposable {
        private _fontFamily = "Arial";
        private _fontStyle = "";       
        /** @hidden */ 
        public _host: AdvancedDynamicTexture;
        /** @hidden */
        public _fontSize = new ValueAndUnit(18, ValueAndUnit.UNITMODE_PIXEL, false);

        /**
         * Observable raised when the style values are changed
         */
        public onChangedObservable = new BABYLON.Observable<Style>();

        /**
         * Creates a new style object
         * @param host defines the AdvancedDynamicTexture which hosts this style
         */
        public constructor(host: AdvancedDynamicTexture) {
            this._host = host;
        }

        /**
         * Gets or sets the font size
         */
        public get fontSize(): string | number {
            return this._fontSize.toString(this._host);
        }

        public set fontSize(value: string | number) {
            if (this._fontSize.toString(this._host) === value) {
                return;
            }

            if (this._fontSize.fromString(value)) {
                this.onChangedObservable.notifyObservers(this);
            }
        }        
        
        /**
         * Gets or sets the font family
         */
        public get fontFamily(): string {
            return this._fontFamily;
        }

        public set fontFamily(value: string) {
            if (this._fontFamily === value) {
                return;
            }

            this._fontFamily = value;
            this.onChangedObservable.notifyObservers(this);
        }

        /**
         * Gets or sets the font style 
         */
        public get fontStyle(): string {
            return this._fontStyle;
        }

        public set fontStyle(value: string) {
            if (this._fontStyle === value) {
                return;
            }

            this._fontStyle = value;
            this.onChangedObservable.notifyObservers(this);
        }

        /** Dispose all associated resources */
        public dispose() {
            this.onChangedObservable.clear();
        }
    }    
}