module INSPECTOR {
    export abstract class AbstractTool {
        private _elem: HTMLElement;
        protected _inspector: Inspector;

        constructor(icon: string, parent: HTMLElement, inspector: Inspector, tooltip: string) {
            this._inspector = inspector;

            this._elem = Inspector.DOCUMENT.createElement('i');
            this._elem.className = `tool fa ${icon}`;
            parent.appendChild(this._elem);

            this._elem.addEventListener('click', (e) => {
                this.action();
            });

            new Tooltip(this._elem, tooltip);
        }

        public toHtml(): HTMLElement {
            return this._elem;
        }

        /** 
         * Returns the total width in pixel of this tool, 0 by default
        */
        public getPixelWidth(): number {
            let style = Inspector.WINDOW.getComputedStyle(this._elem);

            if (!style.marginLeft || !style.marginRight) {
                return 0;
            }

            let left = parseFloat(style.marginLeft.substr(0, style.marginLeft.length - 2)) || 0;
            let right = parseFloat(style.marginRight.substr(0, style.marginRight.length - 2)) || 0;
            return (this._elem.clientWidth || 0) + left + right;
        }

        /** 
         * Updates the icon of this tool with the given string
         */
        protected _updateIcon(icon: string) {
            this._elem.className = `tool fa ${icon}`;
        }

        public abstract action(): void;
    }
}