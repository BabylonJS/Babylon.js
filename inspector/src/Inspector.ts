module INSPECTOR {
    export class Inspector {

        private _c2diwrapper    : HTMLElement;
        // private _detailsPanel: DetailPanel;
        /** The panel displayed at the top of the inspector */
        private _topPanel       : HTMLElement;
        /** The div containing the content of the active tab */
        private _tabPanel       : HTMLElement;
        /** The panel containing the list if items */
        // private _treePanel   : HTMLElement;
        /** The list if tree items displayed in the tree panel. */
        private _items          : Array<TreeItem>;
        private _tabbar         : TabBar;
        private _scene          : BABYLON.Scene;
        /** The HTML document relative to this inspector (the window or the popup depending on its mode) */
        public static DOCUMENT  : HTMLDocument;
        /** True if the inspector is built as a popup tab */
        private _popupMode      : boolean = false;
        /** The original canvas size, before applying the inspector*/
        private _canvasSize : {width:string, height:string};

        /** The inspector is created with the given engine.
         * If a HTML parent is not given as a parameter, the inspector is created as a right panel on the main window.
         * If a HTML parent is given, the inspector is created in this element, taking full size of its parent.
         */
        constructor(scene: BABYLON.Scene, parent?:HTMLElement) {

            // get canvas parent only if needed.
            this._scene     = scene;
            
            // Save HTML document
            Inspector.DOCUMENT = window.document;                       
            
            // POPUP MODE if parent is defined
            if (parent) {    
                // Build the inspector in the given parent
                this._buildInspector(parent);
            } else {        
                // Get canvas and its DOM parent
                let canvas            = this._scene.getEngine().getRenderingCanvas();            
                let canvasParent      = canvas.parentElement;                                
                // resize canvas
                // canvas.style.width = 'calc(100% - 750px - 12px)';

                // get canvas style                
                let canvasStyle       = window.getComputedStyle(canvas);
                this._canvasSize = { width:canvasStyle.width, height:canvasStyle.height};

                // Create c2di wrapper
                this._c2diwrapper  = Helpers.CreateDiv('insp-wrapper', canvasParent);
                this._c2diwrapper.style.width = this._canvasSize.width;
                this._c2diwrapper.style.height = this._canvasSize.height;
                // Add canvas to the wrapper
                this._c2diwrapper.appendChild(canvas);
                // add inspector     
                let inspector      = Helpers.CreateDiv('insp-right-panel', this._c2diwrapper);
                // Add split bar
                Split([canvas, inspector], {
                    direction:'horizontal',
                    sizes : [75, 25],
                    onDrag : () => { 
                        Helpers.SEND_EVENT('resize');
                        if (this._tabbar) {
                            this._tabbar.updateWidth()
                        }
                    }
                });

                // Build the inspector
                this._buildInspector(inspector);   
                // Send resize event to the window
                Helpers.SEND_EVENT('resize');
            }

            // Refresh the inspector
            this.refresh();
        }
        
        /** Build the inspector panel in the given HTML element */
        private _buildInspector(parent:HTMLElement) {            
            // tabbar
            this._tabbar = new TabBar(this);

            // Top panel
            this._topPanel = Helpers.CreateDiv('top-panel', parent);
            // Add tabbar
            this._topPanel.appendChild(this._tabbar.toHtml());
            this._tabbar.updateWidth();
            
            // Tab panel
            this._tabPanel = Helpers.CreateDiv('tab-panel-content', this._topPanel);
            
        }

        public get scene() : BABYLON.Scene {
            return this._scene;
        }
        public get popupMode() : boolean {
            return this._popupMode;
        }

        /**  
         * Filter the list of item present in the tree.
         * All item returned should have the given filter contained in the item id.
        */
        public filterItem(filter:string){
            this._tabbar.getActiveTab().filter(filter);
        }
        
        /** Display the mesh tab on the given object */
        public displayObjectDetails(mesh:BABYLON.AbstractMesh) {
            this._tabbar.switchMeshTab(mesh);
        }

        /** Clean the whole tree of item and rebuilds it */
        public refresh() {
            // Clean top panel
            Helpers.CleanDiv(this._tabPanel);

            // Get the active tab and its items
            let activeTab = this._tabbar.getActiveTab();
            activeTab.update();
            this._tabPanel.appendChild(activeTab.getPanel());            
            Helpers.SEND_EVENT('resize');
            
        }        
        
        /** Remove the inspector panel when it's built as a right panel:
         * remove the right panel and remove the wrapper
         */
        public dispose() {
            if (!this._popupMode) {
                // Get canvas
                let canvas         = this._scene.getEngine().getRenderingCanvas(); 
                // restore canvas size
                canvas.style.width = this._canvasSize.width;
                canvas.style.height = this._canvasSize.height;
                // Get parent of the wrapper           
                let canvasParent   = canvas.parentElement.parentElement;  
                canvasParent.appendChild(canvas);                              
                // Remove wrapper
                Helpers.CleanDiv(this._c2diwrapper);
                this._c2diwrapper.remove();                   
                // Send resize event to the window
                Helpers.SEND_EVENT('resize');              
            }
        }
        
        /** Open the inspector in a new popup */
        public openPopup() {    
            // Create popup
            let popup = window.open('', 'Babylon.js INSPECTOR', 'toolbar=no,resizable=yes,menubar=no,width=750,height=1000');
            popup.document.title = 'Babylon.js INSPECTOR';
            // Get the inspector style      
            let styles = Inspector.DOCUMENT.querySelectorAll('style');
            for (let s = 0; s<styles.length; s++) {
                popup.document.body.appendChild(styles[s].cloneNode(true));              
            } 
            let links = document.querySelectorAll('link');
            for (let l = 0; l<links.length; l++) {
                let link  = popup.document.createElement("link");
                link.rel  = "stylesheet";
                link.href = (links[l] as HTMLLinkElement).href;
                popup.document.head.appendChild(link);              
            } 
            // Dispose the right panel
            this.dispose();
            // set the mode as popup
            this._popupMode = true;
            // Save the HTML document
            Inspector.DOCUMENT = popup.document;
            // Build the inspector wrapper
            this._c2diwrapper  = Helpers.CreateDiv('insp-wrapper', popup.document.body);
            // add inspector     
            let inspector      = Helpers.CreateDiv('insp-right-panel', this._c2diwrapper);
            // and build it in the popup  
            this._buildInspector(inspector); 
            // Rebuild it
            this.refresh();              
        }
    }
}