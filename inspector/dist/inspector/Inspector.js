var INSPECTOR;
(function (INSPECTOR) {
    var Inspector = (function () {
        /** The inspector is created with the given engine.
         * If a HTML parent is not given as a parameter, the inspector is created as a right panel on the main window.
         * If a HTML parent is given, the inspector is created in this element, taking full size of its parent.
         */
        function Inspector(scene, parent) {
            var _this = this;
            /** True if the inspector is built as a popup tab */
            this._popupMode = false;
            // get canvas parent only if needed.
            this._scene = scene;
            // Save HTML document
            Inspector.DOCUMENT = window.document;
            // POPUP MODE if parent is defined
            if (parent) {
                // Build the inspector in the given parent
                this._buildInspector(parent);
            }
            else {
                // Get canvas and its DOM parent
                var canvas = this._scene.getEngine().getRenderingCanvas();
                var canvasParent = canvas.parentElement;
                // resize canvas
                // canvas.style.width = 'calc(100% - 750px - 12px)';
                // get canvas style                
                var canvasStyle = window.getComputedStyle(canvas);
                this._canvasSize = { width: canvasStyle.width, height: canvasStyle.height };
                // Create c2di wrapper
                this._c2diwrapper = INSPECTOR.Helpers.CreateDiv('insp-wrapper', canvasParent);
                this._c2diwrapper.style.width = this._canvasSize.width;
                this._c2diwrapper.style.height = this._canvasSize.height;
                // Add canvas to the wrapper
                this._c2diwrapper.appendChild(canvas);
                // add inspector     
                var inspector = INSPECTOR.Helpers.CreateDiv('insp-right-panel', this._c2diwrapper);
                // Add split bar
                Split([canvas, inspector], {
                    direction: 'horizontal',
                    onDrag: function () {
                        INSPECTOR.Helpers.SEND_EVENT('resize');
                        if (_this._tabbar) {
                            _this._tabbar.updateWidth();
                        }
                    }
                });
                // Build the inspector
                this._buildInspector(inspector);
                // Send resize event to the window
                INSPECTOR.Helpers.SEND_EVENT('resize');
            }
            // Refresh the inspector
            this.refresh();
        }
        /** Build the inspector panel in the given HTML element */
        Inspector.prototype._buildInspector = function (parent) {
            // tabbar
            this._tabbar = new INSPECTOR.TabBar(this);
            // Top panel
            this._topPanel = INSPECTOR.Helpers.CreateDiv('top-panel', parent);
            // Add tabbar
            this._topPanel.appendChild(this._tabbar.toHtml());
            this._tabbar.updateWidth();
            // Tab panel
            this._tabPanel = INSPECTOR.Helpers.CreateDiv('tab-panel-content', this._topPanel);
        };
        Object.defineProperty(Inspector.prototype, "scene", {
            get: function () {
                return this._scene;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Inspector.prototype, "popupMode", {
            get: function () {
                return this._popupMode;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Filter the list of item present in the tree.
         * All item returned should have the given filter contained in the item id.
        */
        Inspector.prototype.filterItem = function (filter) {
            this._tabbar.getActiveTab().filter(filter);
        };
        /** Display the mesh tab on the given object */
        Inspector.prototype.displayObjectDetails = function (mesh) {
            this._tabbar.switchMeshTab(mesh);
        };
        /** Clean the whole tree of item and rebuilds it */
        Inspector.prototype.refresh = function () {
            // Clean top panel
            INSPECTOR.Helpers.CleanDiv(this._tabPanel);
            // Get the active tab and its items
            var activeTab = this._tabbar.getActiveTab();
            activeTab.update();
            this._tabPanel.appendChild(activeTab.getPanel());
            INSPECTOR.Helpers.SEND_EVENT('resize');
        };
        /** Remove the inspector panel when it's built as a right panel:
         * remove the right panel and remove the wrapper
         */
        Inspector.prototype._disposeInspector = function () {
            if (!this._popupMode) {
                // Get canvas
                var canvas = this._scene.getEngine().getRenderingCanvas();
                // restore canvas size
                canvas.style.width = this._canvasSize.width;
                canvas.style.height = this._canvasSize.height;
                // Get parent of the wrapper           
                var canvasParent = canvas.parentElement.parentElement;
                canvasParent.appendChild(canvas);
                // Remove wrapper
                INSPECTOR.Helpers.CleanDiv(this._c2diwrapper);
                this._c2diwrapper.remove();
                // Send resize event to the window
                INSPECTOR.Helpers.SEND_EVENT('resize');
            }
        };
        /** Open the inspector in a new popup */
        Inspector.prototype.openPopup = function () {
            // Create popup
            var popup = window.open('', 'Babylon.js INSPECTOR', 'toolbar=no,resizable=yes,menubar=no,width=750,height=1000');
            popup.document.title = 'Babylon.js INSPECTOR';
            // Get the inspector style      
            var styles = Inspector.DOCUMENT.querySelectorAll('style');
            for (var s = 0; s < styles.length; s++) {
                popup.document.body.appendChild(styles[s].cloneNode(true));
            }
            var links = document.querySelectorAll('link');
            for (var l = 0; l < links.length; l++) {
                var link = popup.document.createElement("link");
                link.rel = "stylesheet";
                link.href = links[l].href;
                popup.document.head.appendChild(link);
            }
            // Dispose the right panel
            this._disposeInspector();
            // set the mode as popup
            this._popupMode = true;
            // Save the HTML document
            Inspector.DOCUMENT = popup.document;
            // Build the inspector wrapper
            this._c2diwrapper = INSPECTOR.Helpers.CreateDiv('insp-wrapper', popup.document.body);
            // add inspector     
            var inspector = INSPECTOR.Helpers.CreateDiv('insp-right-panel', this._c2diwrapper);
            // and build it in the popup  
            this._buildInspector(inspector);
            // Rebuild it
            this.refresh();
        };
        return Inspector;
    }());
    INSPECTOR.Inspector = Inspector;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Inspector.js.map