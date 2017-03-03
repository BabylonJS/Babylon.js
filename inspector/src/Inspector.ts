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
        /** The HTML window. In popup mode, it's the popup itself. Otherwise, it's the current tab */
        public static WINDOW : Window;
        /** True if the inspector is built as a popup tab */
        private _popupMode      : boolean = false;
        /** The original canvas style, before applying the inspector*/
        private _canvasStyle :any ;

        /** The inspector is created with the given engine.
         * If the parameter 'popup' is false, the inspector is created as a right panel on the main window.
         * If the parameter 'popup' is true, the inspector is created in another popup.
         */
        constructor(scene: BABYLON.Scene, popup?:boolean) {

            // get canvas parent only if needed.
            this._scene     = scene;
            
            // Save HTML document and window
            Inspector.DOCUMENT = window.document;   
            Inspector.WINDOW = window;                       
            
            // Load the Canvas2D library if it's not already done
            if (!BABYLON.Canvas2D) {
                BABYLON.Tools.LoadScript("http://www.babylonjs.com/babylon.canvas2d.js", () => {});
            }

            // POPUP MODE
            if (popup) { 
                // Build the inspector in the given parent
                this.openPopup(true);// set to true in order to NOT dispose the inspector (done in openPopup), as it's not existing yet
            } else {        
                // Get canvas and its DOM parent
                let canvas                    = this._scene.getEngine().getRenderingCanvas();            
                let canvasParent              = canvas.parentElement;            
                let canvasParentComputedStyle = Inspector.WINDOW.getComputedStyle(canvasParent);

                // get canvas style                
                let canvasComputedStyle  = Inspector.WINDOW.getComputedStyle(canvas);

                this._canvasStyle = { 
                    width        : Helpers.Css(canvas, 'width'),
                    height       : Helpers.Css(canvas, 'height'),

                    position     : canvasComputedStyle.position,
                    top          : canvasComputedStyle.top,
                    bottom       : canvasComputedStyle.bottom,
                    left         : canvasComputedStyle.left,
                    right        : canvasComputedStyle.right,

                    padding      : canvasComputedStyle.padding,
                    paddingBottom: canvasComputedStyle.paddingBottom,
                    paddingLeft  : canvasComputedStyle.paddingLeft,
                    paddingTop   : canvasComputedStyle.paddingTop,
                    paddingRight : canvasComputedStyle.paddingRight,

                    margin       : canvasComputedStyle.margin,
                    marginBottom : canvasComputedStyle.marginBottom,
                    marginLeft   : canvasComputedStyle.marginLeft,
                    marginTop    : canvasComputedStyle.marginTop,
                    marginRight  : canvasComputedStyle.marginRight

                };
                
                // Create c2di wrapper
                this._c2diwrapper  = Helpers.CreateDiv('insp-wrapper');
                
                // copy style from canvas to wrapper
                for (let prop in this._canvasStyle) {
                    this._c2diwrapper.style[prop] = this._canvasStyle[prop];
                }
                
                // Convert wrapper size in % (because getComputedStyle returns px only)
                let widthPx        = parseFloat(canvasComputedStyle.width.substr(0,canvasComputedStyle.width.length-2)) || 0;
                let heightPx       = parseFloat(canvasComputedStyle.height.substr(0,canvasComputedStyle.height.length-2)) || 0;

                // If the canvas position is absolute, restrain the wrapper width to the window width + left positionning
                if (canvasComputedStyle.position === "absolute" || canvasComputedStyle.position === "relative") {
                    // compute only left as it takes predominance if right is also specified (and it will be for the wrapper)
                    let leftPx = parseFloat(canvasComputedStyle.left.substr(0,canvasComputedStyle.left.length-2)) || 0;
                    if (widthPx + leftPx >= Inspector.WINDOW.innerWidth) {
                        this._c2diwrapper.style.maxWidth = `${widthPx-leftPx}px`;
                    }
                }
                
                // Check if the parent of the canvas is the body page. If yes, the size ratio is computed
                let parent = this._getRelativeParent(canvas);

                let parentWidthPx  = parent.clientWidth;
                let parentHeightPx = parent.clientHeight;
                
                let pWidth = widthPx / parentWidthPx * 100;
                let pheight = heightPx / parentHeightPx * 100;

                this._c2diwrapper.style.width = pWidth+"%";
                this._c2diwrapper.style.height = pheight+"%";            

                // reset canvas style
                canvas.style.position = "static";
                canvas.style.width    = "100%";
                canvas.style.height   = "100%";
                canvas.style.paddingBottom = "0";
                canvas.style.paddingLeft = "0";
                canvas.style.paddingTop = "0";
                canvas.style.paddingRight = "0";

                canvas.style.margin = "0";
                canvas.style.marginBottom = "0";
                canvas.style.marginLeft = "0";
                canvas.style.marginTop = "0";
                canvas.style.marginRight = "0";


                // Replace canvas with the wrapper...
                canvasParent.replaceChild(this._c2diwrapper, canvas);
                // ... and add canvas to the wrapper
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
                this._tabbar.updateWidth();
            }

            // Refresh the inspector if the browser is not edge
            if (!Helpers.IsBrowserEdge()) {
                this.refresh();
            }
        }
        
        /**
         * If the given element has a position 'asbolute' or 'relative', 
         * returns the first parent of the given element that has a position 'relative' or 'absolute'.
         * If the given element has no position, returns the first parent
         * 
         */
        private _getRelativeParent(elem:HTMLElement, lookForAbsoluteOrRelative?:boolean) : HTMLElement{
            // If the elem has no parent, returns himself
            if (!elem.parentElement) {
                return elem;
            } 
            let computedStyle = Inspector.WINDOW.getComputedStyle(elem);
            // looking for the first element absolute or relative
            if (lookForAbsoluteOrRelative) {
                // if found, return this one
                if (computedStyle.position === "relative" || computedStyle.position === "absolute") {
                    return elem;
                }else {
                    // otherwise keep looking
                    return this._getRelativeParent(elem.parentElement, true);
                }
            }
            // looking for the relative parent of the element 
            else {
                if (computedStyle.position == "static") {
                    return elem.parentElement;
                } else {
                    // the elem has a position relative or absolute, look for the closest relative/absolute parent
                    return this._getRelativeParent(elem.parentElement, true);
                }         
            }   
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

                // restore canvas style
                for (let prop in this._canvasStyle) {
                    canvas.style[prop] = this._canvasStyle[prop];
                }
                // Get parent of the wrapper 
                let canvasParent   = canvas.parentElement.parentElement;  
                canvasParent.insertBefore(canvas, this._c2diwrapper);
                // Remove wrapper
                Helpers.CleanDiv(this._c2diwrapper);
                this._c2diwrapper.remove();                   
                // Send resize event to the window
                Helpers.SEND_EVENT('resize');              
            }
        }
        
        /** Open the inspector in a new popup
         * Set 'firstTime' to true if there is no inspector created beforehands
         */
        public openPopup(firstTime?:boolean) {    
            
            if (Helpers.IsBrowserEdge()) {
                console.warn('Inspector - Popup mode is disabled in Edge, as the popup DOM cannot be updated from the main window for security reasons');
            } else {
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
                // Dispose the right panel if existing
                if (!firstTime) {
                    this.dispose();
                }
                // set the mode as popup
                this._popupMode = true;
                // Save the HTML document
                Inspector.DOCUMENT = popup.document;
                Inspector.WINDOW = popup;
                // Build the inspector wrapper
                this._c2diwrapper  = Helpers.CreateDiv('insp-wrapper', popup.document.body);
                // add inspector     
                let inspector      = Helpers.CreateDiv('insp-right-panel', this._c2diwrapper);
                inspector.classList.add('popupmode');
                // and build it in the popup  
                this._buildInspector(inspector); 
                // Rebuild it
                this.refresh(); 

                popup.addEventListener('resize', () => {                    
                    if (this._tabbar) {
                        this._tabbar.updateWidth()
                    }
                });
            }             
        }
    }
}