var ActionsBuilder;
(function (ActionsBuilder) {
    var Parameters = (function () {
        function Parameters(viewer) {
            var _this = this;
            this._action = null;
            this.parametersContainer = document.getElementById("ParametersElementID");
            this.parametersHelpElement = document.getElementById("ParametersHelpElementID");
            this._viewer = viewer;
            window.addEventListener("resize", function (event) {
                _this.onResize(event);
            });
        }
        Parameters.prototype.clearParameters = function () {
            if (this.parametersContainer.children === null) {
                return;
            }
            while (this.parametersContainer.children.length > 0) {
                this.parametersContainer.removeChild(this.parametersContainer.firstChild);
            }
        };
        Parameters.prototype.createParameters = function (action) {
            this._action = action;
            this.clearParameters();
            if (action === null) {
                return;
            }
            this._createHelpSection(action);
            this._createNodeSection(action);
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
            for (var i = 0; i < properties.length; i++) {
                var separator = document.createElement("hr");
                separator.noShade = true;
                separator.className = "ParametersElementSeparatorClass";
                this.parametersContainer.appendChild(separator);
                var parameterName = document.createElement("a");
                parameterName.text = properties[i].text;
                parameterName.className = "ParametersElementTitleClass";
                this.parametersContainer.appendChild(parameterName);
                if (properties[i].text === "parameter" || properties[i].text === "target" || properties[i].text === "parent") {
                    targetParameterSelect = document.createElement("select");
                    targetParameterSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(targetParameterSelect);
                    targetParameterNameSelect = document.createElement("select");
                    targetParameterNameSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(targetParameterNameSelect);
                    (this._parameterTargetChanged(targetParameterSelect, targetParameterNameSelect, propertyPathSelect, propertyPathOptionalSelect, i))(null);
                    targetParameterSelect.value = propertiesResults[i].targetType;
                    targetParameterNameSelect.value = propertiesResults[i].value;
                    targetParameterSelect.onchange = this._parameterTargetChanged(targetParameterSelect, targetParameterNameSelect, propertyPathSelect, propertyPathOptionalSelect, i);
                    targetParameterNameSelect.onchange = this._parameterTargetNameChanged(targetParameterSelect, targetParameterNameSelect, i);
                }
                else if (properties[i].text === "propertyPath") {
                    propertyPathIndice = i;
                    propertyPathSelect = document.createElement("select");
                    propertyPathSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(propertyPathSelect);
                    propertyPathOptionalSelect = document.createElement("select");
                    propertyPathOptionalSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(propertyPathOptionalSelect);
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
                    (this._conditionOperatorSelectChanged(conditionOperatorSelect, i))(null);
                    conditionOperatorSelect.value = propertiesResults[i].value;
                    conditionOperatorSelect.onchange = this._conditionOperatorSelectChanged(conditionOperatorSelect, i);
                }
                else if (properties[i].text === "sound") {
                    var soundSelect = document.createElement("select");
                    soundSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(soundSelect);
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
                    (this._booleanSelectChanged(booleanSelect, i))(null);
                    booleanSelect.value = propertiesResults[i].value;
                    booleanSelect.onchange = this._booleanSelectChanged(booleanSelect, i);
                    propertyInput = document.createElement("input");
                    propertyInput.value = propertiesResults[i].value;
                    propertyInput.className = "ParametersElementInputClass";
                    this.parametersContainer.appendChild(propertyInput);
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
        Parameters.prototype.onResize = function (event) {
            var tools = document.getElementById("ToolsButtonsID");
            this.parametersContainer.style.height = window.innerHeight - tools.getBoundingClientRect().height - 25 - 200 + "px";
            this.parametersHelpElement.style.height = 200 + "px";
        };
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
        Parameters.prototype._propertyInputChanged = function (propertyInput, indice) {
            var _this = this;
            return function (ev) {
                _this._action.propertiesResults[indice].value = propertyInput.value;
            };
        };
        Parameters.prototype._propertyPathSelectChanged = function (targetParameterSelect, propertyPathSelect, additionalPropertyPathSelect, booleanSelect, propertyInput, indice) {
            var _this = this;
            return function (event) {
                if (propertyPathSelect.options.length === 0) {
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
                _this._fillAdditionalPropertyPath(targetParameterSelect, propertyPathSelect, additionalPropertyPathSelect);
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
        Parameters.prototype._parameterTargetChanged = function (targetParameterSelect, targetParameterNameSelect, propertyPathSelect, additionalPropertyPathSelect, indice) {
            var _this = this;
            return function (event) {
                if (targetParameterSelect.options.length === 0) {
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
                        _this._action.propertiesResults[indice + 1].value = "";
                    }
                }
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
                if (propertyPathSelect !== null) {
                    propertyPathSelect.options.length = 0;
                    additionalPropertyPathSelect.options.length = 0;
                    _this._propertyPathSelectChanged(targetParameterSelect, propertyPathSelect, additionalPropertyPathSelect, null, null, indice + 1)(null);
                }
                _this._sortList(targetParameterNameSelect);
                _this._sortList(targetParameterSelect);
            };
        };
        Parameters.prototype._parameterTargetNameChanged = function (targetParameterSelect, targetParameterNameSelect, indice) {
            var _this = this;
            return function (event) {
                _this._action.propertiesResults[indice].value = targetParameterNameSelect.value;
            };
        };
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
        Parameters.prototype._createHelpSection = function (action) {
            var element = ActionsBuilder.Elements.GetElementFromName(action.name);
            if (element !== null) {
                this.parametersHelpElement.textContent = element.description;
            }
        };
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
