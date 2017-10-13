module INSPECTOR {

    export abstract class Tab extends BasicElement {
        protected _tabbar: TabBar;
        // The tab name displayed in the tabbar
        public name: string;
        protected _isActive: boolean = false;

        // The whole panel corresponding to this tab. It's what is displayed when the tab is activacted
        protected _panel: HTMLDivElement;

        constructor(tabbar: TabBar, name: string) {
            super();
            this._tabbar = tabbar;
            this.name = name;
            this._build();
        }

        /** True if the tab is active, false otherwise */
        public isActive(): boolean {
            return this._isActive;
        }

        protected _build() {
            this._div.className = 'tab';
            this._div.textContent = this.name;

            this._div.addEventListener('click', (evt) => {
                // Set this tab as active
                this._tabbar.switchTab(this);
            });
        }

        /** Set this tab as active or not, depending on the current state */
        public active(b: boolean) {
            if (b) {
                this._div.classList.add('active');
            } else {
                this._div.classList.remove('active');
            }
            this._isActive = b;
        }

        public update() {
            // Nothing for the moment
        }

        /** Creates the tab panel for this tab. */
        public getPanel(): HTMLElement {
            return this._panel;
        }

        /** Add this in the propertytab with the searchbar */
        public filter(str: string) { };

        /** Dispose properly this tab */
        public abstract dispose(): void;

        /** Select an item in the tree */
        public select(item: TreeItem) {
            // To define in subclasses if needed 
        }

        /** 
         * Returns the total width in pixel of this tab, 0 by default
        */
        public getPixelWidth(): number {
            let style = Inspector.WINDOW.getComputedStyle(this._div);
            let left = parseFloat(style.marginLeft.substr(0, style.marginLeft.length - 2)) || 0;
            let right = parseFloat(style.marginRight.substr(0, style.marginRight.length - 2)) || 0;
            return (this._div.clientWidth || 0) + left + right;
        }
    }

}