var ActionsBuilder;
(function (ActionsBuilder) {
    var Node = (function () {
        function Node() {
            this.rect = null;
            this.text = null;
            this.line = null;
            this.detached = false;
            this.minimized = false;
        }
        /**
        * Returns if the point (x, y) is inside the text or rect
        * @param x: the x position of the point
        * @param y: the y position of the point
        */
        Node.prototype.isPointInside = function (x, y) {
            return this.rect.isPointInside(x, y) || this.text.isPointInside(x, y);
        };
        return Node;
    })();
    ActionsBuilder.Node = Node;
    var Action = (function () {
        /**
        * Constructor
        * @param node: The associated node to draw in the viewer
        */
        function Action(node) {
            this.parent = null;
            this.children = new Array();
            this.name = "";
            this.type = ActionsBuilder.Type.OBJECT;
            this.properties = new Array();
            this.propertiesResults = new Array();
            this.combineArray = null;
            this.hub = null;
            this.combineAction = null;
            this.node = node;
        }
        /*
        * Removes a combined action from the combine array
        * @param action: the action to remove
        */
        Action.prototype.removeCombinedAction = function (action) {
            if (action === null || this.combineArray === null) {
                return false;
            }
            var index = this.combineArray.indexOf(action);
            if (index !== -1) {
                this.combineArray.splice(index, 1);
            }
            return false;
        };
        /*
        * Adds a child
        * @param child: the action to add as child
        */
        Action.prototype.addChild = function (child) {
            if (child === null) {
                return false;
            }
            this.children.push(child);
            child.parent = this;
            return true;
        };
        /*
        * Removes the given action to children
        * @param child: the child to remove
        */
        Action.prototype.removeChild = function (child) {
            var indice = this.children.indexOf(child);
            if (indice !== -1) {
                this.children.splice(indice, 1);
                return true;
            }
            return false;
        };
        /*
        * Clears the children's array
        */
        Action.prototype.clearChildren = function () {
            this.children = new Array();
        };
        return Action;
    })();
    ActionsBuilder.Action = Action;
})(ActionsBuilder || (ActionsBuilder = {}));
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
        /**
        * Constructor
        */
        function List(viewer) {
            var _this = this;
            this._listElements = new Array();
            // Get HTML elements
            this.listElement = document.getElementById("ListsElementID");
            this.triggersElement = document.getElementById("TriggersListID");
            this.actionsElement = document.getElementById("ActionsListID");
            this.flowControlsElement = document.getElementById("FlowActionsListID");
            this._parentContainer = document.getElementById("ParentContainerID");
            // Configure this
            this._viewer = viewer;
            // Create elements (lists)
            this.triggersList = Raphael("TriggersListID", (25 * screen.width) / 100, 400);
            this.actionsList = Raphael("ActionsListID", (25 * screen.width) / 100, 400);
            this.flowControlsList = Raphael("FlowActionsListID", (25 * screen.width) / 100, 400);
            // Manage events
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
        /**
        * Resize event that resizes the list element dynamically
        * @param event: the resize event
        */
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
            // Create triggers
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
            // Create actions
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
            // Create flow controls
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
        /**
        * Clears the list of elements and removes the elements
        */
        List.prototype.clearLists = function () {
            for (var i = 0; i < this._listElements.length; i++) {
                this._removeListElement(this._listElements[i]);
            }
            this._listElements.splice(0, this._listElements.length - 1);
        };
        /**
        * Sets the color theme of the lists
        * @param color: the theme color
        */
        List.prototype.setColorTheme = function (color) {
            this.triggersList.canvas.style.backgroundColor = color;
            this.actionsList.canvas.style.backgroundColor = color;
            this.flowControlsList.canvas.style.backgroundColor = color;
        };
        /**
        * Creates a list element
        * @param paper: the Raphael.js paper
        * @param yPosition: the y position of the element
        * @param text: the element text
        * @param type: the element type (trigger, action, flow control)
        * @param textColor: the text color
        * @param drag: if the element should be drag'n'dropped
        */
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
        /**
        * Removes a list element
        * @param element: the element to remove
        */
        List.prototype._removeListElement = function (element) {
            element.rect.remove();
            element.text.remove();
        };
        /*
        * Creates the collapse animation of a list
        * @param paper: the list paper
        * @param htmlElement: the list div container
        * @param element: the list element to click on
        * @param expandedHeight: the height when the list is expanded
        */
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
        /*
        * Creates the animation of a list element
        * @param element: the list element to animate
        */
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
                    //if (element.type === Type.FLOW_CONTROL && (dragResult.action === this._viewer.root || (dragResult.action.type === Type.FLOW_CONTROL && dragResult.action.parent.hub === null))) {
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
/*
Global functions called by the plugins (3ds Max, etc.)
*/
// Elements
var list = null;
var viewer = null;
var actionsBuilderJsonInput = document.getElementById("ActionsBuilderJSON");
this.createJSON = function () {
    var structure = viewer.utils.createJSON(viewer.root);
    var asText = JSON.stringify(structure);
    actionsBuilderJsonInput.value = asText;
    console.log(asText);
};
this.loadFromJSON = function () {
    var json = actionsBuilderJsonInput.value;
    if (json !== "") {
        var structure = JSON.parse(json);
        viewer.utils.loadFromJSON(structure, null);
    }
};
this.updateObjectName = function () {
    var element = document.getElementById("ActionsBuilderObjectName");
    var name = element.value;
    viewer.objectName = name;
    if (viewer.root.type === ActionsBuilder.Type.OBJECT) {
        name += " - Mesh";
    }
    else {
        name += " - Scene";
    }
    viewer.root.node.text.attr("text", name);
};
this.resetList = function () {
    list.clearLists();
    list.createListsElements();
};
this.setMeshesNames = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    for (var i = 0; i < args.length; i++) {
        ActionsBuilder.SceneElements.MESHES.push(args[i]);
    }
};
this.setLightsNames = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    for (var i = 0; i < args.length; i++) {
        ActionsBuilder.SceneElements.LIGHTS.push(args[i]);
    }
};
this.setCamerasNames = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    for (var i = 0; i < args.length; i++) {
        ActionsBuilder.SceneElements.CAMERAS.push(args[i]);
    }
};
this.setSoundsNames = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    for (var i = 0; i < args.length; i++) {
        var sound = args[i];
        if (sound !== "" && ActionsBuilder.SceneElements.SOUNDS.indexOf(sound) === -1) {
            ActionsBuilder.SceneElements.SOUNDS.push(args[i]);
        }
    }
};
this.hideButtons = function () {
    // Empty
};
this.setIsObject = function () {
    viewer.root.type = ActionsBuilder.Type.OBJECT;
};
this.setIsScene = function () {
    viewer.root.type = ActionsBuilder.Type.SCENE;
};
this.run = function () {
    // Configure viewer
    viewer = new ActionsBuilder.Viewer(ActionsBuilder.Type.OBJECT);
    viewer.setColorTheme("-ms-linear-gradient(top, rgba(38, 38, 38,1) 0%, rgba(125, 126, 125, 1) 100%)");
    viewer.setColorTheme("linear-gradient(top, rgba(38, 38, 38,1) 0%, rgba(125, 126, 125, 1) 100%)");
    viewer.setColorTheme("-webkit-linear-gradient(top, rgba(38, 38, 38,1) 0%, rgba(125, 126, 125, 1) 100%)");
    viewer.setColorTheme("-o-linear-gradient(top, rgba(38, 38, 38,1) 0%, rgba(125, 126, 125, 1) 100%)");
    viewer.onResize();
    viewer.update();
    // Configure list
    list = new ActionsBuilder.List(viewer);
    list.setColorTheme("rgb(64, 64, 64)");
    list.createListsElements();
    list.onResize();
    // 3ds Max fix
    viewer.onResize();
};
var ActionsBuilder;
(function (ActionsBuilder) {
    var Parameters = (function () {
        /*
        * Constructor
        */
        function Parameters(viewer) {
            var _this = this;
            this._action = null;
            // Get HTML elements
            this.parametersContainer = document.getElementById("ParametersElementID");
            this.parametersHelpElement = document.getElementById("ParametersHelpElementID");
            // Configure this
            this._viewer = viewer;
            // Configure events
            window.addEventListener("resize", function (event) {
                _this.onResize(event);
            });
        }
        /*
        * Clears the parameters fileds in the parameters view
        */
        Parameters.prototype.clearParameters = function () {
            if (this.parametersContainer.children === null) {
                return;
            }
            while (this.parametersContainer.children.length > 0) {
                this.parametersContainer.removeChild(this.parametersContainer.firstChild);
            }
        };
        /*
        * Creates parameters fields
        * @param action: the action to configure
        */
        Parameters.prototype.createParameters = function (action) {
            // Clear parameters fields and draw help description
            this._action = action;
            this.clearParameters();
            if (action === null) {
                return;
            }
            this._createHelpSection(action);
            this._createNodeSection(action);
            // Get properties
            var properties = action.properties;
            var propertiesResults = action.propertiesResults;
            var targetParameterSelect = null;
            var targetParameterNameSelect = null;
            var propertyPathSelect = null;
            var propertyPathOptionalSelect = null;
            var booleanSelect = null;
            var propertyInput = null;
            var propertyPathIndice = -1;
            if (properties.length === 0) {
                return;
            }
            // Draw properties
            for (var i = 0; i < properties.length; i++) {
                // Create separator
                var separator = document.createElement("hr");
                separator.noShade = true;
                separator.className = "ParametersElementSeparatorClass";
                this.parametersContainer.appendChild(separator);
                // Create parameter text
                var parameterName = document.createElement("a");
                parameterName.text = properties[i].text;
                parameterName.className = "ParametersElementTitleClass";
                this.parametersContainer.appendChild(parameterName);
                if (properties[i].text === "parameter" || properties[i].text === "target" || properties[i].text === "parent") {
                    // Create target select element
                    targetParameterSelect = document.createElement("select");
                    targetParameterSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(targetParameterSelect);
                    // Create target name select element
                    targetParameterNameSelect = document.createElement("select");
                    targetParameterNameSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(targetParameterNameSelect);
                    // Events and configure
                    (this._parameterTargetChanged(targetParameterSelect, targetParameterNameSelect, propertyPathSelect, propertyPathOptionalSelect, i))(null);
                    targetParameterSelect.value = propertiesResults[i].targetType;
                    targetParameterNameSelect.value = propertiesResults[i].value;
                    targetParameterSelect.onchange = this._parameterTargetChanged(targetParameterSelect, targetParameterNameSelect, propertyPathSelect, propertyPathOptionalSelect, i);
                    targetParameterNameSelect.onchange = this._parameterTargetNameChanged(targetParameterSelect, targetParameterNameSelect, i);
                }
                else if (properties[i].text === "propertyPath") {
                    propertyPathIndice = i;
                    // Create property path select
                    propertyPathSelect = document.createElement("select");
                    propertyPathSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(propertyPathSelect);
                    // Create additional select
                    propertyPathOptionalSelect = document.createElement("select");
                    propertyPathOptionalSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(propertyPathOptionalSelect);
                    // Events and configure
                    (this._propertyPathSelectChanged(targetParameterSelect, propertyPathSelect, propertyPathOptionalSelect, null, null, i))(null);
                    var property = this._action.propertiesResults[i].value.split(".");
                    if (property.length > 0) {
                        if (property.length === 1) {
                            propertyPathSelect.value = property[0];
                        }
                        else {
                            var completePropertyPath = "";
                            for (var j = 0; j < property.length - 1; j++) {
                                completePropertyPath += property[j];
                                completePropertyPath += (j === property.length - 2) ? "" : ".";
                            }
                            propertyPathSelect.value = completePropertyPath;
                            this._viewer.utils.setElementVisible(propertyPathOptionalSelect, true);
                        }
                        this._fillAdditionalPropertyPath(targetParameterSelect, propertyPathSelect, propertyPathOptionalSelect);
                        propertyPathOptionalSelect.value = property[property.length - 1];
                        if (propertyPathOptionalSelect.options.length === 0 || propertyPathOptionalSelect.options[0].text === "") {
                            this._viewer.utils.setElementVisible(propertyPathOptionalSelect, false);
                        }
                    }
                    targetParameterSelect.onchange = this._parameterTargetChanged(targetParameterSelect, targetParameterNameSelect, propertyPathSelect, propertyPathOptionalSelect, i - 1);
                    propertyPathSelect.onchange = this._propertyPathSelectChanged(targetParameterSelect, propertyPathSelect, propertyPathOptionalSelect, null, null, i);
                    propertyPathOptionalSelect.onchange = this._additionalPropertyPathSelectChanged(propertyPathSelect, propertyPathOptionalSelect, i);
                }
                else if (properties[i].text === "operator") {
                    var conditionOperatorSelect = document.createElement("select");
                    conditionOperatorSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(conditionOperatorSelect);
                    // Configure event
                    (this._conditionOperatorSelectChanged(conditionOperatorSelect, i))(null);
                    conditionOperatorSelect.value = propertiesResults[i].value;
                    conditionOperatorSelect.onchange = this._conditionOperatorSelectChanged(conditionOperatorSelect, i);
                }
                else if (properties[i].text === "sound") {
                    var soundSelect = document.createElement("select");
                    soundSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(soundSelect);
                    // Configure event
                    (this._soundSelectChanged(soundSelect, i))(null);
                    soundSelect.value = propertiesResults[i].value;
                    soundSelect.onchange = this._soundSelectChanged(soundSelect, i);
                }
                else {
                    var isBoolean = propertiesResults[i].value === "true" || propertiesResults[i].value === "false";
                    var object = this._getObjectFromType(targetParameterSelect.value);
                    if (object !== null) {
                        var property = this._action.propertiesResults[i - 1].value.split(".");
                        for (var j = 0; j < property.length && object !== undefined; j++) {
                            object = object[property[j]];
                            if (j === property.length - 1) {
                                isBoolean = isBoolean || typeof object === "boolean";
                            }
                        }
                    }
                    booleanSelect = document.createElement("select");
                    booleanSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(booleanSelect);
                    // Configure event
                    (this._booleanSelectChanged(booleanSelect, i))(null);
                    booleanSelect.value = propertiesResults[i].value;
                    booleanSelect.onchange = this._booleanSelectChanged(booleanSelect, i);
                    propertyInput = document.createElement("input");
                    propertyInput.value = propertiesResults[i].value;
                    propertyInput.className = "ParametersElementInputClass";
                    this.parametersContainer.appendChild(propertyInput);
                    // Configure event
                    propertyInput.onkeyup = this._propertyInputChanged(propertyInput, i);
                    if (propertyPathIndice !== -1 && properties[i].text === "value") {
                        propertyPathSelect.onchange = this._propertyPathSelectChanged(targetParameterSelect, propertyPathSelect, propertyPathOptionalSelect, booleanSelect, propertyInput, propertyPathIndice);
                    }
                    if (isBoolean) {
                        this._viewer.utils.setElementVisible(booleanSelect, true);
                        this._viewer.utils.setElementVisible(propertyInput, false);
                    }
                    else {
                        this._viewer.utils.setElementVisible(booleanSelect, false);
                        this._viewer.utils.setElementVisible(propertyInput, true);
                    }
                }
            }
        };
        /*
        * Resizes the parameters view
        * @param: the resize event
        */
        Parameters.prototype.onResize = function (event) {
            var tools = document.getElementById("ToolsButtonsID");
            this.parametersContainer.style.height = window.innerHeight - tools.getBoundingClientRect().height - 25 - 200 + "px";
            this.parametersHelpElement.style.height = 200 + "px";
        };
        /*
        * Returns the boolean select change event
        * @param booleanSelect: the boolean select element
        * @param indice: the properties result indice
        */
        Parameters.prototype._booleanSelectChanged = function (booleanSelect, indice) {
            var _this = this;
            return function (ev) {
                if (booleanSelect.options.length === 0) {
                    var values = ["true", "false"];
                    for (var i = 0; i < values.length; i++) {
                        var option = document.createElement("option");
                        option.value = option.text = values[i];
                        booleanSelect.options.add(option);
                    }
                }
                else {
                    _this._action.propertiesResults[indice].value = booleanSelect.value;
                }
            };
        };
        /*
        * Returns the sound select change event
        * @param soundSelect: the sound select element
        * @param indice: the properties result indice
        */
        Parameters.prototype._soundSelectChanged = function (soundSelect, indice) {
            var _this = this;
            return function (ev) {
                if (soundSelect.options.length === 0) {
                    for (var i = 0; i < ActionsBuilder.SceneElements.SOUNDS.length; i++) {
                        var option = document.createElement("option");
                        option.value = option.text = ActionsBuilder.SceneElements.SOUNDS[i];
                        soundSelect.options.add(option);
                    }
                    _this._sortList(soundSelect);
                }
                else {
                    _this._action.propertiesResults[indice].value = soundSelect.value;
                }
            };
        };
        /*
        * Returns the condition opeator select changed event
        * @param conditionOperatorSelect: the condition operator select element
        * @param indice: the properties result indice
        */
        Parameters.prototype._conditionOperatorSelectChanged = function (conditionOperatorSelect, indice) {
            var _this = this;
            return function (ev) {
                if (conditionOperatorSelect.options.length === 0) {
                    for (var i = 0; i < ActionsBuilder.SceneElements.OPERATORS.length; i++) {
                        var option = document.createElement("option");
                        option.value = option.text = ActionsBuilder.SceneElements.OPERATORS[i];
                        conditionOperatorSelect.options.add(option);
                    }
                }
                else {
                    _this._action.propertiesResults[indice].value = conditionOperatorSelect.value;
                }
            };
        };
        /*
        * Returns the property input changed event
        * @param propertyInput: the property input
        * @param indice: the properties result indice
        */
        Parameters.prototype._propertyInputChanged = function (propertyInput, indice) {
            var _this = this;
            return function (ev) {
                _this._action.propertiesResults[indice].value = propertyInput.value;
            };
        };
        /*
        * Returns the propertyPath select changed event
        * @param targetParameterSelect: the target/parameter select element
        * @param propertyPathSelect: the propertyPath select element
        * @param additionalPropertyPathSelect: the additional propertyPath select element
        * @param indice: the properties indice in action.properties
        */
        Parameters.prototype._propertyPathSelectChanged = function (targetParameterSelect, propertyPathSelect, additionalPropertyPathSelect, booleanSelect, propertyInput, indice) {
            var _this = this;
            return function (event) {
                if (propertyPathSelect.options.length === 0) {
                    // Configure start values
                    var properties = _this._getPropertiesFromType(targetParameterSelect.value);
                    if (properties !== null) {
                        for (var i = 0; i < properties.length; i++) {
                            var option = document.createElement("option");
                            option.value = option.text = properties[i];
                            propertyPathSelect.options.add(option);
                        }
                    }
                }
                else {
                    // Set property
                    _this._action.propertiesResults[indice].value = propertyPathSelect.value;
                    if (booleanSelect !== null && propertyInput !== null) {
                        var object = _this._getObjectFromType(targetParameterSelect.value);
                        var isBoolean = false;
                        if (object !== null) {
                            var property = _this._action.propertiesResults[indice].value.split(".");
                            for (var j = 0; j < property.length; j++) {
                                object = object[property[j]];
                                if (j === property.length - 1) {
                                    isBoolean = isBoolean || typeof object === "boolean";
                                }
                            }
                        }
                        if (isBoolean) {
                            _this._viewer.utils.setElementVisible(booleanSelect, true);
                            _this._viewer.utils.setElementVisible(propertyInput, false);
                        }
                        else {
                            _this._viewer.utils.setElementVisible(booleanSelect, false);
                            _this._viewer.utils.setElementVisible(propertyInput, true);
                        }
                    }
                }
                // Configure addition property
                _this._fillAdditionalPropertyPath(targetParameterSelect, propertyPathSelect, additionalPropertyPathSelect);
                // Sort
                _this._sortList(propertyPathSelect);
            };
        };
        Parameters.prototype._fillAdditionalPropertyPath = function (targetParameterSelect, propertyPathSelect, additionalPropertyPathSelect) {
            additionalPropertyPathSelect.options.length = 0;
            var object = this._getObjectFromType(targetParameterSelect.value);
            if (object !== null) {
                var propertyPath = propertyPathSelect.value.split(".");
                for (var i = 0; i < propertyPath.length; i++) {
                    object = object[propertyPath[i]];
                }
            }
            if (object === null || object === undefined || (typeof (object)).toLowerCase() === "string") {
                this._viewer.utils.setElementVisible(additionalPropertyPathSelect, false);
                return;
            }
            // Add options
            var emptyOption = document.createElement("option");
            emptyOption.value = emptyOption.text = "";
            additionalPropertyPathSelect.add(emptyOption);
            for (var thing in object) {
                var type = ActionsBuilder.SceneElements.GetInstanceOf(object[thing]);
                var index = ActionsBuilder.SceneElements.TYPES.indexOf(type);
                if (index !== -1) {
                    var option = document.createElement("option");
                    option.value = option.text = thing;
                    additionalPropertyPathSelect.options.add(option);
                    emptyOption.text += thing + ", ";
                }
            }
            if (additionalPropertyPathSelect.options.length === 0 || additionalPropertyPathSelect.options[0].text === "") {
                this._viewer.utils.setElementVisible(additionalPropertyPathSelect, false);
            }
            else {
                this._viewer.utils.setElementVisible(additionalPropertyPathSelect, true);
            }
        };
        /*
        * Returns the additional propertyPath select changed event
        * @param propertyPathSelect: the propertyPath select element
        * @param additionalPropertyPathSelect: the additional propertyPath select element
        * @param indice: the properties indice in action.properties
        */
        Parameters.prototype._additionalPropertyPathSelectChanged = function (propertyPathSelect, additionalPropertyPathSelect, indice) {
            var _this = this;
            return function (event) {
                var property = propertyPathSelect.value;
                var additionalProperty = additionalPropertyPathSelect.value;
                if (additionalProperty !== "") {
                    property += ".";
                    property += additionalPropertyPathSelect.value;
                }
                _this._action.propertiesResults[indice].value = property;
            };
        };
        /*
        * Returns the parameter/target select changed event
        * @param targetParameterSelect: the target/parameter select element
        * @param targetParameterNameSelect: the target/parameter name select element
        * @param propertyPathSelect: the propertyPath select element
        * @param additionalPropertyPathSelect: the additional propertyPath select element
        * @param indice: the properties indice in action.properties
        */
        Parameters.prototype._parameterTargetChanged = function (targetParameterSelect, targetParameterNameSelect, propertyPathSelect, additionalPropertyPathSelect, indice) {
            var _this = this;
            return function (event) {
                if (targetParameterSelect.options.length === 0) {
                    // Configure start values
                    var options = [
                        { text: "Mesh", targetType: "MeshProperties" },
                        { text: "Light", targetType: "LightProperties" },
                        { text: "Camera", targetType: "CameraProperties" },
                        { text: "Scene", targetType: "SceneProperties" }
                    ];
                    targetParameterSelect.options.length = 0;
                    for (var i = 0; i < options.length; i++) {
                        var option = document.createElement("option");
                        option.text = options[i].text;
                        option.value = options[i].targetType;
                        targetParameterSelect.options.add(option);
                    }
                    targetParameterSelect.value = _this._action.propertiesResults[indice].targetType;
                }
                else {
                    _this._action.propertiesResults[indice].targetType = targetParameterSelect.value;
                    var names = _this._getListFromType(targetParameterSelect.value);
                    if (names !== null && names.length > 0) {
                        _this._action.propertiesResults[indice].value = names[0];
                    }
                    else {
                        _this._action.propertiesResults[indice].value = "";
                    }
                    if (propertyPathSelect !== null) {
                        _this._action.propertiesResults[indice + 1].value = ""; // propertyPath
                    }
                }
                // Configure target names
                var targetParameterProperties = _this._getTargetFromType(targetParameterSelect.value);
                targetParameterNameSelect.options.length = 0;
                if (targetParameterProperties !== null) {
                    for (var i = 0; i < targetParameterProperties.length; i++) {
                        var option = document.createElement("option");
                        option.text = option.value = targetParameterProperties[i];
                        targetParameterNameSelect.options.add(option);
                    }
                }
                targetParameterNameSelect.value = _this._action.propertiesResults[indice].value;
                // Clear property path
                if (propertyPathSelect !== null) {
                    propertyPathSelect.options.length = 0;
                    additionalPropertyPathSelect.options.length = 0;
                    _this._propertyPathSelectChanged(targetParameterSelect, propertyPathSelect, additionalPropertyPathSelect, null, null, indice + 1)(null);
                }
                _this._sortList(targetParameterNameSelect);
                _this._sortList(targetParameterSelect);
            };
        };
        /*
        * Returns the parameter/target name select changed
        * @param indice: the properties indice to change
        */
        Parameters.prototype._parameterTargetNameChanged = function (targetParameterSelect, targetParameterNameSelect, indice) {
            var _this = this;
            return function (event) {
                _this._action.propertiesResults[indice].value = targetParameterNameSelect.value;
            };
        };
        /*
        * Returns the array of objects names in function of its type
        * @param type: the target type
        */
        Parameters.prototype._getTargetFromType = function (type) {
            if (type === "MeshProperties" || type === "Mesh") {
                return ActionsBuilder.SceneElements.MESHES;
            }
            if (type === "LightProperties" || type === "Light") {
                return ActionsBuilder.SceneElements.LIGHTS;
            }
            if (type === "CameraProperties" || type === "Camera") {
                return ActionsBuilder.SceneElements.CAMERAS;
            }
            return null;
        };
        /*
        * Returns the properties in function of its type
        * @param type: the target type
        */
        Parameters.prototype._getPropertiesFromType = function (type) {
            if (type === "MeshProperties" || type === "Mesh") {
                return ActionsBuilder.SceneElements.MESH_PROPERTIES;
            }
            if (type === "LightProperties" || type === "Light") {
                return ActionsBuilder.SceneElements.LIGHT_PROPERTIES;
            }
            if (type === "CameraProperties" || type === "Camera") {
                return ActionsBuilder.SceneElements.CAMERA_PROPERTIES;
            }
            if (type === "SceneProperties" || type === "Scene") {
                return ActionsBuilder.SceneElements.SCENE_PROPERTIES;
            }
            return null;
        };
        Parameters.prototype._getListFromType = function (type) {
            if (type === "MeshProperties" || type === "Mesh") {
                return ActionsBuilder.SceneElements.MESHES;
            }
            if (type === "LightProperties" || type === "Light") {
                return ActionsBuilder.SceneElements.LIGHTS;
            }
            if (type === "CameraProperties" || type === "Camera") {
                return ActionsBuilder.SceneElements.CAMERAS;
            }
            return null;
        };
        /*
        * Returns the object in function of the given type
        * @param type: the target type
        */
        Parameters.prototype._getObjectFromType = function (type) {
            if (type === "MeshProperties" || type === "Mesh") {
                this._currentObject = ActionsBuilder.SceneElements.MESH;
                return ActionsBuilder.SceneElements.MESH;
            }
            if (type === "LightProperties" || type === "Light") {
                this._currentObject = ActionsBuilder.SceneElements.LIGHT;
                return ActionsBuilder.SceneElements.LIGHT;
            }
            if (type === "CameraProperties" || type === "Camera") {
                this._currentObject = ActionsBuilder.SceneElements.CAMERA;
                return ActionsBuilder.SceneElements.CAMERA;
            }
            if (type === "SceneProperties" || type === "Scene") {
                this._currentObject = ActionsBuilder.SceneElements.SCENE;
                return ActionsBuilder.SceneElements.SCENE;
            }
            return null;
        };
        /*
        * Creates the node section (top of parameters)
        * @param action: the action element to get color, text, name etc.
        */
        Parameters.prototype._createNodeSection = function (action) {
            var element = document.createElement("div");
            element.style.background = this._viewer.getSelectedNodeColor(action.type, action.node.detached);
            element.className = "ParametersElementNodeClass";
            var text = document.createElement("a");
            text.text = action.name;
            text.className = "ParametersElementNodeTextClass";
            element.appendChild(text);
            this.parametersContainer.appendChild(element);
        };
        /*
        * Creates the help section
        * @param action : the action containing the description
        */
        Parameters.prototype._createHelpSection = function (action) {
            // Get description
            var element = ActionsBuilder.Elements.GetElementFromName(action.name);
            if (element !== null) {
                this.parametersHelpElement.textContent = element.description;
            }
        };
        /*
        * Alphabetically sorts a HTML select element options
        * @param element : the HTML select element to sort
        */
        Parameters.prototype._sortList = function (element) {
            var options = [];
            for (var i = element.options.length - 1; i >= 0; i--) {
                options.push(element.removeChild(element.options[i]));
            }
            options.sort(function (a, b) {
                return a.innerHTML.localeCompare(b.innerHTML);
            });
            for (var i = 0; i < options.length; i++) {
                element.options.add(options[i]);
            }
        };
        return Parameters;
    })();
    ActionsBuilder.Parameters = Parameters;
})(ActionsBuilder || (ActionsBuilder = {}));
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
var ActionsBuilder;
(function (ActionsBuilder) {
    /**
    * Defines static types
    */
    var Type = (function () {
        function Type() {
        }
        Object.defineProperty(Type, "TRIGGER", {
            get: function () {
                return Type._TRIGGER;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type, "ACTION", {
            get: function () {
                return Type._ACTION;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type, "FLOW_CONTROL", {
            get: function () {
                return Type._FLOW_CONTROL;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type, "OBJECT", {
            get: function () {
                return Type._OBJECT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type, "SCENE", {
            get: function () {
                return Type._SCENE;
            },
            enumerable: true,
            configurable: true
        });
        Type._TRIGGER = 0;
        Type._ACTION = 1;
        Type._FLOW_CONTROL = 2;
        Type._OBJECT = 3;
        Type._SCENE = 4;
        return Type;
    })();
    ActionsBuilder.Type = Type;
    /*
    * Defines the BABYLON.JS elements
    */
    var SceneElements = (function () {
        function SceneElements() {
        }
        Object.defineProperty(SceneElements, "ENGINE", {
            get: function () {
                return SceneElements._ENGINE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "SCENE", {
            get: function () {
                return SceneElements._SCENE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "MESH", {
            get: function () {
                return SceneElements._MESH;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "LIGHT", {
            get: function () {
                return SceneElements._LIGHT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "CAMERA", {
            get: function () {
                return SceneElements._CAMERA;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "MESHES", {
            get: function () {
                return SceneElements._MESHES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "LIGHTS", {
            get: function () {
                return SceneElements._LIGHTS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "CAMERAS", {
            get: function () {
                return SceneElements._CAMERAS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "SOUNDS", {
            get: function () {
                return SceneElements._SOUNDS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "MESH_PROPERTIES", {
            get: function () {
                return SceneElements._MESH_PROPERTIES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "LIGHT_PROPERTIES", {
            get: function () {
                return SceneElements._LIGHT_PROPERTIES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "CAMERA_PROPERTIES", {
            get: function () {
                return SceneElements._CAMERA_PROPERTIES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "SCENE_PROPERTIES", {
            get: function () {
                return SceneElements._SCENE_PROPERTIES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "TYPES", {
            get: function () {
                return SceneElements._TYPES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "OPERATORS", {
            get: function () {
                return SceneElements._OPERATORS;
            },
            enumerable: true,
            configurable: true
        });
        /*
        * Methods
        */
        SceneElements.GetInstanceOf = function (object) {
            if (object === null || object === undefined) {
                return "";
            }
            return object.constructor.toString().match(/function (\w*)/)[1];
        };
        SceneElements.TestInstanceOf = function (object, propertyName) {
            if (object === null || object.constructor === null) {
                return false;
            }
            if (propertyName.length > 0 && propertyName[0] === "_")
                return false;
            var name = SceneElements.GetInstanceOf(object);
            for (var i = 0; i < SceneElements.TYPES.length; i++) {
                if (name === SceneElements.TYPES[i]) {
                    return true;
                }
            }
            return false;
        };
        /*
        * BabylonJS objects
        */
        SceneElements._ENGINE = new BABYLON.Engine(document.getElementById("RenderCanvasID"));
        SceneElements._SCENE = new BABYLON.Scene(SceneElements.ENGINE);
        SceneElements._MESH = new BABYLON.Mesh("mesh", SceneElements._SCENE);
        SceneElements._LIGHT = new BABYLON.Light("light", SceneElements._SCENE);
        SceneElements._CAMERA = new BABYLON.Camera("camera", BABYLON.Vector3.Zero(), SceneElements._SCENE);
        /*
        * Objects names
        */
        SceneElements._MESHES = new Array();
        SceneElements._LIGHTS = new Array();
        SceneElements._CAMERAS = new Array();
        SceneElements._SOUNDS = new Array();
        /*
        * Properties
        */
        SceneElements._MESH_PROPERTIES = new Array();
        SceneElements._LIGHT_PROPERTIES = new Array();
        SceneElements._CAMERA_PROPERTIES = new Array();
        SceneElements._SCENE_PROPERTIES = new Array();
        /*
        * Types
        */
        SceneElements._TYPES = new Array();
        /*
        * Operators
        */
        SceneElements._OPERATORS = new Array();
        return SceneElements;
    })();
    ActionsBuilder.SceneElements = SceneElements;
    // Functions
    var specialTypes = [
        "StandardMaterial"
    ];
    SceneElements.MESH.material = new BABYLON.StandardMaterial("material", SceneElements.SCENE);
    var addSpecialType = function (object, properties, thing) {
        for (var specialThing in object[thing]) {
            if (object[thing].hasOwnProperty(specialThing) && SceneElements.TestInstanceOf(object[thing][specialThing], specialThing)) {
                properties.push(thing + "." + specialThing);
            }
        }
    };
    // Configure types
    SceneElements.TYPES.push("Color3");
    SceneElements.TYPES.push("Boolean");
    SceneElements.TYPES.push("Number");
    SceneElements.TYPES.push("Vector2");
    SceneElements.TYPES.push("Vector3");
    SceneElements.TYPES.push("String");
    // Configure operators
    SceneElements.OPERATORS.push("IsEqual");
    SceneElements.OPERATORS.push("IsDifferent");
    SceneElements.OPERATORS.push("IsGreater");
    SceneElements.OPERATORS.push("IsLesser");
    // Configure properties
    for (var thing in SceneElements.MESH) {
        var instance = SceneElements.GetInstanceOf(SceneElements.MESH[thing]);
        if (SceneElements.MESH.hasOwnProperty(thing)) {
            if (specialTypes.indexOf(instance) !== -1) {
                addSpecialType(SceneElements.MESH, SceneElements.MESH_PROPERTIES, thing);
            }
            else if (SceneElements.TestInstanceOf(SceneElements.MESH[thing], thing)) {
                SceneElements.MESH_PROPERTIES.push(thing);
            }
        }
    }
    for (var thing in SceneElements.LIGHT) {
        if (SceneElements.LIGHT.hasOwnProperty(thing) && SceneElements.TestInstanceOf(SceneElements.LIGHT[thing], thing)) {
            SceneElements.LIGHT_PROPERTIES.push(thing);
        }
    }
    for (var thing in SceneElements.CAMERA) {
        if (SceneElements.CAMERA.hasOwnProperty(thing) && SceneElements.TestInstanceOf(SceneElements.CAMERA[thing], thing)) {
            SceneElements.CAMERA_PROPERTIES.push(thing);
        }
    }
    for (var thing in SceneElements.SCENE) {
        if (SceneElements.SCENE.hasOwnProperty(thing) && SceneElements.TestInstanceOf(SceneElements.SCENE[thing], thing)) {
            SceneElements.SCENE_PROPERTIES.push(thing);
        }
    }
    /**
    * Actions Builder elements (triggers, actions & flow controls) that are
    * arrays of Element
    */
    var Elements = (function () {
        function Elements() {
        }
        Object.defineProperty(Elements, "TRIGGERS", {
            get: function () {
                return Elements._TRIGGERS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Elements, "ACTIONS", {
            get: function () {
                return Elements._ACTIONS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Elements, "FLOW_CONTROLS", {
            get: function () {
                return Elements._FLOW_CONTROLS;
            },
            enumerable: true,
            configurable: true
        });
        Elements.GetElementFromName = function (name) {
            for (var i = 0; i < Elements.TRIGGERS.length; i++) {
                if (Elements.TRIGGERS[i].name === name) {
                    return Elements._TRIGGERS[i];
                }
            }
            for (var i = 0; i < Elements.ACTIONS.length; i++) {
                if (Elements.ACTIONS[i].name === name) {
                    return Elements._ACTIONS[i];
                }
            }
            for (var i = 0; i < Elements.FLOW_CONTROLS.length; i++) {
                if (Elements.FLOW_CONTROLS[i].name === name) {
                    return Elements._FLOW_CONTROLS[i];
                }
            }
            return null;
        };
        Elements._TRIGGERS = new Array();
        Elements._ACTIONS = new Array();
        Elements._FLOW_CONTROLS = new Array();
        return Elements;
    })();
    ActionsBuilder.Elements = Elements;
    // Configure triggers
    Elements.TRIGGERS.push({ name: "OnPickTrigger", text: "pick", properties: [], description: "When the user picks the edited mesh" });
    Elements.TRIGGERS.push({ name: "OnLeftPickTrigger", text: "left pick", properties: [], description: "When the user picks the edited mesh using the left click" });
    Elements.TRIGGERS.push({ name: "OnRightPickTrigger", text: "right pick", properties: [], description: "When the user picks the edited mesh using the right click" });
    Elements.TRIGGERS.push({ name: "OnCenterPickTrigger", text: "center pick", properties: [], description: "When the user picks the edited mesh using the click of the mouse wheel" });
    Elements.TRIGGERS.push({ name: "OnPointerOverTrigger", text: "pointer over", properties: [], description: "When the user's mouse is over the edited mesh" });
    Elements.TRIGGERS.push({ name: "OnPointerOutTrigger", text: "pointer out", properties: [], description: "When the user's mouse is out of the edited mesh" });
    Elements.TRIGGERS.push({ name: "OnEveryFrameTrigger", text: "every frame", properties: [], description: "This trigger is called each frame (only on scene)" });
    Elements.TRIGGERS.push({ name: "OnIntersectionEnterTrigger", text: "intersection enter", properties: [{ targetType: "MeshProperties", text: "parameter", value: "Object name?" }], description: "When the edited mesh intersects the another mesh predefined in the options" });
    Elements.TRIGGERS.push({ name: "OnIntersectionExitTrigger", text: "intersection exit", properties: [{ targetType: "MeshProperties", text: "parameter", value: "Object name?" }], description: "When the edited mesh exits intersection with the another mesh predefined in the options" });
    Elements.TRIGGERS.push({ name: "OnKeyDownTrigger", text: "key down", properties: [{ targetType: null, text: "parameter:", value: "a" }], description: "When the user pressed a key (enter the key character, example: \"r\")" });
    Elements.TRIGGERS.push({ name: "OnKeyUpTrigger", text: "key up", properties: [{ targetType: null, text: "parameter:", value: "a" }], description: "When the user unpressed a key (enter the key character, example: \"p\")" });
    // Configure actions
    Elements.ACTIONS.push({ name: "SwitchBooleanAction", text: "switch boolean", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "propertyPath", value: "" }], description: "Switches the boolean value of a given parameter of the target object: true to false, or false to true" });
    Elements.ACTIONS.push({ name: "SetStateAction", text: "set state", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "value", value: "" }], description: "Sets a new state value for the target object (example: \"off\" or \"on\")" });
    Elements.ACTIONS.push({ name: "SetValueAction", text: "set value", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "propertyPath", value: "" }, { text: "value", value: "" }], description: "Sets a new value to the specified parameter of the target object (example: position.x to 0.0)" });
    Elements.ACTIONS.push({ name: "SetParentAction", text: "set parent", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "parent", value: "" }], description: "Sets the new parent of the target object (example: a mesh or a light)" });
    Elements.ACTIONS.push({ name: "IncrementValueAction", text: "increment value", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "propertyPath", value: "" }, { text: "value", value: "" }], description: "Increments the value of the given parameter of the target object. The value can be negative. (example: increment position.x of 5.0)" });
    Elements.ACTIONS.push({ name: "PlayAnimationAction", text: "play animation", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "from", value: "0" }, { text: "to", value: "150" }, { text: "loop", value: "false" }], description: "Plays an animation of the target object. Specify the start frame, the end frame and if the animation should loop." });
    Elements.ACTIONS.push({ name: "StopAnimationAction", text: "stop animation", properties: [{ targetType: "MeshProperties", text: "target", value: "" }], description: "Stops the animations of the target object." });
    Elements.ACTIONS.push({ name: "DoNothingAction", text: "do nothing", properties: [], description: "Does nothing, can be used to balance/equilibrate the actions graph." });
    Elements.ACTIONS.push({ name: "InterpolateValueAction", text: "interpolate value", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "propertyPath", value: "" }, { text: "value", value: "0" }, { text: "duration", value: "1000" }, { text: "stopOtherAnimations", value: "false" }], description: "Creates an animation (key frames) that animates the target object by interpolating the given parameter of the target value." });
    Elements.ACTIONS.push({ name: "PlaySoundAction", text: "play sound", properties: [{ text: "sound", value: "" }], description: "Plays the specified sound." });
    Elements.ACTIONS.push({ name: "StopSoundAction", text: "stop sound", properties: [{ text: "sound", value: "" }], description: "Stops the specified sound." });
    Elements.ACTIONS.push({ name: "CombineAction", text: "combine", properties: [], description: "Special action that combines multiple actions. The combined actions are executed at the same time. Drag'n'drop the new actions inside to combine actions." });
    // Configure flow control
    Elements.FLOW_CONTROLS.push({ name: "ValueCondition", text: "value condition", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "propertyPath", value: "" }, { text: "value", value: "" }, { text: "operator", value: SceneElements.OPERATORS[0] }], description: "A condition checking if a given value is equal, different, lesser or greater than the given parameter of the target object" });
    Elements.FLOW_CONTROLS.push({ name: "StateCondition", text: "state condition", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "value", value: "" }], description: "A condition checking if the target object's state is equal to the given state. See \"set state\" action to set a state to an object." });
    Elements.FLOW_CONTROLS.push({ name: "Hub", text: "hub", properties: [], description: "The hub is internally used by the Combine Action. It allows to add children to the Combine Action" });
})(ActionsBuilder || (ActionsBuilder = {}));
var ActionsBuilder;
(function (ActionsBuilder) {
    var Utils = (function () {
        /*
        * Constructor
        * @param viewer: the viewer instance
        */
        function Utils(viewer) {
            // Members
            this.copiedStructure = null;
            // Configure this
            this._viewer = viewer;
        }
        /*
        * Tests the graph and reports errors
        */
        Utils.prototype.onTestGraph = function () {
            var _this = this;
            if (this._viewer.root.children.length === 0) {
                alert("Please add at least a Trigger and an Action to test the graph");
            }
            var onTestTarget = function (targetType, target) {
                var targetExists = false;
                var array = _this._viewer.parameters._getTargetFromType(targetType);
                if (array === null) {
                    return targetExists;
                }
                for (var i = 0; i < array.length; i++) {
                    if (array[i] === target) {
                        targetExists = true;
                        break;
                    }
                }
                return targetExists;
            };
            var onNodeError = function (action) {
                var node = action.node;
                node.rect.attr("fill", Raphael.rgb(255, 0, 0));
                return false;
            };
            var onTestAction = function (action) {
                console.log("Testing " + action.name);
                if (action.combineArray !== null) {
                    var foundError = false;
                    for (var i = 0; i < action.combineArray.length; i++) {
                        if (!onTestAction(action.combineArray[i])) {
                            foundError = true;
                        }
                    }
                    if (foundError) {
                        return false;
                    }
                }
                else {
                    // Test properties
                    var properties = action.properties;
                    var propertiesResults = action.propertiesResults;
                    if (properties !== null) {
                        var object = null;
                        var propertyPath = null;
                        for (var i = 0; i < properties.length; i++) {
                            // Target
                            if (properties[i].text === "target" || properties[i].text === "parent") {
                                object = _this._viewer.parameters._getObjectFromType(properties[i].targetType);
                                var targetExists = onTestTarget(propertiesResults[i].targetType, propertiesResults[i].value);
                                if (!targetExists) {
                                    return onNodeError(action);
                                }
                            }
                            else if (properties[i].text === "propertyPath") {
                                var property = propertiesResults[i].value;
                                var effectiveProperty = object;
                                var p = property.split(".");
                                for (var j = 0; j < p.length && effectiveProperty !== undefined; j++) {
                                    effectiveProperty = effectiveProperty[p[j]];
                                }
                                if (effectiveProperty === undefined) {
                                    return onNodeError(action);
                                }
                                else {
                                    propertyPath = effectiveProperty;
                                }
                            }
                            else if (properties[i].text == "value" && propertyPath != null) {
                                var value = propertiesResults[i].value;
                                if (!isNaN(propertyPath)) {
                                    var num = parseFloat(value);
                                    if (isNaN(num) || value === "") {
                                        return onNodeError(action);
                                    }
                                }
                            }
                        }
                    }
                    var foundError = false;
                    for (var i = 0; i < action.children.length; i++) {
                        if (!onTestAction(action.children[i])) {
                            foundError = true;
                        }
                    }
                    return !foundError;
                }
            };
            var root = this._viewer.root;
            var foundError = false;
            for (var i = 0; i < root.children.length; i++) {
                var trigger = root.children[i];
                var properties = trigger.properties;
                // Test properties of trigger (parameter)
                if (properties !== null && properties.length > 0) {
                    // Only one property
                    var parameter = trigger.propertiesResults[0].value;
                    if (properties[0].targetType !== null) {
                        // Intersection trigger
                        if (!onTestTarget("MeshProperties", parameter)) {
                            foundError = onNodeError(trigger);
                        }
                    }
                    else {
                        // Key trigger
                        if (!parameter.match(/[a-z]/)) {
                            foundError = onNodeError(trigger);
                        }
                    }
                }
                for (var j = 0; j < trigger.children.length; j++) {
                    var child = trigger.children[j];
                    var result = onTestAction(child);
                    if (!result) {
                        foundError = true;
                    }
                }
            }
            if (foundError) {
                alert("Found error(s). the red nodes contain the error.");
            }
            else {
                alert("No error found.");
            }
        };
        /*
        * Recursively reduce/expand nodes
        */
        Utils.prototype.onReduceAll = function (forceExpand) {
            if (forceExpand === void 0) { forceExpand = false; }
            if (this._viewer.selectedNode === null) {
                return;
            }
            var action = this._viewer.selectedNode;
            if (action.combineArray !== null) {
                for (var i = 0; i < action.combineArray.length; i++) {
                    this._viewer.selectedNode = action.combineArray[i];
                    this.onReduce(forceExpand, !forceExpand);
                }
            }
            else {
                this.onReduce(forceExpand, !forceExpand);
            }
            for (var i = 0; i < action.children.length; i++) {
                this._viewer.selectedNode = action.children[i];
                this.onReduceAll(forceExpand);
            }
        };
        /*
        * Reduces the selected node
        */
        Utils.prototype.onReduce = function (forceExpand, forceReduce) {
            if (forceExpand === void 0) { forceExpand = false; }
            if (forceReduce === void 0) { forceReduce = false; }
            if (this._viewer.selectedNode === null) {
                return;
            }
            var node = this._viewer.selectedNode.node;
            node.rect.stop(node.rect.animation);
            // Set minimized
            if (forceExpand === true) {
                node.minimized = false;
            }
            else if (forceReduce === true) {
                node.minimized = true;
            }
            else {
                node.minimized = !node.minimized;
            }
            // Set size
            if (node.minimized) {
                node.text.hide();
                node.rect.attr("width", ActionsBuilder.Viewer.NODE_MINIMIZED_WIDTH * this._viewer.zoom);
            }
            else {
                node.text.show();
                node.rect.attr("width", ActionsBuilder.Viewer.NODE_WIDTH * this._viewer.zoom);
            }
        };
        /*
        * Detaches the selected action
        */
        Utils.prototype.onDetachAction = function (forceDetach, forceAttach) {
            var _this = this;
            if (forceDetach === void 0) { forceDetach = false; }
            if (forceAttach === void 0) { forceAttach = false; }
            if (this._viewer.selectedNode === null) {
                return;
            }
            var action = this._viewer.selectedNode;
            if (forceDetach === true) {
                action.node.detached = true;
            }
            else if (forceAttach === true) {
                action.node.detached = false;
            }
            else {
                action.node.detached = !action.node.detached;
            }
            var onSetColor = function (root, detached) {
                var rootNode = root.node;
                rootNode.rect.attr("fill", _this._viewer.getNodeColor(root.type, detached));
                if (root.combineArray !== null) {
                    for (var i = 0; i < root.combineArray.length; i++) {
                        var combineNode = root.combineArray[i].node;
                        combineNode.rect.attr("fill", _this._viewer.getNodeColor(root.combineArray[i].type, detached));
                    }
                }
                for (var i = 0; i < root.children.length; i++) {
                    onSetColor(root.children[i], detached);
                }
            };
            onSetColor(action, action.node.detached);
        };
        /*
        * Removes the selected node
        */
        Utils.prototype.onRemoveNode = function () {
            if (this._viewer.selectedNode === null) {
                return;
            }
            var action = this._viewer.selectedNode;
            var parent = action.parent;
            // If trigger, remove branch
            if (action.type === ActionsBuilder.Type.TRIGGER) {
                this.onRemoveBranch();
                return;
            }
            // If it is a combine hub
            if (action.type === ActionsBuilder.Type.FLOW_CONTROL && parent !== null && parent.combineArray !== null) {
                action = parent;
                parent = action.parent;
            }
            // Remove
            if (parent !== null && parent.combineArray !== null) {
                parent.removeCombinedAction(action);
                if (parent.combineArray.length === 0) {
                    parent.node.text.attr("text", "combine");
                }
            }
            else {
                if (action.combineArray !== null) {
                    action.removeChild(action.hub);
                }
                action.parent.removeChild(action);
            }
            if (action.combineArray !== null) {
                this._viewer.removeAction(action.hub, false);
            }
            this._viewer.removeAction(action, false);
            // Finish
            this._viewer.update();
            this._viewer.parameters.clearParameters();
            this._viewer.selectedNode = null;
        };
        /*
        * Removes a branch starting from the selected node
        */
        Utils.prototype.onRemoveBranch = function () {
            if (this._viewer.selectedNode === null) {
                return;
            }
            if (this._viewer.selectedNode === this._viewer.root) {
                alert("Cannot remove the root node");
                return;
            }
            var action = this._viewer.selectedNode;
            var parent = action.parent;
            // If combine
            if (action.parent !== null && action.parent.combineArray !== null) {
                action = parent;
                parent = action.parent;
            }
            // Remove
            if (action.combineArray !== null) {
                action.removeChild(action.hub);
            }
            action.parent.removeChild(action);
            this._viewer.removeAction(action, true);
            // Finish
            this._viewer.update();
            this._viewer.parameters.clearParameters();
            this._viewer.selectedNode = null;
        };
        /*
        * Copies the selected structure
        */
        Utils.prototype.onCopyStructure = function () {
            if (this._viewer.selectedNode === null) {
                return;
            }
            var structure = this.createJSON(this._viewer.selectedNode);
            var asText = JSON.stringify(structure);
            if (window.clipboardData !== undefined) {
                window.clipboardData.setData("text", asText);
            }
            else {
                this.copiedStructure = asText;
            }
        };
        /*
        * Pastes the graph structure previously copied
        */
        Utils.prototype.onPasteStructure = function () {
            if (this._viewer.selectedNode === null) {
                return;
            }
            var asText = (window.clipboardData !== undefined) ? window.clipboardData.getData("text") : this.copiedStructure;
            var isJson = asText.length > 0 && asText[0] == "{" && asText[asText.length - 1] == "}";
            var structure = JSON.parse(asText);
            var action = this._viewer.selectedNode;
            if (structure.type === ActionsBuilder.Type.TRIGGER && action !== this._viewer.root) {
                alert("You can't paste a trigger if the selected node isn't the root object");
                return;
            }
            if (structure.type !== ActionsBuilder.Type.TRIGGER && action === this._viewer.root) {
                alert("You can't paste an action or condition if the selected node is the root object");
                return;
            }
            this.loadFromJSON(structure, action);
            this._viewer.update();
        };
        /*
        * Loads a graph from JSON
        * @pram graph: the graph structure
        * @param startAction: the action to start load
        */
        Utils.prototype.loadFromJSON = function (graph, startAction) {
            var _this = this;
            // If startNode is null, means it replaces all the graph
            // If not, it comes from a copy/paste
            if (startAction === null) {
                for (var i = 0; i < this._viewer.root.children.length; i++) {
                    this._viewer.removeAction(this._viewer.root.children[i], true);
                }
                this._viewer.root.clearChildren();
            }
            var load = function (root, parent, detached, combine) {
                if (parent === null) {
                    parent = _this._viewer.root;
                }
                var newAction = null;
                if (root.type !== ActionsBuilder.Type.OBJECT && root.type !== ActionsBuilder.Type.SCENE) {
                    var action = _this._viewer.addAction(parent, root.type, ActionsBuilder.Elements.GetElementFromName(root.name));
                    for (var i = 0; i < root.properties.length; i++) {
                        var targetType = root.properties[i].targetType;
                        if (targetType === undefined) {
                            targetType = "MeshProperties"; // Default is mesh properties
                        }
                        action.propertiesResults[i] = { value: root.properties[i].value, targetType: targetType };
                    }
                    var node = action.node;
                    node.detached = root.detached;
                    if (detached) {
                        node.rect.attr("fill", _this._viewer.getNodeColor(action.type, detached));
                    }
                    // If combine array
                    if (root.combine !== undefined) {
                        for (var i = 0; i < root.combine.length; i++) {
                            load(root.combine[i], action, detached, true);
                        }
                    }
                    if (!combine) {
                        parent = parent.children[parent.children.length - 1];
                    }
                }
                for (var i = 0; i < root.children.length; i++) {
                    load(root.children[i], newAction !== null && newAction.combineArray !== null ? newAction.hub : parent, root.detached, false);
                }
            };
            // Finish
            load(graph, startAction, false, false);
            this._viewer.update();
        };
        /*
        * Creates a JSON object starting from a root action
        * @param root: the root action
        */
        Utils.prototype.createJSON = function (root) {
            var action = {
                type: root.type,
                name: root.name,
                detached: root.node.detached,
                children: new Array(),
                combine: new Array(),
                properties: new Array()
            };
            // Set properties
            for (var i = 0; i < root.properties.length; i++) {
                action.properties.push({
                    name: root.properties[i].text,
                    value: root.propertiesResults[i].value,
                    targetType: root.propertiesResults[i].targetType
                });
            }
            // If combine
            if (root.combineArray !== null) {
                for (var i = 0; i < root.combineArray.length; i++) {
                    var combinedAction = root.combineArray[i];
                    action.combine.push(this.createJSON(combinedAction));
                }
                root = root.children[0]; // Hub
            }
            for (var i = 0; i < root.children.length; i++) {
                action.children.push(this.createJSON(root.children[i]));
            }
            return action;
        };
        /*
        *
        */
        Utils.prototype.setElementVisible = function (element, visible) {
            element.style.display = visible ? "block" : "none";
        };
        return Utils;
    })();
    ActionsBuilder.Utils = Utils;
})(ActionsBuilder || (ActionsBuilder = {}));
var ActionsBuilder;
(function (ActionsBuilder) {
    var Viewer = (function () {
        /*
        * Constructor
        * @param type: the root type object (OBJECT or SCENE)
        */
        function Viewer(type) {
            var _this = this;
            this.objectName = "Unnamed Object";
            this.zoom = 1.0;
            this._firstUpdate = true;
            // Get HTML elements
            this.viewerContainer = document.getElementById("GraphContainerID");
            this.viewerElement = document.getElementById("GraphElementID");
            // Create element
            this.paper = Raphael("GraphElementID", screen.width, screen.height);
            // Configure this
            //var name = type === Type.OBJECT ? "Unnamed object" : "Scene";
            this.root = this.addAction(null, type, { name: this.objectName, text: this.objectName, properties: [], description: "" });
            this.selectedNode = null;
            // Configure events
            window.addEventListener("resize", function (event) {
                _this.onResize(event);
            });
            window.addEventListener("mousemove", function (event) {
                _this.onMove(event);
            });
            this.paper.canvas.addEventListener("click", function (event) {
                _this.onClick(event);
            });
            // Load modules
            this._toolbar = new ActionsBuilder.Toolbar(this);
            this._contextMenu = new ActionsBuilder.ContextMenu(this);
            this.parameters = new ActionsBuilder.Parameters(this);
            this.utils = new ActionsBuilder.Utils(this);
            // Finish
            this.parameters.parametersHelpElement.textContent = Viewer._DEFAULT_INFO_MESSAGE;
            this.onResize(null);
        }
        Object.defineProperty(Viewer, "NODE_WIDTH", {
            get: function () {
                return Viewer._NODE_WIDTH;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Viewer, "NODE_HEIGHT", {
            get: function () {
                return Viewer._NODE_HEIGHT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Viewer, "NODE_MINIMIZED_WIDTH", {
            get: function () {
                return Viewer._NODE_MINIMIZE_WIDTH;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Viewer, "VERTICAL_OFFSET", {
            get: function () {
                return Viewer._VERTICAL_OFFSET;
            },
            enumerable: true,
            configurable: true
        });
        /*
        * Resize event
        * @param event: the resize event
        */
        Viewer.prototype.onResize = function (event) {
            var tools = document.getElementById("ToolsButtonsID");
            this.viewerContainer.style.height = window.innerHeight - tools.getBoundingClientRect().height - 25 - 50 + "px";
            this.viewerElement.style.height = window.innerHeight - tools.getBoundingClientRect().height - 25 - 50 + "px";
            this.parameters.onResize();
            this._toolbar.onResize();
            if (this.paper.height < window.innerHeight) {
                this.paper.setSize(this.paper.width, window.innerHeight);
            }
            if (this._firstUpdate) {
                this.viewerElement.scrollLeft = ((this.viewerElement.scrollWidth / 2) - (this.viewerElement.getBoundingClientRect().width / 2));
                this._firstUpdate = false;
            }
        };
        /*
        * Handles the onMove event
        * @param event: the onMove mouse event
        */
        Viewer.prototype.onMove = function (event) {
            this.mousex = event.clientX - this.paper.canvas.getBoundingClientRect().left;
            this.mousey = event.clientY - this.paper.canvas.getBoundingClientRect().top;
        };
        /*
        * Handles the onClick event to get selected node
        * @param event: the onClick mouse event
        */
        Viewer.prototype.onClick = function (event) {
            if (this._contextMenu.showing) {
                return;
            }
            // Reset selected node
            if (this.selectedNode !== null) {
                var node = this.selectedNode.node;
                node.rect.attr("fill", this.getNodeColor(this.selectedNode.type, node.detached));
            }
            // Configure new selected node
            var result = this.traverseGraph(null, this.mousex, this.mousey, true);
            if (result.hit) {
                this.selectedNode = result.action;
                var node = this.selectedNode.node;
                node.rect.attr("fill", this.getSelectedNodeColor(this.selectedNode.type, node.detached));
            }
            else {
                this.selectedNode = null;
                this.parameters.clearParameters();
                this.parameters.parametersHelpElement.textContent = Viewer._DEFAULT_INFO_MESSAGE;
            }
        };
        /*
        * Set the color theme of the viewer
        * @param color: the color theme ( ex: "rgb(64, 64, 64)" )
        */
        Viewer.prototype.setColorTheme = function (color) {
            this.paper.canvas.style.background = color;
        };
        /*
        * Returns the color according to the given parameters
        * @param action: the action used to select the color
        * @param detached: if the node is attached to its parent or not
        */
        Viewer.prototype.getNodeColor = function (type, detached) {
            if (detached) {
                return Raphael.rgb(96, 122, 14);
            }
            switch (type) {
                case ActionsBuilder.Type.TRIGGER:
                    return Raphael.rgb(133, 154, 185);
                    break;
                case ActionsBuilder.Type.ACTION:
                    return Raphael.rgb(182, 185, 132);
                    break;
                case ActionsBuilder.Type.FLOW_CONTROL:
                    return Raphael.rgb(185, 132, 140);
                    break;
                case ActionsBuilder.Type.OBJECT:
                case ActionsBuilder.Type.SCENE:
                    return Raphael.rgb(255, 255, 255);
                    break;
                default: break;
            }
            return null;
        };
        /*
        * Returns the selected node color according to the given parameters
        * @param action: the action used to select the color
        * @param detached: if the node is attached to its parent or not
        */
        Viewer.prototype.getSelectedNodeColor = function (type, detached) {
            if (detached) {
                return Raphael.rgb(96, 122, 14);
            }
            switch (type) {
                case ActionsBuilder.Type.TRIGGER:
                    return Raphael.rgb(41, 129, 255);
                    break;
                case ActionsBuilder.Type.ACTION:
                    return Raphael.rgb(255, 220, 42);
                    break;
                case ActionsBuilder.Type.FLOW_CONTROL:
                    return Raphael.rgb(255, 41, 53);
                    break;
                case ActionsBuilder.Type.OBJECT:
                case ActionsBuilder.Type.SCENE:
                    return Raphael.rgb(255, 255, 255);
                    break;
                default: break;
            }
            return null;
        };
        /*
        * Removes the given action from the graph
        * @param action: the action to remove
        * @param removeChildren: if remove the branch or not
        */
        Viewer.prototype.removeAction = function (action, removeChildren) {
            // If selected node is combine
            if (action.parent !== null && action.parent.hub === action) {
                this.removeAction(action.parent, false);
                return;
            }
            // Basic suppress
            this.removeNode(action.node);
            if (action.combineArray !== null) {
                this.removeNode(action.hub.node);
                // Remove combine array
                for (var i = 0; i < action.combineArray.length; i++) {
                    this.removeNode(action.combineArray[i].node);
                }
                action.combineArray.length = 0;
            }
            if (removeChildren) {
                for (var i = 0; i < action.children.length; i++) {
                    this.removeAction(action.children[i], removeChildren);
                }
                action.clearChildren();
            }
            else {
                for (var i = 0; i < action.children.length; i++) {
                    action.parent.addChild(action.children[i]);
                    action.children[i].parent = action.parent;
                }
            }
        };
        /*
        * Removes the given node (not the action)
        * @param node: the node to remove
        */
        Viewer.prototype.removeNode = function (node) {
            node.rect.remove();
            node.text.remove();
            if (node.line !== null) {
                node.line.remove();
            }
        };
        /*
        * Updates the graph viewer
        */
        Viewer.prototype.update = function () {
            var _this = this;
            // Set root position
            this._setActionPosition(this.root, (this.paper.width / 2) - (Viewer.NODE_WIDTH / 2) * this.zoom, 10);
            // Sets node size
            var onSetNodeSize = function (node) {
                node.rect.attr("width", node.minimized ? Viewer.NODE_MINIMIZED_WIDTH : Viewer.NODE_WIDTH * _this.zoom);
                node.rect.attr("height", Viewer.NODE_HEIGHT * _this.zoom);
                node.text.attr("font-size", 11 * _this.zoom);
            };
            // First pass: set actions positions according to parents
            var onSetPositionPass = function (action, yPosition) {
                var node = action.node;
                var parent = action.parent !== null ? action.parent : null;
                // Set node properties (size, text size, etc.)
                if (action.combineArray !== null) {
                    for (var i = 0; i < action.combineArray.length; i++) {
                        var combinedNode = action.combineArray[i].node;
                        onSetNodeSize(combinedNode);
                    }
                }
                onSetNodeSize(node);
                // Set position from parent
                if (parent) {
                    var parentx = parent.node.rect.attr("x");
                    if (parent.combineArray !== null && parent.combineArray.length > 1) {
                        parentx += parent.node.rect.attr("width") / 2;
                    }
                    _this._setActionPosition(action, parentx, yPosition);
                    _this._setActionLine(action);
                }
                // Calculate total width for current action
                var totalSize = 0;
                for (var i = 0; i < action.children.length; i++) {
                    var childNode = action.children[i].node;
                    totalSize += childNode.rect.attr("width");
                }
                // Get values to place nodes according to the parent position
                var nodeWidth = node.rect.attr("width");
                var startingPositionX = node.rect.attr("x");
                // Set children positions
                for (var i = 0; i < action.children.length; i++) {
                    var childAction = action.children[i];
                    var childNode = childAction.node;
                    var newPositionX = startingPositionX;
                    if (childAction.combineArray !== null && childAction.combineArray.length > 1) {
                        newPositionX -= (childNode.rect.attr("width") / 2) - nodeWidth / 2;
                    }
                    var newPositionY = yPosition + Viewer.VERTICAL_OFFSET * _this.zoom;
                    onSetPositionPass(childAction, newPositionY);
                    _this._setActionPosition(childAction, newPositionX, newPositionY);
                    _this._setActionLine(childAction);
                }
            };
            onSetPositionPass(this.root, 10 * this.zoom);
            // Seconds pass, get sizes of groups
            var onGetSizePass = function (action, maxSize) {
                var mySize = 0;
                if (action.combineArray !== null) {
                    for (var i = 0; i < action.combineArray.length; i++) {
                        mySize += action.combineArray[i].node.rect.attr("width");
                    }
                }
                else {
                    mySize = action.node.rect.attr("width");
                }
                if (mySize > maxSize) {
                    maxSize = mySize;
                }
                for (var i = 0; i < action.children.length; i++) {
                    maxSize = onGetSizePass(action.children[i], maxSize);
                }
                return maxSize;
            };
            // Resize canvas
            var onResizeCanvas = function (action) {
                var node = action.node;
                var nodex = node.rect.attr("x");
                var nodey = node.rect.attr("y");
                if (nodex < 0 || nodex > _this.paper.width) {
                    _this.paper.setSize(_this.paper.width + 1000, _this.paper.height);
                    _this._setActionPosition(_this.root, (_this.paper.width / 2) - (Viewer.NODE_WIDTH / 2) * _this.zoom, 10);
                }
                if (nodey > _this.paper.height) {
                    _this.paper.setSize(_this.paper.width, _this.paper.height + 1000);
                    _this._setActionPosition(_this.root, (_this.paper.width / 2) - (Viewer.NODE_WIDTH / 2) * _this.zoom, 10);
                }
            };
            var widths = new Array();
            for (var i = 0; i < this.root.children.length; i++) {
                var trigger = this.root.children[i];
                var triggerResult = { triggerWidth: onGetSizePass(trigger, 0), childrenWidths: new Array() };
                if (trigger.children.length > 0) {
                    triggerResult.triggerWidth = 0;
                }
                for (var j = 0; j < trigger.children.length; j++) {
                    var actionWidth = onGetSizePass(trigger.children[j], 0);
                    triggerResult.triggerWidth += actionWidth + 15;
                    triggerResult.childrenWidths.push({
                        triggerWidth: actionWidth,
                        childrenWidths: null
                    });
                }
                widths.push(triggerResult);
            }
            // Third pass, set positions of nodes
            var onSetNodePosition = function (action, widthArray, isChild) {
                var actionsCount = action.children.length;
                var actionsMiddle = actionsCount % 2;
                var actionsHasMiddle = actionsMiddle !== 0;
                var actionsLeftOffset = 0;
                var actionsRightOffset = 0;
                var actionWidth = action.node.rect.attr("width");
                if (actionsHasMiddle && actionsCount > 1) {
                    var middle = Math.floor(actionsCount / 2);
                    actionsLeftOffset += widthArray[middle].triggerWidth / 2;
                    actionsRightOffset += widthArray[middle].triggerWidth / 2;
                }
                // Move left
                var leftStart = actionsHasMiddle ? Math.floor(actionsCount / 2) - 1 : (actionsCount / 2) - 1;
                for (var i = leftStart; i >= 0; i--) {
                    var child = action.children[i];
                    var node = child.node;
                    var width = (widthArray[i].triggerWidth) + 15;
                    _this._setActionPosition(action.children[i], node.rect.attr("x") - actionsLeftOffset - (width / 2), node.rect.attr("y"));
                    _this._setActionLine(child);
                    onResizeCanvas(child);
                    actionsLeftOffset += width;
                }
                // Move right
                var rightStart = actionsHasMiddle ? Math.round(actionsCount / 2) : actionsCount / 2;
                for (var i = rightStart; i < actionsCount; i++) {
                    var child = action.children[i];
                    var node = child.node;
                    var width = (widthArray[i].triggerWidth) + 15;
                    _this._setActionPosition(action.children[i], node.rect.attr("x") + actionsRightOffset + (width / 2), node.rect.attr("y"));
                    _this._setActionLine(child);
                    onResizeCanvas(child);
                    actionsRightOffset += width;
                }
            };
            onSetNodePosition(this.root, widths, false);
            for (var i = 0; i < this.root.children.length; i++) {
                onSetNodePosition(this.root.children[i], widths[i].childrenWidths, true);
            }
        };
        /*
        * Adds an action to the graph viewer and returns it
        * @param parent: the parent action
        * @param type: the action type
        * @param element: the Actions Builder type (TRIGGERS, ACTIONS, FLOW_CONTROLS)
        */
        Viewer.prototype.addAction = function (parent, type, element) {
            var node = this._createNode(element.text, type, parent === null);
            var action = new ActionsBuilder.Action(node);
            if (element.name === "CombineAction") {
                action.combineArray = new Array();
                var hubElement = ActionsBuilder.Elements.FLOW_CONTROLS[ActionsBuilder.Elements.FLOW_CONTROLS.length - 1];
                var hub = this.addAction(action, ActionsBuilder.Type.FLOW_CONTROL, hubElement);
                action.hub = hub;
                action.addChild(hub);
                this._createActionAnimation(hub);
            }
            action.name = element.name;
            action.properties = element.properties;
            action.type = type;
            // Configure properties
            for (var i = 0; i < action.properties.length; i++) {
                action.propertiesResults.push({ targetType: action.properties[i].targetType, value: action.properties[i].value });
            }
            if (action.properties !== null && action.properties.length > 0) {
                if (action.properties[0].text === "target") {
                    action.propertiesResults[0].value = this.objectName;
                }
            }
            if (parent !== null) {
                if (parent.combineArray === null) {
                    parent.addChild(action);
                }
                else if (parent.combineArray !== null && action.name !== "Hub") {
                    parent.combineArray.push(action);
                    action.parent = parent;
                    action.combineAction = parent;
                    parent.node.text.attr("text", "");
                }
            }
            // Create animation
            this._createActionAnimation(action);
            return action;
        };
        /*
        * Traverses the graph viewer and returns if an action
        * is selected at coordinates (x, y)
        * @param start: the start node. Can be null
        * @param x: the x coordinate
        * @param y: the y coordinate
        * @param traverseCombine: if we traverse combine actions children
        */
        Viewer.prototype.traverseGraph = function (start, x, y, traverseCombine) {
            if (start === null)
                start = this.root;
            var result = { action: start, hit: true };
            if (start.node.isPointInside(x, y)) {
                return result;
            }
            for (var i = 0; i < start.children.length; i++) {
                var action = start.children[i];
                if (action.node.isPointInside(x, y)) {
                    result.hit = true;
                    result.action = start.children[i];
                    if (traverseCombine && action.combineArray !== null) {
                        for (var j = 0; j < action.combineArray.length; j++) {
                            if (action.combineArray[j].node.isPointInside(x, y)) {
                                result.action = action.combineArray[j];
                                break;
                            }
                        }
                    }
                    return result;
                }
                result = this.traverseGraph(action, x, y, traverseCombine);
                if (result.hit) {
                    return result;
                }
            }
            result.hit = false;
            result.action = null;
            return result;
        };
        /*
        * Sets the action's position (node)
        * @param action: the action to place
        * @param x: the x position of the action
        * @param y: the y position of the action
        */
        Viewer.prototype._setActionPosition = function (action, x, y) {
            var node = action.node;
            var offsetx = node.rect.attr("x") - x;
            var parent = action.parent;
            if (parent !== null && parent.combineArray !== null && parent.combineArray.length > 1) {
                var parentNode = parent.node;
                x = parentNode.rect.attr("x") + (parent.node.rect.attr("width") / 2) - (node.rect.attr("width") / 2);
            }
            node.rect.attr("x", x);
            node.rect.attr("y", y);
            var textBBox = node.text.getBBox();
            var textWidth = 0;
            if (textBBox !== null && textBBox !== undefined) {
                textWidth = textBBox.width;
            }
            node.text.attr("x", x + node.rect.attr("width") / 2 - textWidth / 2);
            node.text.attr("y", y + node.rect.attr("height") / 2);
            if (action.combineArray !== null && action.combineArray.length > 0) {
                var length = 0;
                for (var i = 0; i < action.combineArray.length; i++) {
                    var combinedAction = action.combineArray[i];
                    var combinedNode = combinedAction.node;
                    combinedNode.rect.attr("x", node.rect.attr("x") + length);
                    combinedNode.rect.attr("y", node.rect.attr("y"));
                    textBBox = combinedNode.text.getBBox();
                    if (textBBox !== null) {
                        textWidth = textBBox.width;
                    }
                    combinedNode.text.attr("x", combinedNode.rect.attr("x") + combinedNode.rect.attr("width") / 2 - textWidth / 2);
                    combinedNode.text.attr("y", y + combinedNode.rect.attr("height") / 2);
                    length += combinedNode.rect.attr("width");
                }
                node.rect.attr("width", length);
            }
            for (var i = 0; i < action.children.length; i++) {
                var child = action.children[i];
                this._setActionPosition(child, child.node.rect.attr("x") - offsetx, y + Viewer.VERTICAL_OFFSET * this.zoom);
                this._setActionLine(child);
            }
        };
        /*
        * Configures the line (link) between the action and its parent
        * @param action: the action to configure
        */
        Viewer.prototype._setActionLine = function (action) {
            if (action.node.line === null) {
                return;
            }
            var node = action.node;
            var nodex = node.rect.attr("x");
            var nodey = node.rect.attr("y");
            var nodeWidth = node.rect.attr("width");
            var nodeHeight = node.rect.attr("height");
            var parent = action.parent.node;
            var parentx = parent.rect.attr("x");
            var parenty = parent.rect.attr("y");
            var parentWidth = parent.rect.attr("width");
            var parentHeight = parent.rect.attr("height");
            if (node.detached) {
                node.line.attr("path", ["M", nodex, nodey, "L", nodex, nodey]);
                return;
            }
            var line1x = nodex + (nodeWidth / 2);
            var line1y = nodey;
            var line2y = line1y - (line1y - parenty - parentHeight) / 2;
            var line3x = parentx + (parentWidth / 2);
            var line4y = parenty + parentHeight;
            node.line.attr("path", ["M", line1x, line1y, "L", line1x, line2y, "L", line3x, line2y, "L", line3x, line4y]);
        };
        /*
        * Creates and returns a node
        * @param text: the text to draw in the nde
        * @param color: the node's color
        * @param noLine: if draw a line to the parent or not
        */
        Viewer.prototype._createNode = function (text, type, noLine) {
            var node = new ActionsBuilder.Node();
            var color = this.getNodeColor(type, false);
            node.rect = this.paper.rect(20, 20, Viewer.NODE_WIDTH, Viewer.NODE_HEIGHT, 0);
            node.rect.attr("fill", color);
            node.text = this.paper.text(20, 20, text);
            node.text.attr("font-size", 11);
            node.text.attr("text-anchor", "start");
            node.text.attr("font-family", "Sinkin Sans Light");
            if (!noLine) {
                node.line = this.paper.path("");
                node.line.attr("stroke", color);
            }
            return node;
        };
        /*
        * Creates the drag animation
        * @param action: the action to animate
        */
        Viewer.prototype._createActionAnimation = function (action) {
            var _this = this;
            var node = action.node;
            var finished = true;
            var nodex = 0;
            var nodey = 0;
            var onMove = function (dx, dy, x, y) { };
            var onStart = function (x, y, event) {
                if (node.minimized) {
                    return;
                }
                if (finished) {
                    nodex = node.rect.attr("x");
                    nodey = node.rect.attr("y");
                }
                finished = false;
                node.rect.animate({
                    x: node.rect.attr("x") - 10,
                    y: node.rect.attr("y"),
                    width: (Viewer.NODE_WIDTH + 20) * _this.zoom,
                    height: (Viewer.NODE_HEIGHT + 10) * _this.zoom,
                    opacity: 0.25
                }, 500, ">");
            };
            var onEnd = function (event) {
                if (!node.minimized) {
                    node.rect.animate({
                        x: nodex,
                        y: nodey,
                        width: Viewer.NODE_WIDTH * _this.zoom,
                        height: Viewer.NODE_HEIGHT * _this.zoom,
                        opacity: 1.0
                    }, 500, ">", function () { finished = true; });
                }
                var dragResult = _this.traverseGraph(null, _this.mousex, _this.mousey, true);
                if (dragResult.hit && dragResult.action === action || !dragResult.hit) {
                    // Create parameters. Action can be null
                    _this.parameters.createParameters(action);
                }
                else {
                    // Manage drag'n'drop
                    if (dragResult.action.children.length > 0 && action.type !== ActionsBuilder.Type.TRIGGER) {
                        return;
                    }
                    if (action.type === ActionsBuilder.Type.TRIGGER && dragResult.action !== _this.root) {
                        return;
                    }
                    if (action.type === ActionsBuilder.Type.ACTION && dragResult.action === _this.root) {
                        return;
                    }
                    if (action.type === ActionsBuilder.Type.FLOW_CONTROL && (dragResult.action === _this.root || dragResult.action.type === ActionsBuilder.Type.FLOW_CONTROL)) {
                        return;
                    }
                    if (action === dragResult.action.parent) {
                        return;
                    }
                    if (action.parent !== null && action.parent.combineArray !== null) {
                        return;
                    }
                    // Reset node
                    node.rect.stop(node.rect.animation);
                    node.text.stop(node.text.animation);
                    node.rect.undrag();
                    node.text.undrag();
                    node.rect.attr("opacity", 1.0);
                    node.rect.attr("width", Viewer.NODE_WIDTH);
                    node.rect.attr("height", Viewer.NODE_HEIGHT);
                    if (action.parent !== null) {
                        // Configure drag'n'drop
                        action.parent.removeChild(action);
                        dragResult.action.addChild(action);
                        _this.update();
                        _this._createActionAnimation(action);
                    }
                }
            };
            node.rect.drag(onMove, onStart, onEnd);
            node.text.drag(onMove, onStart, onEnd);
        };
        // Statics
        Viewer._NODE_WIDTH = 150;
        Viewer._NODE_HEIGHT = 25;
        Viewer._NODE_MINIMIZE_WIDTH = 50;
        Viewer._VERTICAL_OFFSET = 70;
        Viewer._DEFAULT_INFO_MESSAGE = "Select or add a node to customize actions";
        return Viewer;
    })();
    ActionsBuilder.Viewer = Viewer;
})(ActionsBuilder || (ActionsBuilder = {}));
