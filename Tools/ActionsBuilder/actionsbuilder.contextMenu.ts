module ActionsBuilder {

    export interface ContextMenuElement {
        text: string;
        node: Node;
        action: string;
    }

    export class ContextMenu {
        public showing: boolean = false;
        public savedColor: RaphaelColor = Raphael.rgb(255, 255, 255);
        public overColor: RaphaelColor = Raphael.rgb(140, 200, 230);

        private _viewer: Viewer = null;
        private elements: Array<ContextMenuElement> = [
            { text: "Reduce", node: null, action: "onReduce" },
            { text: "Delete", node: null, action: "onRemoveNode" },
            { text: "Delete branch", node: null, action: "onRemoveBranch" },
            { text: "Connect / Disconnect", node: null, action: "onDetachAction" },
            { text: "Copy", node: null, action: "onCopyStructure" },
            { text: "Paste", node: null, action: "onPasteStructure" },
            // Add other elements here
            { text: "", node: null, action: null } // Color separator (top)
        ];

        /*
        * Constructor
        * @param viewer: the graph viewer
        */
        constructor(viewer: Viewer) {
            // Members
            this._viewer = viewer;

            // Configure
            this.attachControl(this._viewer.paper.canvas);
        }

        public attachControl(element: HTMLElement): void {
            var onClick = (event: MouseEvent) => {
                var x = this._viewer.mousex;
                var y = this._viewer.mousey;

                // Remove all context menu nodes, and run action if selected
                if (this.showing) {
                    for (var i = 0; i < this.elements.length; i++) {
                        var element = this.elements[i];

                        if (element.action && element.node.rect.isPointInside(x, y)) {
                            this._viewer.utils[element.action]();
                            this._viewer.update();
                        }

                        element.node.rect.remove();
                        element.node.text.remove();
                    }
                }
                this.showing = false;
            };

            var onMouseMove = (event: MouseEvent) => {
                // Override context menu's node color if mouse is inside
                if (this.showing) {
                    for (var i = 0; i < this.elements.length; i++) {
                        var element = this.elements[i];

                        if (element.text === "")
                            continue;

                        var x = this._viewer.mousex;
                        var y = this._viewer.mousey;

                        if (element.node.rect.isPointInside(x, y)) {
                            element.node.rect.attr("fill", this.overColor);
                        }
                        else {
                            element.node.rect.attr("fill", this.savedColor);
                        }
                    }
                }
            };

            var onRightClick = (event: MouseEvent) => {
                var x = this._viewer.mousex;
                var y = this._viewer.mousey;

                this._viewer.onClick(event);

                // Set selected node
                var result = this._viewer.traverseGraph(null, x, y, true);
                if (result.hit) {
                    //this._viewer.selectedNode = result.element;
                }

                // Properly draw the context menu on the screen
                if (y + (Viewer.NODE_HEIGHT * this.elements.length) > this._viewer.viewerElement.offsetHeight + this._viewer.viewerElement.scrollTop) {
                    y = (Viewer.NODE_HEIGHT * this.elements.length);
                }
                if (x + Viewer.NODE_WIDTH > this._viewer.viewerElement.offsetWidth + this._viewer.viewerElement.scrollLeft) {
                    x -= Viewer.NODE_WIDTH;
                }

                if (!this.showing) {
                    if (this._viewer.selectedNode === null)
                        return;

                    // Create elements
                    var yOffset = 10;

                    for (var i = 0; i < this.elements.length - 1; i++) {
                        var element = this.elements[i];

                        element.node = this._viewer._createNode(element.text, Type.OBJECT, true);
                        element.node.rect.attr("fill", Raphael.rgb(216, 216, 216));

                        element.node.rect.attr("x", x);
                        element.node.rect.attr("y", y + yOffset);

                        element.node.text.attr("x", x + 5);
                        element.node.text.attr("y", y + yOffset + element.node.rect.attr("height") / 2);

                        yOffset += Viewer.NODE_HEIGHT;
                    }

                    // Color separator
                    var separator = this.elements[this.elements.length - 1];
                    separator.node = this._viewer._createNode("", Type.OBJECT, true);
                    separator.node.rect.attr("fill", this._viewer.getNodeColor(this._viewer.selectedNode.type, this._viewer.selectedNode.node.detached));

                    separator.node.rect.attr("x", x);
                    separator.node.rect.attr("y", y);
                    separator.node.rect.attr("height", 10);

                    // Finish
                    this.showing = true;
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
        }
    }
} 