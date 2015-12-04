var ActionsBuilder;
(function (ActionsBuilder) {
    var ContextMenu = (function () {
        /*
        * Constructor
        * @param viewer: the graph viewer
        */
        function ContextMenu(viewer) {
            this.showing = false;
            this.savedColor = Raphael.rgb(255, 255, 255);
            this.overColor = Raphael.rgb(140, 200, 230);
            this._viewer = null;
            this.elements = [
                { text: "Reduce", node: null, action: "onReduce" },
                { text: "Delete", node: null, action: "onRemoveNode" },
                { text: "Delete branch", node: null, action: "onRemoveBranch" },
                { text: "Connect / Disconnect", node: null, action: "onDetachAction" },
                { text: "Copy", node: null, action: "onCopyStructure" },
                { text: "Paste", node: null, action: "onPasteStructure" },
                // Add other elements here
                { text: "", node: null, action: null } // Color separator (top)
            ];
            // Members
            this._viewer = viewer;
            // Configure
            this.attachControl(this._viewer.paper.canvas);
        }
        ContextMenu.prototype.attachControl = function (element) {
            var _this = this;
            var onClick = function (event) {
                var x = _this._viewer.mousex;
                var y = _this._viewer.mousey;
                // Remove all context menu nodes, and run action if selected
                if (_this.showing) {
                    for (var i = 0; i < _this.elements.length; i++) {
                        var element = _this.elements[i];
                        if (element.action && element.node.rect.isPointInside(x, y)) {
                            _this._viewer.utils[element.action]();
                            _this._viewer.update();
                        }
                        element.node.rect.remove();
                        element.node.text.remove();
                    }
                }
                _this.showing = false;
            };
            var onMouseMove = function (event) {
                // Override context menu's node color if mouse is inside
                if (_this.showing) {
                    for (var i = 0; i < _this.elements.length; i++) {
                        var element = _this.elements[i];
                        if (element.text === "")
                            continue;
                        var x = _this._viewer.mousex;
                        var y = _this._viewer.mousey;
                        if (element.node.rect.isPointInside(x, y)) {
                            element.node.rect.attr("fill", _this.overColor);
                        }
                        else {
                            element.node.rect.attr("fill", _this.savedColor);
                        }
                    }
                }
            };
            var onRightClick = function (event) {
                var x = _this._viewer.mousex;
                var y = _this._viewer.mousey;
                _this._viewer.onClick(event);
                // Set selected node
                var result = _this._viewer.traverseGraph(null, x, y, true);
                if (result.hit) {
                }
                // Properly draw the context menu on the screen
                if (y + (ActionsBuilder.Viewer.NODE_HEIGHT * _this.elements.length) > _this._viewer.viewerElement.offsetHeight + _this._viewer.viewerElement.scrollTop) {
                    y = (ActionsBuilder.Viewer.NODE_HEIGHT * _this.elements.length);
                }
                if (x + ActionsBuilder.Viewer.NODE_WIDTH > _this._viewer.viewerElement.offsetWidth + _this._viewer.viewerElement.scrollLeft) {
                    x -= ActionsBuilder.Viewer.NODE_WIDTH;
                }
                if (!_this.showing) {
                    if (_this._viewer.selectedNode === null)
                        return;
                    // Create elements
                    var yOffset = 10;
                    for (var i = 0; i < _this.elements.length - 1; i++) {
                        var element = _this.elements[i];
                        element.node = _this._viewer._createNode(element.text, ActionsBuilder.Type.OBJECT, true);
                        element.node.rect.attr("fill", Raphael.rgb(216, 216, 216));
                        element.node.rect.attr("x", x);
                        element.node.rect.attr("y", y + yOffset);
                        element.node.text.attr("x", x + 5);
                        element.node.text.attr("y", y + yOffset + element.node.rect.attr("height") / 2);
                        yOffset += ActionsBuilder.Viewer.NODE_HEIGHT;
                    }
                    // Color separator
                    var separator = _this.elements[_this.elements.length - 1];
                    separator.node = _this._viewer._createNode("", ActionsBuilder.Type.OBJECT, true);
                    separator.node.rect.attr("fill", _this._viewer.getNodeColor(_this._viewer.selectedNode.type, _this._viewer.selectedNode.node.detached));
                    separator.node.rect.attr("x", x);
                    separator.node.rect.attr("y", y);
                    separator.node.rect.attr("height", 10);
                    // Finish
                    _this.showing = true;
                }
                else {
                    onClick(event);
                    onRightClick(event);
                }
                window.event.returnValue = false;
            };
            document.addEventListener("click", onClick);
            document.addEventListener("mousemove", onMouseMove);
            element.addEventListener("contextmenu", onRightClick);
        };
        return ContextMenu;
    })();
    ActionsBuilder.ContextMenu = ContextMenu;
})(ActionsBuilder || (ActionsBuilder = {}));
//# sourceMappingURL=actionsbuilder.contextMenu.js.map