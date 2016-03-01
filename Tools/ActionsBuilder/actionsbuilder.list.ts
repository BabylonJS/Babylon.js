module ActionsBuilder {
    export class ListElement {
        public rect: Rect = null;
        public text: Text = null;
        public name: string = "";
        public type: number = Type.TRIGGER;
        public element: Element = null;
    }

    export class List {
        public listElement: HTMLElement;
        public triggersElement: HTMLElement;
        public actionsElement: HTMLElement;
        public flowControlsElement: HTMLElement;

        public triggersList: Paper;
        public actionsList: Paper;
        public flowControlsList: Paper;

        private _parentContainer: HTMLElement;
        private _listElements: Array<ListElement> = new Array<ListElement>();
        private _viewer: Viewer;

        public static get ELEMENT_HEIGHT(): number {
            return 25;
        }

        /**
        * Constructor
        */
        constructor(viewer: Viewer) {
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
            window.addEventListener("resize", (event: Event) => {
                this.onResize(event);
            });
        }

        /**
        * Resize event that resizes the list element dynamically
        * @param event: the resize event
        */
        public onResize(event?: Event): void {
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

        }

        public createListsElements(): void {
            var excludedTriggers = [6, 9, 10];
            var yPosition = 10;
            var textColor = Raphael.rgb(61, 72, 76);
            var whiteColor = Raphael.rgb(255, 255, 255);

            var configureTitle = (listElement: ListElement, rectColor: RaphaelColor) => {
                listElement.text.attr("x", 15);
                listElement.rect.attr("fill", rectColor);
                listElement.text.attr("font-family", "Sinkin Sans Medium");
                listElement.text.attr("font-size", "11");
            };

            // Create triggers
            var triggers = this._createListElement(this.triggersList, yPosition, "TRIGGERS", Type.TRIGGER, whiteColor, false);
            yPosition += List.ELEMENT_HEIGHT;
            configureTitle(triggers, Raphael.rgb(41, 129, 255));

            for (var i = 0; i < Elements.TRIGGERS.length; i++) {
                var element: any = Elements.TRIGGERS[i];

                if (this._viewer.root.type === Type.OBJECT && excludedTriggers.indexOf(i) !== -1) {
                    continue;
                }
                else if (this._viewer.root.type === Type.SCENE && excludedTriggers.indexOf(i) === -1) {
                    continue;
                }

                var trigger = this._createListElement(this.triggersList, yPosition, element.text, Type.TRIGGER, textColor, true, element);

                trigger.rect.attr("fill", Raphael.rgb(133, 154, 185));
                yPosition += List.ELEMENT_HEIGHT;
            }

            yPosition += List.ELEMENT_HEIGHT;
            this.triggersElement.style.height = this.triggersList.canvas.style.height = yPosition + "px";
            this._createCollapseAnimation(this.triggersList, this.triggersElement, triggers, yPosition);

            // Create actions
            yPosition = 10;
            var actions = this._createListElement(this.actionsList, yPosition, "ACTIONS", Type.ACTION, textColor, false);
            yPosition += List.ELEMENT_HEIGHT;
            configureTitle(actions, Raphael.rgb(255, 220, 42));

            for (var i = 0; i < Elements.ACTIONS.length; i++) {
                var element: any = Elements.ACTIONS[i];
                var action = this._createListElement(this.actionsList, yPosition, element.text, Type.ACTION, textColor, true, element);

                action.rect.attr("fill", Raphael.rgb(182, 185, 132));
                yPosition += List.ELEMENT_HEIGHT;
            }

            yPosition += List.ELEMENT_HEIGHT;
            this.actionsElement.style.height = this.actionsList.canvas.style.height = yPosition + "px";
            this._createCollapseAnimation(this.actionsList, this.actionsElement, actions, yPosition);

            // Create flow controls
            yPosition = 10;
            var flowControls = this._createListElement(this.flowControlsList, yPosition, "FLOW CONTROLS", Type.FLOW_CONTROL, whiteColor, false);
            yPosition += List.ELEMENT_HEIGHT;
            configureTitle(flowControls, Raphael.rgb(255, 41, 53));

            for (var i = 0; i < Elements.FLOW_CONTROLS.length - 1; i++) {
                var element: any = Elements.FLOW_CONTROLS[i];
                var flowControl = this._createListElement(this.flowControlsList, yPosition, element.text, Type.FLOW_CONTROL, textColor, true, element);

                flowControl.rect.attr("fill", Raphael.rgb(185, 132, 140));
                yPosition += List.ELEMENT_HEIGHT;
            }

            yPosition += List.ELEMENT_HEIGHT;
            this.flowControlsElement.style.height = this.flowControlsList.canvas.style.height = yPosition + "px";
            this._createCollapseAnimation(this.flowControlsList, this.flowControlsElement, flowControls, yPosition);
        }

        /**
        * Clears the list of elements and removes the elements
        */
        public clearLists(): void {
            for (var i = 0; i < this._listElements.length; i++) {
                this._removeListElement(this._listElements[i]);
            }
            this._listElements.splice(0, this._listElements.length - 1);
        }

        /**
        * Sets the color theme of the lists
        * @param color: the theme color
        */
        public setColorTheme(color: string): void {
            this.triggersList.canvas.style.backgroundColor = color;
            this.actionsList.canvas.style.backgroundColor = color;
            this.flowControlsList.canvas.style.backgroundColor = color;
        }

        /**
        * Creates a list element
        * @param paper: the Raphael.js paper
        * @param yPosition: the y position of the element
        * @param text: the element text
        * @param type: the element type (trigger, action, flow control)
        * @param textColor: the text color
        * @param drag: if the element should be drag'n'dropped
        */
        private _createListElement(paper: Paper, yPosition: number, text: string, type: number,
                                   textColor: RaphaelColor, drag: boolean, element?: Element): ListElement
        {
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
        }

        /**
        * Removes a list element
        * @param element: the element to remove
        */
        private _removeListElement(element: ListElement): void {
            element.rect.remove();
            element.text.remove();
        }

        /*
        * Creates the collapse animation of a list
        * @param paper: the list paper
        * @param htmlElement: the list div container
        * @param element: the list element to click on
        * @param expandedHeight: the height when the list is expanded
        */
        private _createCollapseAnimation(paper: Paper, htmlElement: HTMLElement, element: ListElement, expandedHeight: number): void {
            var onClick = (event: MouseEvent) => {
                var height = htmlElement.style.height;
                if (height === expandedHeight + "px") {
                    htmlElement.style.height = paper.canvas.style.height = 35 + "px";
                }
                else {
                    htmlElement.style.height = paper.canvas.style.height = expandedHeight + "px";
                }
            };

            element.rect.click(onClick);
        }

        /*
        * Creates the animation of a list element
        * @param element: the list element to animate
        */
        private _createListElementAnimation(element: ListElement): void {
            var onMove = (dx: number, dy: number, x: number, y: number) =>
            { };

            var onStart = (x: number, y: number, event: MouseEvent) => {
                this._parentContainer.style.cursor = "copy";
                element.rect.animate({
                    x: -10,
                    opacity: 0.25
                }, 500, ">");
                element.text.animate({
                    x: 10,
                    opacity: 0.25
                }, 500, ">");
            };

            var onEnd = (event: MouseEvent) => {
                this._parentContainer.style.cursor = "default";
                element.rect.animate({
                    x: 10,
                    opacity: 1.0
                }, 500, "<");
                element.text.animate({
                    x: 30,
                    opacity: 1.0
                }, 500, "<");

                var dragResult = this._viewer.traverseGraph(null, this._viewer.mousex, this._viewer.mousey, false);

                if (dragResult.hit) {
                    if (element.type === Type.TRIGGER && dragResult.action !== this._viewer.root) {
                        alert("Triggers can be dragged only on the root node (the mesh)");
                        return;
                    }

                    if (element.type === Type.ACTION && dragResult.action === this._viewer.root) {
                        alert("Please add a trigger before.");
                        return;
                    }

                    //if (element.type === Type.FLOW_CONTROL && (dragResult.action === this._viewer.root || (dragResult.action.type === Type.FLOW_CONTROL && dragResult.action.parent.hub === null))) {
                    if (element.type === Type.FLOW_CONTROL && dragResult.action === this._viewer.root) {
                        return;
                    }

                    if (element.type === Type.FLOW_CONTROL && dragResult.action.combineArray !== null) {
                        alert("A condition cannot be handled by a Combine Action.");
                        return;
                    }

                    if ((element.type === Type.FLOW_CONTROL || element.type === Type.ACTION) && dragResult.action.type === Type.TRIGGER && dragResult.action.children.length > 0) {
                        alert("Triggers can have only one child. Please add another trigger of same type.");
                        return;
                    }

                    if (!(dragResult.action.combineArray !== null) && dragResult.action.children.length > 0 && dragResult.action.type !== Type.TRIGGER && dragResult.action !== this._viewer.root) {
                        alert("An action can have only one child.");
                        return;
                    }

                    this._viewer.addAction(dragResult.action, element.type, element.element);
                    this._viewer.update();
                }
            };

            element.rect.drag(onMove, onStart, onEnd);
            element.text.drag(onMove, onStart, onEnd);
        }

    }
}