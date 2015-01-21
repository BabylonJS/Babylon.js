/// <reference path="raphael.js" />
/// <reference path="actionKinds.js" />
/// <reference path="viewer.js" />

var AB;
(function (AB) {

    var ListElement = (function () {
        function ListElement() {
            // Members
            this.rect = null;
            this.text = null;

            this.name = new String();
            this.type = AB.ActionsBuilder.Type.SCENE;
            this.kind = null;
            this.properties = null;
        }

        ListElement.prototype.attr = function (element, attribute, value) {
            if (value)
                element.attr(attribute, value);
            else
                return element.attr(attribute);
        }

        return ListElement;
    })();

    var List = (function () {

        //
        // Public functions
        //
        function List(graph) {
            // Members
            this.element = document.getElementById('List');
            this.list = Raphael('List', (25 * screen.width) / 100, screen.height);
            this.graph = graph;

            this.listElements = new Array();
            this.objectType = AB.ActionsBuilder.Type.OBJECT;

            var scope = this;
            window.onresize = function () {
                for (var i = 0; i < scope.listElements.length; i++) {
                    scope.listElements[i].attr(scope.listElements[i].rect, 'width', scope.element.getBoundingClientRect().width - 20);
                }
            }
        }

        List.prototype.clearList = function () {
            for (var i = 0; i < this.listElements.length; i++) {
                this._removeListElement(this.listElements[i]);
            }
        }

        List.prototype.createListElements = function () {
            var excludedTriggers = [7, 10, 11]; // If objectType === Scene
            var yOffset = 10;

            // Create Triggers
            var t = this._createListElement('Triggers', AB.ActionsBuilder.Type.OBJECT, null, yOffset);
            t.attr(t.rect, 'fill', Raphael.rgb(100, 149, 237));
            yOffset += 15;

            for (var i = 0; i < AB.ActionsBuilder.Trigger.COUNT; i++) {
                if (excludedTriggers.indexOf(i) != -1 && this.objectType != AB.ActionsBuilder.Type.SCENE)
                    continue;

                var e = this._createListElement(AB.ActionsBuilder.Trigger[i].name, AB.ActionsBuilder.Type.TRIGGER,
                                                AB.ActionsBuilder.Trigger[i].properties, yOffset, true);

                yOffset += 15;
            }

            // Create Actions
            var a = this._createListElement('Actions', AB.ActionsBuilder.Type.OBJECT, null, yOffset);
            a.attr(a.rect, 'fill', Raphael.rgb(240, 230, 140));
            yOffset += 15;

            for (var i = 0; i < AB.ActionsBuilder.Action.COUNT; i++) {
                var e = this._createListElement(AB.ActionsBuilder.Action[i].name, AB.ActionsBuilder.Type.ACTION,
                                                AB.ActionsBuilder.Action[i].properties, yOffset, true);

                yOffset += 15;
            }

            // Create flow control
            var f = this._createListElement('Flow Control', AB.ActionsBuilder.Type.OBJECT, null, yOffset);
            f.attr(f.rect, 'fill', Raphael.rgb(205, 92, 92));
            yOffset += 15;

            for (var i = 0; i < AB.ActionsBuilder.FlowAction.COUNT; i++) {
                var e = this._createListElement(AB.ActionsBuilder.FlowAction[i].name, AB.ActionsBuilder.Type.FLOW_CONTROL,
                                                AB.ActionsBuilder.FlowAction[i].properties, yOffset, true);

                yOffset += 15;
            }
        }

        //
        // Private functions
        //
        List.prototype._createListElement = function (name, type, properties, yOffset, drag) {
            var e = new ListElement();

            e.rect = this.list.rect(0, yOffset, this.element.getBoundingClientRect().width - 20, 15);
            e.text = this.list.text(e.rect.attr('x') + 20, yOffset + e.rect.attr('height') / 2, name);
            e.name = name;
            e.type = type;
            e.properties = properties;

            e.rect.attr('fill', Raphael.rgb(200, 200, 200));
            e.text.attr('font-size', '12');
            e.text.attr('text-anchor', 'start');

            if (drag) {
                this._createListElementAnimation(e);
            }

            this.listElements.push(e);
            return e;
        }

        List.prototype._removeListElement = function (element) {
            element.rect.remove();
            element.text.remove();
        }

        List.prototype._createListElementAnimation = function (element) {
            var scope = this;
            var mousex, mousey;

            var onMove = function (dx, dy, x, y, event) {
                mousex = x;
                mousey = y;
            };

            var onStart = function (x, y, event) {
                element.rect.animate({
                    x: -20,
                    opacity: 0.25
                }, 500, '>');
                element.text.animate({
                    x: 0,
                    opacity: 0.25
                }, 500, '>');
            };

            var onEnd = function (event) {
                element.rect.animate({
                    x: 0,
                    opacity: 1.0
                }, 500, '<');
                element.text.animate({
                    x: 20,
                    opacity: 1.0
                }, 500, '<');

                var x = mousex - scope.graph.graph.canvas.getBoundingClientRect().left;
                var y = mousey - scope.graph.graph.canvas.getBoundingClientRect().top;
                var dragResult = scope.graph.traverseGraph(null, x, y);

                if (dragResult.hit) {
                    if (element.type == AB.ActionsBuilder.Type.TRIGGER && dragResult.element != scope.graph.root.action)
                        return;

                    if (element.type == AB.ActionsBuilder.Type.ACTION && dragResult.element == scope.graph.root.action)
                        return;

                    if (element.type == AB.ActionsBuilder.Type.FLOW_CONTROL && dragResult.element == scope.graph.root.action)
                        return;

                    scope.graph.addNode(dragResult.element, element);
                    scope.graph.update();
                }
            };

            element.rect.drag(onMove, onStart, onEnd);
            element.text.drag(onMove, onStart, onEnd);
        }

        return List;
    })();

    AB.List = List;
    AB.ListElement = ListElement;

})(AB || (AB = { }));
