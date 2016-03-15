var BABYLON;
(function (BABYLON) {
    var DebugLayer = (function () {
        function DebugLayer(scene) {
            var _this = this;
            this._transformationMatrix = BABYLON.Matrix.Identity();
            this._enabled = false;
            this._labelsEnabled = false;
            this._displayStatistics = true;
            this._displayTree = false;
            this._displayLogs = false;
            this._skeletonViewers = new Array();
            this._identityMatrix = BABYLON.Matrix.Identity();
            this.axisRatio = 0.02;
            this.accentColor = "orange";
            this._scene = scene;
            this._syncPositions = function () {
                var engine = _this._scene.getEngine();
                var canvasRect = engine.getRenderingCanvasClientRect();
                if (_this._showUI) {
                    _this._statsDiv.style.left = (canvasRect.width - 410) + "px";
                    _this._statsDiv.style.top = (canvasRect.height - 290) + "px";
                    _this._statsDiv.style.width = "400px";
                    _this._statsDiv.style.height = "auto";
                    _this._statsSubsetDiv.style.maxHeight = "240px";
                    _this._optionsDiv.style.left = "0px";
                    _this._optionsDiv.style.top = "10px";
                    _this._optionsDiv.style.width = "200px";
                    _this._optionsDiv.style.height = "auto";
                    _this._optionsSubsetDiv.style.maxHeight = (canvasRect.height - 225) + "px";
                    _this._logDiv.style.left = "0px";
                    _this._logDiv.style.top = (canvasRect.height - 170) + "px";
                    _this._logDiv.style.width = "600px";
                    _this._logDiv.style.height = "160px";
                    _this._treeDiv.style.left = (canvasRect.width - 310) + "px";
                    _this._treeDiv.style.top = "10px";
                    _this._treeDiv.style.width = "300px";
                    _this._treeDiv.style.height = "auto";
                    _this._treeSubsetDiv.style.maxHeight = (canvasRect.height - 340) + "px";
                }
                _this._globalDiv.style.left = canvasRect.left + "px";
                _this._globalDiv.style.top = canvasRect.top + "px";
                _this._drawingCanvas.style.left = "0px";
                _this._drawingCanvas.style.top = "0px";
                _this._drawingCanvas.style.width = engine.getRenderWidth() + "px";
                _this._drawingCanvas.style.height = engine.getRenderHeight() + "px";
                var devicePixelRatio = window.devicePixelRatio || 1;
                var context = _this._drawingContext;
                var backingStoreRatio = context.webkitBackingStorePixelRatio ||
                    context.mozBackingStorePixelRatio ||
                    context.msBackingStorePixelRatio ||
                    context.oBackingStorePixelRatio ||
                    context.backingStorePixelRatio || 1;
                _this._ratio = devicePixelRatio / backingStoreRatio;
                _this._drawingCanvas.width = engine.getRenderWidth() * _this._ratio;
                _this._drawingCanvas.height = engine.getRenderHeight() * _this._ratio;
            };
            this._onCanvasClick = function (evt) {
                _this._clickPosition = {
                    x: evt.clientX * _this._ratio,
                    y: evt.clientY * _this._ratio
                };
            };
            this._syncUI = function () {
                if (_this._showUI) {
                    if (_this._displayStatistics) {
                        _this._displayStats();
                        _this._statsDiv.style.display = "";
                    }
                    else {
                        _this._statsDiv.style.display = "none";
                    }
                    if (_this._displayLogs) {
                        _this._logDiv.style.display = "";
                    }
                    else {
                        _this._logDiv.style.display = "none";
                    }
                    if (_this._displayTree) {
                        _this._treeDiv.style.display = "";
                        if (_this._needToRefreshMeshesTree) {
                            _this._needToRefreshMeshesTree = false;
                            _this._refreshMeshesTreeContent();
                        }
                    }
                    else {
                        _this._treeDiv.style.display = "none";
                    }
                }
            };
            this._syncData = function () {
                if (_this._labelsEnabled || !_this._showUI) {
                    _this._camera.getViewMatrix().multiplyToRef(_this._camera.getProjectionMatrix(), _this._transformationMatrix);
                    _this._drawingContext.clearRect(0, 0, _this._drawingCanvas.width, _this._drawingCanvas.height);
                    var engine = _this._scene.getEngine();
                    var viewport = _this._camera.viewport;
                    var globalViewport = viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
                    // Meshes
                    var meshes = _this._camera.getActiveMeshes();
                    var index;
                    var projectedPosition;
                    for (index = 0; index < meshes.length; index++) {
                        var mesh = meshes.data[index];
                        var position = mesh.getBoundingInfo().boundingSphere.center;
                        projectedPosition = BABYLON.Vector3.Project(position, mesh.getWorldMatrix(), _this._transformationMatrix, globalViewport);
                        if (mesh.renderOverlay || _this.shouldDisplayAxis && _this.shouldDisplayAxis(mesh)) {
                            _this._renderAxis(projectedPosition, mesh, globalViewport);
                        }
                        if (!_this.shouldDisplayLabel || _this.shouldDisplayLabel(mesh)) {
                            _this._renderLabel(mesh.name, projectedPosition, 12, function () { mesh.renderOverlay = !mesh.renderOverlay; }, function () { return mesh.renderOverlay ? 'red' : 'black'; });
                        }
                    }
                    // Cameras
                    var cameras = _this._scene.cameras;
                    for (index = 0; index < cameras.length; index++) {
                        var camera = cameras[index];
                        if (camera === _this._camera) {
                            continue;
                        }
                        projectedPosition = BABYLON.Vector3.Project(BABYLON.Vector3.Zero(), camera.getWorldMatrix(), _this._transformationMatrix, globalViewport);
                        if (!_this.shouldDisplayLabel || _this.shouldDisplayLabel(camera)) {
                            _this._renderLabel(camera.name, projectedPosition, 12, function () {
                                _this._camera.detachControl(engine.getRenderingCanvas());
                                _this._camera = camera;
                                _this._camera.attachControl(engine.getRenderingCanvas());
                            }, function () { return "purple"; });
                        }
                    }
                    // Lights
                    var lights = _this._scene.lights;
                    for (index = 0; index < lights.length; index++) {
                        var light = lights[index];
                        if (light.position) {
                            projectedPosition = BABYLON.Vector3.Project(light.getAbsolutePosition(), _this._identityMatrix, _this._transformationMatrix, globalViewport);
                            if (!_this.shouldDisplayLabel || _this.shouldDisplayLabel(light)) {
                                _this._renderLabel(light.name, projectedPosition, -20, function () {
                                    light.setEnabled(!light.isEnabled());
                                }, function () { return light.isEnabled() ? "orange" : "gray"; });
                            }
                        }
                    }
                }
                _this._clickPosition = undefined;
            };
        }
        DebugLayer.prototype._refreshMeshesTreeContent = function () {
            while (this._treeSubsetDiv.hasChildNodes()) {
                this._treeSubsetDiv.removeChild(this._treeSubsetDiv.lastChild);
            }
            // Add meshes
            var sortedArray = this._scene.meshes.slice(0, this._scene.meshes.length);
            sortedArray.sort(function (a, b) {
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
                this._generateAdvancedCheckBox(this._treeSubsetDiv, mesh.name, mesh.getTotalVertices() + " verts", mesh.isVisible, function (element, m) {
                    m.isVisible = element.checked;
                }, mesh);
            }
        };
        DebugLayer.prototype._renderSingleAxis = function (zero, unit, unitText, label, color) {
            this._drawingContext.beginPath();
            this._drawingContext.moveTo(zero.x, zero.y);
            this._drawingContext.lineTo(unit.x, unit.y);
            this._drawingContext.strokeStyle = color;
            this._drawingContext.lineWidth = 4;
            this._drawingContext.stroke();
            this._drawingContext.font = "normal 14px Segoe UI";
            this._drawingContext.fillStyle = color;
            this._drawingContext.fillText(label, unitText.x, unitText.y);
        };
        DebugLayer.prototype._renderAxis = function (projectedPosition, mesh, globalViewport) {
            var position = mesh.getBoundingInfo().boundingSphere.center;
            var worldMatrix = mesh.getWorldMatrix();
            var unprojectedVector = BABYLON.Vector3.UnprojectFromTransform(projectedPosition.add(new BABYLON.Vector3(this._drawingCanvas.width * this.axisRatio, 0, 0)), globalViewport.width, globalViewport.height, worldMatrix, this._transformationMatrix);
            var unit = (unprojectedVector.subtract(position)).length();
            var xAxis = BABYLON.Vector3.Project(position.add(new BABYLON.Vector3(unit, 0, 0)), worldMatrix, this._transformationMatrix, globalViewport);
            var xAxisText = BABYLON.Vector3.Project(position.add(new BABYLON.Vector3(unit * 1.5, 0, 0)), worldMatrix, this._transformationMatrix, globalViewport);
            this._renderSingleAxis(projectedPosition, xAxis, xAxisText, "x", "#FF0000");
            var yAxis = BABYLON.Vector3.Project(position.add(new BABYLON.Vector3(0, unit, 0)), worldMatrix, this._transformationMatrix, globalViewport);
            var yAxisText = BABYLON.Vector3.Project(position.add(new BABYLON.Vector3(0, unit * 1.5, 0)), worldMatrix, this._transformationMatrix, globalViewport);
            this._renderSingleAxis(projectedPosition, yAxis, yAxisText, "y", "#00FF00");
            var zAxis = BABYLON.Vector3.Project(position.add(new BABYLON.Vector3(0, 0, unit)), worldMatrix, this._transformationMatrix, globalViewport);
            var zAxisText = BABYLON.Vector3.Project(position.add(new BABYLON.Vector3(0, 0, unit * 1.5)), worldMatrix, this._transformationMatrix, globalViewport);
            this._renderSingleAxis(projectedPosition, zAxis, zAxisText, "z", "#0000FF");
        };
        DebugLayer.prototype._renderLabel = function (text, projectedPosition, labelOffset, onClick, getFillStyle) {
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
        };
        DebugLayer.prototype._isClickInsideRect = function (x, y, width, height) {
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
        };
        DebugLayer.prototype.isVisible = function () {
            return this._enabled;
        };
        DebugLayer.prototype.hide = function () {
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
            BABYLON.StandardMaterial.DiffuseTextureEnabled = true;
            BABYLON.StandardMaterial.AmbientTextureEnabled = true;
            BABYLON.StandardMaterial.SpecularTextureEnabled = true;
            BABYLON.StandardMaterial.EmissiveTextureEnabled = true;
            BABYLON.StandardMaterial.BumpTextureEnabled = true;
            BABYLON.StandardMaterial.OpacityTextureEnabled = true;
            BABYLON.StandardMaterial.ReflectionTextureEnabled = true;
            BABYLON.StandardMaterial.LightmapTextureEnabled = true;
            BABYLON.StandardMaterial.RefractionTextureEnabled = true;
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
        };
        DebugLayer.prototype._clearSkeletonViewers = function () {
            for (var index = 0; index < this._skeletonViewers.length; index++) {
                this._skeletonViewers[index].dispose();
            }
            this._skeletonViewers = [];
        };
        DebugLayer.prototype.show = function (showUI, camera, rootElement) {
            if (showUI === void 0) { showUI = true; }
            if (camera === void 0) { camera = null; }
            if (rootElement === void 0) { rootElement = null; }
            if (this._enabled) {
                return;
            }
            this._enabled = true;
            if (camera) {
                this._camera = camera;
            }
            else {
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
        };
        DebugLayer.prototype._clearLabels = function () {
            this._drawingContext.clearRect(0, 0, this._drawingCanvas.width, this._drawingCanvas.height);
            for (var index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];
                mesh.renderOverlay = false;
            }
        };
        DebugLayer.prototype._generateheader = function (root, text) {
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
        };
        DebugLayer.prototype._generateTexBox = function (root, title, color) {
            var label = document.createElement("label");
            label.innerHTML = title;
            label.style.color = color;
            root.appendChild(label);
            root.appendChild(document.createElement("br"));
        };
        DebugLayer.prototype._generateAdvancedCheckBox = function (root, leftTitle, rightTitle, initialState, task, tag) {
            if (tag === void 0) { tag = null; }
            var label = document.createElement("label");
            var boundingBoxesCheckbox = document.createElement("input");
            boundingBoxesCheckbox.type = "checkbox";
            boundingBoxesCheckbox.checked = initialState;
            boundingBoxesCheckbox.addEventListener("change", function (evt) {
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
        };
        DebugLayer.prototype._generateCheckBox = function (root, title, initialState, task, tag) {
            if (tag === void 0) { tag = null; }
            var label = document.createElement("label");
            var checkBox = document.createElement("input");
            checkBox.type = "checkbox";
            checkBox.checked = initialState;
            checkBox.addEventListener("change", function (evt) {
                task(evt.target, tag);
            });
            label.appendChild(checkBox);
            label.appendChild(document.createTextNode(title));
            root.appendChild(label);
            root.appendChild(document.createElement("br"));
        };
        DebugLayer.prototype._generateButton = function (root, title, task, tag) {
            if (tag === void 0) { tag = null; }
            var button = document.createElement("button");
            button.innerHTML = title;
            button.style.height = "24px";
            button.style.width = "150px";
            button.style.marginBottom = "5px";
            button.style.color = "#444444";
            button.style.border = "1px solid white";
            button.className = "debugLayerButton";
            button.addEventListener("click", function (evt) {
                task(evt.target, tag);
            });
            root.appendChild(button);
            root.appendChild(document.createElement("br"));
        };
        DebugLayer.prototype._generateRadio = function (root, title, name, initialState, task, tag) {
            if (tag === void 0) { tag = null; }
            var label = document.createElement("label");
            var boundingBoxesRadio = document.createElement("input");
            boundingBoxesRadio.type = "radio";
            boundingBoxesRadio.name = name;
            boundingBoxesRadio.checked = initialState;
            boundingBoxesRadio.addEventListener("change", function (evt) {
                task(evt.target, tag);
            });
            label.appendChild(boundingBoxesRadio);
            label.appendChild(document.createTextNode(title));
            root.appendChild(label);
            root.appendChild(document.createElement("br"));
        };
        DebugLayer.prototype._generateDOMelements = function () {
            var _this = this;
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
                this._logSubsetDiv.innerHTML = BABYLON.Tools.LogCache;
                this._logDiv.appendChild(this._logSubsetDiv);
                BABYLON.Tools.OnNewCacheEntry = function (entry) {
                    _this._logSubsetDiv.innerHTML = entry + _this._logSubsetDiv.innerHTML;
                };
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
                this._generateCheckBox(this._optionsSubsetDiv, "Statistics", this._displayStatistics, function (element) { _this._displayStatistics = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Logs", this._displayLogs, function (element) { _this._displayLogs = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Meshes tree", this._displayTree, function (element) {
                    _this._displayTree = element.checked;
                    _this._needToRefreshMeshesTree = true;
                });
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>General:</b>", this.accentColor);
                this._generateCheckBox(this._optionsSubsetDiv, "Bounding boxes", this._scene.forceShowBoundingBoxes, function (element) { _this._scene.forceShowBoundingBoxes = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Clickable labels", this._labelsEnabled, function (element) {
                    _this._labelsEnabled = element.checked;
                    if (!_this._labelsEnabled) {
                        _this._clearLabels();
                    }
                });
                this._generateCheckBox(this._optionsSubsetDiv, "Generate user marks (F12)", BABYLON.Tools.PerformanceLogLevel === BABYLON.Tools.PerformanceUserMarkLogLevel, function (element) {
                    if (element.checked) {
                        BABYLON.Tools.PerformanceLogLevel = BABYLON.Tools.PerformanceUserMarkLogLevel;
                    }
                    else {
                        BABYLON.Tools.PerformanceLogLevel = BABYLON.Tools.PerformanceNoneLogLevel;
                    }
                });
                ;
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>Rendering mode:</b>", this.accentColor);
                this._generateRadio(this._optionsSubsetDiv, "Solid", "renderMode", !this._scene.forceWireframe && !this._scene.forcePointsCloud, function (element) {
                    if (element.checked) {
                        _this._scene.forceWireframe = false;
                        _this._scene.forcePointsCloud = false;
                    }
                });
                this._generateRadio(this._optionsSubsetDiv, "Wireframe", "renderMode", this._scene.forceWireframe, function (element) {
                    if (element.checked) {
                        _this._scene.forceWireframe = true;
                        _this._scene.forcePointsCloud = false;
                    }
                });
                this._generateRadio(this._optionsSubsetDiv, "Point", "renderMode", this._scene.forcePointsCloud, function (element) {
                    if (element.checked) {
                        _this._scene.forceWireframe = false;
                        _this._scene.forcePointsCloud = true;
                    }
                });
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>Texture channels:</b>", this.accentColor);
                this._generateCheckBox(this._optionsSubsetDiv, "Diffuse", BABYLON.StandardMaterial.DiffuseTextureEnabled, function (element) { BABYLON.StandardMaterial.DiffuseTextureEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Ambient", BABYLON.StandardMaterial.AmbientTextureEnabled, function (element) { BABYLON.StandardMaterial.AmbientTextureEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Specular", BABYLON.StandardMaterial.SpecularTextureEnabled, function (element) { BABYLON.StandardMaterial.SpecularTextureEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Emissive", BABYLON.StandardMaterial.EmissiveTextureEnabled, function (element) { BABYLON.StandardMaterial.EmissiveTextureEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Bump", BABYLON.StandardMaterial.BumpTextureEnabled, function (element) { BABYLON.StandardMaterial.BumpTextureEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Opacity", BABYLON.StandardMaterial.OpacityTextureEnabled, function (element) { BABYLON.StandardMaterial.OpacityTextureEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Reflection", BABYLON.StandardMaterial.ReflectionTextureEnabled, function (element) { BABYLON.StandardMaterial.ReflectionTextureEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Refraction", BABYLON.StandardMaterial.RefractionTextureEnabled, function (element) { BABYLON.StandardMaterial.RefractionTextureEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Lightmap", BABYLON.StandardMaterial.LightmapTextureEnabled, function (element) { BABYLON.StandardMaterial.LightmapTextureEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Fresnel", BABYLON.StandardMaterial.FresnelEnabled, function (element) { BABYLON.StandardMaterial.FresnelEnabled = element.checked; });
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>Options:</b>", this.accentColor);
                this._generateCheckBox(this._optionsSubsetDiv, "Animations", this._scene.animationsEnabled, function (element) { _this._scene.animationsEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Collisions", this._scene.collisionsEnabled, function (element) { _this._scene.collisionsEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Fog", this._scene.fogEnabled, function (element) { _this._scene.fogEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Lens flares", this._scene.lensFlaresEnabled, function (element) { _this._scene.lensFlaresEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Lights", this._scene.lightsEnabled, function (element) { _this._scene.lightsEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Particles", this._scene.particlesEnabled, function (element) { _this._scene.particlesEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Post-processes", this._scene.postProcessesEnabled, function (element) { _this._scene.postProcessesEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Probes", this._scene.probesEnabled, function (element) { _this._scene.probesEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Procedural textures", this._scene.proceduralTexturesEnabled, function (element) { _this._scene.proceduralTexturesEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Render targets", this._scene.renderTargetsEnabled, function (element) { _this._scene.renderTargetsEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Shadows", this._scene.shadowsEnabled, function (element) { _this._scene.shadowsEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Skeletons", this._scene.skeletonsEnabled, function (element) { _this._scene.skeletonsEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Sprites", this._scene.spritesEnabled, function (element) { _this._scene.spritesEnabled = element.checked; });
                this._generateCheckBox(this._optionsSubsetDiv, "Textures", this._scene.texturesEnabled, function (element) { _this._scene.texturesEnabled = element.checked; });
                if (BABYLON.AudioEngine && BABYLON.Engine.audioEngine.canUseWebAudio) {
                    this._optionsSubsetDiv.appendChild(document.createElement("br"));
                    this._generateTexBox(this._optionsSubsetDiv, "<b>Audio:</b>", this.accentColor);
                    this._generateRadio(this._optionsSubsetDiv, "Headphones", "panningModel", this._scene.headphone, function (element) {
                        if (element.checked) {
                            _this._scene.headphone = true;
                        }
                    });
                    this._generateRadio(this._optionsSubsetDiv, "Normal Speakers", "panningModel", !this._scene.headphone, function (element) {
                        if (element.checked) {
                            _this._scene.headphone = false;
                        }
                    });
                    this._generateCheckBox(this._optionsSubsetDiv, "Disable audio", !this._scene.audioEnabled, function (element) {
                        _this._scene.audioEnabled = !element.checked;
                    });
                }
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>Viewers:</b>", this.accentColor);
                this._generateCheckBox(this._optionsSubsetDiv, "Skeletons", false, function (element) {
                    if (!element.checked) {
                        _this._clearSkeletonViewers();
                        return;
                    }
                    for (var index = 0; index < _this._scene.meshes.length; index++) {
                        var mesh = _this._scene.meshes[index];
                        if (mesh.skeleton) {
                            var found = false;
                            for (var sIndex = 0; sIndex < _this._skeletonViewers.length; sIndex++) {
                                if (_this._skeletonViewers[sIndex].skeleton === mesh.skeleton) {
                                    found = true;
                                    break;
                                }
                            }
                            if (found) {
                                continue;
                            }
                            var viewer = new BABYLON.Debug.SkeletonViewer(mesh.skeleton, mesh, _this._scene);
                            viewer.isEnabled = true;
                            _this._skeletonViewers.push(viewer);
                        }
                    }
                });
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._generateTexBox(this._optionsSubsetDiv, "<b>Tools:</b>", this.accentColor);
                this._generateButton(this._optionsSubsetDiv, "Dump rendertargets", function (element) { _this._scene.dumpNextRenderTargets = true; });
                this._generateButton(this._optionsSubsetDiv, "Run SceneOptimizer", function (element) { BABYLON.SceneOptimizer.OptimizeAsync(_this._scene); });
                this._generateButton(this._optionsSubsetDiv, "Log camera object", function (element) {
                    if (_this._camera) {
                        console.log(_this._camera);
                    }
                    else {
                        console.warn("No camera defined, or debug layer created before camera creation!");
                    }
                });
                this._optionsSubsetDiv.appendChild(document.createElement("br"));
                this._globalDiv.appendChild(this._statsDiv);
                this._globalDiv.appendChild(this._logDiv);
                this._globalDiv.appendChild(this._optionsDiv);
                this._globalDiv.appendChild(this._treeDiv);
            }
        };
        DebugLayer.prototype._displayStats = function () {
            var scene = this._scene;
            var engine = scene.getEngine();
            var glInfo = engine.getGlInfo();
            this._statsSubsetDiv.innerHTML = "Babylon.js v" + BABYLON.Engine.Version + " - <b>" + BABYLON.Tools.Format(engine.getFps(), 0) + " fps</b><br><br>"
                + "<div style='column-count: 2;-moz-column-count:2;-webkit-column-count:2'>"
                + "<b>Count</b><br>"
                + "Total meshes: " + scene.meshes.length + "<br>"
                + "Total vertices: " + scene.getTotalVertices() + "<br>"
                + "Total materials: " + scene.materials.length + "<br>"
                + "Total textures: " + scene.textures.length + "<br>"
                + "Active meshes: " + scene.getActiveMeshes().length + "<br>"
                + "Active indices: " + scene.getActiveIndices() + "<br>"
                + "Active bones: " + scene.getActiveBones() + "<br>"
                + "Active particles: " + scene.getActiveParticles() + "<br>"
                + "<b>Draw calls: " + engine.drawCalls + "</b><br><br><br>"
                + "<b>Duration</b><br>"
                + "Meshes selection:</i> " + BABYLON.Tools.Format(scene.getEvaluateActiveMeshesDuration()) + " ms<br>"
                + "Render Targets: " + BABYLON.Tools.Format(scene.getRenderTargetsDuration()) + " ms<br>"
                + "Particles: " + BABYLON.Tools.Format(scene.getParticlesDuration()) + " ms<br>"
                + "Sprites: " + BABYLON.Tools.Format(scene.getSpritesDuration()) + " ms<br><br>"
                + "Render: <b>" + BABYLON.Tools.Format(scene.getRenderDuration()) + " ms</b><br>"
                + "Frame: " + BABYLON.Tools.Format(scene.getLastFrameDuration()) + " ms<br>"
                + "Potential FPS: " + BABYLON.Tools.Format(1000.0 / scene.getLastFrameDuration(), 0) + "<br>"
                + "Resolution: " + engine.getRenderWidth() + "x" + engine.getRenderHeight() + "<br>"
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
        };
        return DebugLayer;
    })();
    BABYLON.DebugLayer = DebugLayer;
})(BABYLON || (BABYLON = {}));
