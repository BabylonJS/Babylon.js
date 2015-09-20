interface Window {
    clipboardData: any;
}

module ActionsBuilder {
    export interface JSONObjectProperty {
        targetType?: string;
        name: string;
        value: string;
    }

    export interface JSONObject {
        type: number;
        name: string;
        detached: boolean;
        children: Array<JSONObject>;
        combine: Array<JSONObject>;
        properties: Array<JSONObjectProperty>;
    }

    export class Utils {
        // Members
        public copiedStructure: string = null;

        private _viewer: Viewer;

        /*
        * Constructor
        * @param viewer: the viewer instance
        */
        constructor(viewer: Viewer) {
            // Configure this
            this._viewer = viewer;
        }

        /*
        * Tests the graph and reports errors
        */
        public onTestGraph(): void {
            if (this._viewer.root.children.length === 0) {
                alert("Please add at least a Trigger and an Action to test the graph");
            }

            var onTestTarget = (targetType: string, target: any) => {
                var targetExists = false;
                var array = this._viewer.parameters._getTargetFromType(targetType);

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

            var onNodeError = (action: Action): boolean => {
                var node = action.node;
                node.rect.attr("fill", Raphael.rgb(255, 0, 0));

                return false;
            };

            var onTestAction = (action: Action): boolean => {
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
                        var object: any = null;
                        var propertyPath: any = null;

                        for (var i = 0; i < properties.length; i++) {
                            // Target
                            if (properties[i].text === "target" || properties[i].text === "parent") {
                                object = this._viewer.parameters._getObjectFromType(properties[i].targetType);
                                var targetExists = onTestTarget(propertiesResults[i].targetType, propertiesResults[i].value);

                                if (!targetExists) {
                                    return onNodeError(action);
                                }
                            }
                            // Property Path
                            else if (properties[i].text === "propertyPath") {
                                var property = <string>propertiesResults[i].value;
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
                            // value
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
        }

        /*
        * Recursively reduce/expand nodes
        */
        public onReduceAll(forceExpand: boolean = false): void {
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
        }

        /*
        * Reduces the selected node
        */
        public onReduce(forceExpand: boolean = false, forceReduce: boolean = false): void {
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
                node.rect.attr("width", Viewer.NODE_MINIMIZED_WIDTH * this._viewer.zoom);
            }
            else {
                node.text.show();
                node.rect.attr("width", Viewer.NODE_WIDTH * this._viewer.zoom);
            }
        }

        /*
        * Detaches the selected action
        */
        public onDetachAction(forceDetach: boolean = false, forceAttach: boolean = false): void {
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

            var onSetColor = (root: Action, detached: boolean) => {
                var rootNode = root.node;
                rootNode.rect.attr("fill", this._viewer.getNodeColor(root.type, detached));

                if (root.combineArray !== null) {
                    for (var i = 0; i < root.combineArray.length; i++) {
                        var combineNode = root.combineArray[i].node;
                        combineNode.rect.attr("fill", this._viewer.getNodeColor(root.combineArray[i].type, detached));
                    }
                }

                for (var i = 0; i < root.children.length; i++) {
                    onSetColor(root.children[i], detached);
                }
            };

            onSetColor(action, action.node.detached);
        }

        /*
        * Removes the selected node
        */
        public onRemoveNode(): void {
            if (this._viewer.selectedNode === null) {
                return;
            }

            var action = this._viewer.selectedNode;
            var parent = action.parent;

            // If trigger, remove branch
            if (action.type === Type.TRIGGER) {
                this.onRemoveBranch();
                return;
            }

            // If it is a combine hub
            if (action.type === Type.FLOW_CONTROL && parent !== null && parent.combineArray !== null) {
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
        }

        /*
        * Removes a branch starting from the selected node
        */
        public onRemoveBranch(): void {
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
        }

        /*
        * Copies the selected structure
        */ 
        public onCopyStructure(): void {
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
        }

        /*
        * Pastes the graph structure previously copied
        */
        public onPasteStructure(): void {
            if (this._viewer.selectedNode === null) {
                return;
            }

            var asText = (window.clipboardData !== undefined) ? window.clipboardData.getData("text") : this.copiedStructure;
            var isJson = asText.length > 0 && asText[0] == "{" && asText[asText.length - 1] == "}";
            var structure: JSONObject = JSON.parse(asText);
            var action = this._viewer.selectedNode;

            if (structure.type === Type.TRIGGER && action !== this._viewer.root) {
                alert("You can't paste a trigger if the selected node isn't the root object");
                return;
            }

            if (structure.type !== Type.TRIGGER && action === this._viewer.root) {
                alert("You can't paste an action or condition if the selected node is the root object");
                return;
            }

            this.loadFromJSON(structure, action);
            this._viewer.update();
        }

        /*
        * Loads a graph from JSON
        * @pram graph: the graph structure
        * @param startAction: the action to start load
        */
        public loadFromJSON(graph: JSONObject, startAction: Action): void {
            // If startNode is null, means it replaces all the graph
            // If not, it comes from a copy/paste
            if (startAction === null) {
                for (var i = 0; i < this._viewer.root.children.length; i++) {
                    this._viewer.removeAction(this._viewer.root.children[i], true);
                }
                this._viewer.root.clearChildren();
            }

            var load = (root: JSONObject, parent: Action, detached: boolean, combine: boolean) => {
                if (parent === null) {
                    parent = this._viewer.root;
                }

                var newAction: Action = null;

                if (root.type !== Type.OBJECT && root.type !== Type.SCENE) {
                    var action = this._viewer.addAction(parent, root.type, Elements.GetElementFromName(root.name));

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
                        node.rect.attr("fill", this._viewer.getNodeColor(action.type, detached));
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
        }

        /*
        * Creates a JSON object starting from a root action
        * @param root: the root action
        */
        public createJSON(root: Action): JSONObject {
            var action: JSONObject = {
                type: root.type,
                name: root.name,
                detached: root.node.detached,
                children: new Array<JSONObject>(),
                combine: new Array<JSONObject>(),
                properties: new Array<JSONObjectProperty>()
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
        }

        /*
        *
        */
        public setElementVisible(element: HTMLElement, visible: boolean): void {
            element.style.display = visible ? "block" : "none";
        }

    }
} 