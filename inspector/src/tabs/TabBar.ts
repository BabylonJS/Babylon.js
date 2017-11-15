module INSPECTOR {
    /**
     * A tab bar will contains each view the inspector can have : Canvas2D, Meshes...
     * The default active tab is the first one of the list.
     */
    export class TabBar extends BasicElement {

        // The list of available tabs
        private _tabs: Array<Tab> = [];
        private _inspector: Inspector;
        /** The tab displaying all meshes */
        private _meshTab: MeshTab;
        /** The toolbar */
        private _toolBar: Toolbar;
        /** The icon displayed at the end of the toolbar displaying a combo box of tabs not displayed */
        private _moreTabsIcon: HTMLElement;
        /** The panel displayed when the 'more-tab' icon is selected */
        private _moreTabsPanel: HTMLElement;
        /** The list of tab displayed by clicking on the remainingIcon */
        private _invisibleTabs: Array<Tab> = [];
        /** The list of tabs visible, displayed in the tab bar */
        private _visibleTabs: Array<Tab> = [];

        constructor(inspector: Inspector, initialTab?: number) {
            super();
            this._inspector = inspector;
            this._tabs.push(new SceneTab(this, this._inspector));
            this._tabs.push(new ConsoleTab(this, this._inspector));
            this._tabs.push(new StatsTab(this, this._inspector));
            this._meshTab = new MeshTab(this, this._inspector);
            this._tabs.push(new TextureTab(this, this._inspector));
            this._tabs.push(this._meshTab);
            this._tabs.push(new LightTab(this, this._inspector));
            this._tabs.push(new MaterialTab(this, this._inspector));
            if (BABYLON.GUI) {
                this._tabs.push(new GUITab(this, this._inspector));
            }
            this._tabs.push(new PhysicsTab(this, this._inspector));
            this._tabs.push(new CameraTab(this, this._inspector));
            this._tabs.push(new SoundTab(this, this._inspector));

            this._toolBar = new Toolbar(this._inspector);

            this._build();

            //Check initialTab is defined and between tabs bounds
            if (!initialTab || initialTab < 0 || initialTab >= this._tabs.length) {
                initialTab = 0;
            }

            this._tabs[initialTab].active(true);

            // set all tab as visible
            for (let tab of this._tabs) {
                this._visibleTabs.push(tab);
            }
        }

        // No update
        public update() { }

        protected _build() {
            this._div.className = 'tabbar';

            this._div.appendChild(this._toolBar.toHtml());
            for (let tab of this._tabs) {
                this._div.appendChild(tab.toHtml());
            }


            this._moreTabsIcon = Helpers.CreateElement('i', 'fa fa-angle-double-right more-tabs');

            this._moreTabsPanel = Helpers.CreateDiv('more-tabs-panel');

            this._moreTabsIcon.addEventListener('click', () => {
                // Hide the 'more-tabs-panel' if already displayed 
                if (this._moreTabsPanel.style.display == 'flex') {
                    this._moreTabsPanel.style.display = 'none';
                } else {
                    // Attach more-tabs-panel if not attached yet
                    let topPanel = this._div.parentNode as HTMLElement;
                    if (!topPanel.contains(this._moreTabsPanel)) {
                        topPanel.appendChild(this._moreTabsPanel);
                    }
                    // Clean the 'more-tabs-panel'
                    Helpers.CleanDiv(this._moreTabsPanel);
                    // Add each invisible tabs to this panel
                    for (let tab of this._invisibleTabs) {
                        this._addInvisibleTabToPanel(tab);
                    }
                    // And display it
                    this._moreTabsPanel.style.display = 'flex';
                }
            });
        }

        /** 
         * Add a tab to the 'more-tabs' panel, displayed by clicking on the 
         * 'more-tabs' icon
         */
        private _addInvisibleTabToPanel(tab: Tab) {
            let div = Helpers.CreateDiv('invisible-tab', this._moreTabsPanel);
            div.textContent = tab.name;
            div.addEventListener('click', () => {
                this._moreTabsPanel.style.display = 'none';
                this.switchTab(tab);
            });
        }

        /** Dispose the current tab, set the given tab as active, and refresh the treeview */
        public switchTab(tab: Tab) {
            // Dispose the active tab
            let activeTab = this.getActiveTab();

            if (activeTab) {
                activeTab.dispose();
            }

            // Deactivate all tabs
            for (let t of this._tabs) {
                t.active(false);
            }
            // activate the given tab
            tab.active(true);

            // Refresh the inspector
            this._inspector.refresh();
        }

        /** Display the mesh tab.
         * If a parameter is given, the given mesh details are displayed
         */
        public switchMeshTab(mesh?: BABYLON.AbstractMesh) {
            this.switchTab(this._meshTab);
            if (mesh) {
                let item = this._meshTab.getItemFor(mesh);
                if (item) {
                    this._meshTab.select(item);
                }
            }
        }

        /** Returns the active tab */
        public getActiveTab(): BABYLON.Nullable<Tab> {
            for (let tab of this._tabs) {
                if (tab.isActive()) {
                    return tab;
                }
            }

            return null;
        }

        public getActiveTabIndex(): number {
            for (let i = 0; i < this._tabs.length; i++) {
                if (this._tabs[i].isActive()) {
                    return i;
                }
            }
            return 0;
        }

        public get inspector(): Inspector {
            return this._inspector;
        }

        /** 
         * Returns the total width in pixel of the tabbar, 
         * that corresponds to the sum of the width of each visible tab + toolbar width
        */
        public getPixelWidth(): number {
            let sum = 0;
            for (let tab of this._visibleTabs) {
                sum += tab.getPixelWidth();
            }
            sum += this._toolBar.getPixelWidth();
            if (this._div.contains(this._moreTabsIcon)) {
                sum += 30; // $tabbarheight
            }
            return sum;
        }

        /** Display the remaining icon or not depending on the tabbar width.
         * This function should be called each time the inspector width is updated
         */
        public updateWidth(): void {
            if (!this._div.parentElement) {
                return;
            }
            let parentSize = this._div.parentElement.clientWidth;
            let lastTabWidth = 75;
            let currentSize = this.getPixelWidth();

            // Check if a tab should be removed : if the tab bar width is greater than
            // its parent width
            while (this._visibleTabs.length > 0 && currentSize > parentSize) {
                // Start by the last element
                let tab = this._visibleTabs.pop();

                if (!tab) {
                    break;
                }

                // set it invisible
                this._invisibleTabs.push(tab);
                // and removes it from the DOM
                this._div.removeChild(tab.toHtml());
                currentSize = this.getPixelWidth() + lastTabWidth;
            }

            // Check if a tab can be added to the tab bar : if the tab bar width
            // + 100 (at least 100px is needed to add a tab) is less than its parent width
            if (this._invisibleTabs.length > 0) {
                if (currentSize + lastTabWidth < parentSize) {
                    let lastTab = this._invisibleTabs.pop();

                    if (lastTab) {
                        this._div.appendChild(lastTab.toHtml());
                        this._visibleTabs.push(lastTab);
                    }
                    // Update more-tab icon in last position if needed
                    if (this._div.contains(this._moreTabsIcon)) {
                        this._div.removeChild(this._moreTabsIcon);
                    }
                }
            }
            if (this._invisibleTabs.length > 0 && !this._div.contains(this._moreTabsIcon)) {
                this._div.appendChild(this._moreTabsIcon);
            }
        }

    }
}