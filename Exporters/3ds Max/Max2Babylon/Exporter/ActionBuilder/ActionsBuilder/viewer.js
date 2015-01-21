/// <reference path="raphael.js" />
/// <reference path="action.js" />

var AB;
(function (AB) {

    var Graph = (function () {

        //
        // Public functions
        //
        function Graph() {
            var scope = this;

            // Members
            this.element = document.getElementById('Graph');
            this.graph = Raphael('Graph', (50 * screen.width) / 100, screen.height);
            this.root = this._createNode('Object name', Raphael.rgb(200, 200, 200), true);
            this.parametersElement = document.getElementById('Parameters');

            this.mousex = 0;
            this.mousey = 0;
            this.objectName = '';

            // Context menu (to remove a node)
            this.contextMenu = null;
            this.selectedNode = null;

            this.graph.canvas.addEventListener('contextmenu', function (event) {
                var result = scope.traverseGraph(null, scope.mousex, scope.mousey);
                if (result.hit && result.element != scope.root.action) {
                    scope.selectedNode = result.element;
                    scope.contextMenu = scope._createNode('Remove', Raphael.rgb(255, 255, 255), true);
                    scope._setNodePosition(scope.contextMenu, scope.mousex, scope.mousey);
                }

                window.event.returnValue = false;
            });
            document.onclick = function (event) {
                if (scope.contextMenu) {
                    if (scope.contextMenu.isPointInside(scope.mousex, scope.mousey)) {
                        scope.selectedNode.parent.removeChild(scope.selectedNode);
                        scope._removeAction(scope.selectedNode, true);
                        scope.update();
                    }

                    scope.selectedNode = null;
                    scope._removeNode(scope.contextMenu);
                }

                scope.contextMenu = null;
            };
            document.onmousemove = function (event) {
                scope.mousex = event.clientX - scope.graph.canvas.getBoundingClientRect().left;
                scope.mousey = event.clientY - scope.graph.canvas.getBoundingClientRect().top;

                if (!scope.contextMenu)
                    return;

                if (scope.contextMenu.isPointInside(scope.mousex, scope.mousey))
                    scope.contextMenu.attr(scope.contextMenu.rect, 'fill', Raphael.rgb(140, 200, 230));
                else
                    scope.contextMenu.attr(scope.contextMenu.rect, 'fill', Raphael.rgb(255, 255, 255));
            };

            // Set properties
            this.element.scrollLeft = (this.element.getBoundingClientRect().width / 2) + (Graph.NODE_WIDTH / 2);
        }

        Graph.prototype.addNode = function (parent, listElement) {
            var color = Raphael.rgb(200, 200, 200);
            switch (listElement.type) {
                case AB.ActionsBuilder.Type.TRIGGER: color = Raphael.rgb(100, 149, 237); break;
                case AB.ActionsBuilder.Type.ACTION: color = Raphael.rgb(240, 230, 140); break;
                case AB.ActionsBuilder.Type.FLOW_CONTROL: color = Raphael.rgb(205, 92, 92); break;
            }

            var n = this._createNode(listElement.name, color, false);
            n.action.name = listElement.name;
            n.action.type = listElement.type;
            n.action.properties = listElement.properties;

            for (var i = 0; i < listElement.properties.length; i++)
                n.action.propertiesResults.push(listElement.properties[i].value);

            if (parent)
                parent.addChild(n.action);

            this._createNodeAnimation(n);
        }

        Graph.prototype.update = function (node, yOffset, childID, rootChildID) {
            if (!yOffset)
                yOffset = 10;
            else
                yOffset += Graph.VERTICAL_OFFSET;

            if (!node) node = this.root;

            if (node == this.root) {
                this._setNodePosition(node, (this.graph.width / 2) - (Graph.NODE_WIDTH / 2), yOffset);
            }
            else {
                var length = node.action.parent.children.length;
                var parentx = node.action.parent.node.attr(node.action.parent.node.rect, 'x');
                var totalLength = Graph.NODE_WIDTH * length;
                var offset = ( Graph.NODE_WIDTH * (length - childID - 1) );
                var posx = parentx;
                posx += offset - ((Graph.NODE_WIDTH / 2) * (length - 1));

                this._setNodePosition(node, posx, yOffset);
                this._setLine(node.action);
            }

            for (var i = 0; i < node.action.children.length; i++) {
                if (node == this.root)
                    rootChildID = i;

                this.update(node.action.children[i].node, yOffset, i, rootChildID);

                var n = node.action.children[i].node;
                if (n.action.children.length > 1) {
                    for (var j = rootChildID; j >= 0; j--) {
                        if (node.action.children.length < 2 || n.action.children.length < 2)
                            continue;

                        var rx = this.root.attr(this.root.rect, 'x');
                        var x = this.root.action.children[j].node.attr(this.root.action.children[j].node.rect, 'x');
                        var y = this.root.action.children[j].node.attr(this.root.action.children[j].node.rect, 'y');

                        x -= ((Graph.NODE_WIDTH / 2) * (node.action.children.length - 1)) * (x > rx ? -1 : 1);

                        this._setNodePosition(this.root.action.children[j].node, x, y);
                        this._setLine(this.root.action.children[j]);

                    }
                }
                
            }
        }

        Graph.prototype.createJSON = function (root, graph) {
            if (!root) root = this.root.action;
            if (!graph) graph = {};

            var action = {};
            action.type = root.type;
            action.name = root.name;
            action.children = new Array();

            action.properties = new Array();
            for (var i = 0; i < root.properties.length; i++)
                action.properties[i] = { name: root.properties[i].text, value: root.propertiesResults[i] };
            
            for (var i = 0; i < root.children.length; i++) {
                action.children.push(this.createJSON(root.children[i], action));
            }

            return action;
        }

        Graph.prototype.loadFromJSON = function (graph) {
            var scope = this;

            for (var i = 0; i < this.root.action.children.length; i++)
                this._removeAction(this.root.action.children[i], true);

            this.root.action.clearChildren();

            graph = JSON.parse(graph);
            console.log(graph);

            var load = function (root, parent) {
                if (!parent) parent = scope.root.action;
                if (!root) root = graph;

                if (root.type != AB.ActionsBuilder.Type.OBJECT) { // Means it is the root (the edited object)
                    var e = {};
                    e.type = root.type;
                    e.name = root.name;
                    e.properties = new Array();

                    for (var i = 0; i < root.properties.length; i++)
                        e.properties.push({ text: root.properties[i].name, value: root.properties[i].value });

                    var n = scope.addNode(parent, e);
                    parent = parent.children[parent.children.length - 1];
                }

                for (var i = 0; i < root.children.length; i++) {
                    load(root.children[i], parent);
                }
            }

            load();
            this.update();
        }

        Graph.prototype.traverseGraph = function (start, x, y) {
            if (!start) start = this.root.action;
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
                    return result;
                }

                result = this.traverseGraph(start.children[i], x, y);
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
        Graph.prototype._setLine = function (element) {
            var linex = element.node.attr(element.node.rect, 'x') + Graph.NODE_WIDTH / 2;
            var liney = element.node.attr(element.node.rect, 'y');
            var linex2 = element.parent.node.attr(element.parent.node.rect, 'x') + Graph.NODE_WIDTH / 2;
            var liney2 = element.parent.node.attr(element.parent.node.rect, 'y') + Graph.NODE_HEIGHT;

            element.node.attr(element.node.line, 'path', 'M' + linex + ' ' + liney + 'L' + linex2 + ' ' + liney2);
        }

        Graph.prototype._setNodePosition = function (node, x, y) {
            var offsetx = node.attr(node.rect, 'x') - x;

            node.attr(node.rect, 'x', x);
            node.attr(node.rect, 'y', y);

            node.attr(node.text, 'x', x + 5);
            node.attr(node.text, 'y', y + Graph.NODE_HEIGHT / 2);

            for (var i = 0; i < node.action.children.length; i++) {
                this._setNodePosition(node.action.children[i].node, node.action.children[i].node.attr(node.action.children[i].node.rect, 'x') - offsetx, y + Graph.VERTICAL_OFFSET);
                this._setLine(node.action.children[i]);
            }
        }

        Graph.prototype._removeNode = function (element) {
            element.rect.remove();
            element.text.remove();
            if (element.line)
                element.line.remove();
        }

        Graph.prototype._removeAction = function (action, removeChildren) {
            if (!removeChildren)
                removeChildren = false;

            this._removeNode(action.node);

            if (removeChildren) {
                for (var i = 0; i < action.children.length; i++)
                    this._removeAction(action.children[i], removeChildren);

                action.clearChildren();
            }
            else {
                for (var i = 0; i < action.children.length; i++)
                    action.children[i].parent = action.parent;
            }
        }

        Graph.prototype._createNode = function (text, color, noLine) {
            var n = new AB.Node();
            n.rect = this.graph.rect(0, 0, Graph.NODE_WIDTH, Graph.NODE_HEIGHT, 5);
            n.text = this.graph.text(0, 0, text);
            if (!noLine)
                n.line = this.graph.path('M10 10L90 90');
            n.action = new AB.Action(n);

            n.rect.attr('fill', color);
            n.text.attr('font-size', 12);
            n.text.attr('text-anchor', 'start');

            return n;
        }

        Graph.prototype._createParameters = function (element) {
            var onChange = function (input, propertyID) {
                return function () {
                    var value = input.value;
                    element.action.propertiesResults[propertyID] = value;
                }
            }

            while (this.parametersElement.childNodes.length)
                this.parametersElement.removeChild(this.parametersElement.firstChild);

            var p = element.action.properties;
            var pr = element.action.propertiesResults;

            if (p.length == 0)
                return;

            for (var i = 0; i < p.length; i++) {
                var el = document.createElement('input');
                el.setAttribute('value', pr[i]);
                el.onchange = onChange(el, i);

                var text = document.createElement('a');
                text.text = p[i].text;
                this.parametersElement.appendChild(document.createElement('br'));
                this.parametersElement.appendChild(text);
                this.parametersElement.appendChild(document.createElement('br'));
                this.parametersElement.appendChild(el);
            }
        }

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
                mousex = x;
                mousey = y;

                if (finished) {
                    elementx = element.attr(element.rect, 'x');
                    elementy = element.attr(element.rect, 'y');
                }
                finished = false;

                element.rect.animate({
                    x: element.attr(element.rect, 'x') - 10,
                    y: element.attr(element.rect, 'y') - 5,
                    width: Graph.NODE_WIDTH + 20,
                    height: Graph.NODE_HEIGHT + 10,
                    opacity: 0.25
                }, 500, '>');
            };

            var onEnd = function (event) {
                element.rect.animate({
                    x: elementx,
                    y: elementy,
                    width: Graph.NODE_WIDTH,
                    height: Graph.NODE_HEIGHT,
                    opacity: 1.0
                }, 500, '>', function () { finished = true; });

                var x = mousex - scope.graph.canvas.getBoundingClientRect().left;
                var y = mousey - scope.graph.canvas.getBoundingClientRect().top;
                var dragResult = scope.traverseGraph(null, x, y);

                var json = JSON.stringify(scope.createJSON());
                console.log(json);

                if (dragResult.hit && dragResult.element == element.action || !dragResult.hit) {
                    scope._createParameters(element);
                }
                else {
                    if (element.action.type == AB.ActionsBuilder.Type.TRIGGER && dragResult.element != scope.root.action)
                        return;

                    if (element.action.type == AB.ActionsBuilder.Type.ACTION && dragResult.element == scope.root.action)
                        return;

                    if (element.action.type == AB.ActionsBuilder.Type.FLOW_CONTROL && dragResult.element == scope.root.action)
                        return;

                    // Reset node
                    element.rect.stop(element.rect.animation);
                    element.attr(element.rect, 'opacity', 1.0);
                    element.attr(element.rect, 'width', Graph.NODE_WIDTH);
                    element.attr(element.rect, 'height', Graph.NODE_HEIGHT);

                    element.action.parent.removeChild(element.action);
                    dragResult.element.addChild(element.action);
                    scope.update();
                }
            };

            element.rect.drag(onMove, onStart, onEnd);
            element.text.drag(onMove, onStart, onEnd);
        }

        Graph.NODE_WIDTH = 150;
        Graph.NODE_HEIGHT = 25;
        Graph.VERTICAL_OFFSET = 70;

        return Graph;
    })();

    AB.Graph = Graph;

})(AB || (AB = {}));
