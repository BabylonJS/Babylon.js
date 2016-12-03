module ActionsBuilder {
    export interface TraverseResult {
        action: Action;
        hit: boolean;
    }

    export interface UpdateResult {
        triggerWidth: number;
        childrenWidths: Array<UpdateResult>;
    }

    export class Viewer {
        // Statics
        private static _NODE_WIDTH: number = 150;
        private static _NODE_HEIGHT: number = 25;
        private static _NODE_MINIMIZE_WIDTH: number = 50;
        private static _VERTICAL_OFFSET: number = 70;
        
        private static _DEFAULT_INFO_MESSAGE = "Select or add a node to customize actions";
        
        public static get NODE_WIDTH(): number {
            return Viewer._NODE_WIDTH;
        }

        public static get NODE_HEIGHT(): number {
            return Viewer._NODE_HEIGHT;
        }

        public static get NODE_MINIMIZED_WIDTH(): number {
            return Viewer._NODE_MINIMIZE_WIDTH;
        }

        public static get VERTICAL_OFFSET(): number {
            return Viewer._VERTICAL_OFFSET;
        }

        // Members
        // Public
        public viewerContainer: HTMLElement;
        public viewerElement: HTMLElement;

        public objectName: string = "Unnamed Object";
        public zoom: number = 1.0;
        public mousex: number;
        public mousey: number;

        public paper: Paper;
        public root: Action;
        public selectedNode: Action;

        public parameters: Parameters;
        public utils: Utils;

        // Private
        private _toolbar: Toolbar;
        private _contextMenu: ContextMenu;

        private _firstUpdate: boolean = true;

        /*
        * Constructor
        * @param type: the root type object (OBJECT or SCENE)
        */
        constructor(type: number) {
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
            window.addEventListener("resize", (event: Event) => {
                this.onResize(event);
            });
            window.addEventListener("mousemove", (event: MouseEvent) => {
                this.onMove(event);
            });
            this.paper.canvas.addEventListener("click", (event: MouseEvent) => {
                this.onClick(event);
            });

            // Load modules
            this._toolbar = new Toolbar(this);
            this._contextMenu = new ContextMenu(this);

            this.parameters = new Parameters(this);
            this.utils = new Utils(this);

            // Finish
            this.parameters.parametersHelpElement.textContent = Viewer._DEFAULT_INFO_MESSAGE;
            this.onResize(null);
        }

        /*
        * Resize event
        * @param event: the resize event
        */
        public onResize(event?: Event): void {
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
        }

        /*
        * Handles the onMove event
        * @param event: the onMove mouse event
        */
        public onMove(event: MouseEvent): void {
            this.mousex = event.clientX - this.paper.canvas.getBoundingClientRect().left;
            this.mousey = event.clientY - this.paper.canvas.getBoundingClientRect().top;
        }

        /*
        * Handles the onClick event to get selected node
        * @param event: the onClick mouse event
        */
        public onClick(event: MouseEvent): void {
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
        }

        /*
        * Set the color theme of the viewer
        * @param color: the color theme ( ex: "rgb(64, 64, 64)" )
        */
        public setColorTheme(color: string): void {
            this.paper.canvas.style.background = color;
        }

        /*
        * Returns the color according to the given parameters
        * @param action: the action used to select the color
        * @param detached: if the node is attached to its parent or not
        */
        public getNodeColor(type: number, detached: boolean): RaphaelColor {
            if (detached) {
                return Raphael.rgb(96, 122, 14);
            }

            switch (type) {
                case Type.TRIGGER: return Raphael.rgb(133, 154, 185); break;
                case Type.ACTION:  return Raphael.rgb(182, 185, 132); break;
                case Type.FLOW_CONTROL: return Raphael.rgb(185, 132, 140); break;
                case Type.OBJECT:
                case Type.SCENE: return Raphael.rgb(255, 255, 255); break;
                default: break;
            }

            return null;
        }

        /*
        * Returns the selected node color according to the given parameters
        * @param action: the action used to select the color
        * @param detached: if the node is attached to its parent or not
        */
        public getSelectedNodeColor(type: number, detached: boolean): RaphaelColor {
            if (detached) {
                return Raphael.rgb(96, 122, 14);
            }

            switch (type) {
                case Type.TRIGGER: return Raphael.rgb(41, 129, 255); break;
                case Type.ACTION: return Raphael.rgb(255, 220, 42); break;
                case Type.FLOW_CONTROL: return Raphael.rgb(255, 41, 53); break;
                case Type.OBJECT:
                case Type.SCENE: return Raphael.rgb(255, 255, 255); break;
                default: break;
            }

            return null;
        }

        /*
        * Removes the given action from the graph
        * @param action: the action to remove
        * @param removeChildren: if remove the branch or not
        */
        public removeAction(action: Action, removeChildren: boolean): void {
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
        }

        /*
        * Removes the given node (not the action)
        * @param node: the node to remove
        */
        public removeNode(node: Node): void {
            node.rect.remove();
            node.text.remove();

            if (node.line !== null) {
                node.line.remove();
            }
        }

        /*
        * Updates the graph viewer
        */
        public update(): void {
            // Set root position
            this._setActionPosition(this.root, (this.paper.width / 2) - (Viewer.NODE_WIDTH / 2) * this.zoom, 10);

            // Sets node size
            var onSetNodeSize = (node: Node) => {
                node.rect.attr("width", node.minimized ? Viewer.NODE_MINIMIZED_WIDTH : Viewer.NODE_WIDTH * this.zoom);
                node.rect.attr("height", Viewer.NODE_HEIGHT * this.zoom);
                node.text.attr("font-size", 11 * this.zoom);
            };

            // First pass: set actions positions according to parents
            var onSetPositionPass = (action: Action, yPosition: number): void => {

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
                    this._setActionPosition(action, parentx, yPosition);
                    this._setActionLine(action);
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

                    var newPositionY = yPosition + Viewer.VERTICAL_OFFSET * this.zoom;

                    onSetPositionPass(childAction, newPositionY);

                    this._setActionPosition(childAction, newPositionX, newPositionY);
                    this._setActionLine(childAction);
                }
            };

            onSetPositionPass(this.root, 10 * this.zoom);

            // Seconds pass, get sizes of groups
            var onGetSizePass = (action: Action, maxSize: number): number => {
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
            var onResizeCanvas = (action: Action): void => {
                var node = action.node;
                var nodex = node.rect.attr("x");
                var nodey = node.rect.attr("y");

                if (nodex < 0 || nodex > this.paper.width) {
                    this.paper.setSize(this.paper.width + 1000, this.paper.height);
                    this._setActionPosition(this.root, (this.paper.width / 2) - (Viewer.NODE_WIDTH / 2) * this.zoom, 10);
                }
                if (nodey > this.paper.height) {
                    this.paper.setSize(this.paper.width, this.paper.height + 1000);
                    this._setActionPosition(this.root, (this.paper.width / 2) - (Viewer.NODE_WIDTH / 2) * this.zoom, 10);
                }
            };

            var widths = new Array<UpdateResult>();

            for (var i = 0; i < this.root.children.length; i++) {
                var trigger = this.root.children[i];
                var triggerResult: UpdateResult = { triggerWidth: onGetSizePass(trigger, 0), childrenWidths: new Array<UpdateResult>() };

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
            var onSetNodePosition = (action: Action, widthArray: Array<UpdateResult>, isChild: boolean) => {
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

                    this._setActionPosition(action.children[i], node.rect.attr("x") - actionsLeftOffset - (width / 2), node.rect.attr("y"));
                    this._setActionLine(child);
                    onResizeCanvas(child);

                    actionsLeftOffset += width;
                }

                // Move right
                var rightStart = actionsHasMiddle ? Math.round(actionsCount / 2) : actionsCount / 2;
                for (var i = rightStart; i < actionsCount; i++) {
                    var child = action.children[i];
                    var node = child.node;
                    var width = (widthArray[i].triggerWidth) + 15;

                    this._setActionPosition(action.children[i], node.rect.attr("x") + actionsRightOffset + (width / 2), node.rect.attr("y"));
                    this._setActionLine(child);
                    onResizeCanvas(child);

                    actionsRightOffset += width;
                }
            };

            onSetNodePosition(this.root, widths, false);
            for (var i = 0; i < this.root.children.length; i++) {
                onSetNodePosition(this.root.children[i], widths[i].childrenWidths, true);
            }
            
        }

        /*
        * Adds an action to the graph viewer and returns it
        * @param parent: the parent action
        * @param type: the action type
        * @param element: the Actions Builder type (TRIGGERS, ACTIONS, FLOW_CONTROLS)
        */
        public addAction(parent: Action, type: number, element: Element): Action {
            var node = this._createNode(element.text, type, parent === null);
            var action = new Action(node);

            if (element.name === "CombineAction") {
                action.combineArray = new Array<Action>();

                var hubElement = Elements.FLOW_CONTROLS[Elements.FLOW_CONTROLS.length - 1];
                var hub = this.addAction(action, Type.FLOW_CONTROL, hubElement);

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
        }

        /*
        * Traverses the graph viewer and returns if an action
        * is selected at coordinates (x, y)
        * @param start: the start node. Can be null
        * @param x: the x coordinate
        * @param y: the y coordinate
        * @param traverseCombine: if we traverse combine actions children
        */
        public traverseGraph(start: Action, x: number, y: number, traverseCombine: boolean): TraverseResult {
            if (start === null) start = this.root;

            var result: TraverseResult = { action: start, hit: true };

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
        }

        /*
        * Sets the action's position (node)
        * @param action: the action to place
        * @param x: the x position of the action
        * @param y: the y position of the action
        */
        public _setActionPosition(action: Action, x: number, y: number): void {
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
        }

        /*
        * Configures the line (link) between the action and its parent
        * @param action: the action to configure
        */
        private _setActionLine(action: Action): void {
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
        }

        /*
        * Creates and returns a node
        * @param text: the text to draw in the nde
        * @param color: the node's color
        * @param noLine: if draw a line to the parent or not
        */
        public _createNode(text: string, type: number, noLine: boolean): Node {
            var node = new Node();
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
        }

        /*
        * Creates the drag animation
        * @param action: the action to animate
        */
        private _createActionAnimation(action: Action): void {
            var node = action.node;
            var finished = true;
            var nodex: number = 0;
            var nodey: number = 0;

            var onMove = (dx: number, dy: number, x: number, y: number) =>
            { };

            var onStart = (x: number, y: number, event: MouseEvent) => {
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
                    width: (Viewer.NODE_WIDTH + 20) * this.zoom,
                    height: (Viewer.NODE_HEIGHT + 10) * this.zoom,
                    opacity: 0.25
                }, 500, ">");
            };

            var onEnd = (event: MouseEvent) => {
                if (!node.minimized) {
                    node.rect.animate({
                        x: nodex,
                        y: nodey,
                        width: Viewer.NODE_WIDTH * this.zoom,
                        height: Viewer.NODE_HEIGHT * this.zoom,
                        opacity: 1.0
                    }, 500, ">", () => { finished = true; });
                }

                var dragResult = this.traverseGraph(null, this.mousex, this.mousey, true);

                if (dragResult.hit && dragResult.action === action || !dragResult.hit) {
                    // Create parameters. Action can be null
                    this.parameters.createParameters(action);
                }
                else {
                    // Manage drag'n'drop
                    if (dragResult.action.children.length > 0 && action.type !== Type.TRIGGER) {
                        return;
                    }

                    if (action.type === Type.TRIGGER && dragResult.action !== this.root) {
                        return;
                    }

                    if (action.type === Type.ACTION && dragResult.action === this.root) {
                        return;
                    }

                    if (action.type === Type.FLOW_CONTROL && (dragResult.action === this.root || dragResult.action.type === Type.FLOW_CONTROL)) {
                        return;
                    }

                    if (action === dragResult.action.parent) {
                        return;
                    }

                    if (action.parent !== null && action.parent.combineArray !== null) { // Musn't move hubs of combine actions
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
                        this.update();
                        this._createActionAnimation(action);
                    }
                }
            };

            node.rect.drag(onMove, onStart, onEnd);
            node.text.drag(onMove, onStart, onEnd);
        }
    }
}