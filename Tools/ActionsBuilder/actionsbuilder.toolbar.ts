module ActionsBuilder {
    export class Toolbar {
        public toolbarElement: HTMLElement;
        public saveActionGraphElement: HTMLElement;

        private _viewer: Viewer;

        constructor(viewer: Viewer) {
            // Get HTML elements
            this.toolbarElement = document.getElementById("ToolbarElementID");

            // Configure this
            this._viewer = viewer;

            // Manage events
            window.addEventListener("resize", (event: Event) => {
                this.onResize();
            });

            // Bottom toolbar
            document.getElementById("ViewerDeZoomID").addEventListener("click", (event: MouseEvent) => {
                if (this._viewer.zoom > 0.1) {
                    this._viewer.zoom -= 0.1;
                }
                this._viewer.update();
            });
            document.getElementById("ViewerZoomID").addEventListener("click", (event: MouseEvent) => {
                if (this._viewer.zoom < 1.0) {
                    this._viewer.zoom += 0.1;
                }
                this._viewer.update();
            });
            document.getElementById("ViewerReconnectAll").addEventListener("click", (event: MouseEvent) => {
                for (var i = 0; i < this._viewer.root.children.length; i++) {
                    this._viewer.selectedNode = this._viewer.root.children[i];
                    this._viewer.utils.onDetachAction(false, true);
                }
                this._viewer.update();
                this._viewer.selectedNode = null;
            });
            document.getElementById("ViewerDisconnectAll").addEventListener("click", (event: MouseEvent) => {
                for (var i = 0; i < this._viewer.root.children.length; i++) {
                    this._viewer.selectedNode = this._viewer.root.children[i];
                    this._viewer.utils.onDetachAction(true, false);
                }
                this._viewer.update();
                this._viewer.selectedNode = null;
            });
            document.getElementById("ViewerReduceAll").addEventListener("click", (event: MouseEvent) => {
                for (var i = 0; i < this._viewer.root.children.length; i++) {
                    this._viewer.selectedNode = this._viewer.root.children[i];
                    this._viewer.utils.onReduceAll(false);
                }
                this._viewer.update();
                this._viewer.selectedNode = null;
            });
            document.getElementById("ViewerExpandAll").addEventListener("click", (event: MouseEvent) => {
                for (var i = 0; i < this._viewer.root.children.length; i++) {
                    this._viewer.selectedNode = this._viewer.root.children[i];
                    this._viewer.utils.onReduceAll(true);
                }
                this._viewer.update();
                this._viewer.selectedNode = null;
            });

            // Top toolbar
            this.saveActionGraphElement = document.getElementById("ToolsButtonIDSaveActionGraph");
            this.drawSaveActionGraphButton(false);

            document.getElementById("ResetActionGraphID").addEventListener("click", (event: MouseEvent) => {
                if (confirm("Are you sure?")) {
                    for (var i = 0; i < this._viewer.root.children.length; i++) {
                        this._viewer.selectedNode = this._viewer.root.children[i];
                        this._viewer.utils.onRemoveBranch();
                    }
                    this._viewer.update();
                    this._viewer.selectedNode = null;
                }
            });
            document.getElementById("TestActionGraphID").addEventListener("click", (event: MouseEvent) => {
                this._viewer.utils.onTestGraph();
            });
        }

        public onResize(): void {
            this.toolbarElement.style.top = this._viewer.viewerElement.clientHeight + 20 + "px";
        }

        public drawSaveActionGraphButton(draw: boolean) {
            this.saveActionGraphElement.style.display = draw ? "block" : "none";
        }
    }
}
 