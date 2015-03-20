/// <reference path="raphael.js" />
/// <reference path="actionKinds.js" />
/// <reference path="viewer.js" />

var AB;
(function (AB) {

    //
    // List element
    //
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
            this.telement = document.getElementById("ListTriggers");
            this.aelement = document.getElementById("ListActions");
            this.faelement = document.getElementById("ListFlowActions");

            this.tlist = Raphael("ListTriggers", (25 * screen.width) / 100, 400);
            this.alist = Raphael("ListActions", (25 * screen.width) / 100, 400);
            this.falist = Raphael("ListFlowActions", (25 * screen.width) / 100, 400);
            this.graph = graph;

            this.listElements = new Array();
            this.objectType = AB.ActionsBuilder.Type.OBJECT;

            var scope = this;
            window.onresize = function () {
                for (var i = 0; i < scope.listElements.length; i++) {
                    scope.listElements[i].attr(scope.listElements[i].rect, "width", scope.telement.getBoundingClientRect().width - 20);
                }
            }
        }

        // Clears the list of elements
        List.prototype.clearList = function () {
            for (var i = 0; i < this.listElements.length; i++) {
                this._removeListElement(this.listElements[i]);
            }
        }

        // Creates the list of elements automatically
        List.prototype.createListElements = function () {
            var excludedTriggers = [7, 10, 11]; // If objectType === Scene
            var yOffset = 10;
            var textColor = Raphael.rgb(61, 72, 76);
            var whiteTitle = Raphael.rgb(255, 255, 255);

            // Create Triggers
            var t = this._createListElement("TRIGGERS", AB.ActionsBuilder.Type.OBJECT, null, yOffset, false, whiteTitle, this.tlist);
            t.attr(t.text, "x", 15);
            t.attr(t.rect, "fill", Raphael.rgb(41, 129, 255));
            t.text.attr("font-family", "Sinkin Sans Medium");
            t.text.attr("font-size", "11");
            yOffset += List.ELEMENT_HEIGHT;

            for (var i = 0; i < AB.ActionsBuilder.Trigger.COUNT; i++) {
                if (excludedTriggers.indexOf(i) != -1 && this.objectType != AB.ActionsBuilder.Type.SCENE)
                    continue;

                var e = this._createListElement(AB.ActionsBuilder.Trigger[i].name, AB.ActionsBuilder.Type.TRIGGER,
                                                AB.ActionsBuilder.Trigger[i].properties, yOffset, true, textColor,
                                                this.tlist);
                e.attr(e.rect, "fill", Raphael.rgb(133, 154, 185));

                yOffset += List.ELEMENT_HEIGHT;
            }

            yOffset += List.ELEMENT_HEIGHT;
            this.tlist.canvas.style.height = this.telement.style.height = yOffset + "px";
            this._createCollapseAnimation(this.tlist, this.telement, yOffset, t);

            // Create Actions
            yOffset = 10;

            var a = this._createListElement("ACTIONS", AB.ActionsBuilder.Type.OBJECT, null, yOffset, false, textColor, this.alist);
            a.attr(a.text, "x", 15);
            a.attr(a.rect, "fill", Raphael.rgb(255, 220, 42));
            a.text.attr("font-family", "Sinkin Sans Medium");
            a.text.attr("font-size", "11");
            yOffset += List.ELEMENT_HEIGHT;

            for (var i = 0; i < AB.ActionsBuilder.Action.COUNT; i++) {
                var e = this._createListElement(AB.ActionsBuilder.Action[i].name, AB.ActionsBuilder.Type.ACTION,
                                                AB.ActionsBuilder.Action[i].properties, yOffset, true, textColor,
                                                this.alist);
                e.attr(e.rect, "fill", Raphael.rgb(182, 185, 132));

                yOffset += List.ELEMENT_HEIGHT;
            }

            yOffset += List.ELEMENT_HEIGHT;
            this.alist.canvas.style.height = this.aelement.style.height = yOffset + "px";
            this._createCollapseAnimation(this.alist, this.aelement, yOffset, a);

            // Create flow control
            yOffset = 10;

            var f = this._createListElement("FLOW CONTROL", AB.ActionsBuilder.Type.OBJECT, null, yOffset, false, whiteTitle, this.falist);
            f.attr(f.text, "x", 15);
            f.attr(f.rect, "fill", Raphael.rgb(255, 41, 53));
            f.text.attr("font-family", "Sinkin Sans Medium");
            f.text.attr("font-size", "11");
            yOffset += List.ELEMENT_HEIGHT;

            for (var i = 0; i < AB.ActionsBuilder.FlowAction.COUNT; i++) {
                var e = this._createListElement(AB.ActionsBuilder.FlowAction[i].name, AB.ActionsBuilder.Type.FLOW_CONTROL,
                                                AB.ActionsBuilder.FlowAction[i].properties, yOffset, true, textColor,
                                                this.falist);
                e.attr(e.rect, "fill", Raphael.rgb(185, 132, 140));

                yOffset += List.ELEMENT_HEIGHT;
            }

            yOffset += List.ELEMENT_HEIGHT;
            this.falist.canvas.style.height = this.faelement.style.height = yOffset + "px";
            this._createCollapseAnimation(this.falist, this.faelement, yOffset, f);
        }

        // Sets the color theme of the list (background)
        List.prototype.setColorTheme = function (color) {
            this.tlist.canvas.style.backgroundColor = color;
            this.alist.canvas.style.backgroundColor = color;
            this.falist.canvas.style.backgroundColor = color;
        }

        //
        // Private functions
        //

        // Creates a list element
        // name: the element's name
        // type: the elements type (TRIGGER, ACTION, FLOW_CONTROL)
        // properties: array of properties
        // yOffset: the y position of the element
        // drag: boolean, if the element should be animated
        // textColor: optional, the text color
        // list: the raphaeljs object
        List.prototype._createListElement = function (name, type, properties, yOffset, drag, textColor, list) {
            var e = new ListElement();

            e.rect = list.rect(10, yOffset, this.telement.getBoundingClientRect().width - 30, List.ELEMENT_HEIGHT);
            e.text = list.text(e.rect.attr("x") + 20, yOffset + e.rect.attr("height") / 2, name);
            e.name = name;
            e.type = type;
            e.properties = properties;

            e.rect.attr("fill", Raphael.rgb(64, 64, 64));
            e.rect.attr("stroke", Raphael.rgb(58, 58, 58));
            e.text.attr("font-size", "12");
            e.text.attr("text-anchor", "start");
            e.text.attr("font-family", "Sinkin Sans Light");
            if (textColor)
                e.text.attr("fill", textColor);

            if (drag) {
                this._createListElementAnimation(e);
            }

            this.listElements.push(e);
            return e;
        }

        // Removes a list element
        // element: the list element to remove
        List.prototype._removeListElement = function (element) {
            element.rect.remove();
            element.text.remove();
        }

        // Creates the collapse / expand animation
        // element: the element to animated
        // htmlElement: the html element container
        // expandedHeight: the height when list is expanded
        // onElement: the element that receives the click element
        List.prototype._createCollapseAnimation = function (element, htmlElement, expandedHeight, onElement) {
            var onClick = function (event) {               
                var height = htmlElement.style.height;
                if (height == expandedHeight + "px") {
                    htmlElement.style.height = element.canvas.style.height = 35 + "px";
                }
                else {
                    htmlElement.style.height = element.canvas.style.height = expandedHeight + "px";
                }
            };

            onElement.rect.click(onClick);
        }

        // Creates the animation of list elements
        // element: the element to animate
        List.prototype._createListElementAnimation = function (element) {
            var scope = this;
            var mousex, mousey;

            var onMove = function (dx, dy, x, y, event) {
                mousex = x;
                mousey = y;
            };

            var onStart = function (x, y, event) {
                element.rect.animate({
                    x: -10,
                    opacity: 0.25
                }, 500, ">");
                element.text.animate({
                    x: 10,
                    opacity: 0.25
                }, 500, ">");
            };

            var onEnd = function (event) {
                element.rect.animate({
                    x: 10,
                    opacity: 1.0
                }, 500, "<");
                element.text.animate({
                    x: 30,
                    opacity: 1.0
                }, 500, "<");

                var x = mousex - scope.graph.graph.canvas.getBoundingClientRect().left;
                var y = mousey - scope.graph.graph.canvas.getBoundingClientRect().top;
                var dragResult = scope.graph.traverseGraph(null, x, y);

                if (dragResult.hit) {
                    if (element.type == AB.ActionsBuilder.Type.TRIGGER && dragResult.element != scope.graph.root.action)
                        return;

                    if (element.type == AB.ActionsBuilder.Type.ACTION && dragResult.element == scope.graph.root.action)
                        return;

                    if (element.type == AB.ActionsBuilder.Type.FLOW_CONTROL && (dragResult.element == scope.graph.root.action || (dragResult.element.type == AB.ActionsBuilder.Type.FLOW_CONTROL && dragResult.element.parent.hub == null)))
                        return;

                    if (element.type == AB.ActionsBuilder.Type.FLOW_CONTROL && dragResult.element.combine)
                        return;

                    if (!dragResult.element.combine && dragResult.element.children.length > 0 && dragResult.element.type != AB.ActionsBuilder.Type.TRIGGER && dragResult.element != scope.graph.root.action)
                        return;

                    scope.graph.addNode(dragResult.element, element);
                    scope.graph.update();
                }
            };

            element.rect.drag(onMove, onStart, onEnd);
            element.text.drag(onMove, onStart, onEnd);
        }

        List.ELEMENT_HEIGHT = 25;

        return List;
    })();

    AB.List = List;
    AB.ListElement = ListElement;

})(AB || (AB = { }));
