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
//# sourceMappingURL=actionsbuilder.utils.js.map