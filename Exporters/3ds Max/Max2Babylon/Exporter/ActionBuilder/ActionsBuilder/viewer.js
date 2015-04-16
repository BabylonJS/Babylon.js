/// <reference path="raphael.js" />
/// <reference path="action.js" />
/// <reference path="contextmenu.js" />
/// <reference path="viewertoolbar.js" />
/// <reference path="parametersManager.js" />
/// <reference path="utils.js" />

var AB;
(function (AB) {

    var Graph = (function () {

        //
        // Public functions
        //
        function Graph() {
            var scope = this;

            // Members
            this.element = document.getElementById("Graph");
            this.graph = Raphael("Graph", (50 * screen.width) / 100, screen.height);
            this.root = this._createNode("Object name", Raphael.rgb(255, 255, 255), true);

            this.utils = new AB.Utils(this);
            this.contextMenu = new AB.ContextMenu(this);
            this.toolbar = new AB.ToolBar(this);
            this.parametersManager = new AB.ParametersManager(this);

            this.mousex = 0;
            this.mousey = 0;
            this.objectName = "";
            this.editing = false;
            this.zoom = 1.0;

            this.selectedNode = null;

            this.element.onmouseover = function () {
                scope.editing = false;
            };
            this.element.onmouseout = function () {
                scope.editing = true;
            };

            document.addEventListener("click", function (event) {
                if (!scope.contextMenu.showing) {
                    scope.onClick(event);
                }
            });
            document.ondblclick = function (event) {
                var result = scope.traverseGraph(null, scope.mousex, scope.mousey);
                if (result.hit && result.element.node != scope.root) {
                    scope.onReduce();
                }
            };
            document.onmousemove = function (event) {
                scope.mousex = event.clientX - scope.graph.canvas.getBoundingClientRect().left;
                scope.mousey = event.clientY - scope.graph.canvas.getBoundingClientRect().top;
            };

            // Set properties
            this.element.scrollLeft = (this.element.getBoundingClientRect().width / 2) + (Graph.NODE_WIDTH / 2);
        }

        // Handles the click event. Called by this and this.contextmenu
        // event: the event object
        Graph.prototype.onClick = function (event) {
            var result = this.traverseGraph(null, this.mousex, this.mousey, true);

            if (!this.editing) {
                if (this.selectedNode != null) {
                    var detached = this.isParentDetached(this.selectedNode);
                    this.selectedNode.node.attr(this.selectedNode.node.rect, "fill", this.getNodeColor(this.selectedNode, detached));
                    this.selectedNode = null;
                    if (!result.hit)
                        this.parametersManager.clearParameters();
                }

                if (result.hit && result.element.node != this.root) {
                    this.selectedNode = result.element;
                    this.selectedNode.node.attr(this.selectedNode.node.rect, "fill", this.getSelectedNodeColor(this.selectedNode, detached));
                }

                if (!result.hit)
                    this.selectedNode = null;
            }
        }

        // Returns the node's color for a given type
        // action : the action to test
        // returns the node color
        Graph.prototype.getSelectedNodeColor = function (action, detached) {
            // Detached
            if (action.detached || (action.node && action.node.detached) || detached)
                return Raphael.rgb(96, 122, 14);

            // Get proper color
            var color = Raphael.rgb(255, 255, 255); // Default color for root
            switch (action.type) {
                case AB.ActionsBuilder.Type.TRIGGER: color = Raphael.rgb(41, 129, 255); break;
                case AB.ActionsBuilder.Type.ACTION: color = Raphael.rgb(255, 220, 42); break;
                case AB.ActionsBuilder.Type.FLOW_CONTROL: color = Raphael.rgb(255, 41, 53); break;
            }

            return color;
        }

        Graph.prototype.getNodeColor = function (action, detached) {
            if (action.detached || (action.node && action.node.detached) || detached)
                return Raphael.rgb(96, 122, 14);

            // Get proper color
            var color = Raphael.rgb(255, 255, 255); // Default color for root
            switch (action.type) {
                case AB.ActionsBuilder.Type.TRIGGER: color = Raphael.rgb(133, 154, 185); break;
                case AB.ActionsBuilder.Type.ACTION: color = Raphael.rgb(182, 185, 132); break;
                case AB.ActionsBuilder.Type.FLOW_CONTROL: color = Raphael.rgb(185, 132, 140); break;
            }

            return color;
        }

        Graph.prototype.isParentDetached = function (node) {
            var parent = node.parent;
            while (parent != null) {
                if (parent.node.detached)
                    return true;
                parent = parent.parent;
            }

            return false;
        }

        // Adds a node to the graph
        // parent : the parent of the added node
        // listElement : the values
        Graph.prototype.addNode = function (parent, listElement) {
            var color = this.getNodeColor(listElement);

            var n = this._createNode(listElement.name, color, parent.combine ? true : false);
            if (listElement.name == "CombineAction") {
                n.action.combine = true;

                var hubElement = AB.ActionsBuilder.FlowAction.Hub;
                var hubType = AB.ActionsBuilder.Type.FLOW_CONTROL;
                n.action.hub = this._createNode(hubElement.name, this.getNodeColor({ type: hubType }), false);
                n.action.hub.action.type = hubType;
                n.action.addChild(n.action.hub.action);
                this._createNodeAnimation(n.action.hub);
            }

            n.action.name = listElement.name;
            n.action.type = listElement.type;
            n.detached = listElement.detached || false;
            n.action.properties = listElement.properties;

            for (var i = 0; i < listElement.properties.length; i++)
                n.action.propertiesResults.push(listElement.properties[i].value);

            if (parent && !parent.combine) {
                parent.addChild(n.action);
            }
            else if (parent.combine) {
                // Create hub
                parent.combineArray.push(n.action);
                n.action.parent = parent;
                parent.node.attr(parent.node.text, "text", "");
            }

            this._createNodeAnimation(n);

            return n;
        }

        // Updates the graph
        Graph.prototype.update = function () {
            var scope = this;
            var rootChildID = 0;

            var setNodeSize = function(node) {
                if (node.minimized) {
                    node.attr(node.rect, "width", Graph.NODE_MINIMIZED_WIDTH * scope.zoom);
                    node.attr(node.rect, "height", Graph.NODE_HEIGHT * scope.zoom);
                }
                else {
                    node.attr(node.rect, "width", Graph.NODE_WIDTH * scope.zoom);
                    node.attr(node.rect, "height", Graph.NODE_HEIGHT * scope.zoom);
                }
                node.attr(node.text, "font-size", 11 * scope.zoom);
            }

            var onUpdate = function (action, yOffset) {
                var node = action.node;
                var parent = action.parent ? action.parent.node : null;

                // Set size of node according to zoom
                if (action.combine) {
                    var length = 0;
                    for (var i = 0; i < action.combineArray.length; i++) {
                        var n = action.combineArray[i].node;

                        setNodeSize(n);

                        length += n.attr(n.rect, "width");
                    }
                }
                setNodeSize(node);

                // Set position
                if (parent) {
                    scope._setNodePosition(node, parent.attr(parent.rect, "x"), yOffset);
                    scope._setLine(action);
                }

                // Calculate total width
                var totalWidth = 0;
                for (var i = 0; i < action.children.length; i++) {
                    var n = action.children[i].node;
                    totalWidth += n.attr(n.rect, "width");
                }

                var nodeWidth = node.attr(node.rect, "width");
                var nodex = node.attr(node.rect, "x");

                var startingXPos = nodex + (nodeWidth / 2) - (totalWidth / 2);

                // Recursively set position of children
                for (var i = 0; i < action.children.length; i++) {

                    var n = action.children[i].node;
                    var newx = startingXPos;
                    var newy = yOffset + Graph.VERTICAL_OFFSET * scope.zoom;

                    onUpdate(n.action, newy);

                    scope._setNodePosition(n, newx, newy);
                    scope._setLine(n.action);
                    startingXPos += n.attr(n.rect, "width");
                }
            };

            var onPosition = function (action, maxWidth) {

                var total = 0;
                var start = action.combine && action.combineArray.length > 1 ? 0 : 1;

                for (var i = start; i < action.children.length; i++) {
                    var n = action.children[i].node;

                    if (action.combine) {
                        for (var j = 1; j < action.combineArray.length; j++) {
                            var cn = action.combineArray[j].node;
                            total += cn.attr(cn.rect, "width");
                        }
                    }
                    else
                        total += n.attr(n.rect, "width");
                }

                if (total > maxWidth) {
                    maxWidth = total;
                }

                for (var i = 0; i < action.children.length; i++) {
                    maxWidth = onPosition(action.children[i], maxWidth);
                }

                return maxWidth;

            };

            // Set root node position / scale and recursively set position of its children
            this._setNodePosition(this.root, (this.graph.width / 2) - (Graph.NODE_WIDTH / 2) * this.zoom, 10);
            this.root.attr(this.root.rect, "width", Graph.NODE_WIDTH * scope.zoom);
            this.root.attr(this.root.rect, "height", Graph.NODE_HEIGHT * scope.zoom);

            onUpdate(this.root.action, 10 * this.zoom);

            // Get total widths
            var widths = new Array();
            /*
            object:
                {
                    triggerWidth: number
                    childrenWidths: new Array<number>()
                }
            */

            for (var i = 0; i < scope.root.action.children.length; i++) {
                var a = scope.root.action.children[i];

                var obj = {
                    triggerWidth: onPosition(a, 0),
                    childrenWidths: new Array()
                };

                for (var j = 0; j < a.children.length; j++) {
                    var cw = onPosition(a.children[j], 0);
                    obj.childrenWidths.push(cw);
                    obj.triggerWidth += cw;
                }

                widths.push(obj);
            }

            // Set new position of children
            var rx = scope.root.attr(scope.root.rect, "x");
            var rwidth = 0;
            var cwidth = 0;

            for (var i = 0; i < scope.root.action.children.length; i++) {
                var a = scope.root.action.children[i];
                var tx = a.node.attr(a.node.rect, "x");

                for (var j = 0; j < a.children.length; j++) {
                    var n = a.children[j].node;
                    var x = n.attr(n.rect, "x");
                    var y = n.attr(n.rect, "y");
                    var inverse = x >= tx ? 1 : -1;

                    scope._setNodePosition(n, x + (scope.root.action.children.length > 1 ? widths[i].childrenWidths[j] / 1.8 : 0) * inverse, y);
                    scope._setLine(n.action);

                    scope._resizeCanvas(n);
                    cwidth += widths[i].childrenWidths[j] / 2;
                }

                if (scope.root.action.children.length > 1) {
                    var n = a.node;
                    var x = n.attr(n.rect, "x");
                    var y = n.attr(n.rect, "y");
                    var inverse = x >= rx && i == 0 && !n.minimized ? 1 : -1;

                    scope._setNodePosition(n, x + rwidth + (i > 1 ? widths[i - 1].triggerWidth / 1.8 : 0) + (widths[i].triggerWidth / 1.8) * inverse, y);
                    scope._setLine(n.action);

                    scope._resizeCanvas(n);
                }

                rwidth += widths[i].triggerWidth / 2;
            }
        }

        // Creates the JSON according to the graph
        // root: the root object to start with
        Graph.prototype.createJSON = function (root) {
            if (!root) root = this.root.action;

            var action = {};
            action.type = root.type;
            action.name = root.name;
            action.detached = root.node.detached;
            action.children = new Array();
            action.combine = new Array();

            action.properties = new Array();
            for (var i = 0; i < root.properties.length; i++) {
                action.properties[i] = { name: root.properties[i].text, value: root.propertiesResults[i] };
                if (root.properties[i].targetType != null)
                    action.properties[i].targetType = root.properties[i].targetType;
            }

            if (root.combine) {
                for (var i = 0; i < root.combineArray.length; i++) {
                    var combinedAction = root.combineArray[i];
                    action.combine.push(this.createJSON(combinedAction, action));
                }
            }
            
            if (root.combine)
                root = root.children[0]; // The hub

            for (var i = 0; i < root.children.length; i++) {
                action.children.push(this.createJSON(root.children[i], action));
            }

            return action;
        }

        // Loads a graph from a JSON
        // Graph: the root object's graph
        // startNode: the start node to where begin the load
        Graph.prototype.loadFromJSON = function (graph, startNode) {
            var scope = this;

            // If startNode is null, means it replaces all the graph
            // If not, it comes from a copy/paste
            if (startNode == null) {
                for (var i = 0; i < this.root.action.children.length; i++)
                    this._removeAction(this.root.action.children[i], true);

                this.root.action.clearChildren();
            }

            var load = function (root, parent, detached, combine) {
                if (!parent) parent = scope.root.action;
                if (!root) root = graph;
                if (!detached) detached = false;
                if (!combine) combine = false;

                var n = null; // Not going to be created

                if (root.type != AB.ActionsBuilder.Type.OBJECT) { // Means it is not the root (the edited object)
                    var e = {};
                    e.type = root.type;
                    e.name = root.name;
                    e.detached = root.detached;
                    e.combine = root.combine.length > 0;
                    e.properties = new Array();
                    e.combineArray = new Array();

                    for (var i = 0; i < root.properties.length; i++) {
                        e.properties.push({ text: root.properties[i].name, value: root.properties[i].value });
                        if (root.properties[i].targetType != null) {
                            e.properties[e.properties.length - 1].targetType = root.properties[i].targetType;
                        }
                    }

                    n = scope.addNode(parent, e);
                    if (detached)
                        n.attr(n.rect, "fill", scope.getNodeColor(n.action));
                    else
                        detached = n.detached;

                    // If combine array length > 0, it is a combine action
                    for (var i = 0; i < root.combine.length; i++) {
                        load(root.combine[i], n.action, detached, true);
                    }

                    if (!combine)
                        parent = parent.children[parent.children.length - 1];
                    else
                        n.action.parent = null;
                }

                for (var i = 0; i < root.children.length; i++) {
                    load(root.children[i], n && n.action.combine ? n.action.hub.action : parent, root.detached, false);
                }
            }

            load(graph, startNode);
            this.update();
        }

        // Traverse the graph and returns if hit a node
        // start: the start node to start traverse
        // x: the mouse's x position
        // y: the mouse's y position
        // traverseCombine: if check the combine nodes
        Graph.prototype.traverseGraph = function (start, x, y, traverseCombine) {
            if (!start) start = this.root.action;
            if (traverseCombine == null) traverseCombine = false;

            var result = {
                hit: true,
                element: start
            };

            if (start.node.isPointInside(x, y))
                return result;

            for (var i = 0; i < start.children.length; i++) {

                if (start.children[i].node.isPointInside(x, y)) {
                    result.hit = true;
                    result.element = start.children[i];

                    if (start.children[i].combine && traverseCombine) {
                        var a = start.children[i];
                        for (var j = 0; j < a.combineArray.length; j++) {
                            if (a.combineArray[j].node.isPointInside(x, y)) {
                                result.element = a.combineArray[j];
                                break;
                            }
                        }
                    }

                    return result;
                }

                result = this.traverseGraph(start.children[i], x, y, traverseCombine);
                if (result.hit)
                    return result;

            }

            result.hit = false;
            result.element = null;
            return result;
        }

        //
        // Private functions
        //

        // Sets the given node's line
        // If commented, the line isn't setted by hidden
        Graph.prototype._setLine = function (element) {
            var n = element.node;
            var nodeWidth = n.attr(n.rect, "width");
            var nodeHeight = n.attr(n.rect, "height");
            var nodex = n.attr(n.rect, "x");
            var nodey = n.attr(n.rect, "y");

            if (n.detached) {
                n.attr(n.line, "path", ["M", nodex, nodey, "L", nodex, nodey]);
                return;
            }

            var linex = n.attr(n.rect, "x") + nodeWidth / 2;
            var liney = n.attr(n.rect, "y");

            var p = element.parent.node;
            var parentWidth = p.attr(p.rect, "width");
            var parentHeight = p.attr(p.rect, "height");
            var parentx = p.attr(p.rect, "x");
            var parenty = p.attr(p.rect, "y");

            var liney2 = liney - (liney - parenty - parentHeight) / 2;
            var linex3 = parentx + parentWidth / 2;
            var liney4 = parenty + parentHeight;

            n.attr(n.line, "path", ["M", linex, liney, "L", linex, liney2, "L", linex3, liney2, "L", linex3, liney4]);
            n.attr(n.line, "stroke", this.getSelectedNodeColor(element, element.node.detached));

        }

        // Sets the given node's position
        // Applies changements on its children
        Graph.prototype._setNodePosition = function (node, x, y) {
            var offsetx = node.attr(node.rect, "x") - x;

            node.attr(node.rect, "x", x);
            node.attr(node.rect, "y", y);

            var bbox = node.text.getBBox();
            var textWidth = 0;
            if (bbox)
                textWidth = node.text.getBBox().width;

            node.attr(node.text, "x", x + node.attr(node.rect, "width") / 2 - textWidth / 2);
            node.attr(node.text, "y", y + node.attr(node.rect, "height") / 2);

            // Set combine nodes positions
            if (node.action.combine) {
                var length = 0;
                for (var i = 0; i < node.action.combineArray.length; i++) {
                    var a = node.action.combineArray[i];
                    var n = a.node;

                    n.attr(n.rect, "x", node.attr(node.rect, "x") + length);
                    n.attr(n.rect, "y", node.attr(node.rect, "y"));

                    textWidth = n.text.getBBox().width;
                    n.attr(n.text, "x", n.attr(n.rect, "x") + n.attr(n.rect, "width") / 2 - textWidth / 2);
                    n.attr(n.text, "y", y + Graph.NODE_HEIGHT / 2);

                    length += n.attr(n.rect, "width");
                }

                node.attr(node.rect, "width", length);
            }

            for (var i = 0; i < node.action.children.length; i++) {
                this._setNodePosition(node.action.children[i].node, node.action.children[i].node.attr(node.action.children[i].node.rect, "x") - offsetx, y + Graph.VERTICAL_OFFSET);
                this._setLine(node.action.children[i]);
            }
        }

        // Resizes the canvas if the node is outside the current canvas size
        Graph.prototype._resizeCanvas = function (node) {
            var x = node.attr(node.rect, "x");
            var y = node.attr(node.rect, "y");

            if (x > 0 + Graph.NODE_WIDTH && x < this.graph.width - Graph.NODE_WIDTH && y < this.graph.height)
                    return;

            this.graph.setSize(this.graph.width + 500, this.graph.height + 500);
            this._setNodePosition(this.root, (this.graph.width / 2) - (Graph.NODE_WIDTH / 2), 10);

            this.element.scrollLeft = (this.graph.width / 2) - this.element.getBoundingClientRect().width / 2;
        }

        // Removes a node
        // node : the node to remove
        Graph.prototype._removeNode = function (node) {
            node.rect.remove();
            node.text.remove();
            if (node.line)
                node.line.remove();
        }

        // Remove an action from the graph
        // action : the action to remove
        // removeChildren : if true, it deletes the branch
        Graph.prototype._removeAction = function (action, removeChildren) {
            if (!removeChildren)
                removeChildren = false;

            this._removeNode(action.node);

            if (action.combine) {
                for (var i = 0; i < action.combineArray.length; i++) {
                    this._removeNode(action.combineArray[i].node);
                }
                action.combineArray = new Array();
            }

            if (removeChildren) {
                for (var i = 0; i < action.children.length; i++)
                    this._removeAction(action.children[i], removeChildren);

                action.clearChildren();
            }
            else {
                for (var i = 0; i < action.children.length; i++) {
                    action.parent.addChild(action.children[i]);
                    action.children[i].parent = action.parent;
                }
            }
        }

        // Creates a node
        // text : the text/name of the node
        // color : the node's color
        // noLine : if the node has parent then draw a line, or not
        Graph.prototype._createNode = function (text, color, noLine) {
            var n = new AB.Node();
            n.rect = this.graph.rect(20, 20, Graph.NODE_WIDTH, Graph.NODE_HEIGHT, 0);
            n.text = this.graph.text(0, 0, text);

            if (!noLine) {
                n.line = this.graph.path("M10 10L90 90");
                n.line.attr("stroke", color);
            }

            n.action = new AB.Action(n);

            n.rect.attr("fill", color);
            n.text.attr("font-size", 11);
            n.text.attr("text-anchor", "start");
            n.text.attr("font-family", "Sinkin Sans Light");

            return n;
        }

        // Creates the animations for a node
        // element: the node
        Graph.prototype._createNodeAnimation = function (element) {
            var scope = this;
            var mousex, mousey;
            var finished = true;
            var elementx = 0;
            var elementy = 0;

            var onMove = function (dx, dy, x, y, event) {
                mousex = x;
                mousey = y;
            };

            var onStart = function (x, y, event) {
                if (element.minimized)
                    return;

                mousex = x;
                mousey = y;

                if (finished) {
                    elementx = element.attr(element.rect, "x");
                    elementy = element.attr(element.rect, "y");
                }
                finished = false;

                if (!element.minimized) {
                    element.rect.animate({
                        x: element.attr(element.rect, "x") - 10,
                        y: element.attr(element.rect, "y") - 5,
                        width: element.minimized ? Graph.NODE_MINIMIZED_WIDTH + 20 : Graph.NODE_WIDTH + 20,
                        height: Graph.NODE_HEIGHT + 10,
                        opacity: 0.25
                    }, 500, ">");
                }
            };

            var onEnd = function (event) {

                if (!element.minimized) {
                    element.rect.animate({
                        x: elementx,
                        y: elementy,
                        width: element.minimized ? Graph.NODE_MINIMIZED_WIDTH : Graph.NODE_WIDTH,
                        height: Graph.NODE_HEIGHT,
                        opacity: 1.0
                    }, 500, ">", function () { finished = true; });
                }
                var x = mousex - scope.graph.canvas.getBoundingClientRect().left;
                var y = mousey - scope.graph.canvas.getBoundingClientRect().top;
                var dragResult = scope.traverseGraph(null, x, y, true);

                if (dragResult.hit && dragResult.element == element.action || !dragResult.hit) {
                    scope.parametersManager.createParameters(element);
                }
                else {
                    if (dragResult.element.children.length > 0 && dragResult.element.type != AB.ActionsBuilder.Type.TRIGGER)
                        return;

                    if (element.action.type == AB.ActionsBuilder.Type.TRIGGER && dragResult.element != scope.root.action)
                        return;

                    if (element.action.type == AB.ActionsBuilder.Type.ACTION && dragResult.element == scope.root.action)
                        return;

                    if (element.action.type == AB.ActionsBuilder.Type.FLOW_CONTROL && (dragResult.element == scope.root.action || dragResult.element.type == AB.ActionsBuilder.Type.FLOW_CONTROL))
                        return;

                    if (element.action.parent && element.action.parent.combine) // Musn't move hubs
                        return;

                    if (element.action == dragResult.element.parent)
                        return;

                    // Reset node
                    element.rect.stop(element.rect.animation);
                    element.attr(element.rect, "opacity", 1.0);
                    element.attr(element.rect, "width", Graph.NODE_WIDTH);
                    element.attr(element.rect, "height", Graph.NODE_HEIGHT);

                    if (element.action.parent) {
                        element.action.parent.removeChild(element.action);
                        dragResult.element.addChild(element.action);
                        scope.update();
                        scope._createNodeAnimation(element);
                    }
                }
            };

            element.rect.drag(onMove, onStart, onEnd);
            element.text.drag(onMove, onStart, onEnd);
        }

        Graph.NODE_MINIMIZED_WIDTH = 50;
        Graph.NODE_WIDTH = 150;
        Graph.NODE_HEIGHT = 25;
        Graph.VERTICAL_OFFSET = 70;

        return Graph;
    })();

    AB.Graph = Graph;

})(AB || (AB = {}));
