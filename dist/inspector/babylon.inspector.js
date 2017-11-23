var INSPECTOR;
(function (INSPECTOR) {
    var Inspector = (function () {
        /** The inspector is created with the given engine.
         * If the parameter 'popup' is false, the inspector is created as a right panel on the main window.
         * If the parameter 'popup' is true, the inspector is created in another popup.
         */
        function Inspector(scene, popup, initialTab, parentElement, newColors) {
            var _this = this;
            /** True if the inspector is built as a popup tab */
            this._popupMode = false;
            // Load GUI library if not already done
            if (!BABYLON.GUI) {
                BABYLON.Tools.LoadScript("https://preview.babylonjs.com/gui/babylon.gui.js", function () {
                    //Load properties of GUI objects now as BABYLON.GUI has to be declared before 
                    INSPECTOR.loadGUIProperties();
                }, function () {
                    console.warn("Please add script https://preview.babylonjs.com/gui/babylon.gui.js to the HTML file");
                });
            }
            else {
                //Load properties of GUI objects now as BABYLON.GUI has to be declared before 
                INSPECTOR.loadGUIProperties();
            }
            //get Tabbar initialTab
            this._initialTab = initialTab;
            //get parentElement of our Inspector
            this._parentElement = parentElement;
            // get canvas parent only if needed.
            this._scene = scene;
            // Save HTML document and window
            Inspector.DOCUMENT = window.document;
            Inspector.WINDOW = window;
            // POPUP MODE
            if (popup) {
                // Build the inspector in the given parent
                this.openPopup(true); // set to true in order to NOT dispose the inspector (done in openPopup), as it's not existing yet
            }
            else {
                // Get canvas and its DOM parent
                var canvas = this._scene.getEngine().getRenderingCanvas();
                var canvasParent = canvas.parentElement;
                var canvasParentComputedStyle = Inspector.WINDOW.getComputedStyle(canvasParent);
                // get canvas style                
                var canvasComputedStyle = Inspector.WINDOW.getComputedStyle(canvas);
                this._canvasStyle = {
                    width: INSPECTOR.Helpers.Css(canvas, 'width'),
                    height: INSPECTOR.Helpers.Css(canvas, 'height'),
                    position: canvasComputedStyle.position,
                    top: canvasComputedStyle.top,
                    bottom: canvasComputedStyle.bottom,
                    left: canvasComputedStyle.left,
                    right: canvasComputedStyle.right,
                    padding: canvasComputedStyle.padding,
                    paddingBottom: canvasComputedStyle.paddingBottom,
                    paddingLeft: canvasComputedStyle.paddingLeft,
                    paddingTop: canvasComputedStyle.paddingTop,
                    paddingRight: canvasComputedStyle.paddingRight,
                    margin: canvasComputedStyle.margin,
                    marginBottom: canvasComputedStyle.marginBottom,
                    marginLeft: canvasComputedStyle.marginLeft,
                    marginTop: canvasComputedStyle.marginTop,
                    marginRight: canvasComputedStyle.marginRight
                };
                if (this._parentElement) {
                    // Build the inspector wrapper
                    this._c2diwrapper = INSPECTOR.Helpers.CreateDiv('insp-wrapper', this._parentElement);
                    this._c2diwrapper.style.width = '100%';
                    this._c2diwrapper.style.height = '100%';
                    this._c2diwrapper.style.paddingLeft = '5px';
                    // add inspector     
                    var inspector = INSPECTOR.Helpers.CreateDiv('insp-right-panel', this._c2diwrapper);
                    inspector.style.width = '100%';
                    inspector.style.height = '100%';
                    // and build it in the popup  
                    this._buildInspector(inspector);
                }
                else {
                    // Create c2di wrapper
                    this._c2diwrapper = INSPECTOR.Helpers.CreateDiv('insp-wrapper');
                    // copy style from canvas to wrapper
                    for (var prop in this._canvasStyle) {
                        this._c2diwrapper.style[prop] = this._canvasStyle[prop];
                    }
                    // Convert wrapper size in % (because getComputedStyle returns px only)
                    var widthPx = parseFloat(canvasComputedStyle.width.substr(0, canvasComputedStyle.width.length - 2)) || 0;
                    var heightPx = parseFloat(canvasComputedStyle.height.substr(0, canvasComputedStyle.height.length - 2)) || 0;
                    // If the canvas position is absolute, restrain the wrapper width to the window width + left positionning
                    if (canvasComputedStyle.position === "absolute" || canvasComputedStyle.position === "relative") {
                        // compute only left as it takes predominance if right is also specified (and it will be for the wrapper)
                        var leftPx = parseFloat(canvasComputedStyle.left.substr(0, canvasComputedStyle.left.length - 2)) || 0;
                        if (widthPx + leftPx >= Inspector.WINDOW.innerWidth) {
                            this._c2diwrapper.style.maxWidth = widthPx - leftPx + "px";
                        }
                    }
                    // Check if the parent of the canvas is the body page. If yes, the size ratio is computed
                    var parent_1 = this._getRelativeParent(canvas);
                    var parentWidthPx = parent_1.clientWidth;
                    var parentHeightPx = parent_1.clientHeight;
                    var pWidth = widthPx / parentWidthPx * 100;
                    var pheight = heightPx / parentHeightPx * 100;
                    this._c2diwrapper.style.width = pWidth + "%";
                    this._c2diwrapper.style.height = pheight + "%";
                    // reset canvas style
                    canvas.style.position = "static";
                    canvas.style.width = "100%";
                    canvas.style.height = "100%";
                    canvas.style.paddingBottom = "0";
                    canvas.style.paddingLeft = "0";
                    canvas.style.paddingTop = "0";
                    canvas.style.paddingRight = "0";
                    canvas.style.margin = "0";
                    canvas.style.marginBottom = "0";
                    canvas.style.marginLeft = "0";
                    canvas.style.marginTop = "0";
                    canvas.style.marginRight = "0";
                    // Replace canvas with the wrapper...
                    canvasParent.replaceChild(this._c2diwrapper, canvas);
                    // ... and add canvas to the wrapper
                    this._c2diwrapper.appendChild(canvas);
                    // add inspector
                    var inspector = INSPECTOR.Helpers.CreateDiv('insp-right-panel', this._c2diwrapper);
                    // Add split bar
                    if (!this._parentElement) {
                        Split([canvas, inspector], {
                            direction: 'horizontal',
                            sizes: [75, 25],
                            onDrag: function () {
                                INSPECTOR.Helpers.SEND_EVENT('resize');
                                if (_this._tabbar) {
                                    _this._tabbar.updateWidth();
                                }
                            }
                        });
                    }
                    // Build the inspector
                    this._buildInspector(inspector);
                }
                // Send resize event to the window
                INSPECTOR.Helpers.SEND_EVENT('resize');
                this._tabbar.updateWidth();
            }
            // Refresh the inspector if the browser is not edge
            if (!INSPECTOR.Helpers.IsBrowserEdge()) {
                this.refresh();
            }
            // Check custom css colors
            if (newColors) {
                var bColor = newColors.backgroundColor || '#242424';
                var bColorl1 = newColors.backgroundColorLighter || '#2c2c2c';
                var bColorl2 = newColors.backgroundColorLighter2 || '#383838';
                var bColorl3 = newColors.backgroundColorLighter3 || '#454545';
                var color = newColors.color || '#ccc';
                var colorTop = newColors.colorTop || '#f29766';
                var colorBot = newColors.colorBot || '#5db0d7';
                var styles = Inspector.DOCUMENT.querySelectorAll('style');
                for (var s = 0; s < styles.length; s++) {
                    var style = styles[s];
                    if (style.innerHTML.indexOf('insp-wrapper') != -1) {
                        styles[s].innerHTML = styles[s].innerHTML
                            .replace(/#242424/g, bColor) // background color
                            .replace(/#2c2c2c/g, bColorl1) // background-lighter
                            .replace(/#383838/g, bColorl2) // background-lighter2
                            .replace(/#454545/g, bColorl3) // background-lighter3
                            .replace(/#ccc/g, color) // color
                            .replace(/#f29766/g, colorTop) // color-top
                            .replace(/#5db0d7/g, colorBot); // color-bot
                    }
                }
            }
        }
        /**
         * If the given element has a position 'asbolute' or 'relative',
         * returns the first parent of the given element that has a position 'relative' or 'absolute'.
         * If the given element has no position, returns the first parent
         *
         */
        Inspector.prototype._getRelativeParent = function (elem, lookForAbsoluteOrRelative) {
            // If the elem has no parent, returns himself
            if (!elem.parentElement) {
                return elem;
            }
            var computedStyle = Inspector.WINDOW.getComputedStyle(elem);
            // looking for the first element absolute or relative
            if (lookForAbsoluteOrRelative) {
                // if found, return this one
                if (computedStyle.position === "relative" || computedStyle.position === "absolute") {
                    return elem;
                }
                else {
                    // otherwise keep looking
                    return this._getRelativeParent(elem.parentElement, true);
                }
            }
            else {
                if (computedStyle.position == "static") {
                    return elem.parentElement;
                }
                else {
                    // the elem has a position relative or absolute, look for the closest relative/absolute parent
                    return this._getRelativeParent(elem.parentElement, true);
                }
            }
        };
        /** Build the inspector panel in the given HTML element */
        Inspector.prototype._buildInspector = function (parent) {
            // tabbar
            this._tabbar = new INSPECTOR.TabBar(this, this._initialTab);
            // Top panel
            this._topPanel = INSPECTOR.Helpers.CreateDiv('top-panel', parent);
            // Add tabbar
            this._topPanel.appendChild(this._tabbar.toHtml());
            this._tabbar.updateWidth();
            // Tab panel
            this._tabPanel = INSPECTOR.Helpers.CreateDiv('tab-panel-content', this._topPanel);
        };
        Object.defineProperty(Inspector.prototype, "scene", {
            get: function () {
                return this._scene;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Inspector.prototype, "popupMode", {
            get: function () {
                return this._popupMode;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Filter the list of item present in the tree.
         * All item returned should have the given filter contained in the item id.
        */
        Inspector.prototype.filterItem = function (filter) {
            this._tabbar.getActiveTab().filter(filter);
        };
        /** Display the mesh tab on the given object */
        Inspector.prototype.displayObjectDetails = function (mesh) {
            this._tabbar.switchMeshTab(mesh);
        };
        /** Clean the whole tree of item and rebuilds it */
        Inspector.prototype.refresh = function () {
            // Clean top panel
            INSPECTOR.Helpers.CleanDiv(this._tabPanel);
            // Get the active tab and its items
            var activeTab = this._tabbar.getActiveTab();
            activeTab.update();
            this._tabPanel.appendChild(activeTab.getPanel());
            INSPECTOR.Helpers.SEND_EVENT('resize');
        };
        /** Remove the inspector panel when it's built as a right panel:
         * remove the right panel and remove the wrapper
         */
        Inspector.prototype.dispose = function () {
            if (!this._popupMode) {
                this._tabbar.getActiveTab().dispose();
                // Get canvas
                var canvas = this._scene.getEngine().getRenderingCanvas();
                // restore canvas style
                for (var prop in this._canvasStyle) {
                    canvas.style[prop] = this._canvasStyle[prop];
                }
                // Get parent of the wrapper 
                var canvasParent = canvas.parentElement.parentElement;
                canvasParent.insertBefore(canvas, this._c2diwrapper);
                // Remove wrapper
                INSPECTOR.Helpers.CleanDiv(this._c2diwrapper);
                this._c2diwrapper.remove();
                // Send resize event to the window
                INSPECTOR.Helpers.SEND_EVENT('resize');
            }
        };
        /** Open the inspector in a new popup
         * Set 'firstTime' to true if there is no inspector created beforehands
         */
        Inspector.prototype.openPopup = function (firstTime) {
            var _this = this;
            if (INSPECTOR.Helpers.IsBrowserEdge()) {
                console.warn('Inspector - Popup mode is disabled in Edge, as the popup DOM cannot be updated from the main window for security reasons');
            }
            else {
                // Create popup
                var popup = window.open('', 'Babylon.js INSPECTOR', 'toolbar=no,resizable=yes,menubar=no,width=750,height=1000');
                popup.document.title = 'Babylon.js INSPECTOR';
                // Get the inspector style      
                var styles = Inspector.DOCUMENT.querySelectorAll('style');
                for (var s = 0; s < styles.length; s++) {
                    popup.document.body.appendChild(styles[s].cloneNode(true));
                }
                var links = document.querySelectorAll('link');
                for (var l = 0; l < links.length; l++) {
                    var link = popup.document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = links[l].href;
                    popup.document.head.appendChild(link);
                }
                // Dispose the right panel if existing
                if (!firstTime) {
                    this.dispose();
                }
                // set the mode as popup
                this._popupMode = true;
                // Save the HTML document
                Inspector.DOCUMENT = popup.document;
                Inspector.WINDOW = popup;
                // Build the inspector wrapper
                this._c2diwrapper = INSPECTOR.Helpers.CreateDiv('insp-wrapper', popup.document.body);
                // add inspector     
                var inspector = INSPECTOR.Helpers.CreateDiv('insp-right-panel', this._c2diwrapper);
                inspector.classList.add('popupmode');
                // and build it in the popup  
                this._buildInspector(inspector);
                // Rebuild it
                this.refresh();
                popup.addEventListener('resize', function () {
                    if (_this._tabbar) {
                        _this._tabbar.updateWidth();
                    }
                });
            }
        };
        Inspector.prototype.getActiveTabIndex = function () {
            return this._tabbar.getActiveTabIndex();
        };
        return Inspector;
    }());
    INSPECTOR.Inspector = Inspector;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=Inspector.js.map

var INSPECTOR;
(function (INSPECTOR) {
    INSPECTOR.PROPERTIES = {
        /** Format the given object :
         * If a format function exists, returns the result of this function.
         * If this function doesn't exists, return the object type instead */
        format: function (obj) {
            var type = INSPECTOR.Helpers.GET_TYPE(obj) || 'type_not_defined';
            if (INSPECTOR.PROPERTIES[type] && INSPECTOR.PROPERTIES[type].format) {
                return INSPECTOR.PROPERTIES[type].format(obj);
            }
            else {
                return INSPECTOR.Helpers.GET_TYPE(obj);
            }
        },
        'type_not_defined': {
            properties: [],
            format: function () { return ''; }
        },
        'Vector2': {
            type: BABYLON.Vector2,
            properties: ['x', 'y'],
            format: function (vec) { return "x:" + INSPECTOR.Helpers.Trunc(vec.x) + ", y:" + INSPECTOR.Helpers.Trunc(vec.y); }
        },
        'Vector3': {
            type: BABYLON.Vector3,
            properties: ['x', 'y', 'z'],
            format: function (vec) { return "x:" + INSPECTOR.Helpers.Trunc(vec.x) + ", y:" + INSPECTOR.Helpers.Trunc(vec.y) + ", z:" + INSPECTOR.Helpers.Trunc(vec.z); }
        },
        'Color3': {
            type: BABYLON.Color3,
            properties: ['r', 'g', 'b'],
            format: function (color) { return "R:" + color.r + ", G:" + color.g + ", B:" + color.b; }
        },
        'Quaternion': {
            type: BABYLON.Quaternion,
            properties: ['x', 'y', 'z', 'w']
        },
        'Size': {
            type: BABYLON.Size,
            properties: ['width', 'height'],
            format: function (size) { return "Size - w:" + INSPECTOR.Helpers.Trunc(size.width) + ", h:" + INSPECTOR.Helpers.Trunc(size.height); }
        },
        'Texture': {
            type: BABYLON.Texture,
            properties: [
                'hasAlpha',
                'level',
                'name',
                'wrapU',
                'wrapV',
                'uScale',
                'vScale',
                'uAng',
                'vAng',
                'wAng',
                'uOffset',
                'vOffset'
            ],
            format: function (tex) { return tex.name; }
        },
        'MapTexture': {
            type: BABYLON.MapTexture
        },
        'RenderTargetTexture': {
            type: BABYLON.RenderTargetTexture
        },
        'DynamicTexture': {
            type: BABYLON.DynamicTexture
        },
        'BaseTexture': {
            type: BABYLON.BaseTexture
        },
        'FontTexture': {
            type: BABYLON.FontTexture
        },
        'Sound': {
            type: BABYLON.Sound,
            properties: [
                'name',
                'autoplay',
                'loop',
                'useCustomAttenuation',
                'soundTrackId',
                'spatialSound',
                'refDistance',
                'rolloffFactor',
                'maxDistance',
                'distanceModel',
                'isPlaying',
                'isPaused'
            ]
        },
        'ArcRotateCamera': {
            type: BABYLON.ArcRotateCamera,
            properties: [
                'position',
                'alpha',
                'beta',
                'radius',
                'angularSensibilityX',
                'angularSensibilityY',
                'target',
                'lowerAlphaLimit',
                'lowerBetaLimit',
                'upperAlphaLimit',
                'upperBetaLimit',
                'lowerRadiusLimit',
                'upperRadiusLimit',
                'pinchPrecision',
                'wheelPrecision',
                'allowUpsideDown',
                'checkCollisions'
            ]
        },
        'FreeCamera': {
            type: BABYLON.FreeCamera,
            properties: [
                'position',
                'rotation',
                'rotationQuaternion',
                'cameraDirection',
                'cameraRotation',
                'ellipsoid',
                'applyGravity',
                'angularSensibility',
                'keysUp',
                'keysDown',
                'keysLeft',
                'keysRight',
                'checkCollisions',
                'speed',
                'lockedTarget',
                'noRotationConstraint',
                'fov',
                'inertia',
                'minZ', 'maxZ',
                'layerMask',
                'mode',
                'orthoBottom',
                'orthoTop',
                'orthoLeft',
                'orthoRight'
            ]
        },
        'Scene': {
            type: BABYLON.Scene,
            properties: [
                'actionManager',
                'activeCamera',
                'ambientColor',
                'clearColor',
                'forceWireframe',
                'forcePointsCloud',
                'forceShowBoundingBoxes',
                'useRightHandedSystem',
                'hoverCursor',
                'cameraToUseForPointers',
                'fogEnabled',
                'fogColor',
                'fogDensity',
                'fogStart',
                'fogEnd',
                'shadowsEnabled',
                'lightsEnabled',
                'collisionsEnabled',
                'gravity',
                'meshUnderPointer',
                'pointerX',
                'pointerY',
                'uid'
            ]
        },
        'Mesh': {
            type: BABYLON.Mesh,
            properties: [
                'name',
                'position',
                'rotation',
                'rotationQuaternion',
                'absolutePosition',
                'material',
                'actionManager',
                'visibility',
                'isVisible',
                'isPickable',
                'renderingGroupId',
                'receiveShadows',
                'renderOutline',
                'outlineColor',
                'outlineWidth',
                'renderOverlay',
                'overlayColor',
                'overlayAlpha',
                'hasVertexAlpha',
                'useVertexColors',
                'layerMask',
                'alwaysSelectAsActiveMesh',
                'ellipsoid',
                'ellipsoidOffset',
                'edgesWidth',
                'edgesColor',
                'checkCollisions',
                'hasLODLevels'
            ],
            format: function (m) { return m.name; }
        },
        'StandardMaterial': {
            type: BABYLON.StandardMaterial,
            properties: [
                'name',
                'alpha',
                'alphaMode',
                'wireframe',
                'isFrozen',
                'zOffset',
                'ambientColor',
                'emissiveColor',
                'diffuseColor',
                'specularColor',
                'specularPower',
                'useAlphaFromDiffuseTexture',
                'linkEmissiveWithDiffuse',
                'useSpecularOverAlpha',
                'diffuseFresnelParameters',
                'opacityFresnelParameters',
                'reflectionFresnelParameters',
                'refractionFresnelParameters',
                'emissiveFresnelParameters',
                'diffuseTexture',
                'emissiveTexture',
                'specularTexture',
                'ambientTexture',
                'bumpTexture',
                'lightMapTexture',
                'opacityTexture',
                'reflectionTexture',
                'refractionTexture'
            ],
            format: function (mat) { return mat.name; }
        },
        'PrimitiveAlignment': {
            type: BABYLON.PrimitiveAlignment,
            properties: ['horizontal', 'vertical']
        },
        'PrimitiveThickness': {
            type: BABYLON.PrimitiveThickness,
            properties: ['topPixels', 'leftPixels', 'rightPixels', 'bottomPixels']
        },
        'BoundingInfo2D': {
            type: BABYLON.BoundingInfo2D,
            properties: ['radius', 'center', 'extent']
        },
        'SolidColorBrush2D': {
            type: BABYLON.SolidColorBrush2D,
            properties: ['color']
        },
        'GradientColorBrush2D': {
            type: BABYLON.GradientColorBrush2D,
            properties: ['color1', 'color2', 'translation', 'rotation', 'scale']
        },
        'PBRMaterial': {
            type: BABYLON.PBRMaterial,
            properties: [
                'name',
                'albedoColor',
                'albedoTexture',
                'opacityTexture',
                'reflectionTexture',
                'emissiveTexture',
                'bumpTexture',
                'lightmapTexture',
                'opacityFresnelParameters',
                'emissiveFresnelParameters',
                'linkEmissiveWithAlbedo',
                'useLightmapAsShadowmap',
                'useAlphaFromAlbedoTexture',
                'useSpecularOverAlpha',
                'useAutoMicroSurfaceFromReflectivityMap',
                'useLogarithmicDepth',
                'reflectivityColor',
                'reflectivityTexture',
                'reflectionTexture',
                'reflectionColor',
                'alpha',
                'linkRefractionWithTransparency',
                'indexOfRefraction',
                'microSurface',
                'useMicroSurfaceFromReflectivityMapAlpha',
                'directIntensity',
                'emissiveIntensity',
                'specularIntensity',
                'environmentIntensity',
                'cameraExposure',
                'cameraContrast',
                'cameraColorGradingTexture',
                'cameraColorCurves'
            ]
        },
        'Canvas2D': {
            type: BABYLON.Canvas2D
        },
        'Canvas2DEngineBoundData': {
            type: BABYLON.Canvas2DEngineBoundData
        },
        'Ellipse2D': {
            type: BABYLON.Ellipse2D
        },
        'Ellipse2DInstanceData': {
            type: BABYLON.Ellipse2DInstanceData
        },
        'Ellipse2DRenderCache': {
            type: BABYLON.Ellipse2DRenderCache
        },
        'Group2D': {
            type: BABYLON.Group2D
        },
        'IntersectInfo2D': {
            type: BABYLON.IntersectInfo2D
        },
        'Lines2D': {
            type: BABYLON.Lines2D
        },
        'Lines2DInstanceData': {
            type: BABYLON.Lines2DInstanceData
        },
        'Lines2DRenderCache': {
            type: BABYLON.Lines2DRenderCache
        },
        'PrepareRender2DContext': {
            type: BABYLON.PrepareRender2DContext
        },
        'Prim2DBase': {
            type: BABYLON.Prim2DBase
        },
        'Prim2DClassInfo': {
            type: BABYLON.Prim2DClassInfo
        },
        'Prim2DPropInfo': {
            type: BABYLON.Prim2DPropInfo
        },
        'Rectangle2D': {
            type: BABYLON.Rectangle2D
        },
        'Rectangle2DInstanceData': {
            type: BABYLON.Rectangle2DInstanceData
        },
        'Rectangle2DRenderCache': {
            type: BABYLON.Rectangle2DRenderCache
        },
        'Render2DContext': {
            type: BABYLON.Render2DContext
        },
        'RenderablePrim2D': {
            type: BABYLON.RenderablePrim2D
        },
        'ScreenSpaceCanvas2D': {
            type: BABYLON.ScreenSpaceCanvas2D
        },
        'Shape2D': {
            type: BABYLON.Shape2D
        },
        'Shape2DInstanceData': {
            type: BABYLON.Shape2DInstanceData
        },
        'Sprite2D': {
            type: BABYLON.Sprite2D
        },
        'Sprite2DInstanceData': {
            type: BABYLON.Sprite2DInstanceData
        },
        'Sprite2DRenderCache': {
            type: BABYLON.Sprite2DRenderCache
        },
        'Text2D': {
            type: BABYLON.Text2D
        },
        'Text2DInstanceData': {
            type: BABYLON.Text2DInstanceData
        },
        'Text2DRenderCache': {
            type: BABYLON.Text2DRenderCache
        },
        'WorldSpaceCanvas2D': {
            type: BABYLON.WorldSpaceCanvas2D
        },
        'WorldSpaceCanvas2DNode': {
            type: BABYLON.WorldSpaceCanvas2DNode
        },
        'PhysicsImpostor': {
            type: BABYLON.PhysicsImpostor,
            properties: [
                'friction',
                'mass',
                'restitution',
            ]
        },
    };
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=properties.js.map

var INSPECTOR;
(function (INSPECTOR) {
    /**
     * Function that add gui objects properties to the variable PROPERTIES
     */
    function loadGUIProperties() {
        var PROPERTIES_GUI = {
            'ValueAndUnit': {
                type: BABYLON.GUI.ValueAndUnit,
                properties: ['_value', 'unit'],
                format: function (valueAndUnit) { return valueAndUnit; }
            },
            'Control': {
                type: BABYLON.GUI.Control,
                properties: [
                    '_alpha',
                    '_fontFamily',
                    '_color',
                    '_scaleX',
                    '_scaleY',
                    '_rotation',
                    '_currentMeasure',
                    '_width',
                    '_height',
                    '_left',
                    '_top',
                    '_linkedMesh',
                    'isHitTestVisible',
                    'isPointerBlocker',
                ],
                format: function (control) { return control.name; }
            },
            'Button': {
                type: BABYLON.GUI.Button,
                properties: [],
                format: function (button) { return button.name; }
            },
            'ColorPicker': {
                type: BABYLON.GUI.ColorPicker,
                properties: ['_value'],
                format: function (colorPicker) { return colorPicker.name; }
            },
            'Checkbox': {
                type: BABYLON.GUI.Checkbox,
                properties: ['_isChecked', '_background'],
                format: function (checkbox) { return checkbox.name; }
            },
            'Ellipse': {
                type: BABYLON.GUI.Ellipse,
                properties: ['_thickness'],
                format: function (ellipse) { return ellipse.name; }
            },
            'Image': {
                type: BABYLON.GUI.Image,
                properties: [
                    '_imageWidth',
                    '_imageHeight',
                    '_loaded',
                    '_source',
                ],
                format: function (image) { return image.name; }
            },
            'Line': {
                type: BABYLON.GUI.Line,
                properties: ['_lineWidth',
                    '_background',
                    '_x1',
                    '_y1',
                    '_x2',
                    '_y2',
                ],
                format: function (line) { return line.name; }
            },
            'RadioButton': {
                type: BABYLON.GUI.RadioButton,
                properties: ['_isChecked', '_background'],
                format: function (radioButton) { return radioButton.name; }
            },
            'Rectangle': {
                type: BABYLON.GUI.Rectangle,
                properties: ['_thickness', '_cornerRadius'],
                format: function (rectangle) { return rectangle.name; }
            },
            'Slider': {
                type: BABYLON.GUI.Slider,
                properties: [
                    '_minimum',
                    '_maximum',
                    '_value',
                    '_background',
                    '_borderColor',
                ],
                format: function (slider) { return slider.name; }
            },
            'StackPanel': {
                type: BABYLON.GUI.StackPanel,
                properties: ['_isVertical'],
                format: function (stackPanel) { return stackPanel.name; }
            },
            'TextBlock': {
                type: BABYLON.GUI.TextBlock,
                properties: ['_text', '_textWrapping'],
                format: function (textBlock) { return textBlock.name; }
            },
            'Container': {
                type: BABYLON.GUI.Container,
                properties: ['_background'],
                format: function (container) { return container.name; }
            },
        };
        for (var prop in PROPERTIES_GUI) {
            INSPECTOR.PROPERTIES[prop] = PROPERTIES_GUI[prop];
        }
    }
    INSPECTOR.loadGUIProperties = loadGUIProperties;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=properties_gui.js.map

var INSPECTOR;
(function (INSPECTOR) {
    /**
     * Represents a html div element.
     * The div is built when an instance of BasicElement is created.
     */
    var BasicElement = (function () {
        function BasicElement() {
            this._div = INSPECTOR.Helpers.CreateDiv();
        }
        /**
         * Returns the div element
         */
        BasicElement.prototype.toHtml = function () {
            return this._div;
        };
        /**
         * Build the html element
         */
        BasicElement.prototype._build = function () { };
        ;
        /** Default dispose method if needed */
        BasicElement.prototype.dispose = function () { };
        ;
        return BasicElement;
    }());
    INSPECTOR.BasicElement = BasicElement;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=BasicElement.js.map

var INSPECTOR;
(function (INSPECTOR) {
    var Adapter = (function () {
        function Adapter(obj) {
            this._obj = obj;
        }
        Object.defineProperty(Adapter.prototype, "actualObject", {
            /** Returns the actual object behind this adapter */
            get: function () {
                return this._obj;
            },
            enumerable: true,
            configurable: true
        });
        /** Returns true if the given object correspond to this  */
        Adapter.prototype.correspondsTo = function (obj) {
            return obj === this._obj;
        };
        Object.defineProperty(Adapter.prototype, "name", {
            /** Returns the adapter unique name */
            get: function () {
                return Adapter._name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Adapter.prototype, "object", {
            /**
             * Returns the actual object used for this adapter
             */
            get: function () {
                return this._obj;
            },
            enumerable: true,
            configurable: true
        });
        /** Should be overriden in subclasses */
        Adapter.prototype.highlight = function (b) { };
        ;
        return Adapter;
    }());
    // a unique name for this adapter, to retrieve its own key in the local storage
    Adapter._name = BABYLON.Geometry.RandomId();
    INSPECTOR.Adapter = Adapter;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=Adapter.js.map

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var CameraAdapter = (function (_super) {
        __extends(CameraAdapter, _super);
        function CameraAdapter(obj) {
            return _super.call(this, obj) || this;
        }
        /** Returns the name displayed in the tree */
        CameraAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        CameraAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        CameraAdapter.prototype.getProperties = function () {
            var propertiesLines = [];
            var camToDisplay = [];
            // The if is there to work with the min version of babylon
            if (this._obj instanceof BABYLON.ArcRotateCamera) {
                camToDisplay = INSPECTOR.PROPERTIES['ArcRotateCamera'].properties;
            }
            else if (this._obj instanceof BABYLON.FreeCamera) {
                camToDisplay = INSPECTOR.PROPERTIES['FreeCamera'].properties;
            }
            for (var _i = 0, camToDisplay_1 = camToDisplay; _i < camToDisplay_1.length; _i++) {
                var dirty = camToDisplay_1[_i];
                var infos = new INSPECTOR.Property(dirty, this._obj);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            return propertiesLines;
        };
        CameraAdapter.prototype.getTools = function () {
            var tools = [];
            // tools.push(new Checkbox(this));
            tools.push(new INSPECTOR.CameraPOV(this));
            return tools;
        };
        CameraAdapter.prototype.setPOV = function () {
            this._obj.getScene().activeCamera = this._obj;
        };
        return CameraAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.CameraAdapter = CameraAdapter;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=CameraAdapter.js.map

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var PhysicsImpostorAdapter = (function (_super) {
        __extends(PhysicsImpostorAdapter, _super);
        function PhysicsImpostorAdapter(obj, viewer) {
            var _this = _super.call(this, obj) || this;
            _this._isVisible = false;
            _this._viewer = viewer;
            return _this;
        }
        /** Returns the name displayed in the tree */
        PhysicsImpostorAdapter.prototype.id = function () {
            var str = '';
            var physicsImposter = this._obj;
            if (physicsImposter && physicsImposter.object) {
                str = physicsImposter.object.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        PhysicsImpostorAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        PhysicsImpostorAdapter.prototype.getProperties = function () {
            var propertiesLines = [];
            for (var _i = 0, _a = INSPECTOR.PROPERTIES['PhysicsImpostor'].properties; _i < _a.length; _i++) {
                var dirty = _a[_i];
                var infos = new INSPECTOR.Property(dirty, this._obj);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            return propertiesLines;
        };
        PhysicsImpostorAdapter.prototype.getTools = function () {
            var tools = [];
            tools.push(new INSPECTOR.Checkbox(this));
            return tools;
        };
        PhysicsImpostorAdapter.prototype.setVisible = function (b) {
            this._isVisible = b;
            if (b) {
                this._viewer.showImpostor(this._obj);
            }
            else {
                this._viewer.hideImpostor(this._obj);
            }
        };
        PhysicsImpostorAdapter.prototype.isVisible = function () {
            return this._isVisible;
        };
        return PhysicsImpostorAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.PhysicsImpostorAdapter = PhysicsImpostorAdapter;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=PhysicsImpostorAdapter.js.map

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var GUIAdapter = (function (_super) {
        __extends(GUIAdapter, _super);
        function GUIAdapter(obj) {
            return _super.call(this, obj) || this;
        }
        /** Returns the name displayed in the tree */
        GUIAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        GUIAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        GUIAdapter.prototype.getProperties = function () {
            var propertiesLines = [];
            for (var _i = 0, _a = INSPECTOR.PROPERTIES['Control'].properties; _i < _a.length; _i++) {
                var dirty = _a[_i];
                var infos = new INSPECTOR.Property(dirty, this._obj);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            if (this._obj instanceof BABYLON.GUI.Button) {
                for (var _b = 0, _c = INSPECTOR.PROPERTIES['Button'].properties; _b < _c.length; _b++) {
                    var dirty = _c[_b];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.ColorPicker) {
                for (var _d = 0, _e = INSPECTOR.PROPERTIES['ColorPicker'].properties; _d < _e.length; _d++) {
                    var dirty = _e[_d];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.Checkbox) {
                for (var _f = 0, _g = INSPECTOR.PROPERTIES['Checkbox'].properties; _f < _g.length; _f++) {
                    var dirty = _g[_f];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.Ellipse) {
                for (var _h = 0, _j = INSPECTOR.PROPERTIES['Ellipse'].properties; _h < _j.length; _h++) {
                    var dirty = _j[_h];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.Image) {
                for (var _k = 0, _l = INSPECTOR.PROPERTIES['Image'].properties; _k < _l.length; _k++) {
                    var dirty = _l[_k];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.Line) {
                for (var _m = 0, _o = INSPECTOR.PROPERTIES['Line'].properties; _m < _o.length; _m++) {
                    var dirty = _o[_m];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.RadioButton) {
                for (var _p = 0, _q = INSPECTOR.PROPERTIES['RadioButton'].properties; _p < _q.length; _p++) {
                    var dirty = _q[_p];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.Rectangle) {
                for (var _r = 0, _s = INSPECTOR.PROPERTIES['Rectangle'].properties; _r < _s.length; _r++) {
                    var dirty = _s[_r];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.Slider) {
                for (var _t = 0, _u = INSPECTOR.PROPERTIES['Slider'].properties; _t < _u.length; _t++) {
                    var dirty = _u[_t];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.StackPanel) {
                for (var _v = 0, _w = INSPECTOR.PROPERTIES['StackPanel'].properties; _v < _w.length; _v++) {
                    var dirty = _w[_v];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.TextBlock) {
                for (var _x = 0, _y = INSPECTOR.PROPERTIES['TextBlock'].properties; _x < _y.length; _x++) {
                    var dirty = _y[_x];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            if (this._obj instanceof BABYLON.GUI.Container) {
                for (var _z = 0, _0 = INSPECTOR.PROPERTIES['Container'].properties; _z < _0.length; _z++) {
                    var dirty = _0[_z];
                    var infos = new INSPECTOR.Property(dirty, this._obj);
                    propertiesLines.push(new INSPECTOR.PropertyLine(infos));
                }
            }
            return propertiesLines;
        };
        GUIAdapter.prototype.getTools = function () {
            var tools = [];
            tools.push(new INSPECTOR.Checkbox(this));
            return tools;
        };
        GUIAdapter.prototype.setVisible = function (b) {
            this._obj.isVisible = b;
        };
        GUIAdapter.prototype.isVisible = function () {
            return this._obj.isVisible;
        };
        return GUIAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.GUIAdapter = GUIAdapter;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=GUIAdapter.js.map

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var SoundAdapter = (function (_super) {
        __extends(SoundAdapter, _super);
        function SoundAdapter(obj) {
            return _super.call(this, obj) || this;
        }
        /** Returns the name displayed in the tree */
        SoundAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        SoundAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        SoundAdapter.prototype.getProperties = function () {
            var propertiesLines = [];
            var camToDisplay = [];
            // The if is there to work with the min version of babylon
            var soundProperties = INSPECTOR.PROPERTIES['Sound'].properties;
            for (var _i = 0, soundProperties_1 = soundProperties; _i < soundProperties_1.length; _i++) {
                var dirty = soundProperties_1[_i];
                var infos = new INSPECTOR.Property(dirty, this._obj);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            return propertiesLines;
        };
        SoundAdapter.prototype.getTools = function () {
            var tools = [];
            tools.push(new INSPECTOR.SoundInteractions(this));
            return tools;
        };
        SoundAdapter.prototype.setPlaying = function (callback) {
            if (this._obj.isPlaying) {
                this._obj.pause();
            }
            else {
                this._obj.play();
            }
            this._obj.onended = function () {
                callback();
            };
        };
        return SoundAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.SoundAdapter = SoundAdapter;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=SoundAdapter.js.map

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var TextureAdapter = (function (_super) {
        __extends(TextureAdapter, _super);
        function TextureAdapter(obj) {
            return _super.call(this, obj) || this;
        }
        /** Returns the name displayed in the tree */
        TextureAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        TextureAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        TextureAdapter.prototype.getProperties = function () {
            // Not used in this tab
            return [];
        };
        TextureAdapter.prototype.getTools = function () {
            var tools = [];
            // tools.push(new CameraPOV(this));
            return tools;
        };
        return TextureAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.TextureAdapter = TextureAdapter;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=TextureAdapter.js.map

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var LightAdapter = (function (_super) {
        __extends(LightAdapter, _super);
        function LightAdapter(obj) {
            return _super.call(this, obj) || this;
        }
        /** Returns the name displayed in the tree */
        LightAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        LightAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        LightAdapter.prototype.getProperties = function () {
            var propertiesLines = [];
            for (var _i = 0, _a = LightAdapter._PROPERTIES; _i < _a.length; _i++) {
                var dirty = _a[_i];
                var infos = new INSPECTOR.Property(dirty, this._obj);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            return propertiesLines;
        };
        LightAdapter.prototype.getTools = function () {
            var tools = [];
            tools.push(new INSPECTOR.Checkbox(this));
            return tools;
        };
        LightAdapter.prototype.setVisible = function (b) {
            this._obj.setEnabled(b);
        };
        LightAdapter.prototype.isVisible = function () {
            return this._obj.isEnabled();
        };
        /** Returns some information about this mesh */
        // public getInfo() : string {
        //     return `${(this._obj as BABYLON.AbstractMesh).getTotalVertices()} vertices`;
        // }
        /** Overrides super.highlight */
        LightAdapter.prototype.highlight = function (b) {
            this.actualObject.renderOutline = b;
            this.actualObject.outlineWidth = 0.25;
            this.actualObject.outlineColor = BABYLON.Color3.Yellow();
        };
        return LightAdapter;
    }(INSPECTOR.Adapter));
    LightAdapter._PROPERTIES = [
        'position',
        'diffuse',
        'intensity',
        'radius',
        'range',
        'specular'
    ];
    INSPECTOR.LightAdapter = LightAdapter;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=LightAdapter.js.map

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var MaterialAdapter = (function (_super) {
        __extends(MaterialAdapter, _super);
        function MaterialAdapter(obj) {
            return _super.call(this, obj) || this;
        }
        /** Returns the name displayed in the tree */
        MaterialAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        MaterialAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        MaterialAdapter.prototype.getProperties = function () {
            var propertiesLines = [];
            var propToDisplay = [];
            // The if is there to work with the min version of babylon
            if (this._obj instanceof BABYLON.StandardMaterial) {
                propToDisplay = INSPECTOR.PROPERTIES['StandardMaterial'].properties;
            }
            else if (this._obj instanceof BABYLON.PBRMaterial) {
                propToDisplay = INSPECTOR.PROPERTIES['PBRMaterial'].properties;
            }
            for (var _i = 0, propToDisplay_1 = propToDisplay; _i < propToDisplay_1.length; _i++) {
                var dirty = propToDisplay_1[_i];
                var infos = new INSPECTOR.Property(dirty, this._obj);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            return propertiesLines;
        };
        /** No tools for a material adapter */
        MaterialAdapter.prototype.getTools = function () {
            return [];
        };
        /** Overrides super.highlight.
         * Highlighting a material outlines all meshes linked to this material
         */
        MaterialAdapter.prototype.highlight = function (b) {
            var material = this.actualObject;
            var meshes = material.getBindedMeshes();
            for (var _i = 0, meshes_1 = meshes; _i < meshes_1.length; _i++) {
                var mesh = meshes_1[_i];
                mesh.renderOutline = b;
                mesh.outlineWidth = 0.25;
                mesh.outlineColor = BABYLON.Color3.Yellow();
            }
        };
        return MaterialAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.MaterialAdapter = MaterialAdapter;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=MaterialAdapter.js.map

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var MeshAdapter = (function (_super) {
        __extends(MeshAdapter, _super);
        function MeshAdapter(obj) {
            var _this = _super.call(this, obj) || this;
            /** Keep track of the axis of the actual object */
            _this._axis = [];
            return _this;
        }
        /** Returns the name displayed in the tree */
        MeshAdapter.prototype.id = function () {
            var str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        };
        /** Returns the type of this object - displayed in the tree */
        MeshAdapter.prototype.type = function () {
            return INSPECTOR.Helpers.GET_TYPE(this._obj);
        };
        /** Returns the list of properties to be displayed for this adapter */
        MeshAdapter.prototype.getProperties = function () {
            var propertiesLines = [];
            for (var _i = 0, _a = INSPECTOR.PROPERTIES['Mesh'].properties; _i < _a.length; _i++) {
                var dirty = _a[_i];
                var infos = new INSPECTOR.Property(dirty, this._obj);
                propertiesLines.push(new INSPECTOR.PropertyLine(infos));
            }
            return propertiesLines;
        };
        MeshAdapter.prototype.getTools = function () {
            var tools = [];
            tools.push(new INSPECTOR.Checkbox(this));
            tools.push(new INSPECTOR.DebugArea(this));
            if (this._obj.getTotalVertices() > 0) {
                tools.push(new INSPECTOR.BoundingBox(this));
            }
            tools.push(new INSPECTOR.Info(this));
            return tools;
        };
        MeshAdapter.prototype.setVisible = function (b) {
            this._obj.setEnabled(b);
            this._obj.isVisible = b;
        };
        MeshAdapter.prototype.isVisible = function () {
            return this._obj.isEnabled() && this._obj.isVisible;
        };
        MeshAdapter.prototype.isBoxVisible = function () {
            return this._obj.showBoundingBox;
        };
        MeshAdapter.prototype.setBoxVisible = function (b) {
            return this._obj.showBoundingBox = b;
        };
        MeshAdapter.prototype.debug = function (b) {
            // Draw axis the first time
            if (this._axis.length == 0) {
                this._drawAxis();
            }
            // Display or hide axis
            for (var _i = 0, _a = this._axis; _i < _a.length; _i++) {
                var ax = _a[_i];
                ax.setEnabled(b);
            }
        };
        /** Returns some information about this mesh */
        MeshAdapter.prototype.getInfo = function () {
            return this._obj.getTotalVertices() + " vertices";
        };
        /** Overrides super.highlight */
        MeshAdapter.prototype.highlight = function (b) {
            this.actualObject.renderOutline = b;
            this.actualObject.outlineWidth = 0.25;
            this.actualObject.outlineColor = BABYLON.Color3.Yellow();
        };
        /** Draw X, Y and Z axis for the actual object if this adapter.
         * Should be called only one time as it will fill this._axis
         */
        MeshAdapter.prototype._drawAxis = function () {
            var _this = this;
            this._obj.computeWorldMatrix();
            var m = this._obj.getWorldMatrix();
            // Axis
            var x = new BABYLON.Vector3(8 / this._obj.scaling.x, 0, 0);
            var y = new BABYLON.Vector3(0, 8 / this._obj.scaling.y, 0);
            var z = new BABYLON.Vector3(0, 0, 8 / this._obj.scaling.z);
            // Draw an axis of the given color
            var _drawAxis = function (color, start, end) {
                var axis = BABYLON.Mesh.CreateLines("###axis###", [
                    start,
                    end
                ], _this._obj.getScene());
                axis.color = color;
                axis.renderingGroupId = 1;
                return axis;
            };
            // X axis
            var xAxis = _drawAxis(BABYLON.Color3.Red(), BABYLON.Vector3.Zero(), x);
            xAxis.parent = this._obj;
            this._axis.push(xAxis);
            // Y axis        
            var yAxis = _drawAxis(BABYLON.Color3.Green(), BABYLON.Vector3.Zero(), y);
            yAxis.parent = this._obj;
            this._axis.push(yAxis);
            // Z axis
            var zAxis = _drawAxis(BABYLON.Color3.Blue(), BABYLON.Vector3.Zero(), z);
            zAxis.parent = this._obj;
            this._axis.push(zAxis);
        };
        return MeshAdapter;
    }(INSPECTOR.Adapter));
    INSPECTOR.MeshAdapter = MeshAdapter;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=MeshAdapter.js.map

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var DetailPanel = (function (_super) {
        __extends(DetailPanel, _super);
        function DetailPanel(dr) {
            var _this = _super.call(this) || this;
            // Contains all details rows that belongs to the item above
            _this._detailRows = [];
            // Store the sort direction of each header column
            _this._sortDirection = {};
            _this._build();
            if (dr) {
                _this._detailRows = dr;
                _this.update();
            }
            return _this;
        }
        Object.defineProperty(DetailPanel.prototype, "details", {
            set: function (detailsRow) {
                this.clean();
                this._detailRows = detailsRow;
                // Refresh HTML
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        DetailPanel.prototype._build = function () {
            this._div.className = 'insp-details';
            this._div.id = 'insp-details';
            // Create header row
            this._createHeaderRow();
            this._div.appendChild(this._headerRow);
        };
        /** Updates the HTML of the detail panel */
        DetailPanel.prototype.update = function () {
            this._sortDetails('name', 1);
            this._addDetails();
        };
        /** Add all lines in the html div. Does not sort them! */
        DetailPanel.prototype._addDetails = function () {
            var details = INSPECTOR.Helpers.CreateDiv('details', this._div);
            for (var _i = 0, _a = this._detailRows; _i < _a.length; _i++) {
                var row = _a[_i];
                details.appendChild(row.toHtml());
            }
        };
        /**
         * Sort the details row by comparing the given property of each row
         */
        DetailPanel.prototype._sortDetails = function (property, _direction) {
            // Clean header
            var elems = INSPECTOR.Inspector.DOCUMENT.querySelectorAll('.sort-direction');
            for (var e = 0; e < elems.length; e++) {
                elems[e].classList.remove('fa-chevron-up');
                elems[e].classList.remove('fa-chevron-down');
            }
            if (_direction || !this._sortDirection[property]) {
                this._sortDirection[property] = _direction || 1;
            }
            else {
                this._sortDirection[property] *= -1;
            }
            var direction = this._sortDirection[property];
            if (direction == 1) {
                this._headerRow.querySelector("#sort-direction-" + property).classList.remove('fa-chevron-down');
                this._headerRow.querySelector("#sort-direction-" + property).classList.add('fa-chevron-up');
            }
            else {
                this._headerRow.querySelector("#sort-direction-" + property).classList.remove('fa-chevron-up');
                this._headerRow.querySelector("#sort-direction-" + property).classList.add('fa-chevron-down');
            }
            var isString = function (s) {
                return typeof (s) === 'string' || s instanceof String;
            };
            this._detailRows.sort(function (detail1, detail2) {
                var str1 = String(detail1[property]);
                var str2 = String(detail2[property]);
                if (!isString(str1)) {
                    str1 = detail1[property].toString();
                }
                if (!isString(str2)) {
                    str2 = detail2[property].toString();
                }
                // Compare numbers as numbers and string as string with 'numeric=true'
                return str1.localeCompare(str2, [], { numeric: true }) * direction;
            });
        };
        /**
         * Removes all data in the detail panel but keep the header row
         */
        DetailPanel.prototype.clean = function () {
            // Delete all details row
            for (var _i = 0, _a = this._detailRows; _i < _a.length; _i++) {
                var pline = _a[_i];
                pline.dispose();
            }
            INSPECTOR.Helpers.CleanDiv(this._div);
            // Header row
            this._div.appendChild(this._headerRow);
        };
        /** Overrides basicelement.dispose */
        DetailPanel.prototype.dispose = function () {
            // Delete all details row
            for (var _i = 0, _a = this._detailRows; _i < _a.length; _i++) {
                var pline = _a[_i];
                pline.dispose();
            }
        };
        /**
         * Creates the header row : name, value, id
         */
        DetailPanel.prototype._createHeaderRow = function () {
            var _this = this;
            this._headerRow = INSPECTOR.Helpers.CreateDiv('header-row');
            var createDiv = function (name, cssClass) {
                var div = INSPECTOR.Helpers.CreateDiv(cssClass + ' header-col');
                // Column title - first letter in uppercase
                var spanName = INSPECTOR.Inspector.DOCUMENT.createElement('span');
                spanName.textContent = name.charAt(0).toUpperCase() + name.slice(1);
                // sort direction
                var spanDirection = INSPECTOR.Inspector.DOCUMENT.createElement('i');
                spanDirection.className = 'sort-direction fa';
                spanDirection.id = 'sort-direction-' + name;
                div.appendChild(spanName);
                div.appendChild(spanDirection);
                div.addEventListener('click', function (e) {
                    _this._sortDetails(name);
                    _this._addDetails();
                });
                return div;
            };
            this._headerRow.appendChild(createDiv('name', 'prop-name'));
            this._headerRow.appendChild(createDiv('value', 'prop-value'));
        };
        return DetailPanel;
    }(INSPECTOR.BasicElement));
    INSPECTOR.DetailPanel = DetailPanel;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=DetailPanel.js.map

var INSPECTOR;
(function (INSPECTOR) {
    /**
     * A property is a link between a data (string) and an object.
     */
    var Property = (function () {
        function Property(prop, obj) {
            this._property = prop;
            this._obj = obj;
        }
        Object.defineProperty(Property.prototype, "name", {
            get: function () {
                return this._property;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Property.prototype, "value", {
            get: function () {
                return this._obj[this._property];
            },
            set: function (newValue) {
                this._obj[this._property] = newValue;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Property.prototype, "type", {
            get: function () {
                return INSPECTOR.Helpers.GET_TYPE(this.value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Property.prototype, "obj", {
            get: function () {
                return this._obj;
            },
            set: function (newObj) {
                this._obj = newObj;
            },
            enumerable: true,
            configurable: true
        });
        return Property;
    }());
    INSPECTOR.Property = Property;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=Property.js.map

var INSPECTOR;
(function (INSPECTOR) {
    var PropertyFormatter = (function () {
        function PropertyFormatter() {
        }
        /**
         * Format the value of the given property of the given object.
         */
        PropertyFormatter.format = function (obj, prop) {
            // Get original value;
            var value = obj[prop];
            // test if type PrimitiveAlignment is available (only included in canvas2d)
            if (BABYLON.PrimitiveAlignment) {
                if (obj instanceof BABYLON.PrimitiveAlignment) {
                    if (prop === 'horizontal') {
                        switch (value) {
                            case BABYLON.PrimitiveAlignment.AlignLeft:
                                return 'left';
                            case BABYLON.PrimitiveAlignment.AlignRight:
                                return 'right';
                            case BABYLON.PrimitiveAlignment.AlignCenter:
                                return 'center';
                            case BABYLON.PrimitiveAlignment.AlignStretch:
                                return 'stretch';
                        }
                    }
                    else if (prop === 'vertical') {
                        switch (value) {
                            case BABYLON.PrimitiveAlignment.AlignTop:
                                return 'top';
                            case BABYLON.PrimitiveAlignment.AlignBottom:
                                return 'bottom';
                            case BABYLON.PrimitiveAlignment.AlignCenter:
                                return 'center';
                            case BABYLON.PrimitiveAlignment.AlignStretch:
                                return 'stretch';
                        }
                    }
                }
            }
            return value;
        };
        return PropertyFormatter;
    }());
    INSPECTOR.PropertyFormatter = PropertyFormatter;
    /**
     * A property line represents a line in the detail panel. This line is composed of :
     * - a name (the property name)
     * - a value if this property is of a type 'simple' : string, number, boolean, color, texture
     * - the type of the value if this property is of a complex type (Vector2, Size, ...)
     * - a ID if defined (otherwise an empty string is displayed)
     * The original object is sent to the value object who will update it at will.
     *
     * A property line can contain OTHER property line objects in the case of a complex type.
     * If this instance has no link to other instances, its type is ALWAYS a simple one (see above).
     *
     */
    var PropertyLine = (function () {
        function PropertyLine(prop, parent, level) {
            if (level === void 0) { level = 0; }
            // If the type is complex, this property will have child to update
            this._children = [];
            /** The list of viewer element displayed at the end of the line (color, texture...) */
            this._elements = [];
            this._property = prop;
            this._level = level;
            this._parent = parent;
            this._div = INSPECTOR.Helpers.CreateDiv('row');
            this._div.style.marginLeft = this._level + "px";
            // Property name
            var propName = INSPECTOR.Helpers.CreateDiv('prop-name', this._div);
            propName.textContent = "" + this.name;
            // Value
            this._valueDiv = INSPECTOR.Helpers.CreateDiv('prop-value', this._div);
            this._valueDiv.textContent = this._displayValueContent() || '-'; // Init value text node
            this._createElements();
            for (var _i = 0, _a = this._elements; _i < _a.length; _i++) {
                var elem = _a[_i];
                this._valueDiv.appendChild(elem.toHtml());
            }
            this._updateValue();
            // If the property type is not simple, add click event to unfold its children
            if (!this._isSimple()) {
                this._valueDiv.classList.add('clickable');
                this._valueDiv.addEventListener('click', this._addDetails.bind(this));
            }
            else {
                this._initInput();
                this._valueDiv.addEventListener('click', this._displayInputHandler);
                this._input.addEventListener('keypress', this._validateInputHandler);
                this._input.addEventListener('keydown', this._escapeInputHandler);
            }
            // Add this property to the scheduler
            INSPECTOR.Scheduler.getInstance().add(this);
        }
        /**
         * Init the input element and al its handler :
         * - a click in the window remove the input and restore the old property value
         * - enters updates the property
         */
        PropertyLine.prototype._initInput = function () {
            // Create the input element
            this._input = document.createElement('input');
            this._input.setAttribute('type', 'text');
            // if the property is 'simple', add an event listener to create an input
            this._displayInputHandler = this._displayInput.bind(this);
            this._validateInputHandler = this._validateInput.bind(this);
            this._escapeInputHandler = this._escapeInput.bind(this);
        };
        /**
         * On enter : validates the new value and removes the input
         * On escape : removes the input
         */
        PropertyLine.prototype._validateInput = function (e) {
            if (e.keyCode == 13) {
                // Enter : validate the new value
                var newValue = this._input.value;
                this.updateObject();
                if (typeof this._property.value === 'number') {
                    this._property.value = parseFloat(newValue);
                }
                else {
                    this._property.value = newValue;
                }
                // Remove input
                this.update();
                // resume scheduler
                INSPECTOR.Scheduler.getInstance().pause = false;
            }
            else if (e.keyCode == 27) {
                // Esc : remove input
                this.update();
            }
        };
        /**
         * On escape : removes the input
         */
        PropertyLine.prototype._escapeInput = function (e) {
            if (e.keyCode == 27) {
                // Esc : remove input
                this.update();
            }
        };
        /** Removes the input without validating the new value */
        PropertyLine.prototype._removeInputWithoutValidating = function () {
            INSPECTOR.Helpers.CleanDiv(this._valueDiv);
            this._valueDiv.textContent = "-";
            // restore elements
            for (var _i = 0, _a = this._elements; _i < _a.length; _i++) {
                var elem = _a[_i];
                this._valueDiv.appendChild(elem.toHtml());
            }
            this._valueDiv.addEventListener('click', this._displayInputHandler);
        };
        /** Replaces the default display with an input */
        PropertyLine.prototype._displayInput = function (e) {
            // Remove the displayInput event listener
            this._valueDiv.removeEventListener('click', this._displayInputHandler);
            // Set input value
            var valueTxt = this._valueDiv.textContent;
            this._valueDiv.textContent = "";
            this._input.value = valueTxt;
            this._valueDiv.appendChild(this._input);
            // Pause the scheduler
            INSPECTOR.Scheduler.getInstance().pause = true;
        };
        /** Retrieve the correct object from its parent.
         * If no parent exists, returns the property value.
         * This method is used at each update in case the property object is removed from the original object
         * (example : mesh.position = new BABYLON.Vector3 ; the original vector3 object is deleted from the mesh).
        */
        PropertyLine.prototype.updateObject = function () {
            if (this._parent) {
                this._property.obj = this._parent.updateObject();
            }
            return this._property.value;
        };
        Object.defineProperty(PropertyLine.prototype, "name", {
            // Returns the property name
            get: function () {
                return this._property.name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PropertyLine.prototype, "value", {
            // Returns the value of the property
            get: function () {
                return PropertyFormatter.format(this._property.obj, this._property.name);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PropertyLine.prototype, "type", {
            // Returns the type of the property
            get: function () {
                return this._property.type;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Creates elements that wil be displayed on a property line, depending on the
         * type of the property.
         */
        PropertyLine.prototype._createElements = function () {
            // Colors
            if (this.type == 'Color3' || this.type == 'Color4') {
                this._elements.push(new INSPECTOR.ColorElement(this.value));
            }
            // Texture
            if (this.type == 'Texture') {
                this._elements.push(new INSPECTOR.TextureElement(this.value));
            }
            // HDR Texture
            if (this.type == 'HDRCubeTexture') {
                this._elements.push(new INSPECTOR.HDRCubeTextureElement(this.value));
            }
            if (this.type == 'CubeTexture') {
                this._elements.push(new INSPECTOR.CubeTextureElement(this.value));
            }
        };
        // Returns the text displayed on the left of the property name : 
        // - If the type is simple, display its value
        // - If the type is complex, but instance of Vector2, Size, display the type and its tostring
        // - If the type is another one, display the Type
        PropertyLine.prototype._displayValueContent = function () {
            var value = this.value;
            // If the value is a number, truncate it if needed
            if (typeof value === 'number') {
                return INSPECTOR.Helpers.Trunc(value);
            }
            // If it's a string or a boolean, display its value
            if (typeof value === 'string' || typeof value === 'boolean') {
                return value;
            }
            return INSPECTOR.PROPERTIES.format(value);
        };
        /** Delete properly this property line.
         * Removes itself from the scheduler.
         * Dispose all viewer element (color, texture...)
         */
        PropertyLine.prototype.dispose = function () {
            // console.log('delete properties', this.name);
            INSPECTOR.Scheduler.getInstance().remove(this);
            for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                var child = _a[_i];
                // console.log('delete properties', child.name);
                INSPECTOR.Scheduler.getInstance().remove(child);
            }
            for (var _b = 0, _c = this._elements; _b < _c.length; _b++) {
                var elem = _c[_b];
                elem.dispose();
            }
            this._elements = [];
        };
        /** Updates the content of _valueDiv with the value of the property,
         * and all HTML element correpsonding to this type.
         * Elements are updated as well
         */
        PropertyLine.prototype._updateValue = function () {
            // Update the property object first
            this.updateObject();
            // Then update its value
            // this._valueDiv.textContent = " "; // TOFIX this removes the elements after
            this._valueDiv.childNodes[0].nodeValue = this._displayValueContent();
            for (var _i = 0, _a = this._elements; _i < _a.length; _i++) {
                var elem = _a[_i];
                elem.update(this.value);
            }
        };
        /**
         * Update the property division with the new property value.
         * If this property is complex, update its child, otherwise update its text content
         */
        PropertyLine.prototype.update = function () {
            this._removeInputWithoutValidating();
            this._updateValue();
        };
        /**
         * Returns true if the given instance is a simple type
         */
        PropertyLine._IS_TYPE_SIMPLE = function (inst) {
            var type = INSPECTOR.Helpers.GET_TYPE(inst);
            return PropertyLine._SIMPLE_TYPE.indexOf(type) != -1;
        };
        /**
         * Returns true if the type of this property is simple, false otherwise.
         * Returns true if the value is null
         */
        PropertyLine.prototype._isSimple = function () {
            if (this.value != null && this.type !== 'type_not_defined') {
                if (PropertyLine._SIMPLE_TYPE.indexOf(this.type) == -1) {
                    // complex type : return the type name
                    return false;
                }
                else {
                    // simple type : return value
                    return true;
                }
            }
            else {
                return true;
            }
        };
        PropertyLine.prototype.toHtml = function () {
            return this._div;
        };
        /**
         * Add sub properties in case of a complex type
         */
        PropertyLine.prototype._addDetails = function () {
            if (this._div.classList.contains('unfolded')) {
                // Remove class unfolded
                this._div.classList.remove('unfolded');
                // remove html children
                for (var _i = 0, _a = this._children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    this._div.parentNode.removeChild(child.toHtml());
                }
            }
            else {
                // if children does not exists, generate it
                this._div.classList.toggle('unfolded');
                if (this._children.length == 0) {
                    var objToDetail = this.value;
                    var propToDisplay = INSPECTOR.PROPERTIES[INSPECTOR.Helpers.GET_TYPE(objToDetail)].properties.reverse();
                    var propertyLine = null;
                    for (var _b = 0, propToDisplay_1 = propToDisplay; _b < propToDisplay_1.length; _b++) {
                        var prop = propToDisplay_1[_b];
                        var infos = new INSPECTOR.Property(prop, this._property.value);
                        var child = new PropertyLine(infos, this, this._level + PropertyLine._MARGIN_LEFT);
                        this._children.push(child);
                    }
                }
                // otherwise display it                    
                for (var _c = 0, _d = this._children; _c < _d.length; _c++) {
                    var child = _d[_c];
                    this._div.parentNode.insertBefore(child.toHtml(), this._div.nextSibling);
                }
            }
        };
        return PropertyLine;
    }());
    // Array representing the simple type. All others are considered 'complex'
    PropertyLine._SIMPLE_TYPE = ['number', 'string', 'boolean'];
    // The number of pixel at each children step
    PropertyLine._MARGIN_LEFT = 15;
    INSPECTOR.PropertyLine = PropertyLine;
})(INSPECTOR || (INSPECTOR = {}));

//# sourceMappingURL=PropertyLine.js.map

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
    * Display a very small div corresponding to the given color
    */
    var ColorElement = (function (_super) {
        __extends(ColorElement, _super);
        // The color as hexadecimal string
        function ColorElement(color) {
            var _this = _super.call(this) || this;
            _this._div.className = 'color-element';
            _this._div.style.backgroundColor = _this._toRgba(color);
            return _this;
        }
        ColorElement.prototype.update = function (color) {
            if (color) {
                this._div.style.backgroundColor = this._toRgba(color);
            }
        };
        ColorElement.prototype._toRgba = function (color) {
            if (color) {
                var r = (color.r * 255) | 0;
                var g = (color.g * 255) | 0;
                var b = (color.b * 255) | 0;
                var a = 1;
                if (color instanceof BABYLON.Color4) {
                    var a_1 = color.a;
                }
                return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
            }
            else {
                return '';
            }
        };
        return ColorElement;
    }(INSPECTOR.BasicElement));
    INSPECTOR.ColorElement = ColorElement;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
    * Display a very small div. A new canvas is created, with a new Babylon.js scene, containing only the
    * cube texture in a cube
    */
    var CubeTextureElement = (function (_super) {
        __extends(CubeTextureElement, _super);
        /** The texture given as a parameter should be cube. */
        function CubeTextureElement(tex) {
            var _this = _super.call(this) || this;
            // On pause the engine will not render anything
            _this._pause = false;
            _this._div.className = 'fa fa-search texture-element';
            // Create the texture viewer
            _this._textureDiv = INSPECTOR.Helpers.CreateDiv('texture-viewer', _this._div);
            // canvas
            _this._canvas = INSPECTOR.Helpers.CreateElement('canvas', 'texture-viewer-img', _this._textureDiv);
            if (tex) {
                _this._textureUrl = tex.name;
            }
            _this._div.addEventListener('mouseover', _this._showViewer.bind(_this, 'flex'));
            _this._div.addEventListener('mouseout', _this._showViewer.bind(_this, 'none'));
            return _this;
        }
        CubeTextureElement.prototype.update = function (tex) {
            if (tex && tex.url === this._textureUrl) {
                // Nothing to do, as the old texture is the same as the old one
            }
            else {
                if (tex) {
                    this._textureUrl = tex.name;
                }
                if (this._engine) {
                    // Dispose old material and cube
                    this._cube.material.dispose(true, true);
                    this._cube.dispose();
                }
                else {
                    this._initEngine();
                }
                // and create it again
                this._populateScene();
            }
        };
        /** Creates the box  */
        CubeTextureElement.prototype._populateScene = function () {
            var _this = this;
            // Create the hdr texture
            var hdrTexture = new BABYLON.CubeTexture(this._textureUrl, this._scene);
            hdrTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            this._cube = BABYLON.Mesh.CreateBox("hdrSkyBox", 10.0, this._scene);
            var hdrSkyboxMaterial = new BABYLON.StandardMaterial("skyBox", this._scene);
            hdrSkyboxMaterial.backFaceCulling = false;
            hdrSkyboxMaterial.reflectionTexture = hdrTexture;
            hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            hdrSkyboxMaterial.disableLighting = true;
            this._cube.material = hdrSkyboxMaterial;
            this._cube.registerBeforeRender(function () {
                _this._cube.rotation.y += 0.01;
            });
        };
        /** Init the babylon engine */
        CubeTextureElement.prototype._initEngine = function () {
            var _this = this;
            this._engine = new BABYLON.Engine(this._canvas);
            this._scene = new BABYLON.Scene(this._engine);
            this._scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
            var cam = new BABYLON.FreeCamera('cam', new BABYLON.Vector3(0, 0, -20), this._scene);
            var light = new BABYLON.HemisphericLight('', new BABYLON.Vector3(0, 1, 0), this._scene);
            this._engine.runRenderLoop(function () {
                if (!_this._pause) {
                    _this._scene.render();
                }
            });
            this._canvas.setAttribute('width', '110');
            this._canvas.setAttribute('height', '110');
        };
        CubeTextureElement.prototype._showViewer = function (mode) {
            // If displaying...
            if (mode != 'none') {
                // ... and the canvas is not initialized                
                if (!this._engine) {
                    this._initEngine();
                    this._populateScene();
                }
                // In every cases, unpause the engine
                this._pause = false;
            }
            else {
                // hide : pause the engine
                this._pause = true;
            }
            this._textureDiv.style.display = mode;
        };
        /** Removes properly the babylon engine */
        CubeTextureElement.prototype.dispose = function () {
            if (this._engine) {
                this._engine.dispose();
                this._engine = null;
            }
        };
        return CubeTextureElement;
    }(INSPECTOR.BasicElement));
    INSPECTOR.CubeTextureElement = CubeTextureElement;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
    * Display a very small div. A new canvas is created, with a new Babylon.js scene, containing only the
    * cube texture in a cube
    */
    var HDRCubeTextureElement = (function (_super) {
        __extends(HDRCubeTextureElement, _super);
        /** The texture given as a parameter should be cube. */
        function HDRCubeTextureElement(tex) {
            return _super.call(this, tex) || this;
        }
        /** Creates the box  */
        HDRCubeTextureElement.prototype._populateScene = function () {
            var _this = this;
            // Create the hdr texture
            var hdrTexture = new BABYLON.HDRCubeTexture(this._textureUrl, this._scene, 512);
            hdrTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            this._cube = BABYLON.Mesh.CreateBox("hdrSkyBox", 10.0, this._scene);
            var hdrSkyboxMaterial = new BABYLON.PBRMaterial("skyBox", this._scene);
            hdrSkyboxMaterial.backFaceCulling = false;
            hdrSkyboxMaterial.reflectionTexture = hdrTexture;
            hdrSkyboxMaterial.microSurface = 1.0;
            hdrSkyboxMaterial.disableLighting = true;
            this._cube.material = hdrSkyboxMaterial;
            this._cube.registerBeforeRender(function () {
                _this._cube.rotation.y += 0.01;
            });
        };
        return HDRCubeTextureElement;
    }(INSPECTOR.CubeTextureElement));
    INSPECTOR.HDRCubeTextureElement = HDRCubeTextureElement;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * A search bar can be used to filter elements in the tree panel.
     * At each keypress on the input, the treepanel will be filtered.
     */
    var SearchBar = (function (_super) {
        __extends(SearchBar, _super);
        function SearchBar(tab) {
            var _this = _super.call(this) || this;
            _this._tab = tab;
            _this._div.classList.add('searchbar');
            var filter = INSPECTOR.Inspector.DOCUMENT.createElement('i');
            filter.className = 'fa fa-search';
            _this._div.appendChild(filter);
            // Create input
            _this._inputElement = INSPECTOR.Inspector.DOCUMENT.createElement('input');
            _this._inputElement.placeholder = 'Filter by name...';
            _this._div.appendChild(_this._inputElement);
            _this._inputElement.addEventListener('keyup', function (evt) {
                var filter = _this._inputElement.value;
                _this._tab.filter(filter);
            });
            return _this;
        }
        /** Delete all characters typped in the input element */
        SearchBar.prototype.reset = function () {
            this._inputElement.value = '';
        };
        SearchBar.prototype.update = function () {
            // Nothing to update
        };
        return SearchBar;
    }(INSPECTOR.BasicElement));
    INSPECTOR.SearchBar = SearchBar;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
    * Display a very small div corresponding to the given texture. On mouse over, display the full image
    */
    var TextureElement = (function (_super) {
        __extends(TextureElement, _super);
        function TextureElement(tex) {
            var _this = _super.call(this) || this;
            _this._div.className = 'fa fa-search texture-element';
            // Create the texture viewer
            _this._textureDiv = INSPECTOR.Helpers.CreateDiv('texture-viewer', _this._div);
            // Img
            var imgDiv = INSPECTOR.Helpers.CreateDiv('texture-viewer-img', _this._textureDiv);
            // Texture size
            var sizeDiv = INSPECTOR.Helpers.CreateDiv(null, _this._textureDiv);
            if (tex) {
                sizeDiv.textContent = tex.getBaseSize().width + "px x " + tex.getBaseSize().height + "px";
                imgDiv.style.backgroundImage = "url('" + tex.url + "')";
                imgDiv.style.width = tex.getBaseSize().width + "px";
                imgDiv.style.height = tex.getBaseSize().height + "px";
            }
            _this._div.addEventListener('mouseover', _this._showViewer.bind(_this, 'flex'));
            _this._div.addEventListener('mouseout', _this._showViewer.bind(_this, 'none'));
            return _this;
        }
        TextureElement.prototype.update = function (tex) {
        };
        TextureElement.prototype._showViewer = function (mode) {
            this._textureDiv.style.display = mode;
        };
        return TextureElement;
    }(INSPECTOR.BasicElement));
    INSPECTOR.TextureElement = TextureElement;
})(INSPECTOR || (INSPECTOR = {}));

var INSPECTOR;
(function (INSPECTOR) {
    /**
     * Creates a tooltip for the parent of the given html element
     */
    var Tooltip = (function () {
        function Tooltip(elem, tip, attachTo) {
            var _this = this;
            this._elem = elem;
            if (!attachTo) {
                attachTo = this._elem.parentElement;
            }
            this._infoDiv = INSPECTOR.Helpers.CreateDiv('tooltip', attachTo);
            this._elem.addEventListener('mouseover', function () {
                _this._infoDiv.textContent = tip;
                _this._infoDiv.style.display = 'block';
            });
            this._elem.addEventListener('mouseout', function () { _this._infoDiv.style.display = 'none'; });
        }
        return Tooltip;
    }());
    INSPECTOR.Tooltip = Tooltip;
})(INSPECTOR || (INSPECTOR = {}));

var INSPECTOR;
(function (INSPECTOR) {
    var Helpers = (function () {
        function Helpers() {
        }
        /**
         * Returns the type of the given object. First
         * uses getClassName. If nothing is returned, used the type of the constructor
         */
        Helpers.GET_TYPE = function (obj) {
            if (obj != null && obj != undefined) {
                var classname = BABYLON.Tools.getClassName(obj);
                if (!classname || classname === 'object') {
                    classname = obj.constructor.name;
                    // classname is undefined in IE11
                    if (!classname) {
                        classname = this._GetFnName(obj.constructor);
                    }
                }
                // If the class name has no matching properties, check every type
                if (!this._CheckIfTypeExists(classname)) {
                    return this._GetTypeFor(obj);
                }
                return classname;
            }
            else {
                return 'type_not_defined';
            }
        };
        /**
         * Check if some properties are defined for the given type.
         */
        Helpers._CheckIfTypeExists = function (type) {
            var properties = INSPECTOR.PROPERTIES[type];
            if (properties) {
                return true;
            }
            return false;
        };
        /**
         * Returns true if the user browser is edge.
         */
        Helpers.IsBrowserEdge = function () {
            //Detect if we are running on a faulty buggy OS.
            var regexp = /Edge/;
            return regexp.test(navigator.userAgent);
        };
        /**
         * Returns the name of the type of the given object, where the name
         * is in PROPERTIES constant.
         * Returns 'Undefined' if no type exists for this object
         */
        Helpers._GetTypeFor = function (obj) {
            for (var type in INSPECTOR.PROPERTIES) {
                var typeBlock = INSPECTOR.PROPERTIES[type];
                if (typeBlock.type) {
                    if (obj instanceof typeBlock.type) {
                        return type;
                    }
                }
            }
            return 'type_not_defined';
        };
        /**
         * Returns the name of a function (workaround to get object type for IE11)
         */
        Helpers._GetFnName = function (fn) {
            var f = typeof fn == 'function';
            var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
            return (!f && 'not a function') || (s && s[1] || 'anonymous');
        };
        /** Send the event which name is given in parameter to the window */
        Helpers.SEND_EVENT = function (eventName) {
            var event;
            if (INSPECTOR.Inspector.DOCUMENT.createEvent) {
                event = INSPECTOR.Inspector.DOCUMENT.createEvent('HTMLEvents');
                event.initEvent(eventName, true, true);
            }
            else {
                event = new Event(eventName);
            }
            window.dispatchEvent(event);
        };
        /** Returns the given number with 2 decimal number max if a decimal part exists */
        Helpers.Trunc = function (nb) {
            if (Math.round(nb) !== nb) {
                return nb.toFixed(2);
            }
            return nb;
        };
        ;
        /**
         * Useful function used to create a div
         */
        Helpers.CreateDiv = function (className, parent) {
            return Helpers.CreateElement('div', className, parent);
        };
        Helpers.CreateElement = function (element, className, parent) {
            var elem = INSPECTOR.Inspector.DOCUMENT.createElement(element);
            if (className) {
                elem.className = className;
            }
            if (parent) {
                parent.appendChild(elem);
            }
            return elem;
        };
        /**
         * Removes all children of the given div.
         */
        Helpers.CleanDiv = function (div) {
            while (div.firstChild) {
                div.removeChild(div.firstChild);
            }
        };
        /**
         * Returns the true value of the given CSS Attribute from the given element (in percentage or in pixel, as it was specified in the css)
         */
        Helpers.Css = function (elem, cssAttribute) {
            var clone = elem.cloneNode(true);
            var div = Helpers.CreateDiv('', INSPECTOR.Inspector.DOCUMENT.body);
            div.style.display = 'none';
            div.appendChild(clone);
            var value = INSPECTOR.Inspector.WINDOW.getComputedStyle(clone)[cssAttribute];
            div.parentNode.removeChild(div);
            return value;
        };
        Helpers.LoadScript = function () {
            BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/highlight.min.js", function (elem) {
                var script = Helpers.CreateElement('script', '', INSPECTOR.Inspector.DOCUMENT.body);
                script.textContent = elem;
                // Load glsl detection
                BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/languages/glsl.min.js", function (elem) {
                    var script = Helpers.CreateElement('script', '', INSPECTOR.Inspector.DOCUMENT.body);
                    script.textContent = elem;
                    // Load css style
                    BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/styles/zenburn.min.css", function (elem) {
                        var style = Helpers.CreateElement('style', '', INSPECTOR.Inspector.DOCUMENT.body);
                        style.textContent = elem;
                    });
                }, null, null, null, function () {
                    console.log("erreur");
                });
            }, null, null, null, function () {
                console.log("erreur");
            });
        };
        Helpers.IsSystemName = function (name) {
            if (name == null) {
                return false;
            }
            return name.indexOf("###") === 0 && name.lastIndexOf("###") === (name.length - 3);
        };
        return Helpers;
    }());
    INSPECTOR.Helpers = Helpers;
})(INSPECTOR || (INSPECTOR = {}));

var INSPECTOR;
(function (INSPECTOR) {
    var Scheduler = (function () {
        function Scheduler() {
            /** Is this scheduler in pause ? */
            this.pause = false;
            /** The list of data to update */
            this._updatableProperties = [];
            this._timer = setInterval(this._update.bind(this), Scheduler.REFRESH_TIME);
        }
        Scheduler.getInstance = function () {
            if (!Scheduler._instance) {
                Scheduler._instance = new Scheduler();
            }
            return Scheduler._instance;
        };
        /** Add a property line to be updated every X ms */
        Scheduler.prototype.add = function (prop) {
            this._updatableProperties.push(prop);
        };
        /** Removes the given property from the list of properties to update */
        Scheduler.prototype.remove = function (prop) {
            var index = this._updatableProperties.indexOf(prop);
            if (index != -1) {
                this._updatableProperties.splice(index, 1);
            }
        };
        Scheduler.prototype._update = function () {
            // If not in pause, update 
            if (!this.pause) {
                for (var _i = 0, _a = this._updatableProperties; _i < _a.length; _i++) {
                    var prop = _a[_i];
                    prop.update();
                }
            }
        };
        return Scheduler;
    }());
    /** All properties are refreshed every 250ms */
    Scheduler.REFRESH_TIME = 250;
    INSPECTOR.Scheduler = Scheduler;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var Tab = (function (_super) {
        __extends(Tab, _super);
        function Tab(tabbar, name) {
            var _this = _super.call(this) || this;
            _this._isActive = false;
            _this._tabbar = tabbar;
            _this.name = name;
            _this._build();
            return _this;
        }
        /** True if the tab is active, false otherwise */
        Tab.prototype.isActive = function () {
            return this._isActive;
        };
        Tab.prototype._build = function () {
            var _this = this;
            this._div.className = 'tab';
            this._div.textContent = this.name;
            this._div.addEventListener('click', function (evt) {
                // Set this tab as active
                _this._tabbar.switchTab(_this);
            });
        };
        /** Set this tab as active or not, depending on the current state */
        Tab.prototype.active = function (b) {
            if (b) {
                this._div.classList.add('active');
            }
            else {
                this._div.classList.remove('active');
            }
            this._isActive = b;
        };
        Tab.prototype.update = function () {
            // Nothing for the moment
        };
        /** Creates the tab panel for this tab. */
        Tab.prototype.getPanel = function () {
            return this._panel;
        };
        /** Add this in the propertytab with the searchbar */
        Tab.prototype.filter = function (str) { };
        ;
        /** Select an item in the tree */
        Tab.prototype.select = function (item) {
            // To define in subclasses if needed 
        };
        /** Highlight the given node, and downplay all others */
        Tab.prototype.highlightNode = function (item) {
            // To define in subclasses if needed
        };
        /**
         * Returns the total width in pixel of this tab, 0 by default
        */
        Tab.prototype.getPixelWidth = function () {
            var style = INSPECTOR.Inspector.WINDOW.getComputedStyle(this._div);
            var left = parseFloat(style.marginLeft.substr(0, style.marginLeft.length - 2)) || 0;
            var right = parseFloat(style.marginRight.substr(0, style.marginRight.length - 2)) || 0;
            return (this._div.clientWidth || 0) + left + right;
        };
        return Tab;
    }(INSPECTOR.BasicElement));
    INSPECTOR.Tab = Tab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * A Property tab can creates two panels:
     * a tree panel and a detail panel,
     * in which properties will be displayed.
     * Both panels are separated by a resize bar
     */
    var PropertyTab = (function (_super) {
        __extends(PropertyTab, _super);
        function PropertyTab(tabbar, name, insp) {
            var _this = _super.call(this, tabbar, name) || this;
            _this._treeItems = [];
            _this._inspector = insp;
            // Build the properties panel : a div that will contains the tree and the detail panel
            _this._panel = INSPECTOR.Helpers.CreateDiv('tab-panel');
            _this._panel.classList.add('searchable');
            // Search bar
            _this._searchBar = new INSPECTOR.SearchBar(_this);
            // Add searchbar
            _this._panel.appendChild(_this._searchBar.toHtml());
            // Build the treepanel
            _this._treePanel = INSPECTOR.Helpers.CreateDiv('insp-tree', _this._panel);
            // Build the detail panel
            _this._detailsPanel = new INSPECTOR.DetailPanel();
            _this._panel.appendChild(_this._detailsPanel.toHtml());
            Split([_this._treePanel, _this._detailsPanel.toHtml()], {
                blockDrag: _this._inspector.popupMode,
                direction: 'vertical'
            });
            _this.update();
            return _this;
        }
        /** Overrides dispose */
        PropertyTab.prototype.dispose = function () {
            this._detailsPanel.dispose();
        };
        PropertyTab.prototype.update = function (_items) {
            var items;
            if (_items) {
                items = _items;
            }
            else {
                // Rebuild the tree
                this._treeItems = this._getTree();
                items = this._treeItems;
            }
            // Clean the tree
            INSPECTOR.Helpers.CleanDiv(this._treePanel);
            // Clean the detail properties
            this._detailsPanel.clean();
            // Sort items alphabetically
            items.sort(function (item1, item2) {
                return item1.compareTo(item2);
            });
            // Display items
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                this._treePanel.appendChild(item.toHtml());
            }
        };
        /** Display the details of the given item */
        PropertyTab.prototype.displayDetails = function (item) {
            // Remove active state on all items
            this.activateNode(item);
            // Update the detail panel
            this._detailsPanel.details = item.getDetails();
        };
        /** Select an item in the tree */
        PropertyTab.prototype.select = function (item) {
            // Remove the node highlight
            this.highlightNode();
            // Active the node
            this.activateNode(item);
            // Display its details
            this.displayDetails(item);
        };
        /** Highlight the given node, and downplay all others */
        PropertyTab.prototype.highlightNode = function (item) {
            if (this._treeItems) {
                for (var _i = 0, _a = this._treeItems; _i < _a.length; _i++) {
                    var node = _a[_i];
                    node.highlight(false);
                }
            }
            if (item) {
                item.highlight(true);
            }
        };
        /** Set the given item as active in the tree */
        PropertyTab.prototype.activateNode = function (item) {
            if (this._treeItems) {
                for (var _i = 0, _a = this._treeItems; _i < _a.length; _i++) {
                    var node = _a[_i];
                    node.active(false);
                }
            }
            item.active(true);
        };
        /** Returns the treeitem corersponding to the given obj, null if not found */
        PropertyTab.prototype.getItemFor = function (_obj) {
            var obj = _obj;
            // Search recursively
            var searchObjectInTree = function (object, treeItem) {
                if (treeItem.correspondsTo(object)) {
                    return treeItem;
                }
                else {
                    if (treeItem.children.length > 0) {
                        for (var _i = 0, _a = treeItem.children; _i < _a.length; _i++) {
                            var item = _a[_i];
                            var it = searchObjectInTree(obj, item);
                            if (it) {
                                return it;
                            }
                        }
                    }
                    else {
                        return null;
                    }
                }
            };
            for (var _i = 0, _a = this._treeItems; _i < _a.length; _i++) {
                var item = _a[_i];
                var it = searchObjectInTree(obj, item);
                if (it) {
                    return it;
                }
            }
            return null;
        };
        PropertyTab.prototype.filter = function (filter) {
            var items = [];
            for (var _i = 0, _a = this._treeItems; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item.id.toLowerCase().indexOf(filter.toLowerCase()) != -1) {
                    items.push(item);
                }
                for (var _b = 0, _c = item.children; _b < _c.length; _b++) {
                    var child = _c[_b];
                    if (child.id.toLowerCase().indexOf(filter.toLowerCase()) != -1) {
                        items.push(item);
                    }
                }
            }
            this.update(items);
        };
        return PropertyTab;
    }(INSPECTOR.Tab));
    INSPECTOR.PropertyTab = PropertyTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var CameraTab = (function (_super) {
        __extends(CameraTab, _super);
        function CameraTab(tabbar, inspector) {
            return _super.call(this, tabbar, 'Camera', inspector) || this;
        }
        /* Overrides super */
        CameraTab.prototype._getTree = function () {
            var arr = [];
            // get all cameras from the first scene
            var instances = this._inspector.scene;
            for (var _i = 0, _a = instances.cameras; _i < _a.length; _i++) {
                var camera = _a[_i];
                arr.push(new INSPECTOR.TreeItem(this, new INSPECTOR.CameraAdapter(camera)));
            }
            return arr;
        };
        return CameraTab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.CameraTab = CameraTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var GUITab = (function (_super) {
        __extends(GUITab, _super);
        function GUITab(tabbar, inspector) {
            return _super.call(this, tabbar, 'GUI', inspector) || this;
        }
        /* Overrides super */
        GUITab.prototype._getTree = function () {
            var _this = this;
            var arr = [];
            // Recursive method building the tree panel
            var createNode = function (obj) {
                var descendants = obj.children;
                if (descendants && descendants.length > 0) {
                    var node = new INSPECTOR.TreeItem(_this, new INSPECTOR.GUIAdapter(obj));
                    for (var _i = 0, descendants_1 = descendants; _i < descendants_1.length; _i++) {
                        var child = descendants_1[_i];
                        var n = createNode(child);
                        node.add(n);
                    }
                    node.update();
                    return node;
                }
                else {
                    return new INSPECTOR.TreeItem(_this, new INSPECTOR.GUIAdapter(obj));
                }
            };
            // get all textures from the first scene
            var instances = this._inspector.scene;
            for (var _i = 0, _a = instances.textures; _i < _a.length; _i++) {
                var tex = _a[_i];
                //only get GUI's textures
                if (tex instanceof BABYLON.GUI.AdvancedDynamicTexture) {
                    var node = createNode(tex._rootContainer);
                    arr.push(node);
                }
            }
            return arr;
        };
        return GUITab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.GUITab = GUITab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var PhysicsTab = (function (_super) {
        __extends(PhysicsTab, _super);
        function PhysicsTab(tabbar, inspector) {
            return _super.call(this, tabbar, 'Physics', inspector) || this;
        }
        /* Overrides super */
        PhysicsTab.prototype._getTree = function () {
            var arr = [];
            var scene = this._inspector.scene;
            if (!scene.isPhysicsEnabled()) {
                return arr;
            }
            if (!this.viewer) {
                this.viewer = new BABYLON.Debug.PhysicsViewer(scene);
            }
            for (var _i = 0, _a = scene.meshes; _i < _a.length; _i++) {
                var mesh = _a[_i];
                if (mesh.physicsImpostor) {
                    arr.push(new INSPECTOR.TreeItem(this, new INSPECTOR.PhysicsImpostorAdapter(mesh.physicsImpostor, this.viewer)));
                }
            }
            return arr;
        };
        return PhysicsTab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.PhysicsTab = PhysicsTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var SoundTab = (function (_super) {
        __extends(SoundTab, _super);
        function SoundTab(tabbar, inspector) {
            return _super.call(this, tabbar, 'Audio', inspector) || this;
        }
        /* Overrides super */
        SoundTab.prototype._getTree = function () {
            var _this = this;
            var arr = [];
            // get all cameras from the first scene
            var instances = this._inspector.scene;
            for (var _i = 0, _a = instances.soundTracks; _i < _a.length; _i++) {
                var sounds = _a[_i];
                var sound = sounds.soundCollection;
                sound.forEach(function (element) {
                    arr.push(new INSPECTOR.TreeItem(_this, new INSPECTOR.SoundAdapter(element)));
                });
            }
            return arr;
        };
        return SoundTab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.SoundTab = SoundTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var TextureTab = (function (_super) {
        __extends(TextureTab, _super);
        function TextureTab(tabbar, inspector) {
            var _this = _super.call(this, tabbar, 'Textures') || this;
            _this._treeItems = [];
            _this._inspector = inspector;
            // Build the properties panel : a div that will contains the tree and the detail panel
            _this._panel = INSPECTOR.Helpers.CreateDiv('tab-panel');
            // Build the treepanel
            _this._treePanel = INSPECTOR.Helpers.CreateDiv('insp-tree', _this._panel);
            _this._imagePanel = INSPECTOR.Helpers.CreateDiv('insp-details', _this._panel);
            Split([_this._treePanel, _this._imagePanel], {
                blockDrag: _this._inspector.popupMode,
                direction: 'vertical'
            });
            _this.update();
            return _this;
        }
        TextureTab.prototype.dispose = function () {
            // Nothing to dispose
        };
        TextureTab.prototype.update = function (_items) {
            var items;
            if (_items) {
                items = _items;
            }
            else {
                // Rebuild the tree
                this._treeItems = this._getTree();
                items = this._treeItems;
            }
            // Clean the tree
            INSPECTOR.Helpers.CleanDiv(this._treePanel);
            INSPECTOR.Helpers.CleanDiv(this._imagePanel);
            // Sort items alphabetically
            items.sort(function (item1, item2) {
                return item1.compareTo(item2);
            });
            // Display items
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                this._treePanel.appendChild(item.toHtml());
            }
        };
        /* Overrides super */
        TextureTab.prototype._getTree = function () {
            var arr = [];
            // get all cameras from the first scene
            var instances = this._inspector.scene;
            for (var _i = 0, _a = instances.textures; _i < _a.length; _i++) {
                var tex = _a[_i];
                arr.push(new INSPECTOR.TreeItem(this, new INSPECTOR.TextureAdapter(tex)));
            }
            return arr;
        };
        /** Display the details of the given item */
        TextureTab.prototype.displayDetails = function (item) {
            // Remove active state on all items
            this.activateNode(item);
            INSPECTOR.Helpers.CleanDiv(this._imagePanel);
            // Get the texture object
            var texture = item.adapter.object;
            var img = INSPECTOR.Helpers.CreateElement('img', 'texture-image', this._imagePanel);
            var img1 = INSPECTOR.Helpers.CreateElement('img', 'texture-image', this._imagePanel);
            var img2 = INSPECTOR.Helpers.CreateElement('img', 'texture-image', this._imagePanel);
            var img3 = INSPECTOR.Helpers.CreateElement('img', 'texture-image', this._imagePanel);
            var img4 = INSPECTOR.Helpers.CreateElement('img', 'texture-image', this._imagePanel);
            var img5 = INSPECTOR.Helpers.CreateElement('img', 'texture-image', this._imagePanel);
            if (texture instanceof BABYLON.MapTexture) {
                // instance of Map texture
                texture.bindTextureForPosSize(new BABYLON.Vector2(0, 0), new BABYLON.Size(texture.getSize().width, texture.getSize().height), false);
                BABYLON.Tools.DumpFramebuffer(texture.getSize().width, texture.getSize().height, this._inspector.scene.getEngine(), function (data) { return img.src = data; });
                texture.unbindTexture();
            }
            else if (texture instanceof BABYLON.RenderTargetTexture) {
                // RenderTarget textures
                var scene = this._inspector.scene;
                var engine_1 = scene.getEngine();
                var size_1 = texture.getSize();
                // Clone the texture
                var screenShotTexture = texture.clone();
                screenShotTexture.activeCamera = texture.activeCamera;
                screenShotTexture.onBeforeRender = texture.onBeforeRender;
                screenShotTexture.onAfterRender = texture.onAfterRender;
                screenShotTexture.onBeforeRenderObservable = texture.onBeforeRenderObservable;
                // To display the texture after rendering
                screenShotTexture.onAfterRenderObservable.add(function (faceIndex) {
                    var targetImg;
                    switch (faceIndex) {
                        case 0:
                            targetImg = img;
                            break;
                        case 1:
                            targetImg = img1;
                            break;
                        case 2:
                            targetImg = img2;
                            break;
                        case 3:
                            targetImg = img3;
                            break;
                        case 4:
                            targetImg = img4;
                            break;
                        case 5:
                            targetImg = img5;
                            break;
                        default:
                            targetImg = img;
                            break;
                    }
                    BABYLON.Tools.DumpFramebuffer(size_1.width, size_1.height, engine_1, function (data) { return targetImg.src = data; }, "image/png");
                });
                // Render the texture
                scene.incrementRenderId();
                scene.resetCachedMaterial();
                screenShotTexture.render();
                screenShotTexture.dispose();
            }
            else if (texture.url) {
                // If an url is present, the texture is an image
                img.src = texture.url;
            }
            else if (texture['_canvas']) {
                // Dynamic texture
                var base64Image = texture['_canvas'].toDataURL("image/png");
                img.src = base64Image;
            }
        };
        /** Select an item in the tree */
        TextureTab.prototype.select = function (item) {
            // Remove the node highlight
            this.highlightNode();
            // Active the node
            this.activateNode(item);
            // Display its details
            this.displayDetails(item);
        };
        /** Set the given item as active in the tree */
        TextureTab.prototype.activateNode = function (item) {
            if (this._treeItems) {
                for (var _i = 0, _a = this._treeItems; _i < _a.length; _i++) {
                    var node = _a[_i];
                    node.active(false);
                }
            }
            item.active(true);
        };
        /** Highlight the given node, and downplay all others */
        TextureTab.prototype.highlightNode = function (item) {
            if (this._treeItems) {
                for (var _i = 0, _a = this._treeItems; _i < _a.length; _i++) {
                    var node = _a[_i];
                    node.highlight(false);
                }
            }
            if (item) {
                item.highlight(true);
            }
        };
        return TextureTab;
    }(INSPECTOR.Tab));
    INSPECTOR.TextureTab = TextureTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var LightTab = (function (_super) {
        __extends(LightTab, _super);
        function LightTab(tabbar, inspector) {
            return _super.call(this, tabbar, 'Light', inspector) || this;
        }
        /* Overrides super */
        LightTab.prototype._getTree = function () {
            var arr = [];
            // get all lights from the first scene
            var instances = this._inspector.scene;
            for (var _i = 0, _a = instances.lights; _i < _a.length; _i++) {
                var light = _a[_i];
                arr.push(new INSPECTOR.TreeItem(this, new INSPECTOR.LightAdapter(light)));
            }
            return arr;
        };
        return LightTab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.LightTab = LightTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var MaterialTab = (function (_super) {
        __extends(MaterialTab, _super);
        function MaterialTab(tabbar, inspector) {
            return _super.call(this, tabbar, 'Material', inspector) || this;
        }
        /* Overrides super */
        MaterialTab.prototype._getTree = function () {
            var arr = [];
            // get all meshes from the first scene
            var instances = this._inspector.scene;
            for (var _i = 0, _a = instances.materials; _i < _a.length; _i++) {
                var mat = _a[_i];
                arr.push(new INSPECTOR.TreeItem(this, new INSPECTOR.MaterialAdapter(mat)));
            }
            return arr;
        };
        return MaterialTab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.MaterialTab = MaterialTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var MeshTab = (function (_super) {
        __extends(MeshTab, _super);
        function MeshTab(tabbar, inspector) {
            return _super.call(this, tabbar, 'Mesh', inspector) || this;
        }
        /* Overrides super */
        MeshTab.prototype._getTree = function () {
            var _this = this;
            var arr = [];
            // Tab containign mesh already in results
            var alreadyIn = [];
            // Recursive method building the tree panel
            var createNode = function (obj) {
                var descendants = obj.getDescendants(true);
                var node = new INSPECTOR.TreeItem(_this, new INSPECTOR.MeshAdapter(obj));
                if (descendants.length > 0) {
                    for (var _i = 0, descendants_1 = descendants; _i < descendants_1.length; _i++) {
                        var child = descendants_1[_i];
                        if (child instanceof BABYLON.AbstractMesh) {
                            if (!INSPECTOR.Helpers.IsSystemName(child.name)) {
                                var n = createNode(child);
                                node.add(n);
                            }
                        }
                    }
                    node.update();
                }
                // Retrieve the root node if the mesh is actually child of another mesh
                // This can hapen if the child mesh has been created before the parent mesh
                if (obj.parent != null && alreadyIn.indexOf(obj) != -1) {
                    var i = 0;
                    var notFound = true;
                    // Find and delete the root node standing for this mesh
                    while (i < arr.length && notFound) {
                        if (obj.name === arr[i].id) {
                            arr.splice(i, 1);
                            notFound = false;
                        }
                        i++;
                    }
                }
                alreadyIn.push(obj);
                return node;
            };
            // get all meshes from the first scene
            var instances = this._inspector.scene;
            for (var _i = 0, _a = instances.meshes; _i < _a.length; _i++) {
                var mesh = _a[_i];
                if (alreadyIn.indexOf(mesh) == -1 && !INSPECTOR.Helpers.IsSystemName(mesh.name)) {
                    var node = createNode(mesh);
                    arr.push(node);
                }
            }
            return arr;
        };
        return MeshTab;
    }(INSPECTOR.PropertyTab));
    INSPECTOR.MeshTab = MeshTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var SceneTab = (function (_super) {
        __extends(SceneTab, _super);
        function SceneTab(tabbar, insp) {
            var _this = _super.call(this, tabbar, 'Scene') || this;
            /** The list of skeleton viewer */
            _this._skeletonViewers = [];
            _this._inspector = insp;
            // Build the properties panel : a div that will contains the tree and the detail panel
            _this._panel = INSPECTOR.Helpers.CreateDiv('tab-panel');
            _this._actions = INSPECTOR.Helpers.CreateDiv('scene-actions', _this._panel);
            _this._detailsPanel = new INSPECTOR.DetailPanel();
            _this._panel.appendChild(_this._detailsPanel.toHtml());
            // build propertiesline
            var details = [];
            for (var _i = 0, _a = INSPECTOR.PROPERTIES['Scene'].properties; _i < _a.length; _i++) {
                var prop = _a[_i];
                details.push(new INSPECTOR.PropertyLine(new INSPECTOR.Property(prop, _this._inspector.scene)));
            }
            _this._detailsPanel.details = details;
            Split([_this._actions, _this._detailsPanel.toHtml()], {
                blockDrag: _this._inspector.popupMode,
                sizes: [50, 50],
                direction: 'vertical'
            });
            // Build actions
            {
                // Rendering mode
                var title = INSPECTOR.Helpers.CreateDiv('actions-title', _this._actions);
                title.textContent = 'Rendering mode';
                var point = INSPECTOR.Helpers.CreateDiv('action-radio', _this._actions);
                var wireframe = INSPECTOR.Helpers.CreateDiv('action-radio', _this._actions);
                var solid = INSPECTOR.Helpers.CreateDiv('action-radio', _this._actions);
                point.textContent = 'Point';
                wireframe.textContent = 'Wireframe';
                solid.textContent = 'Solid';
                if (_this._inspector.scene.forcePointsCloud) {
                    point.classList.add('active');
                }
                else if (_this._inspector.scene.forceWireframe) {
                    wireframe.classList.add('active');
                }
                else {
                    solid.classList.add('active');
                }
                _this._generateRadioAction([point, wireframe, solid]);
                point.addEventListener('click', function () { _this._inspector.scene.forcePointsCloud = true; _this._inspector.scene.forceWireframe = false; });
                wireframe.addEventListener('click', function () { _this._inspector.scene.forcePointsCloud = false; _this._inspector.scene.forceWireframe = true; });
                solid.addEventListener('click', function () { _this._inspector.scene.forcePointsCloud = false; _this._inspector.scene.forceWireframe = false; });
                // Textures
                title = INSPECTOR.Helpers.CreateDiv('actions-title', _this._actions);
                title.textContent = 'Textures channels';
                _this._generateActionLine('Diffuse Texture', BABYLON.StandardMaterial.DiffuseTextureEnabled, function (b) { BABYLON.StandardMaterial.DiffuseTextureEnabled = b; });
                _this._generateActionLine('Ambient Texture', BABYLON.StandardMaterial.AmbientTextureEnabled, function (b) { BABYLON.StandardMaterial.AmbientTextureEnabled = b; });
                _this._generateActionLine('Specular Texture', BABYLON.StandardMaterial.SpecularTextureEnabled, function (b) { BABYLON.StandardMaterial.SpecularTextureEnabled = b; });
                _this._generateActionLine('Emissive Texture', BABYLON.StandardMaterial.EmissiveTextureEnabled, function (b) { BABYLON.StandardMaterial.EmissiveTextureEnabled = b; });
                _this._generateActionLine('Bump Texture', BABYLON.StandardMaterial.BumpTextureEnabled, function (b) { BABYLON.StandardMaterial.BumpTextureEnabled = b; });
                _this._generateActionLine('Opacity Texture', BABYLON.StandardMaterial.OpacityTextureEnabled, function (b) { BABYLON.StandardMaterial.OpacityTextureEnabled = b; });
                _this._generateActionLine('Reflection Texture', BABYLON.StandardMaterial.ReflectionTextureEnabled, function (b) { BABYLON.StandardMaterial.ReflectionTextureEnabled = b; });
                _this._generateActionLine('Refraction Texture', BABYLON.StandardMaterial.RefractionTextureEnabled, function (b) { BABYLON.StandardMaterial.RefractionTextureEnabled = b; });
                _this._generateActionLine('ColorGrading', BABYLON.StandardMaterial.ColorGradingTextureEnabled, function (b) { BABYLON.StandardMaterial.ColorGradingTextureEnabled = b; });
                _this._generateActionLine('Lightmap Texture', BABYLON.StandardMaterial.LightmapTextureEnabled, function (b) { BABYLON.StandardMaterial.LightmapTextureEnabled = b; });
                _this._generateActionLine('Fresnel', BABYLON.StandardMaterial.FresnelEnabled, function (b) { BABYLON.StandardMaterial.FresnelEnabled = b; });
                // Options
                title = INSPECTOR.Helpers.CreateDiv('actions-title', _this._actions);
                title.textContent = 'Options';
                _this._generateActionLine('Animations', _this._inspector.scene.animationsEnabled, function (b) { _this._inspector.scene.animationsEnabled = b; });
                _this._generateActionLine('Collisions', _this._inspector.scene.collisionsEnabled, function (b) { _this._inspector.scene.collisionsEnabled = b; });
                _this._generateActionLine('Fog', _this._inspector.scene.fogEnabled, function (b) { _this._inspector.scene.fogEnabled = b; });
                _this._generateActionLine('Lens flares', _this._inspector.scene.lensFlaresEnabled, function (b) { _this._inspector.scene.lensFlaresEnabled = b; });
                _this._generateActionLine('Lights', _this._inspector.scene.lightsEnabled, function (b) { _this._inspector.scene.lightsEnabled = b; });
                _this._generateActionLine('Particles', _this._inspector.scene.particlesEnabled, function (b) { _this._inspector.scene.particlesEnabled = b; });
                _this._generateActionLine('Post-processes', _this._inspector.scene.postProcessesEnabled, function (b) { _this._inspector.scene.postProcessesEnabled = b; });
                _this._generateActionLine('Probes', _this._inspector.scene.probesEnabled, function (b) { _this._inspector.scene.probesEnabled = b; });
                _this._generateActionLine('Procedural textures', _this._inspector.scene.proceduralTexturesEnabled, function (b) { _this._inspector.scene.proceduralTexturesEnabled = b; });
                _this._generateActionLine('Render targets', _this._inspector.scene.renderTargetsEnabled, function (b) { _this._inspector.scene.renderTargetsEnabled = b; });
                _this._generateActionLine('Shadows', _this._inspector.scene.shadowsEnabled, function (b) { _this._inspector.scene.shadowsEnabled = b; });
                _this._generateActionLine('Skeletons', _this._inspector.scene.skeletonsEnabled, function (b) { _this._inspector.scene.skeletonsEnabled = b; });
                _this._generateActionLine('Sprites', _this._inspector.scene.spritesEnabled, function (b) { _this._inspector.scene.spritesEnabled = b; });
                _this._generateActionLine('Textures', _this._inspector.scene.texturesEnabled, function (b) { _this._inspector.scene.texturesEnabled = b; });
                // Audio
                title = INSPECTOR.Helpers.CreateDiv('actions-title', _this._actions);
                title.textContent = 'Audio';
                var headphones = INSPECTOR.Helpers.CreateDiv('action-radio', _this._actions);
                var normalSpeaker = INSPECTOR.Helpers.CreateDiv('action-radio', _this._actions);
                _this._generateActionLine('Disable audio', !_this._inspector.scene.audioEnabled, function (b) { _this._inspector.scene.audioEnabled = !b; });
                headphones.textContent = 'Headphones';
                normalSpeaker.textContent = 'Normal speakers';
                _this._generateRadioAction([headphones, normalSpeaker]);
                if (_this._inspector.scene.headphone) {
                    headphones.classList.add('active');
                }
                else {
                    normalSpeaker.classList.add('active');
                }
                headphones.addEventListener('click', function () { _this._inspector.scene.headphone = true; });
                normalSpeaker.addEventListener('click', function () { _this._inspector.scene.headphone = false; });
                // Viewers
                title = INSPECTOR.Helpers.CreateDiv('actions-title', _this._actions);
                title.textContent = 'Viewer';
                _this._generateActionLine('Skeletons', false, function (b) {
                    if (b) {
                        for (var index = 0; index < _this._inspector.scene.meshes.length; index++) {
                            var mesh = _this._inspector.scene.meshes[index];
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
                                var viewer = new BABYLON.Debug.SkeletonViewer(mesh.skeleton, mesh, _this._inspector.scene);
                                viewer.isEnabled = true;
                                _this._skeletonViewers.push(viewer);
                            }
                        }
                    }
                    else {
                        for (var index = 0; index < _this._skeletonViewers.length; index++) {
                            _this._skeletonViewers[index].dispose();
                        }
                        _this._skeletonViewers = [];
                    }
                });
            }
            return _this;
        }
        /** Overrides super.dispose */
        SceneTab.prototype.dispose = function () {
            this._detailsPanel.dispose();
        };
        /** generates a div which correspond to an option that can be activated/deactivated */
        SceneTab.prototype._generateActionLine = function (name, initValue, action) {
            var div = INSPECTOR.Helpers.CreateDiv('scene-actions', this._actions);
            div.textContent = name;
            div.classList.add('action');
            if (initValue) {
                div.classList.add('active');
            }
            div.addEventListener('click', function (e) {
                div.classList.toggle('active');
                var isActivated = div.classList.contains('active');
                action(isActivated);
            });
        };
        /**
         * Add a click action for all given elements :
         * the clicked element is set as active, all others elements are deactivated
         */
        SceneTab.prototype._generateRadioAction = function (arr) {
            var active = function (elem, evt) {
                for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                    var e = arr_1[_i];
                    e.classList.remove('active');
                }
                elem.classList.add('active');
            };
            for (var _i = 0, arr_2 = arr; _i < arr_2.length; _i++) {
                var elem = arr_2[_i];
                elem.addEventListener('click', active.bind(this, elem));
            }
        };
        return SceneTab;
    }(INSPECTOR.Tab));
    INSPECTOR.SceneTab = SceneTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var ShaderTab = (function (_super) {
        __extends(ShaderTab, _super);
        function ShaderTab(tabbar, insp) {
            var _this = _super.call(this, tabbar, 'Shader') || this;
            _this._inspector = insp;
            // Build the shaders panel : a div that will contains the shaders tree and both shaders panels
            _this._panel = INSPECTOR.Helpers.CreateDiv('tab-panel');
            var shaderPanel = INSPECTOR.Helpers.CreateDiv('shader-tree-panel');
            _this._vertexPanel = INSPECTOR.Helpers.CreateDiv('shader-panel');
            _this._fragmentPanel = INSPECTOR.Helpers.CreateDiv('shader-panel');
            _this._panel.appendChild(shaderPanel);
            _this._panel.appendChild(_this._vertexPanel);
            _this._panel.appendChild(_this._fragmentPanel);
            INSPECTOR.Helpers.LoadScript();
            Split([_this._vertexPanel, _this._fragmentPanel], {
                blockDrag: _this._inspector.popupMode,
                sizes: [50, 50],
                direction: 'vertical'
            });
            var comboBox = INSPECTOR.Helpers.CreateElement('select', '', shaderPanel);
            comboBox.addEventListener('change', _this._selectShader.bind(_this));
            var option = INSPECTOR.Helpers.CreateElement('option', '', comboBox);
            option.textContent = 'Select a shader';
            option.setAttribute('value', "");
            option.setAttribute('disabled', 'true');
            option.setAttribute('selected', 'true');
            // Build shaders combobox
            for (var _i = 0, _a = _this._inspector.scene.materials; _i < _a.length; _i++) {
                var mat = _a[_i];
                if (mat instanceof BABYLON.ShaderMaterial) {
                    var option_1 = INSPECTOR.Helpers.CreateElement('option', '', comboBox);
                    option_1.setAttribute('value', mat.id);
                    option_1.textContent = mat.name + " - " + mat.id;
                }
            }
            return _this;
        }
        ShaderTab.prototype._selectShader = function (event) {
            var id = event.target.value;
            var mat = this._inspector.scene.getMaterialByID(id);
            // Clean shader panel
            INSPECTOR.Helpers.CleanDiv(this._vertexPanel);
            // add the title - vertex shader
            var title = INSPECTOR.Helpers.CreateDiv('shader-panel-title', this._vertexPanel);
            title.textContent = 'Vertex shader';
            // add code
            var code = INSPECTOR.Helpers.CreateElement('code', 'glsl', INSPECTOR.Helpers.CreateElement('pre', '', this._vertexPanel));
            code.textContent = this._beautify(mat.getEffect().getVertexShaderSource());
            INSPECTOR.Helpers.CleanDiv(this._fragmentPanel);
            // add the title - fragment shader
            title = INSPECTOR.Helpers.CreateDiv('shader-panel-title', this._fragmentPanel);
            title.textContent = 'Frgament shader';
            // add code
            code = INSPECTOR.Helpers.CreateElement('code', 'glsl', INSPECTOR.Helpers.CreateElement('pre', '', this._fragmentPanel));
            code.textContent = this._beautify(mat.getEffect().getFragmentShaderSource());
            // Init the syntax highlighting
            var styleInit = INSPECTOR.Helpers.CreateElement('script', '', INSPECTOR.Inspector.DOCUMENT.body);
            styleInit.textContent = 'hljs.initHighlighting();';
        };
        /** Overrides super.dispose */
        ShaderTab.prototype.dispose = function () {
        };
        /** Returns the position of the first { and the corresponding } */
        ShaderTab.prototype._getBracket = function (str) {
            var fb = str.indexOf('{');
            var arr = str.substr(fb + 1).split('');
            var counter = 1;
            var currentPosInString = fb;
            var lastBracketIndex = 0;
            for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                var char = arr_1[_i];
                currentPosInString++;
                if (char === '{') {
                    counter++;
                }
                if (char === '}') {
                    counter--;
                }
                if (counter == 0) {
                    lastBracketIndex = currentPosInString;
                    break;
                }
            }
            return { firstBracket: fb, lastBracket: lastBracketIndex };
        };
        /**
         * Beautify the given string : correct indentation
         */
        ShaderTab.prototype._beautify = function (glsl, level) {
            if (level === void 0) { level = 0; }
            // return condition : no brackets at all
            var brackets = this._getBracket(glsl);
            var firstBracket = brackets.firstBracket;
            var lastBracket = brackets.lastBracket;
            var spaces = "";
            for (var i = 0; i < level; i++) {
                spaces += "    "; // 4 spaces
            }
            // If no brackets, return the indented string
            if (firstBracket == -1) {
                glsl = spaces + glsl; // indent first line
                glsl = glsl
                    .replace(/;./g, function (x) { return '\n' + x.substr(1); }); // new line after ;  except the last one
                glsl = glsl.replace(/=/g, " = "); // space around =
                glsl = glsl.replace(/\n/g, "\n" + spaces); // indentation
                return glsl;
            }
            else {
                // if brackets, beautify the inside                                 
                // let insideWithBrackets = glsl.substr(firstBracket, lastBracket-firstBracket+1);
                var left = glsl.substr(0, firstBracket);
                var right = glsl.substr(lastBracket + 1, glsl.length);
                var inside = glsl.substr(firstBracket + 1, lastBracket - firstBracket - 1);
                inside = this._beautify(inside, level + 1);
                return this._beautify(left, level) + '{\n' + inside + '\n' + spaces + '}\n' + this._beautify(right, level);
            }
        };
        return ShaderTab;
    }(INSPECTOR.Tab));
    INSPECTOR.ShaderTab = ShaderTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * The console tab will have two features :
     * - hook all console.log call and display them in this panel (and in the browser console as well)
     * - display all Babylon logs (called with Tools.Log...)
     */
    var ConsoleTab = (function (_super) {
        __extends(ConsoleTab, _super);
        function ConsoleTab(tabbar, insp) {
            var _this = _super.call(this, tabbar, 'Console') || this;
            _this._inspector = insp;
            // Build the shaders panel : a div that will contains the shaders tree and both shaders panels
            _this._panel = INSPECTOR.Helpers.CreateDiv('tab-panel');
            var consolePanel = INSPECTOR.Helpers.CreateDiv('console-panel');
            var bjsPanel = INSPECTOR.Helpers.CreateDiv('console-panel');
            _this._panel.appendChild(consolePanel);
            _this._panel.appendChild(bjsPanel);
            Split([consolePanel, bjsPanel], {
                blockDrag: _this._inspector.popupMode,
                sizes: [50, 50],
                direction: 'vertical'
            });
            // Titles
            var title = INSPECTOR.Helpers.CreateDiv('console-panel-title', consolePanel);
            title.textContent = 'Console logs';
            title = INSPECTOR.Helpers.CreateDiv('console-panel-title', bjsPanel);
            title.textContent = 'Babylon.js logs';
            // Contents
            _this._consolePanelContent = INSPECTOR.Helpers.CreateDiv('console-panel-content', consolePanel);
            _this._bjsPanelContent = INSPECTOR.Helpers.CreateDiv('console-panel-content', bjsPanel);
            // save old console.log
            _this._oldConsoleLog = console.log;
            _this._oldConsoleWarn = console.warn;
            _this._oldConsoleError = console.error;
            console.log = _this._addConsoleLog.bind(_this);
            console.warn = _this._addConsoleWarn.bind(_this);
            console.error = _this._addConsoleError.bind(_this);
            // Bjs logs
            _this._bjsPanelContent.innerHTML = BABYLON.Tools.LogCache;
            BABYLON.Tools.OnNewCacheEntry = function (entry) {
                _this._bjsPanelContent.innerHTML += entry;
                _this._bjsPanelContent.scrollTop = _this._bjsPanelContent.scrollHeight;
            };
            return _this;
            // Testing
            //console.log("This is a console.log message");
            // console.log("That's right, console.log calls are hooked to be written in this window");
            // console.log("Object are also stringify-ed", {width:10, height:30, shape:'rectangular'});
            // console.warn("This is a console.warn message");
            // console.error("This is a console.error message");
            // BABYLON.Tools.Log("This is a message");
            // BABYLON.Tools.Warn("This is a warning");
            // BABYLON.Tools.Error("This is a error");
        }
        /** Overrides super.dispose */
        ConsoleTab.prototype.dispose = function () {
            console.log = this._oldConsoleLog;
            console.warn = this._oldConsoleWarn;
            console.error = this._oldConsoleError;
        };
        ConsoleTab.prototype._message = function (type, message, caller) {
            var callerLine = INSPECTOR.Helpers.CreateDiv('caller', this._consolePanelContent);
            callerLine.textContent = caller;
            var line = INSPECTOR.Helpers.CreateDiv(type, this._consolePanelContent);
            line.textContent += message;
            this._consolePanelContent.scrollTop = this._consolePanelContent.scrollHeight;
        };
        ConsoleTab.prototype._addConsoleLog = function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            // Get caller name if not null
            var callerFunc = this._addConsoleLog.caller;
            var caller = callerFunc == null ? "Window" : "Function " + callerFunc['name'] + ": ";
            for (var i = 0; i < params.length; i++) {
                this._message('log', params[i], caller);
                // Write again in console does not work on edge, as the console object                 
                // is not instantiate if debugger tools is not open
                if (!INSPECTOR.Helpers.IsBrowserEdge()) {
                    this._oldConsoleLog(params[i]);
                }
            }
        };
        ConsoleTab.prototype._addConsoleWarn = function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            // Get caller name if not null
            var callerFunc = this._addConsoleLog.caller;
            var caller = callerFunc == null ? "Window" : callerFunc['name'];
            for (var i = 0; i < params.length; i++) {
                this._message('warn', params[i], caller);
                // Write again in console does not work on edge, as the console object 
                // is not instantiate if debugger tools is not open
                if (!INSPECTOR.Helpers.IsBrowserEdge()) {
                    this._oldConsoleWarn(params[i]);
                }
            }
        };
        ConsoleTab.prototype._addConsoleError = function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            // Get caller name if not null
            var callerFunc = this._addConsoleLog.caller;
            var caller = callerFunc == null ? "Window" : callerFunc['name'];
            for (var i = 0; i < params.length; i++) {
                this._message('error', params[i], caller);
                // Write again in console does not work on edge, as the console object 
                // is not instantiate if debugger tools is not open
                if (!INSPECTOR.Helpers.IsBrowserEdge()) {
                    this._oldConsoleError(params[i]);
                }
            }
        };
        return ConsoleTab;
    }(INSPECTOR.Tab));
    INSPECTOR.ConsoleTab = ConsoleTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var StatsTab = (function (_super) {
        __extends(StatsTab, _super);
        function StatsTab(tabbar, insp) {
            var _this = _super.call(this, tabbar, 'Stats') || this;
            /**
             * Properties in this array will be updated
             * in a render loop - Mostly stats properties
             */
            _this._updatableProperties = [];
            _this._inspector = insp;
            _this._scene = _this._inspector.scene;
            _this._engine = _this._scene.getEngine();
            _this._glInfo = _this._engine.getGlInfo();
            // Build the stats panel: a div that will contains all stats
            _this._panel = INSPECTOR.Helpers.CreateDiv('tab-panel');
            _this._panel.classList.add("stats-panel");
            var title = INSPECTOR.Helpers.CreateDiv('stat-title1', _this._panel);
            var fpsSpan = INSPECTOR.Helpers.CreateElement('span', 'stats-fps');
            _this._updatableProperties.push({
                elem: fpsSpan,
                updateFct: function () { return BABYLON.Tools.Format(_this._inspector.scene.getEngine().getFps(), 0) + " fps"; }
            });
            var versionSpan = INSPECTOR.Helpers.CreateElement('span');
            versionSpan.textContent = "Babylon.js v" + BABYLON.Engine.Version + " - ";
            title.appendChild(versionSpan);
            title.appendChild(fpsSpan);
            _this._updateLoopHandler = _this._update.bind(_this);
            // Count block
            title = INSPECTOR.Helpers.CreateDiv('stat-title2', _this._panel);
            title.textContent = "Count";
            {
                var elemLabel = _this._createStatLabel("Total meshes", _this._panel);
                var elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._scene.meshes.length.toString(); }
                });
                elemLabel = _this._createStatLabel("Draw calls", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._engine.drawCalls.toString(); }
                });
                elemLabel = _this._createStatLabel("Total lights", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._scene.lights.length.toString(); }
                });
                elemLabel = _this._createStatLabel("Total vertices", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._scene.getTotalVertices().toString(); }
                });
                elemLabel = _this._createStatLabel("Total materials", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._scene.materials.length.toString(); }
                });
                elemLabel = _this._createStatLabel("Total textures", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._scene.textures.length.toString(); }
                });
                elemLabel = _this._createStatLabel("Active meshes", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._scene.getActiveMeshes().length.toString(); }
                });
                elemLabel = _this._createStatLabel("Active indices", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._scene.getActiveIndices().toString(); }
                });
                elemLabel = _this._createStatLabel("Active bones", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._scene.getActiveBones().toString(); }
                });
                elemLabel = _this._createStatLabel("Active particles", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._scene.getActiveParticles().toString(); }
                });
            }
            title = INSPECTOR.Helpers.CreateDiv('stat-title2', _this._panel);
            title.textContent = "Duration";
            {
                var elemLabel = _this._createStatLabel("Meshes selection", _this._panel);
                var elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return BABYLON.Tools.Format(_this._scene.getEvaluateActiveMeshesDuration()); }
                });
                elemLabel = _this._createStatLabel("Render targets", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return BABYLON.Tools.Format(_this._scene.getRenderTargetsDuration()); }
                });
                elemLabel = _this._createStatLabel("Particles", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return BABYLON.Tools.Format(_this._scene.getParticlesDuration()); }
                });
                elemLabel = _this._createStatLabel("Sprites", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return BABYLON.Tools.Format(_this._scene.getSpritesDuration()); }
                });
                elemLabel = _this._createStatLabel("Render", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return BABYLON.Tools.Format(_this._scene.getRenderDuration()); }
                });
                elemLabel = _this._createStatLabel("Frame", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return BABYLON.Tools.Format(_this._scene.getLastFrameDuration()); }
                });
                elemLabel = _this._createStatLabel("Potential FPS", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return BABYLON.Tools.Format(1000.0 / _this._scene.getLastFrameDuration(), 0); }
                });
                elemLabel = _this._createStatLabel("Resolution", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._engine.getRenderWidth() + "x" + _this._engine.getRenderHeight(); }
                });
            }
            title = INSPECTOR.Helpers.CreateDiv('stat-title2', _this._panel);
            title.textContent = "Extensions";
            {
                var elemLabel = _this._createStatLabel("Std derivatives", _this._panel);
                var elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return (_this._engine.getCaps().standardDerivatives ? "Yes" : "No"); }
                });
                elemLabel = _this._createStatLabel("Compressed textures", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return (_this._engine.getCaps().s3tc ? "Yes" : "No"); }
                });
                elemLabel = _this._createStatLabel("Hardware instances", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return (_this._engine.getCaps().instancedArrays ? "Yes" : "No"); }
                });
                elemLabel = _this._createStatLabel("Texture float", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return (_this._engine.getCaps().textureFloat ? "Yes" : "No"); }
                });
                elemLabel = _this._createStatLabel("32bits indices", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return (_this._engine.getCaps().uintIndices ? "Yes" : "No"); }
                });
                elemLabel = _this._createStatLabel("Fragment depth", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return (_this._engine.getCaps().fragmentDepthSupported ? "Yes" : "No"); }
                });
                elemLabel = _this._createStatLabel("High precision shaders", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return (_this._engine.getCaps().highPrecisionShaderSupported ? "Yes" : "No"); }
                });
                elemLabel = _this._createStatLabel("Draw buffers", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return (_this._engine.getCaps().drawBuffersExtension ? "Yes" : "No"); }
                });
                elemLabel = _this._createStatLabel("Vertex array object", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return (_this._engine.getCaps().vertexArrayObject ? "Yes" : "No"); }
                });
            }
            title = INSPECTOR.Helpers.CreateDiv('stat-title2', _this._panel);
            title.textContent = "Caps.";
            {
                var elemLabel = _this._createStatLabel("Stencil", _this._panel);
                var elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return (_this._engine.isStencilEnable ? "Enabled" : "Disabled"); }
                });
                elemLabel = _this._createStatLabel("Max textures units", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._engine.getCaps().maxTexturesImageUnits.toString(); }
                });
                elemLabel = _this._createStatLabel("Max textures size", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._engine.getCaps().maxTextureSize.toString(); }
                });
                elemLabel = _this._createStatLabel("Max anisotropy", _this._panel);
                elemValue = INSPECTOR.Helpers.CreateDiv('stat-value', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return _this._engine.getCaps().maxAnisotropy.toString(); }
                });
            }
            title = INSPECTOR.Helpers.CreateDiv('stat-title2', _this._panel);
            title.textContent = "Info";
            {
                var elemValue = INSPECTOR.Helpers.CreateDiv('stat-infos', _this._panel);
                _this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: function () { return "WebGL v" + _this._engine.webGLVersion + " - " + _this._glInfo.version + " - " + _this._glInfo.renderer; }
                });
            }
            // Register the update loop
            _this._scene.registerAfterRender(_this._updateLoopHandler);
            return _this;
        }
        StatsTab.prototype._createStatLabel = function (content, parent) {
            var elem = INSPECTOR.Helpers.CreateDiv('stat-label', parent);
            elem.textContent = content;
            return elem;
        };
        /** Update each properties of the stats panel */
        StatsTab.prototype._update = function () {
            for (var _i = 0, _a = this._updatableProperties; _i < _a.length; _i++) {
                var prop = _a[_i];
                prop.elem.textContent = prop.updateFct();
            }
        };
        StatsTab.prototype.dispose = function () {
            this._scene.unregisterAfterRender(this._updateLoopHandler);
        };
        return StatsTab;
    }(INSPECTOR.Tab));
    INSPECTOR.StatsTab = StatsTab;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * A tab bar will contains each view the inspector can have : Canvas2D, Meshes...
     * The default active tab is the first one of the list.
     */
    var TabBar = (function (_super) {
        __extends(TabBar, _super);
        function TabBar(inspector, initialTab) {
            var _this = _super.call(this) || this;
            // The list of available tabs
            _this._tabs = [];
            /** The list of tab displayed by clicking on the remainingIcon */
            _this._invisibleTabs = [];
            /** The list of tabs visible, displayed in the tab bar */
            _this._visibleTabs = [];
            _this._inspector = inspector;
            _this._tabs.push(new INSPECTOR.SceneTab(_this, _this._inspector));
            _this._tabs.push(new INSPECTOR.ConsoleTab(_this, _this._inspector));
            _this._tabs.push(new INSPECTOR.StatsTab(_this, _this._inspector));
            _this._meshTab = new INSPECTOR.MeshTab(_this, _this._inspector);
            _this._tabs.push(new INSPECTOR.TextureTab(_this, _this._inspector));
            _this._tabs.push(_this._meshTab);
            _this._tabs.push(new INSPECTOR.ShaderTab(_this, _this._inspector));
            _this._tabs.push(new INSPECTOR.LightTab(_this, _this._inspector));
            _this._tabs.push(new INSPECTOR.MaterialTab(_this, _this._inspector));
            if (BABYLON.GUI) {
                _this._tabs.push(new INSPECTOR.GUITab(_this, _this._inspector));
            }
            _this._tabs.push(new INSPECTOR.PhysicsTab(_this, _this._inspector));
            _this._tabs.push(new INSPECTOR.CameraTab(_this, _this._inspector));
            _this._tabs.push(new INSPECTOR.SoundTab(_this, _this._inspector));
            _this._toolBar = new INSPECTOR.Toolbar(_this._inspector);
            _this._build();
            //Check initialTab is defined and between tabs bounds
            if (!initialTab || initialTab < 0 || initialTab >= _this._tabs.length) {
                initialTab = 0;
                console.warn('');
            }
            _this._tabs[initialTab].active(true);
            // set all tab as visible
            for (var _i = 0, _a = _this._tabs; _i < _a.length; _i++) {
                var tab = _a[_i];
                _this._visibleTabs.push(tab);
            }
            return _this;
        }
        // No update
        TabBar.prototype.update = function () { };
        TabBar.prototype._build = function () {
            var _this = this;
            this._div.className = 'tabbar';
            this._div.appendChild(this._toolBar.toHtml());
            for (var _i = 0, _a = this._tabs; _i < _a.length; _i++) {
                var tab = _a[_i];
                this._div.appendChild(tab.toHtml());
            }
            this._moreTabsIcon = INSPECTOR.Helpers.CreateElement('i', 'fa fa-angle-double-right more-tabs');
            this._moreTabsPanel = INSPECTOR.Helpers.CreateDiv('more-tabs-panel');
            this._moreTabsIcon.addEventListener('click', function () {
                // Hide the 'more-tabs-panel' if already displayed 
                if (_this._moreTabsPanel.style.display == 'flex') {
                    _this._moreTabsPanel.style.display = 'none';
                }
                else {
                    // Attach more-tabs-panel if not attached yet
                    var topPanel = _this._div.parentNode;
                    if (!topPanel.contains(_this._moreTabsPanel)) {
                        topPanel.appendChild(_this._moreTabsPanel);
                    }
                    // Clean the 'more-tabs-panel'
                    INSPECTOR.Helpers.CleanDiv(_this._moreTabsPanel);
                    // Add each invisible tabs to this panel
                    for (var _i = 0, _a = _this._invisibleTabs; _i < _a.length; _i++) {
                        var tab = _a[_i];
                        _this._addInvisibleTabToPanel(tab);
                    }
                    // And display it
                    _this._moreTabsPanel.style.display = 'flex';
                }
            });
        };
        /**
         * Add a tab to the 'more-tabs' panel, displayed by clicking on the
         * 'more-tabs' icon
         */
        TabBar.prototype._addInvisibleTabToPanel = function (tab) {
            var _this = this;
            var div = INSPECTOR.Helpers.CreateDiv('invisible-tab', this._moreTabsPanel);
            div.textContent = tab.name;
            div.addEventListener('click', function () {
                _this._moreTabsPanel.style.display = 'none';
                _this.switchTab(tab);
            });
        };
        /** Dispose the current tab, set the given tab as active, and refresh the treeview */
        TabBar.prototype.switchTab = function (tab) {
            // Dispose the active tab
            this.getActiveTab().dispose();
            // Deactivate all tabs
            for (var _i = 0, _a = this._tabs; _i < _a.length; _i++) {
                var t = _a[_i];
                t.active(false);
            }
            // activate the given tab
            tab.active(true);
            // Refresh the inspector
            this._inspector.refresh();
        };
        /** Display the mesh tab.
         * If a parameter is given, the given mesh details are displayed
         */
        TabBar.prototype.switchMeshTab = function (mesh) {
            this.switchTab(this._meshTab);
            if (mesh) {
                var item = this._meshTab.getItemFor(mesh);
                this._meshTab.select(item);
            }
        };
        /** Returns the active tab */
        TabBar.prototype.getActiveTab = function () {
            for (var _i = 0, _a = this._tabs; _i < _a.length; _i++) {
                var tab = _a[_i];
                if (tab.isActive()) {
                    return tab;
                }
            }
        };
        TabBar.prototype.getActiveTabIndex = function () {
            for (var i = 0; i < this._tabs.length; i++) {
                if (this._tabs[i].isActive()) {
                    return i;
                }
            }
            return 0;
        };
        Object.defineProperty(TabBar.prototype, "inspector", {
            get: function () {
                return this._inspector;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns the total width in pixel of the tabbar,
         * that corresponds to the sum of the width of each visible tab + toolbar width
        */
        TabBar.prototype.getPixelWidth = function () {
            var sum = 0;
            for (var _i = 0, _a = this._visibleTabs; _i < _a.length; _i++) {
                var tab = _a[_i];
                sum += tab.getPixelWidth();
            }
            sum += this._toolBar.getPixelWidth();
            if (this._div.contains(this._moreTabsIcon)) {
                sum += 30; // $tabbarheight
            }
            return sum;
        };
        /** Display the remaining icon or not depending on the tabbar width.
         * This function should be called each time the inspector width is updated
         */
        TabBar.prototype.updateWidth = function () {
            var parentSize = this._div.parentElement.clientWidth;
            var lastTabWidth = 75;
            var currentSize = this.getPixelWidth();
            // Check if a tab should be removed : if the tab bar width is greater than
            // its parent width
            while (this._visibleTabs.length > 0 && currentSize > parentSize) {
                // Start by the last element
                var tab = this._visibleTabs.pop();
                // set it invisible
                this._invisibleTabs.push(tab);
                // and removes it from the DOM
                this._div.removeChild(tab.toHtml());
                currentSize = this.getPixelWidth() + lastTabWidth;
            }
            // Check if a tab can be added to the tab bar : if the tab bar width
            // + 100 (at least 100px is needed to add a tab) is less than its parent width
            if (this._invisibleTabs.length > 0) {
                if (currentSize + lastTabWidth < parentSize) {
                    var lastTab = this._invisibleTabs.pop();
                    this._div.appendChild(lastTab.toHtml());
                    this._visibleTabs.push(lastTab);
                    // Update more-tab icon in last position if needed
                    if (this._div.contains(this._moreTabsIcon)) {
                        this._div.removeChild(this._moreTabsIcon);
                    }
                }
            }
            if (this._invisibleTabs.length > 0 && !this._div.contains(this._moreTabsIcon)) {
                this._div.appendChild(this._moreTabsIcon);
            }
        };
        return TabBar;
    }(INSPECTOR.BasicElement));
    INSPECTOR.TabBar = TabBar;
})(INSPECTOR || (INSPECTOR = {}));

var INSPECTOR;
(function (INSPECTOR) {
    var AbstractTool = (function () {
        function AbstractTool(icon, parent, inspector, tooltip) {
            var _this = this;
            this._inspector = inspector;
            this._elem = INSPECTOR.Inspector.DOCUMENT.createElement('i');
            this._elem.className = "tool fa " + icon;
            parent.appendChild(this._elem);
            this._elem.addEventListener('click', function (e) {
                _this.action();
            });
            new INSPECTOR.Tooltip(this._elem, tooltip);
        }
        AbstractTool.prototype.toHtml = function () {
            return this._elem;
        };
        /**
         * Returns the total width in pixel of this tool, 0 by default
        */
        AbstractTool.prototype.getPixelWidth = function () {
            var style = INSPECTOR.Inspector.WINDOW.getComputedStyle(this._elem);
            var left = parseFloat(style.marginLeft.substr(0, style.marginLeft.length - 2)) || 0;
            var right = parseFloat(style.marginRight.substr(0, style.marginRight.length - 2)) || 0;
            return (this._elem.clientWidth || 0) + left + right;
        };
        /**
         * Updates the icon of this tool with the given string
         */
        AbstractTool.prototype._updateIcon = function (icon) {
            this._elem.className = "tool fa " + icon;
        };
        return AbstractTool;
    }());
    INSPECTOR.AbstractTool = AbstractTool;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var PauseScheduleTool = (function (_super) {
        __extends(PauseScheduleTool, _super);
        function PauseScheduleTool(parent, inspector) {
            var _this = _super.call(this, 'fa-pause', parent, inspector, 'Pause the automatic update of properties') || this;
            _this._isPause = false;
            return _this;
        }
        // Action : refresh the whole panel
        PauseScheduleTool.prototype.action = function () {
            if (this._isPause) {
                INSPECTOR.Scheduler.getInstance().pause = false;
                this._updateIcon('fa-pause');
            }
            else {
                INSPECTOR.Scheduler.getInstance().pause = true;
                this._updateIcon('fa-play');
            }
            this._isPause = !this._isPause;
        };
        return PauseScheduleTool;
    }(INSPECTOR.AbstractTool));
    INSPECTOR.PauseScheduleTool = PauseScheduleTool;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var PickTool = (function (_super) {
        __extends(PickTool, _super);
        function PickTool(parent, inspector) {
            var _this = _super.call(this, 'fa-mouse-pointer', parent, inspector, 'Select a mesh in the scene') || this;
            _this._isActive = false;
            // Create handler
            _this._pickHandler = _this._pickMesh.bind(_this);
            return _this;
        }
        // Action : find the corresponding tree item in the correct tab and display it
        PickTool.prototype.action = function () {
            if (this._isActive) {
                this._deactivate();
            }
            else {
                this.toHtml().classList.add('active');
                // Add event handler : pick on a mesh in the scene
                this._inspector.scene.getEngine().getRenderingCanvas().addEventListener('click', this._pickHandler);
                this._isActive = true;
            }
        };
        /** Deactivate this tool */
        PickTool.prototype._deactivate = function () {
            this.toHtml().classList.remove('active');
            // Remove event handler
            this._inspector.scene.getEngine().getRenderingCanvas().removeEventListener('click', this._pickHandler);
            this._isActive = false;
        };
        /** Pick a mesh in the scene */
        PickTool.prototype._pickMesh = function (evt) {
            var pos = this._updatePointerPosition(evt);
            var pi = this._inspector.scene.pick(pos.x, pos.y, function (mesh) { return true; });
            if (pi.pickedMesh) {
                this._inspector.displayObjectDetails(pi.pickedMesh);
            }
            this._deactivate();
        };
        PickTool.prototype._updatePointerPosition = function (evt) {
            var canvasRect = this._inspector.scene.getEngine().getRenderingCanvasClientRect();
            var pointerX = evt.clientX - canvasRect.left;
            var pointerY = evt.clientY - canvasRect.top;
            return { x: pointerX, y: pointerY };
        };
        ;
        return PickTool;
    }(INSPECTOR.AbstractTool));
    INSPECTOR.PickTool = PickTool;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var PopupTool = (function (_super) {
        __extends(PopupTool, _super);
        function PopupTool(parent, inspector) {
            return _super.call(this, 'fa-external-link', parent, inspector, 'Open the inspector in a popup') || this;
        }
        // Action : refresh the whole panel
        PopupTool.prototype.action = function () {
            this._inspector.openPopup();
        };
        return PopupTool;
    }(INSPECTOR.AbstractTool));
    INSPECTOR.PopupTool = PopupTool;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var RefreshTool = (function (_super) {
        __extends(RefreshTool, _super);
        function RefreshTool(parent, inspector) {
            return _super.call(this, 'fa-refresh', parent, inspector, 'Refresh the current tab') || this;
        }
        // Action : refresh the whole panel
        RefreshTool.prototype.action = function () {
            this._inspector.refresh();
        };
        return RefreshTool;
    }(INSPECTOR.AbstractTool));
    INSPECTOR.RefreshTool = RefreshTool;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var LabelTool = (function (_super) {
        __extends(LabelTool, _super);
        function LabelTool(parent, inspector) {
            var _this = _super.call(this, 'fa-tags', parent, inspector, 'Display mesh names on the canvas') || this;
            /** True if label are displayed, false otherwise */
            _this._isDisplayed = false;
            _this._advancedTexture = null;
            _this._labelInitialized = false;
            _this._scene = null;
            _this._guiLoaded = false;
            _this._scene = inspector.scene;
            return _this;
        }
        LabelTool.prototype.dispose = function () {
            if (this._advancedTexture) {
                this._advancedTexture.dispose();
            }
        };
        LabelTool.prototype._checkGUILoaded = function () {
            if (this._guiLoaded === true) {
                return true;
            }
            if (BABYLON.GUI) {
                this._guiLoaded = true;
            }
            return this._guiLoaded;
        };
        LabelTool.prototype._initializeLabels = function () {
            var _this = this;
            // Check if the label are already initialized and quit if it's the case
            if (this._labelInitialized) {
                return;
            }
            // Can't initialize them if the GUI lib is not loaded yet
            if (!this._checkGUILoaded()) {
                return;
            }
            // Create the canvas that will be used to display the labels
            this._advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            // Create label for all the Meshes, Lights and Cameras
            // Those that will be created/removed after this method is called will be taken care by the event handlers added below
            for (var _i = 0, _a = this._scene.meshes; _i < _a.length; _i++) {
                var m = _a[_i];
                this._createLabel(m);
            }
            this._scene.onNewMeshAddedObservable.add(function (m, s) {
                _this._createLabel(m);
            });
            this._scene.onMeshRemovedObservable.add(function (m, s) {
                _this._removeLabel(m);
            });
            this._labelInitialized = true;
        };
        LabelTool.prototype._createLabel = function (mesh) {
            // Don't create label for "system nodes" (starting and ending with ###)
            var name = mesh.name;
            if (INSPECTOR.Helpers.IsSystemName(name)) {
                return;
            }
            if (mesh) {
                var rect1 = new BABYLON.GUI.Rectangle();
                rect1.width = 4 + 10 * name.length + "px";
                rect1.height = "22px";
                rect1.background = "rgba(0,0,0,0.6)";
                rect1.color = "black";
                this._advancedTexture.addControl(rect1);
                var label = new BABYLON.GUI.TextBlock();
                label.text = name;
                label.fontSize = 12;
                rect1.addControl(label);
                rect1.linkWithMesh(mesh);
            }
        };
        LabelTool.prototype._removeLabel = function (mesh) {
            for (var _i = 0, _a = this._advancedTexture._rootContainer.children; _i < _a.length; _i++) {
                var g = _a[_i];
                var ed = g._linkedMesh;
                if (ed === mesh) {
                    this._advancedTexture.removeControl(g);
                    break;
                }
            }
        };
        // Action : Display/hide mesh names on the canvas
        LabelTool.prototype.action = function () {
            // Don't toggle if the script is not loaded
            if (!this._checkGUILoaded()) {
                return;
            }
            // Toggle the label display state
            this._isDisplayed = !this._isDisplayed;
            // Check if we have to display the labels
            if (this._isDisplayed) {
                this._initializeLabels();
                this._advancedTexture._rootContainer.isVisible = true;
            }
            else {
                this._advancedTexture._rootContainer.isVisible = false;
            }
        };
        return LabelTool;
    }(INSPECTOR.AbstractTool));
    INSPECTOR.LabelTool = LabelTool;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var Toolbar = (function (_super) {
        __extends(Toolbar, _super);
        function Toolbar(inspector) {
            var _this = _super.call(this) || this;
            _this._tools = [];
            _this._inspector = inspector;
            _this._build();
            _this._addTools();
            return _this;
        }
        // A toolbar cannot be updated
        Toolbar.prototype.update = function () { };
        ;
        Toolbar.prototype._build = function () {
            this._div.className = 'toolbar';
        };
        ;
        Toolbar.prototype._addTools = function () {
            // Refresh
            this._tools.push(new INSPECTOR.RefreshTool(this._div, this._inspector));
            // Display labels
            this._tools.push(new INSPECTOR.LabelTool(this._div, this._inspector));
            // Pick object
            this._tools.push(new INSPECTOR.PickTool(this._div, this._inspector));
            // Add the popup mode only if the inspector is not in popup mode and if the brower is not edge
            // Edge is 
            if (!this._inspector.popupMode && !INSPECTOR.Helpers.IsBrowserEdge()) {
                this._tools.push(new INSPECTOR.PopupTool(this._div, this._inspector));
            }
            // Pause schedule
            this._tools.push(new INSPECTOR.PauseScheduleTool(this._div, this._inspector));
            // Pause schedule
            this._tools.push(new INSPECTOR.DisposeTool(this._div, this._inspector));
        };
        /**
         * Returns the total width in pixel of the tabbar,
         * that corresponds to the sum of the width of each tab + toolbar width
        */
        Toolbar.prototype.getPixelWidth = function () {
            var sum = 0;
            for (var _i = 0, _a = this._tools; _i < _a.length; _i++) {
                var tool = _a[_i];
                sum += tool.getPixelWidth();
            }
            return sum;
        };
        return Toolbar;
    }(INSPECTOR.BasicElement));
    INSPECTOR.Toolbar = Toolbar;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * Removes the inspector panel
     */
    var DisposeTool = (function (_super) {
        __extends(DisposeTool, _super);
        function DisposeTool(parent, inspector) {
            return _super.call(this, 'fa-times', parent, inspector, 'Close the inspector panel') || this;
        }
        // Action : refresh the whole panel
        DisposeTool.prototype.action = function () {
            this._inspector.dispose();
        };
        return DisposeTool;
    }(INSPECTOR.AbstractTool));
    INSPECTOR.DisposeTool = DisposeTool;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var TreeItem = (function (_super) {
        __extends(TreeItem, _super);
        function TreeItem(tab, obj) {
            var _this = _super.call(this) || this;
            _this.children = [];
            _this._tab = tab;
            _this._adapter = obj;
            _this._tools = _this._adapter.getTools();
            _this._build();
            return _this;
        }
        Object.defineProperty(TreeItem.prototype, "id", {
            /** Returns the item ID == its adapter ID */
            get: function () {
                return this._adapter.id();
            },
            enumerable: true,
            configurable: true
        });
        /** Add the given item as a child of this one */
        TreeItem.prototype.add = function (child) {
            this.children.push(child);
            this.update();
        };
        Object.defineProperty(TreeItem.prototype, "adapter", {
            /**
             * Returns the original adapter
             */
            get: function () {
                return this._adapter;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Function used to compare this item to another tree item.
         * Returns the alphabetical sort of the adapter ID
         */
        TreeItem.prototype.compareTo = function (item) {
            var str1 = this.id;
            var str2 = item.id;
            return str1.localeCompare(str2, [], { numeric: true });
        };
        /** Returns true if the given obj correspond to the adapter linked to this tree item */
        TreeItem.prototype.correspondsTo = function (obj) {
            return this._adapter.correspondsTo(obj);
        };
        /** hide all children of this item */
        TreeItem.prototype.fold = function () {
            // Do nothing id no children
            if (this.children.length > 0) {
                for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                    var elem = _a[_i];
                    elem.toHtml().style.display = 'none';
                }
                this._div.classList.add('folded');
                this._div.classList.remove('unfolded');
            }
        };
        /** Show all children of this item */
        TreeItem.prototype.unfold = function () {
            // Do nothing id no children
            if (this.children.length > 0) {
                for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                    var elem = _a[_i];
                    elem.toHtml().style.display = 'block';
                }
                this._div.classList.add('unfolded');
                this._div.classList.remove('folded');
            }
        };
        /** Build the HTML of this item */
        TreeItem.prototype._build = function () {
            this._div.className = 'line';
            for (var _i = 0, _a = this._tools; _i < _a.length; _i++) {
                var tool = _a[_i];
                this._div.appendChild(tool.toHtml());
            }
            // Id
            var text = INSPECTOR.Inspector.DOCUMENT.createElement('span');
            text.textContent = this._adapter.id();
            this._div.appendChild(text);
            // Type
            var type = INSPECTOR.Inspector.DOCUMENT.createElement('span');
            type.className = 'property-type';
            if (this._adapter.type() !== 'type_not_defined') {
                type.textContent = ' - ' + this._adapter.type();
            }
            this._div.appendChild(type);
            this._lineContent = INSPECTOR.Helpers.CreateDiv('line-content', this._div);
            this._addEvent();
        };
        /**
         * Returns one HTML element (.details) containing all  details of this primitive
         */
        TreeItem.prototype.getDetails = function () {
            return this._adapter.getProperties();
        };
        TreeItem.prototype.update = function () {
            // Clean division holding all children
            INSPECTOR.Helpers.CleanDiv(this._lineContent);
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var child = _a[_i];
                var elem = child.toHtml();
                this._lineContent.appendChild(elem);
            }
            if (this.children.length > 0) {
                // Check if folded or not
                if (!this._div.classList.contains('folded') && !this._div.classList.contains('unfolded')) {
                    this._div.classList.add('folded');
                }
            }
            this.fold();
        };
        /**
         * Add an event listener on the item :
         * - one click display details
         * - on mouse hover the item is highlighted
         */
        TreeItem.prototype._addEvent = function () {
            var _this = this;
            this._div.addEventListener('click', function (e) {
                _this._tab.select(_this);
                // Fold/unfold the tree
                if (_this._isFolded()) {
                    _this.unfold();
                }
                else {
                    _this.fold();
                }
                e.stopPropagation();
            });
            // Highlight on mouse over
            this._div.addEventListener('mouseover', function (e) {
                _this._tab.highlightNode(_this);
                e.stopPropagation();
            });
            // Remove highlight on mouse out
            this._div.addEventListener('mouseout', function (e) {
                _this._tab.highlightNode();
            });
        };
        /** Highlight or downplay this node */
        TreeItem.prototype.highlight = function (b) {
            // Remove highlight for all children 
            if (!b) {
                for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    child._adapter.highlight(b);
                }
            }
            // Highlight this node
            this._adapter.highlight(b);
        };
        /** Returns true if the node is folded, false otherwise */
        TreeItem.prototype._isFolded = function () {
            return !this._div.classList.contains('unfolded');
        };
        /** Set this item as active (background lighter) in the tree panel */
        TreeItem.prototype.active = function (b) {
            this._div.classList.remove('active');
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var child = _a[_i];
                child.active(false);
            }
            if (b) {
                this._div.classList.add('active');
            }
        };
        return TreeItem;
    }(INSPECTOR.BasicElement));
    INSPECTOR.TreeItem = TreeItem;
})(INSPECTOR || (INSPECTOR = {}));

var INSPECTOR;
(function (INSPECTOR) {
    var AbstractTreeTool = (function () {
        function AbstractTreeTool() {
            /** Is the tool enabled ? */
            this._on = false;
            this._elem = INSPECTOR.Inspector.DOCUMENT.createElement('i');
            this._elem.className = 'treeTool fa';
            this._addEvents();
        }
        AbstractTreeTool.prototype.toHtml = function () {
            return this._elem;
        };
        AbstractTreeTool.prototype._addEvents = function () {
            var _this = this;
            this._elem.addEventListener('click', function (e) {
                _this.action();
                e.stopPropagation();
            });
        };
        /**
         * Action launched when clicked on this element
         * Should be overrided
         */
        AbstractTreeTool.prototype.action = function () {
            this._on = !this._on;
        };
        return AbstractTreeTool;
    }());
    INSPECTOR.AbstractTreeTool = AbstractTreeTool;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * Checkbox to display/hide the primitive
     */
    var BoundingBox = (function (_super) {
        __extends(BoundingBox, _super);
        function BoundingBox(obj) {
            var _this = _super.call(this) || this;
            _this._obj = obj;
            _this._elem.classList.add('fa-square-o');
            _this._on = _this._obj.isBoxVisible();
            _this._check();
            return _this;
        }
        // For a checkbox, set visible/invisible the corresponding prim
        BoundingBox.prototype.action = function () {
            _super.prototype.action.call(this);
            // update object and gui according to the new status
            this._check();
        };
        BoundingBox.prototype._check = function () {
            if (this._on) {
                // set icon eye
                this._elem.classList.add('active');
            }
            else {
                // set icon eye-slash
                this._elem.classList.remove('active');
            }
            this._obj.setBoxVisible(this._on);
        };
        return BoundingBox;
    }(INSPECTOR.AbstractTreeTool));
    INSPECTOR.BoundingBox = BoundingBox;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
     *
     */
    var CameraPOV = (function (_super) {
        __extends(CameraPOV, _super);
        function CameraPOV(camera) {
            var _this = _super.call(this) || this;
            _this.cameraPOV = camera;
            _this._elem.classList.add('fa-video-camera');
            return _this;
        }
        CameraPOV.prototype.action = function () {
            _super.prototype.action.call(this);
            this._gotoPOV();
        };
        CameraPOV.prototype._gotoPOV = function () {
            var actives = INSPECTOR.Inspector.DOCUMENT.querySelectorAll(".fa-video-camera.active");
            console.log(actives);
            for (var i = 0; i < actives.length; i++) {
                actives[i].classList.remove('active');
            }
            //if (this._on) {
            // set icon camera
            this._elem.classList.add('active');
            //}
            this.cameraPOV.setPOV();
        };
        return CameraPOV;
    }(INSPECTOR.AbstractTreeTool));
    INSPECTOR.CameraPOV = CameraPOV;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
     *
     */
    var SoundInteractions = (function (_super) {
        __extends(SoundInteractions, _super);
        function SoundInteractions(playSound) {
            var _this = _super.call(this) || this;
            _this.playSound = playSound;
            _this.b = false;
            _this._elem.classList.add('fa-play');
            return _this;
        }
        SoundInteractions.prototype.action = function () {
            _super.prototype.action.call(this);
            this._playSound();
        };
        SoundInteractions.prototype._playSound = function () {
            var _this = this;
            if (this._elem.classList.contains('fa-play')) {
                this._elem.classList.remove('fa-play');
                this._elem.classList.add('fa-pause');
            }
            else {
                this._elem.classList.remove('fa-pause');
                this._elem.classList.add('fa-play');
            }
            this.playSound.setPlaying(function () {
                _this._elem.classList.remove('fa-pause');
                _this._elem.classList.add('fa-play');
            });
        };
        return SoundInteractions;
    }(INSPECTOR.AbstractTreeTool));
    INSPECTOR.SoundInteractions = SoundInteractions;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * Checkbox to display/hide the primitive
     */
    var Checkbox = (function (_super) {
        __extends(Checkbox, _super);
        function Checkbox(obj) {
            var _this = _super.call(this) || this;
            _this._obj = obj;
            _this._elem.classList.add('fa-eye');
            _this._on = _this._obj.isVisible();
            _this._check(true);
            return _this;
        }
        // For a checkbox, set visible/invisible the corresponding prim
        Checkbox.prototype.action = function () {
            _super.prototype.action.call(this);
            // update object and gui according to the new status
            this._check();
        };
        Checkbox.prototype._check = function (dontEnable) {
            if (this._on) {
                // set icon eye
                this._elem.classList.add('fa-eye');
                this._elem.classList.add('active');
                this._elem.classList.remove('fa-eye-slash');
            }
            else {
                // set icon eye-slash
                this._elem.classList.remove('fa-eye');
                this._elem.classList.remove('active');
                this._elem.classList.add('fa-eye-slash');
            }
            if (!dontEnable) {
                this._obj.setVisible(this._on);
            }
        };
        return Checkbox;
    }(INSPECTOR.AbstractTreeTool));
    INSPECTOR.Checkbox = Checkbox;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    var DebugArea = (function (_super) {
        __extends(DebugArea, _super);
        function DebugArea(obj) {
            var _this = _super.call(this) || this;
            _this._obj = obj;
            _this._elem.classList.add('fa-wrench');
            return _this;
        }
        DebugArea.prototype.action = function () {
            _super.prototype.action.call(this);
            if (this._on) {
                // set icon activated
                this._elem.classList.add('active');
            }
            else {
                // set icon deactivated
                this._elem.classList.remove('active');
            }
            this._obj.debug(this._on);
        };
        return DebugArea;
    }(INSPECTOR.AbstractTreeTool));
    INSPECTOR.DebugArea = DebugArea;
})(INSPECTOR || (INSPECTOR = {}));

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var INSPECTOR;
(function (INSPECTOR) {
    /**
     * Checkbox to display/hide the primitive
     */
    var Info = (function (_super) {
        __extends(Info, _super);
        function Info(obj) {
            var _this = _super.call(this) || this;
            _this._obj = obj;
            _this._elem.classList.add('fa-info-circle');
            _this._tooltip = new INSPECTOR.Tooltip(_this._elem, _this._obj.getInfo(), _this._elem);
            return _this;
        }
        // Nothing to do on click
        Info.prototype.action = function () {
            _super.prototype.action.call(this);
        };
        return Info;
    }(INSPECTOR.AbstractTreeTool));
    INSPECTOR.Info = Info;
})(INSPECTOR || (INSPECTOR = {}));
