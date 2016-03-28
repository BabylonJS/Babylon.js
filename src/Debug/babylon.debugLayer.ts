module BABYLON {
    export class DebugLayer {
        private _scene: Scene;
        private _camera: Camera;
        private _transformationMatrix = Matrix.Identity();
        private _enabled: boolean = false;
        private _labelsEnabled: boolean = false;
        private _displayStatistics = true;
        private _displayTree = false;
        private _displayLogs = false;
        private _globalDiv: HTMLDivElement;
        private _statsDiv: HTMLDivElement;
        private _statsSubsetDiv: HTMLDivElement;
        private _optionsDiv: HTMLDivElement;
        private _optionsSubsetDiv: HTMLDivElement;
        private _logDiv: HTMLDivElement;
        private _logSubsetDiv: HTMLDivElement;
        private _treeDiv: HTMLDivElement;
        private _treeSubsetDiv: HTMLDivElement;
        private _drawingCanvas: HTMLCanvasElement;
        private _drawingContext: CanvasRenderingContext2D;
        private _rootElement: HTMLElement;

        private _skeletonViewers = new Array<Debug.SkeletonViewer>();

        public _syncPositions: () => void;
        private _syncData: () => void;
        private _syncUI: () => void;
        private _onCanvasClick: (evt: MouseEvent) => void;

        private _clickPosition: any;
        private _ratio: number;

        private _identityMatrix = Matrix.Identity();

        private _showUI: boolean;
        private _needToRefreshMeshesTree: boolean;

        public shouldDisplayLabel: (node: Node) => boolean;
        public shouldDisplayAxis: (mesh: Mesh) => boolean;

        public axisRatio = 0.02;

        public accentColor = "orange";

        public customStatsFunction: () => string;

        constructor(scene: Scene) {
            this._scene = scene;

            this._syncPositions = (): void => {
                var engine = this._scene.getEngine();
                var canvasRect = engine.getRenderingCanvasClientRect();

                if (this._showUI) {
                    this._statsDiv.style.left = (canvasRect.width - 410) + "px";
                    this._statsDiv.style.top = (canvasRect.height - 290) + "px";
                    this._statsDiv.style.width = "400px";
                    this._statsDiv.style.height = "auto";
                    this._statsSubsetDiv.style.maxHeight = "240px";

                    this._optionsDiv.style.left = "0px";
                    this._optionsDiv.style.top = "10px";
                    this._optionsDiv.style.width = "200px";
                    this._optionsDiv.style.height = "auto";
                    this._optionsSubsetDiv.style.maxHeight = (canvasRect.height - 225) + "px";

                    this._logDiv.style.left = "0px";
                    this._logDiv.style.top = (canvasRect.height - 170) + "px";
                    this._logDiv.style.width = "600px";
                    this._logDiv.style.height = "160px";

                    this._treeDiv.style.left = (canvasRect.width - 310) + "px";
                    this._treeDiv.style.top = "10px";
                    this._treeDiv.style.width = "300px";
                    this._treeDiv.style.height = "auto";
                    this._treeSubsetDiv.style.maxHeight = (canvasRect.height - 340) + "px";
                }

                this._globalDiv.style.left = canvasRect.left + "px";
                this._globalDiv.style.top = canvasRect.top + "px";

                this._drawingCanvas.style.left = "0px";
                this._drawingCanvas.style.top = "0px";
                this._drawingCanvas.style.width = engine.getRenderWidth() + "px";
                this._drawingCanvas.style.height = engine.getRenderHeight() + "px";

                var devicePixelRatio = window.devicePixelRatio || 1;
                var context = <any>this._drawingContext;
                var backingStoreRatio = context.webkitBackingStorePixelRatio ||
                    context.mozBackingStorePixelRatio ||
                    context.msBackingStorePixelRatio ||
                    context.oBackingStorePixelRatio ||
                    context.backingStorePixelRatio || 1;

                this._ratio = devicePixelRatio / backingStoreRatio;

                this._drawingCanvas.width = engine.getRenderWidth() * this._ratio;
                this._drawingCanvas.height = engine.getRenderHeight() * this._ratio;
            }

            this._onCanvasClick = (evt: MouseEvent): void => {
                this._clickPosition = {
                    x: evt.clientX * this._ratio,
                    y: evt.clientY * this._ratio
                };
            }

            this._syncUI = (): void => {
                if (this._showUI) {
                    if (this._displayStatistics) {
                        this._displayStats();
                        this._statsDiv.style.display = "";
                    } else {
                        this._statsDiv.style.display = "none";
                    }

                    if (this._displayLogs) {
                        this._logDiv.style.display = "";
                    } else {
                        this._logDiv.style.display = "none";
                    }

                    if (this._displayTree) {
                        this._treeDiv.style.display = "";

                        if (this._needToRefreshMeshesTree) {
                            this._needToRefreshMeshesTree = false;

                            this._refreshMeshesTreeContent();
                        }

                    } else {
                        this._treeDiv.style.display = "none";
                    }
                }
            }

            this._syncData = (): void => {
                if (this._labelsEnabled || !this._showUI) {

                    this._camera.getViewMatrix().multiplyToRef(this._camera.getProjectionMatrix(), this._transformationMatrix);

                    this._drawingContext.clearRect(0, 0, this._drawingCanvas.width, this._drawingCanvas.height);

                    var engine = this._scene.getEngine();
                    var viewport = this._camera.viewport;
                    var globalViewport = viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

                    // Meshes
                    var meshes = this._camera.getActiveMeshes();
                    var index: number;
                    var projectedPosition: Vector3;
                    for (index = 0; index < meshes.length; index++) {
                        var mesh = meshes.data[index];

                        var position = mesh.getBoundingInfo().boundingSphere.center;
                        projectedPosition = Vector3.Project(position, mesh.getWorldMatrix(), this._transformationMatrix, globalViewport);
                        if (mesh.renderOverlay || this.shouldDisplayAxis && this.shouldDisplayAxis(mesh)) {
                            this._renderAxis(projectedPosition, mesh, globalViewport);
                        }

                        if (!this.shouldDisplayLabel || this.shouldDisplayLabel(mesh)) {
                            this._renderLabel(mesh.name, projectedPosition, 12,
                                () => { mesh.renderOverlay = !mesh.renderOverlay },
                                () => { return mesh.renderOverlay ? 'red' : 'black'; });
                        }
                    }

                    // Cameras
                    var cameras = this._scene.cameras;
                    for (index = 0; index < cameras.length; index++) {
                        var camera = cameras[index];

                        if (camera === this._camera) {
                            continue;
                        }

                        projectedPosition = Vector3.Project(Vector3.Zero(), camera.getWorldMatrix(), this._transformationMatrix, globalViewport);

                        if (!this.shouldDisplayLabel || this.shouldDisplayLabel(camera)) {
                            this._renderLabel(camera.name, projectedPosition, 12,
                                () => {
                                    this._camera.detachControl(engine.getRenderingCanvas());
                                    this._camera = camera;
                                    this._camera.attachControl(engine.getRenderingCanvas());
                                },
                                () => { return "purple"; });
                        }
                    }

                    // Lights
                    var lights = this._scene.lights;
                    for (index = 0; index < lights.length; index++) {
                        var light = <any>lights[index];

                        if (light.position) {

                            projectedPosition = Vector3.Project(light.getAbsolutePosition(), this._identityMatrix, this._transformationMatrix, globalViewport);

                            if (!this.shouldDisplayLabel || this.shouldDisplayLabel(light)) {
                                this._renderLabel(light.name, projectedPosition, -20,
                                    () => {
                                        light.setEnabled(!light.isEnabled());
                                    },
                                    () => { return light.isEnabled() ? "orange" : "gray"; });
                            }

                        }
                    }
                }

                this._clickPosition = undefined;
            }
        }

        private _refreshMeshesTreeContent(): void {
            while (this._treeSubsetDiv.hasChildNodes()) {
                this._treeSubsetDiv.removeChild(this._treeSubsetDiv.lastChild);
            }

            // Add meshes
            var sortedArray = this._scene.meshes.slice(0, this._scene.meshes.length);

            sortedArray.sort((a, b) => {
                if (a.name === b.name) {
                    return 0;
                }

                return (a.name > b.name) ? 1 : -1;
            });

            for (var index = 0; index < sortedArray.length; index++) {
                var mesh = sortedArray[index];

                if (!mesh.isEnabled()) {
                    continue;
                }

                this._generateAdvancedCheckBox(this._treeSubsetDiv, mesh.name, mesh.getTotalVertices() + " verts", mesh.isVisible, (element, m) => {
                    m.isVisible = element.checked;
                }, mesh);
            }
        }

        private _renderSingleAxis(zero: Vector3, unit: Vector3, unitText: Vector3, label: string, color: string) {
            this._drawingContext.beginPath();
            this._drawingContext.moveTo(zero.x, zero.y);
            this._drawingContext.lineTo(unit.x, unit.y);

            this._drawingContext.strokeStyle = color;
            this._drawingContext.lineWidth = 4;
            this._drawingContext.stroke();

            this._drawingContext.font = "normal 14px Segoe UI";
            this._drawingContext.fillStyle = color;
            this._drawingContext.fillText(label, unitText.x, unitText.y);
        }

        private _renderAxis(projectedPosition: Vector3, mesh: Mesh, globalViewport: Viewport) {
            var position = mesh.getBoundingInfo().boundingSphere.center;
            var worldMatrix = mesh.getWorldMatrix();

            var unprojectedVector = Vector3.UnprojectFromTransform(projectedPosition.add(new Vector3(this._drawingCanvas.width * this.axisRatio, 0, 0)), globalViewport.width, globalViewport.height, worldMatrix, this._transformationMatrix);
            var unit = (unprojectedVector.subtract(position)).length();

            var xAxis = Vector3.Project(position.add(new Vector3(unit, 0, 0)), worldMatrix, this._transformationMatrix, globalViewport);
            var xAxisText = Vector3.Project(position.add(new Vector3(unit * 1.5, 0, 0)), worldMatrix, this._transformationMatrix, globalViewport);

            this._renderSingleAxis(projectedPosition, xAxis, xAxisText, "x", "#FF0000");

            var yAxis = Vector3.Project(position.add(new Vector3(0, unit, 0)), worldMatrix, this._transformationMatrix, globalViewport);
            var yAxisText = Vector3.Project(position.add(new Vector3(0, unit * 1.5, 0)), worldMatrix, this._transformationMatrix, globalViewport);

            this._renderSingleAxis(projectedPosition, yAxis, yAxisText, "y", "#00FF00");

            var zAxis = Vector3.Project(position.add(new Vector3(0, 0, unit)), worldMatrix, this._transformationMatrix, globalViewport);
            var zAxisText = Vector3.Project(position.add(new Vector3(0, 0, unit * 1.5)), worldMatrix, this._transformationMatrix, globalViewport);

            this._renderSingleAxis(projectedPosition, zAxis, zAxisText, "z", "#0000FF");
        }

        private _renderLabel(text: string, projectedPosition: Vector3, labelOffset: number, onClick: () => void, getFillStyle: () => string): void {
            if (projectedPosition.z > 0 && projectedPosition.z < 1.0) {
                this._drawingContext.font = "normal 12px Segoe UI";
                var textMetrics = this._drawingContext.measureText(text);
                var centerX = projectedPosition.x - textMetrics.width / 2;
                var centerY = projectedPosition.y;
                var clientRect = this._drawingCanvas.getBoundingClientRect();

                if (this._showUI && this._isClickInsideRect(clientRect.left * this._ratio + centerX - 5, clientRect.top * this._ratio + centerY - labelOffset - 12, textMetrics.width + 10, 17)) {
                    onClick();
                }

                this._drawingContext.beginPath();
                this._drawingContext.rect(centerX - 5, centerY - labelOffset - 12, textMetrics.width + 10, 17);
                this._drawingContext.fillStyle = getFillStyle();
                this._drawingContext.globalAlpha = 0.5;
                this._drawingContext.fill();
                this._drawingContext.globalAlpha = 1.0;

                this._drawingContext.strokeStyle = '#FFFFFF';
                this._drawingContext.lineWidth = 1;
                this._drawingContext.stroke();

                this._drawingContext.fillStyle = "#FFFFFF";
                this._drawingContext.fillText(text, centerX, centerY - labelOffset);

                this._drawingContext.beginPath();
                this._drawingContext.arc(projectedPosition.x, centerY, 5, 0, 2 * Math.PI, false);
                this._drawingContext.fill();
            }
        }

        private _isClickInsideRect(x: number, y: number, width: number, height: number): boolean {
            if (!this._clickPosition) {
                return false;
            }

            if (this._clickPosition.x < x || this._clickPosition.x > x + width) {
                return false;
            }

            if (this._clickPosition.y < y || this._clickPosition.y > y + height) {
                return false;
            }

            return true;
        }

        public isVisible(): boolean {
            return this._enabled;
        }

        public hide() {
            if (!this._enabled) {
                return;
            }

            this._enabled = false;

            var engine = this._scene.getEngine();

            this._scene.unregisterBeforeRender(this._syncData);
            this._scene.unregisterAfterRender(this._syncUI);
            this._rootElement.removeChild(this._globalDiv);

            this._scene.forceShowBoundingBoxes = false;
            this._scene.forceWireframe = false;

            StandardMaterial.DiffuseTextureEnabled = true;
            StandardMaterial.AmbientTextureEnabled = true;
            StandardMaterial.SpecularTextureEnabled = true;
            StandardMaterial.EmissiveTextureEnabled = true;
            StandardMaterial.BumpTextureEnabled = true;
            StandardMaterial.OpacityTextureEnabled = true;
            StandardMaterial.ReflectionTextureEnabled = true;
            StandardMaterial.LightmapTextureEnabled = true;
            StandardMaterial.RefractionTextureEnabled = true;

            this._scene.shadowsEnabled = true;
            this._scene.particlesEnabled = true;
            this._scene.postProcessesEnabled = true;
            this._scene.collisionsEnabled = true;
            this._scene.lightsEnabled = true;
            this._scene.texturesEnabled = true;
            this._scene.lensFlaresEnabled = true;
            this._scene.proceduralTexturesEnabled = true;
            this._scene.renderTargetsEnabled = true;
            this._scene.probesEnabled = true;

            engine.getRenderingCanvas().removeEventListener("click", this._onCanvasClick);

            this._clearSkeletonViewers();
        }

        private _clearSkeletonViewers(): void {
            for (var index = 0; index < this._skeletonViewers.length; index++) {
                this._skeletonViewers[index].dispose();
            }

            this._skeletonViewers = [];
        }

        public show(showUI: boolean = true, camera: Camera = null, rootElement: HTMLElement = null) {
            if (this._enabled) {
                return;
            }

            this._enabled = true;

            if (camera) {
                this._camera = camera;
            } else {
                this._camera = this._scene.activeCamera;
            }

            this._showUI = showUI;

            var engine = this._scene.getEngine();

            this._globalDiv = document.createElement("div");

            this._rootElement = rootElement || document.body;

            this._rootElement.appendChild(this._globalDiv);

            this._generateDOMelements();

            engine.getRenderingCanvas().addEventListener("click", this._onCanvasClick);

            this._syncPositions();
            this._scene.registerBeforeRender(this._syncData);
            this._scene.registerAfterRender(this._syncUI);
        }

        private _clearLabels(): void {
            this._drawingContext.clearRect(0, 0, this._drawingCanvas.width, this._drawingCanvas.height);

            for (var index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];
                mesh.renderOverlay = false;
            }
        }

        private _generateheader(root: HTMLDivElement, text: string): void {
            var header = document.createElement("div");
            header.innerHTML = text + "&nbsp;";

            header.style.textAlign = "right";
            header.style.width = "100%";
            header.style.color = "white";
            header.style.backgroundColor = "Black";
            header.style.padding = "5px 5px 4px 0px";
            header.style.marginLeft = "-5px";
            header.style.fontWeight = "bold";

            root.appendChild(header);
        }

        private _generateTexBox(root: HTMLDivElement, title: string, color: string): void {
            var label = document.createElement("label");
            label.style.display = "inline";
            label.innerHTML = title;
            label.style.color = color;

            root.appendChild(label);
            root.appendChild(document.createElement("br"));
        }

        private _generateAdvancedCheckBox(root: HTMLDivElement, leftTitle: string, rightTitle: string, initialState: boolean, task: (element, tag) => void, tag: any = null): void {
            var label = document.createElement("label");
            label.style.display = "inline";

            var boundingBoxesCheckbox = document.createElement("input");
            boundingBoxesCheckbox.type = "checkbox";
            boundingBoxesCheckbox.checked = initialState;
            boundingBoxesCheckbox.style.display = "inline";
            boundingBoxesCheckbox.style.margin = "0px 5px 0px 0px";
            boundingBoxesCheckbox.style.verticalAlign = "sub";

            boundingBoxesCheckbox.addEventListener("change", (evt: Event) => {
                task(evt.target, tag);
            });

            label.appendChild(boundingBoxesCheckbox);
            var container = document.createElement("span");
            var leftPart = document.createElement("span");
            var rightPart = document.createElement("span");

            rightPart.style.cssFloat = "right";

            leftPart.innerHTML = leftTitle;
            rightPart.innerHTML = rightTitle;
            rightPart.style.fontSize = "12px";
            rightPart.style.maxWidth = "200px";

            container.appendChild(leftPart);
            container.appendChild(rightPart);

            label.appendChild(container);
            root.appendChild(label);
            root.appendChild(document.createElement("br"));
        }

        private _generateCheckBox(root: HTMLDivElement, title: string, initialState: boolean, task: (element, tag) => void, tag: any = null): void {
            var label = document.createElement("label");
            label.style.display = "inline";

            var checkBox = document.createElement("input");
            checkBox.type = "checkbox";
            checkBox.checked = initialState;
            checkBox.style.display = "inline";
            checkBox.style.margin = "0px 5px 0px 0px";
            checkBox.style.verticalAlign = "sub";

            checkBox.addEventListener("change", (evt: Event) => {
                task(evt.target, tag);
            });

            label.appendChild(checkBox);
            label.appendChild(document.createTextNode(title));
            root.appendChild(label);
            root.appendChild(document.createElement("br"));
        }

        private _generateButton(root: HTMLDivElement, title: string, task: (element, tag) => void, tag: any = null): void {
            var button = document.createElement("button");
            button.innerHTML = title;
            button.style.height = "24px";
            button.style.width = "150px";
            button.style.marginBottom = "5px";
            button.style.color = "#444444";
            button.style.border = "1px solid white";
            button.className = "debugLayerButton";

            button.addEventListener("click", (evt: Event) => {
                task(evt.target, tag);
            });

            root.appendChild(button);
            root.appendChild(document.createElement("br"));
        }

        private _generateRadio(root: HTMLDivElement, title: string, name: string, initialState: boolean, task: (element, tag) => void, tag: any = null): void {
            var label = document.createElement("label");

            label.style.display = "inline";

            var boundingBoxesRadio = document.createElement("input");
            boundingBoxesRadio.type = "radio";
            boundingBoxesRadio.name = name;
            boundingBoxesRadio.checked = initialState;
            boundingBoxesRadio.style.display = "inline";
            boundingBoxesRadio.style.margin = "0px 5px 0px 0px";
            boundingBoxesRadio.style.verticalAlign = "sub";

            boundingBoxesRadio.addEventListener("change", (evt: Event) => {
                task(evt.target, tag);
            });

            label.appendChild(boundingBoxesRadio);
            label.appendChild(document.createTextNode(title));
            root.appendChild(label);
            root.appendChild(document.createElement("br"));
        }

        private _generateDOMelements(): void {
            this._globalDiv.id = "DebugLayer";
            this._globalDiv.style.position = "absolute";

            this._globalDiv.style.fontFamily = "Segoe UI, Arial";
            this._globalDiv.style.fontSize = "14px";
            this._globalDiv.style.color = "white";

            // Drawing canvas
            this._drawingCanvas = document.createElement("canvas");
            this._drawingCanvas.id = "DebugLayerDrawingCanvas";
            this._drawingCanvas.style.position = "absolute";
            this._drawingCanvas.style.pointerEvents = "none";
            this._drawingCanvas.style.backgroundColor = "transparent";
            this._drawingContext = this._drawingCanvas.getContext("2d");
            this._globalDiv.appendChild(this._drawingCanvas);

            if (this._showUI) {
                var background = "rgba(128, 128, 128, 0.4)";
                var border = "rgb(180, 180, 180) solid 1px";

                // Stats
                this._statsDiv = document.createElement("div");
                this._statsDiv.id = "DebugLayerStats";
                this._statsDiv.style.border = border;
                this._statsDiv.style.position = "absolute";
                this._statsDiv.style.background = background;
                this._statsDiv.style.padding = "0px 0px 0px 5px";
                this._generateheader(this._statsDiv, "STATISTICS");
                this._statsSubsetDiv = document.createElement("div");
                this._statsSubsetDiv.style.paddingTop = "5px";
                this._statsSubsetDiv.style.paddingBottom = "5px";
                this._statsSubsetDiv.style.overflowY = "auto";
                this._statsDiv.appendChild(this._statsSubsetDiv);

                // Tree
                this._treeDiv = document.createElement("div");
                this._treeDiv.id = "DebugLayerTree";
                this._treeDiv.style.border = border;
                this._treeDiv.style.position = "absolute";
                this._treeDiv.style.background = background;
                this._treeDiv.style.padding = "0px 0px 0px 5px";
                this._treeDiv.style.display = "none";
                this._generateheader(this._treeDiv, "MESHES TREE");
                this._treeSubsetDiv = document.createElement("div");
                this._treeSubsetDiv.style.paddingTop = "5px";
                this._treeSubsetDiv.style.paddingRight = "5px";
                this._treeSubsetDiv.style.overflowY = "auto";
                this._treeSubsetDiv.style.maxHeight = "300px";
                this._treeDiv.appendChild(this._treeSubsetDiv);
                this._needToRefreshMeshesTree = true;

                // Logs
                this._logDiv = document.createElement("div");
                this._logDiv.style.border = border;
                this._logDiv.id = "DebugLayerLogs";
                this._logDiv.style.position = "absolute";
                this._logDiv.style.background = background;
                this._logDiv.style.padding = "0px 0px 0px 5px";
                this._logDiv.style.display = "none";
                this._generateheader(this._logDiv, "LOGS");
                this._logSubsetDiv = document.createElement("div");
                this._logSubsetDiv.style.height = "127px";
                this._logSubsetDiv.style.paddingTop = "5px";
                this._logSubsetDiv.style.overflowY = "auto";
                this._logSubsetDiv.style.fontSize = "12px";
                this._logSubsetDiv.style.fontFamily = "consolas";
                this._logSubsetDiv.innerHTML = Tools.LogCache;
                this._logDiv.appendChild(this._logSubsetDiv);
                Tools.OnNewCacheEntry = (entry: string) => {
                    this._logSubsetDiv.innerHTML = entry + this._logSubsetDiv.innerHTML;
                }

                // Options
                this._optionsDiv = document.createElement("div");
                this._optionsDiv.id = "DebugLayerOptions";
                this._optionsDiv.style.border = border;
                this._optionsDiv.style.position = "absolute";
                this._optionsDiv.style.background = background;
                this._optionsDiv.style.padding = "0px 0px 0px 5px";
                this._optionsDiv.style.overflowY = "auto";
                this._generateheader(this._optionsDiv, "OPTIONS");
                this._optionsSubsetDiv = document.createElement("div");
                this._optionsSubsetDiv.style.paddingTop = "5px";
                this._optionsSubsetDiv.style.paddingBottom = "5px";
                this._optionsSubsetDiv.style.overflowY = "auto";
                this._optionsSubsetDiv.style.maxHeight = "200px";
                this._optionsDiv.appendChild(this._optionsSubsetDiv);

                this._generateTexBox(this._optionsSubsetDiv, "<b>Windows:</b>", this.accentColor);
                this._generateCheckBox(this._optionsSubsetDiv, "Statistics", this._displayStatistics, (element) => { this._displayStatistics = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Logs", this._displayLogs, (element) => { this._displayLogs = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Meshes tree", this._displayTree, (element) => {
                    this._displayTree = element.checked;
                    this._needToRefreshMeshesTree = true;
                });
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>General:</b>", this.accentColor);
                this._generateCheckBox(this._optionsSubsetDiv, "Bounding boxes", this._scene.forceShowBoundingBoxes, (element) => { this._scene.forceShowBoundingBoxes = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Clickable labels", this._labelsEnabled, (element) => {
                    this._labelsEnabled = element.checked;
                    if (!this._labelsEnabled) {
                        this._clearLabels();
                    }
                });
                this._generateCheckBox(this._optionsSubsetDiv, "Generate user marks (F12)", Tools.PerformanceLogLevel === Tools.PerformanceUserMarkLogLevel,
                    (element) => {
                        if (element.checked) {
                            Tools.PerformanceLogLevel = Tools.PerformanceUserMarkLogLevel;
                        } else {
                            Tools.PerformanceLogLevel = Tools.PerformanceNoneLogLevel;
                        }
                    });
                ;
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>Rendering mode:</b>", this.accentColor);
                this._generateRadio(this._optionsSubsetDiv, "Solid", "renderMode", !this._scene.forceWireframe && !this._scene.forcePointsCloud, (element) => {
                    if (element.checked) {
                        this._scene.forceWireframe = false;
                        this._scene.forcePointsCloud = false;
                    }
                });
                this._generateRadio(this._optionsSubsetDiv, "Wireframe", "renderMode", this._scene.forceWireframe, (element) => {
                    if (element.checked) {
                        this._scene.forceWireframe = true;
                        this._scene.forcePointsCloud = false;
                    }
                });
                this._generateRadio(this._optionsSubsetDiv, "Point", "renderMode", this._scene.forcePointsCloud, (element) => {
                    if (element.checked) {
                        this._scene.forceWireframe = false;
                        this._scene.forcePointsCloud = true;
                    }
                });
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>Texture channels:</b>", this.accentColor);
                this._generateCheckBox(this._optionsSubsetDiv, "Diffuse", StandardMaterial.DiffuseTextureEnabled, (element) => { StandardMaterial.DiffuseTextureEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Ambient", StandardMaterial.AmbientTextureEnabled, (element) => { StandardMaterial.AmbientTextureEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Specular", StandardMaterial.SpecularTextureEnabled, (element) => { StandardMaterial.SpecularTextureEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Emissive", StandardMaterial.EmissiveTextureEnabled, (element) => { StandardMaterial.EmissiveTextureEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Bump", StandardMaterial.BumpTextureEnabled, (element) => { StandardMaterial.BumpTextureEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Opacity", StandardMaterial.OpacityTextureEnabled, (element) => { StandardMaterial.OpacityTextureEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Reflection", StandardMaterial.ReflectionTextureEnabled, (element) => { StandardMaterial.ReflectionTextureEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Refraction", StandardMaterial.RefractionTextureEnabled, (element) => { StandardMaterial.RefractionTextureEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Lightmap", StandardMaterial.LightmapTextureEnabled, (element) => { StandardMaterial.LightmapTextureEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Fresnel", StandardMaterial.FresnelEnabled, (element) => { StandardMaterial.FresnelEnabled = element.checked });
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>Options:</b>", this.accentColor);
                this._generateCheckBox(this._optionsSubsetDiv, "Animations", this._scene.animationsEnabled, (element) => { this._scene.animationsEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Collisions", this._scene.collisionsEnabled, (element) => { this._scene.collisionsEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Fog", this._scene.fogEnabled, (element) => { this._scene.fogEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Lens flares", this._scene.lensFlaresEnabled, (element) => { this._scene.lensFlaresEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Lights", this._scene.lightsEnabled, (element) => { this._scene.lightsEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Particles", this._scene.particlesEnabled, (element) => { this._scene.particlesEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Post-processes", this._scene.postProcessesEnabled, (element) => { this._scene.postProcessesEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Probes", this._scene.probesEnabled, (element) => { this._scene.probesEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Procedural textures", this._scene.proceduralTexturesEnabled, (element) => { this._scene.proceduralTexturesEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Render targets", this._scene.renderTargetsEnabled, (element) => { this._scene.renderTargetsEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Shadows", this._scene.shadowsEnabled, (element) => { this._scene.shadowsEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Skeletons", this._scene.skeletonsEnabled, (element) => { this._scene.skeletonsEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Sprites", this._scene.spritesEnabled, (element) => { this._scene.spritesEnabled = element.checked });
                this._generateCheckBox(this._optionsSubsetDiv, "Textures", this._scene.texturesEnabled, (element) => { this._scene.texturesEnabled = element.checked });
                if (AudioEngine && Engine.audioEngine.canUseWebAudio) {
                    this._optionsSubsetDiv.appendChild(document.createElement("br"));
                    this._generateTexBox(this._optionsSubsetDiv, "<b>Audio:</b>", this.accentColor);
                    this._generateRadio(this._optionsSubsetDiv, "Headphones", "panningModel", this._scene.headphone, (element) => {
                        if (element.checked) {
                            this._scene.headphone = true;
                        }
                    });
                    this._generateRadio(this._optionsSubsetDiv, "Normal Speakers", "panningModel", !this._scene.headphone, (element) => {
                        if (element.checked) {
                            this._scene.headphone = false;
                        }
                    });
                    this._generateCheckBox(this._optionsSubsetDiv, "Disable audio", !this._scene.audioEnabled, (element) => {
                        this._scene.audioEnabled = !element.checked;
                    });
                }
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>Viewers:</b>", this.accentColor);
                this._generateCheckBox(this._optionsSubsetDiv, "Skeletons", false, (element) => {

                    if (!element.checked) {
                        this._clearSkeletonViewers();
                        return;
                    }

                    for (var index = 0; index < this._scene.meshes.length; index++) {
                        var mesh = this._scene.meshes[index];

                        if (mesh.skeleton) {
                            var found = false;
                            for (var sIndex = 0; sIndex < this._skeletonViewers.length; sIndex++) {
                                if (this._skeletonViewers[sIndex].skeleton === mesh.skeleton) {
                                    found = true;
                                    break;
                                }
                            }

                            if (found) {
                                continue;
                            }

                            var viewer = new BABYLON.Debug.SkeletonViewer(mesh.skeleton, mesh, this._scene);
                            viewer.isEnabled = true;
                            this._skeletonViewers.push(viewer);
                        }
                    }
                });
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>Tools:</b>", this.accentColor);
                this._generateButton(this._optionsSubsetDiv, "Dump rendertargets", (element) => { this._scene.dumpNextRenderTargets = true; });
                this._generateButton(this._optionsSubsetDiv, "Run SceneOptimizer", (element) => { SceneOptimizer.OptimizeAsync(this._scene); });
                this._generateButton(this._optionsSubsetDiv, "Log camera object", (element) => {
                    if (this._camera) {
                        console.log(this._camera);
                    } else {
                        console.warn("No camera defined, or debug layer created before camera creation!");
                    }
                });
                this._optionsSubsetDiv.appendChild(document.createElement("br"));

                this._globalDiv.appendChild(this._statsDiv);
                this._globalDiv.appendChild(this._logDiv);
                this._globalDiv.appendChild(this._optionsDiv);
                this._globalDiv.appendChild(this._treeDiv);
            }
        }

        private _displayStats() {
            var scene = this._scene;
            var engine = scene.getEngine();
            var glInfo = engine.getGlInfo();

            this._statsSubsetDiv.innerHTML = "Babylon.js v" + Engine.Version + " - <b>" + Tools.Format(engine.getFps(), 0) + " fps</b><br><br>"
                + "<div style='column-count: 2;-moz-column-count:2;-webkit-column-count:2'>"
                + "<b>Count</b><br>"
                + "Total meshes: " + scene.meshes.length + "<br>"
                + "Total lights: " + scene.lights.length + "<br>"
                + "Total vertices: " + scene.getTotalVertices() + "<br>"
                + "Total materials: " + scene.materials.length + "<br>"
                + "Total textures: " + scene.textures.length + "<br>"
                + "Active meshes: " + scene.getActiveMeshes().length + "<br>"
                + "Active indices: " + scene.getActiveIndices() + "<br>"
                + "Active bones: " + scene.getActiveBones() + "<br>"
                + "Active particles: " + scene.getActiveParticles() + "<br>"
                + "<b>Draw calls: " + engine.drawCalls + "</b><br><br>"
                + "<b>Duration</b><br>"
                + "Meshes selection:</i> " + Tools.Format(scene.getEvaluateActiveMeshesDuration()) + " ms<br>"
                + "Render Targets: " + Tools.Format(scene.getRenderTargetsDuration()) + " ms<br>"
                + "Particles: " + Tools.Format(scene.getParticlesDuration()) + " ms<br>"
                + "Sprites: " + Tools.Format(scene.getSpritesDuration()) + " ms<br><br>"
                + "Render: <b>" + Tools.Format(scene.getRenderDuration()) + " ms</b><br>"
                + "Frame: " + Tools.Format(scene.getLastFrameDuration()) + " ms<br>"
                + "Potential FPS: " + Tools.Format(1000.0 / scene.getLastFrameDuration(), 0) + "<br>"
                + "Resolution: " + engine.getRenderWidth() + "x" + engine.getRenderHeight() + "<br><br>"
                + "</div>"
                + "<div style='column-count: 2;-moz-column-count:2;-webkit-column-count:2'>"
                + "<b>Extensions</b><br>"
                + "Std derivatives: " + (engine.getCaps().standardDerivatives ? "Yes" : "No") + "<br>"
                + "Compressed textures: " + (engine.getCaps().s3tc ? "Yes" : "No") + "<br>"
                + "Hardware instances: " + (engine.getCaps().instancedArrays ? "Yes" : "No") + "<br>"
                + "Texture float: " + (engine.getCaps().textureFloat ? "Yes" : "No") + "<br><br>"
                + "32bits indices: " + (engine.getCaps().uintIndices ? "Yes" : "No") + "<br>"
                + "Fragment depth: " + (engine.getCaps().fragmentDepthSupported ? "Yes" : "No") + "<br>"
                + "High precision shaders: " + (engine.getCaps().highPrecisionShaderSupported ? "Yes" : "No") + "<br>"
                + "Draw buffers: " + (engine.getCaps().drawBuffersExtension ? "Yes" : "No") + "<br>"
                + "</div><br>"
                + "<div style='column-count: 2;-moz-column-count:2;-webkit-column-count:2'>"
                + "<b>Caps.</b><br>"
                + "Max textures units: " + engine.getCaps().maxTexturesImageUnits + "<br>"
                + "Max textures size: " + engine.getCaps().maxTextureSize + "<br>"
                + "Max anisotropy: " + engine.getCaps().maxAnisotropy + "<br>"
                + "<b>Info</b><br>"
                + "WebGL feature level: " + engine.webGLVersion + "<br>"
                + glInfo.version + "<br>"
                + "</div><br>"
                + glInfo.renderer + "<br>";

            if (this.customStatsFunction) {
                this._statsSubsetDiv.innerHTML += this._statsSubsetDiv.innerHTML;
            }
        }
    }
}
