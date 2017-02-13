var ActionsBuilder;
(function (ActionsBuilder) {
    var ListElement = (function () {
        function ListElement() {
            this.rect = null;
            this.text = null;
            this.name = "";
            this.type = ActionsBuilder.Type.TRIGGER;
            this.element = null;
        }
        return ListElement;
    })();
    ActionsBuilder.ListElement = ListElement;
    var List = (function () {
        function List(viewer) {
            var _this = this;
            this._listElements = new Array();
            this.listElement = document.getElementById("ListsElementID");
            this.triggersElement = document.getElementById("TriggersListID");
            this.actionsElement = document.getElementById("ActionsListID");
            this.flowControlsElement = document.getElementById("FlowActionsListID");
            this._parentContainer = document.getElementById("ParentContainerID");
            this._viewer = viewer;
            this.triggersList = Raphael("TriggersListID", (25 * screen.width) / 100, 400);
            this.actionsList = Raphael("ActionsListID", (25 * screen.width) / 100, 400);
            this.flowControlsList = Raphael("FlowActionsListID", (25 * screen.width) / 100, 400);
            window.addEventListener("resize", function (event) {
                _this.onResize(event);
            });
        }
        Object.defineProperty(List, "ELEMENT_HEIGHT", {
            get: function () {
                return 25;
            },
            enumerable: true,
            configurable: true
        });
        List.prototype.onResize = function (event) {
            var tools = document.getElementById("ToolsButtonsID");
            this.listElement.style.height = window.innerHeight - tools.getBoundingClientRect().height - 25 + "px";
            var listElementWidth = this.listElement.getBoundingClientRect().width;
            for (var i = 0; i < this._listElements.length; i++) {
                var rect = this._listElements[i].rect;
                rect.attr("width", listElementWidth - 40);
            }
            this.triggersList.setSize(listElementWidth, this.triggersList.height);
            this.actionsList.setSize(listElementWidth, this.triggersList.height);
            this.flowControlsList.setSize(listElementWidth, this.triggersList.height);
        };
        List.prototype.createListsElements = function () {
            var excludedTriggers = [6, 9, 10];
            var yPosition = 10;
            var textColor = Raphael.rgb(61, 72, 76);
            var whiteColor = Raphael.rgb(255, 255, 255);
            var configureTitle = function (listElement, rectColor) {
                listElement.text.attr("x", 15);
                listElement.rect.attr("fill", rectColor);
                listElement.text.attr("font-family", "Sinkin Sans Medium");
                listElement.text.attr("font-size", "11");
            };
            var triggers = this._createListElement(this.triggersList, yPosition, "TRIGGERS", ActionsBuilder.Type.TRIGGER, whiteColor, false);
            yPosition += List.ELEMENT_HEIGHT;
            configureTitle(triggers, Raphael.rgb(41, 129, 255));
            for (var i = 0; i < ActionsBuilder.Elements.TRIGGERS.length; i++) {
                var element = ActionsBuilder.Elements.TRIGGERS[i];
                if (this._viewer.root.type === ActionsBuilder.Type.OBJECT && excludedTriggers.indexOf(i) !== -1) {
                    continue;
                }
                else if (this._viewer.root.type === ActionsBuilder.Type.SCENE && excludedTriggers.indexOf(i) === -1) {
                    continue;
                }
                var trigger = this._createListElement(this.triggersList, yPosition, element.text, ActionsBuilder.Type.TRIGGER, textColor, true, element);
                trigger.rect.attr("fill", Raphael.rgb(133, 154, 185));
                yPosition += List.ELEMENT_HEIGHT;
            }
            yPosition += List.ELEMENT_HEIGHT;
            this.triggersElement.style.height = this.triggersList.canvas.style.height = yPosition + "px";
            this._createCollapseAnimation(this.triggersList, this.triggersElement, triggers, yPosition);
            yPosition = 10;
            var actions = this._createListElement(this.actionsList, yPosition, "ACTIONS", ActionsBuilder.Type.ACTION, textColor, false);
            yPosition += List.ELEMENT_HEIGHT;
            configureTitle(actions, Raphael.rgb(255, 220, 42));
            for (var i = 0; i < ActionsBuilder.Elements.ACTIONS.length; i++) {
                var element = ActionsBuilder.Elements.ACTIONS[i];
                var action = this._createListElement(this.actionsList, yPosition, element.text, ActionsBuilder.Type.ACTION, textColor, true, element);
                action.rect.attr("fill", Raphael.rgb(182, 185, 132));
                yPosition += List.ELEMENT_HEIGHT;
            }
            yPosition += List.ELEMENT_HEIGHT;
            this.actionsElement.style.height = this.actionsList.canvas.style.height = yPosition + "px";
            this._createCollapseAnimation(this.actionsList, this.actionsElement, actions, yPosition);
            yPosition = 10;
            var flowControls = this._createListElement(this.flowControlsList, yPosition, "FLOW CONTROLS", ActionsBuilder.Type.FLOW_CONTROL, whiteColor, false);
            yPosition += List.ELEMENT_HEIGHT;
            configureTitle(flowControls, Raphael.rgb(255, 41, 53));
            for (var i = 0; i < ActionsBuilder.Elements.FLOW_CONTROLS.length - 1; i++) {
                var element = ActionsBuilder.Elements.FLOW_CONTROLS[i];
                var flowControl = this._createListElement(this.flowControlsList, yPosition, element.text, ActionsBuilder.Type.FLOW_CONTROL, textColor, true, element);
                flowControl.rect.attr("fill", Raphael.rgb(185, 132, 140));
                yPosition += List.ELEMENT_HEIGHT;
            }
            yPosition += List.ELEMENT_HEIGHT;
            this.flowControlsElement.style.height = this.flowControlsList.canvas.style.height = yPosition + "px";
            this._createCollapseAnimation(this.flowControlsList, this.flowControlsElement, flowControls, yPosition);
        };
        List.prototype.clearLists = function () {
            for (var i = 0; i < this._listElements.length; i++) {
                this._removeListElement(this._listElements[i]);
            }
            this._listElements.splice(0, this._listElements.length - 1);
        };
        List.prototype.setColorTheme = function (color) {
            this.triggersList.canvas.style.backgroundColor = color;
            this.actionsList.canvas.style.backgroundColor = color;
            this.flowControlsList.canvas.style.backgroundColor = color;
        };
        List.prototype._createListElement = function (paper, yPosition, text, type, textColor, drag, element) {
            var object = new ListElement();
            object.rect = paper.rect(10, yPosition, 300, List.ELEMENT_HEIGHT);
            object.text = paper.text(30, yPosition + object.rect.attr("height") / 2, text);
            object.text.attr("fill", textColor);
            object.text.attr("text-anchor", "start");
            object.text.attr("font-size", "12");
            object.text.attr("text-anchor", "start");
            object.text.attr("font-family", "Sinkin Sans Light");
            if (drag) {
                this._createListElementAnimation(object);
            }
            object.type = type;
            object.element = element;
            this._listElements.push(object);
            return object;
        };
        List.prototype._removeListElement = function (element) {
            element.rect.remove();
            element.text.remove();
        };
        List.prototype._createCollapseAnimation = function (paper, htmlElement, element, expandedHeight) {
            var onClick = function (event) {
                var height = htmlElement.style.height;
                if (height === expandedHeight + "px") {
                    htmlElement.style.height = paper.canvas.style.height = 35 + "px";
                }
                else {
                    htmlElement.style.height = paper.canvas.style.height = expandedHeight + "px";
                }
            };
            element.rect.click(onClick);
        };
        List.prototype._createListElementAnimation = function (element) {
            var _this = this;
            var onMove = function (dx, dy, x, y) { };
            var onStart = function (x, y, event) {
                _this._parentContainer.style.cursor = "copy";
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
                _this._parentContainer.style.cursor = "default";
                element.rect.animate({
                    x: 10,
                    opacity: 1.0
                }, 500, "<");
                element.text.animate({
                    x: 30,
                    opacity: 1.0
                }, 500, "<");
                var dragResult = _this._viewer.traverseGraph(null, _this._viewer.mousex, _this._viewer.mousey, false);
                if (dragResult.hit) {
                    if (element.type === ActionsBuilder.Type.TRIGGER && dragResult.action !== _this._viewer.root) {
                        alert("Triggers can be dragged only on the root node (the mesh)");
                        return;
                    }
                    if (element.type === ActionsBuilder.Type.ACTION && dragResult.action === _this._viewer.root) {
                        alert("Please add a trigger before.");
                        return;
                    }
                    if (element.type === ActionsBuilder.Type.FLOW_CONTROL && dragResult.action === _this._viewer.root) {
                        return;
                    }
                    if (element.type === ActionsBuilder.Type.FLOW_CONTROL && dragResult.action.combineArray !== null) {
                        alert("A condition cannot be handled by a Combine Action.");
                        return;
                    }
                    if ((element.type === ActionsBuilder.Type.FLOW_CONTROL || element.type === ActionsBuilder.Type.ACTION) && dragResult.action.type === ActionsBuilder.Type.TRIGGER && dragResult.action.children.length > 0) {
                        alert("Triggers can have only one child. Please add another trigger of same type.");
                        return;
                    }
                    if (!(dragResult.action.combineArray !== null) && dragResult.action.children.length > 0 && dragResult.action.type !== ActionsBuilder.Type.TRIGGER && dragResult.action !== _this._viewer.root) {
                        alert("An action can have only one child.");
                        return;
                    }
                    _this._viewer.addAction(dragResult.action, element.type, element.element);
                    _this._viewer.update();
                }
            };
            element.rect.drag(onMove, onStart, onEnd);
            element.text.drag(onMove, onStart, onEnd);
        };
        return List;
    })();
    ActionsBuilder.List = List;
})(ActionsBuilder || (ActionsBuilder = {}));
