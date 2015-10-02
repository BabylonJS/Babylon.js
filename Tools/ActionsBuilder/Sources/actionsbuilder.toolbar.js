var ActionsBuilder;
(function (ActionsBuilder) {
    var Toolbar = (function () {
        function Toolbar(viewer) {
            var _this = this;
            // Get HTML elements
            this.toolbarElement = document.getElementById("ToolbarElementID");
            // Configure this
            this._viewer = viewer;
            // Manage events
            window.addEventListener("resize", function (event) {
                _this.onResize();
            });
            // Bottom toolbar
            document.getElementById("ViewerDeZoomID").addEventListener("click", function (event) {
                if (_this._viewer.zoom > 0.1) {
                    _this._viewer.zoom -= 0.1;
                }
                _this._viewer.update();
            });
            document.getElementById("ViewerZoomID").addEventListener("click", function (event) {
                if (_this._viewer.zoom < 1.0) {
                    _this._viewer.zoom += 0.1;
                }
                _this._viewer.update();
            });
            document.getElementById("ViewerReconnectAll").addEventListener("click", function (event) {
                for (var i = 0; i < _this._viewer.root.children.length; i++) {
                    _this._viewer.selectedNode = _this._viewer.root.children[i];
                    _this._viewer.utils.onDetachAction(false, true);
                }
                _this._viewer.update();
                _this._viewer.selectedNode = null;
            });
            document.getElementById("ViewerDisconnectAll").addEventListener("click", function (event) {
                for (var i = 0; i < _this._viewer.root.children.length; i++) {
                    _this._viewer.selectedNode = _this._viewer.root.children[i];
                    _this._viewer.utils.onDetachAction(true, false);
                }
                _this._viewer.update();
                _this._viewer.selectedNode = null;
            });
            document.getElementById("ViewerReduceAll").addEventListener("click", function (event) {
                for (var i = 0; i < _this._viewer.root.children.length; i++) {
                    _this._viewer.selectedNode = _this._viewer.root.children[i];
                    _this._viewer.utils.onReduceAll(false);
                }
                _this._viewer.update();
                _this._viewer.selectedNode = null;
            });
            document.getElementById("ViewerExpandAll").addEventListener("click", function (event) {
                for (var i = 0; i < _this._viewer.root.children.length; i++) {
                    _this._viewer.selectedNode = _this._viewer.root.children[i];
                    _this._viewer.utils.onReduceAll(true);
                }
                _this._viewer.update();
                _this._viewer.selectedNode = null;
            });
            // Top toolbar
            this.saveActionGraphElement = document.getElementById("ToolsButtonIDSaveActionGraph");
            this.drawSaveActionGraphButton(false);
            document.getElementById("ResetActionGraphID").addEventListener("click", function (event) {
                if (confirm("Are you sure?")) {
                    for (var i = 0; i < _this._viewer.root.children.length; i++) {
                        _this._viewer.selectedNode = _this._viewer.root.children[i];
                        _this._viewer.utils.onRemoveBranch();
                    }
                    _this._viewer.update();
                    _this._viewer.selectedNode = null;
                }
            });
            document.getElementById("TestActionGraphID").addEventListener("click", function (event) {
                _this._viewer.utils.onTestGraph();
            });
        }
        Toolbar.prototype.onResize = function () {
            this.toolbarElement.style.top = this._viewer.viewerElement.clientHeight + 20 + "px";
        };
        Toolbar.prototype.drawSaveActionGraphButton = function (draw) {
            this.saveActionGraphElement.style.display = draw ? "block" : "none";
        };
        return Toolbar;
    })();
    ActionsBuilder.Toolbar = Toolbar;
})(ActionsBuilder || (ActionsBuilder = {}));
//# sourceMappingURL=actionsbuilder.toolbar.js.map