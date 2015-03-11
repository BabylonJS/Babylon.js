/// <reference path="raphael.js" />
/// <reference path="actionKinds.js" />
/// <reference path="viewer.js" />

var AB;
(function (AB) {

    var ContextMenu = (function () {

        function ContextMenu(viewer) {
            var scope = this;

            // Members
            this.viewer = viewer;

            this.showing = false;
            this.savedColor = Raphael.rgb(255, 255, 255);
            this.overColor = Raphael.rgb(140, 200, 230);

            // Context menu elements
            this.elements = [
                { text: "Reduce", rect: null, action: "onReduce" },
                { text: "Delete", rect: null, action: "onRemoveNode" },
                { text: "Delete branch", rect: null, action: "onRemoveBranch" },
                { text: "Connect / Disconnect", rect: null, action: "onDetachNode" },
                { text: "Copy", rect: null, action: "onCopyStructure" },
                { text: "Paste", rect: null, action: "onPasteStructure" },
                // Add other elements here
                { text: "", rect: null, action: null } // Color separator (top)
            ];

            // Finish
            this.attachControl(viewer.graph.canvas);
        }

        // Attaches controls to the viewer
        // element: the viewer element (canvas or div or etc.)
        ContextMenu.prototype.attachControl = function (element) {
            var scope = this;

            var onClick = function (event) {
                var x = scope.viewer.mousex;
                var y = scope.viewer.mousey;

                // Remove all context menu nodes, and run action if selected
                if (scope.showing) {
                    for (var i = 0; i < scope.elements.length; i++) {
                        var el = scope.elements[i];

                        if (el.action && el.rect.isPointInside(x, y))
                            scope.viewer.utils[el.action]();

                        scope.viewer._removeNode(el.rect);
                    }
                }
                scope.showing = false;
            };

            var onMouseMove = function (event) {
                // Override context menu's node color if mouse is inside
                if (scope.showing) {
                    for (var i = 0; i < scope.elements.length; i++) {
                        var el = scope.elements[i];

                        if (el.text == "")
                            continue;

                        var x = scope.viewer.mousex;
                        var y = scope.viewer.mousey;

                        if (el.rect.isPointInside(x, y))
                            el.rect.attr(el.rect.rect, "fill", scope.overColor);
                        else
                            el.rect.attr(el.rect.rect, "fill", scope.savedColor);
                    }
                }
            };

            var onRightClick = function (event) {
                var x = scope.viewer.mousex;
                var y = scope.viewer.mousey;

                if (y + (AB.Graph.NODE_HEIGHT * scope.elements.length) > scope.viewer.element.offsetHeight + scope.viewer.element.scrollTop)
                    y = (AB.Graph.NODE_HEIGHT * scope.elements.length);
                if (x + AB.Graph.NODE_WIDTH > scope.viewer.element.offsetWidth + scope.viewer.element.scrollLeft)
                    x -= AB.Graph.NODE_WIDTH;

                scope.viewer.onClick(event);

                // Set selected node
                var result = scope.viewer.traverseGraph(null, x, y);
                if (result.hit) {
                    scope.viewer.selectedNode = result.element;
                }

                if (!scope.showing) {
                    if (scope.viewer.selectedNode == null)
                        return;

                    // Create elements
                    var yOffset = 10;

                    for (var i = 0; i < scope.elements.length - 1; i++) {
                        var el = scope.elements[i];

                        el.rect = scope.viewer._createNode(el.text, Raphael.rgb(216, 216, 216), true);
                        scope.viewer._setNodePosition(el.rect, x, y + yOffset);

                        el.rect.text.attr("x", x + 5);

                        yOffset += AB.Graph.NODE_HEIGHT;
                    }

                    // Color separator
                    var separator = scope.elements[scope.elements.length - 1];
                    separator.rect = scope.viewer._createNode("", scope.viewer.getNodeColor(scope.viewer.selectedNode), true);
                    scope.viewer._setNodePosition(separator.rect, x, y);
                    separator.rect.attr(separator.rect.rect, "height", 10);

                    // Finish
                    scope.showing = true;
                }
                else {
                    onClick();
                    onRightClick(event);
                }

                window.event.returnValue = false;
            };

            document.addEventListener("click", onClick);
            document.addEventListener("mousemove", onMouseMove);
            element.addEventListener("contextmenu", onRightClick);
        }

        return ContextMenu;
    })();

    AB.ContextMenu = ContextMenu;

})(AB || (AB = { }));
