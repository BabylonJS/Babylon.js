module ActionsBuilder {
    export class Parameters {
        public parametersContainer: HTMLElement;
        public parametersHelpElement: HTMLElement;

        private _action: Action = null;
        private _viewer: Viewer;
        private _currentObject: any;

        /*
        * Constructor
        */
        constructor(viewer: Viewer) {
            // Get HTML elements
            this.parametersContainer = document.getElementById("ParametersElementID");
            this.parametersHelpElement = document.getElementById("ParametersHelpElementID");

            // Configure this
            this._viewer = viewer;

            // Configure events
            window.addEventListener("resize", (event: Event) => {
                this.onResize(event);
            });
        }

        /*
        * Clears the parameters fileds in the parameters view
        */
        public clearParameters(): void {
            if (this.parametersContainer.children === null) {
                return;
            }

            while (this.parametersContainer.children.length > 0) {
                this.parametersContainer.removeChild(this.parametersContainer.firstChild);
            }
        }

        /*
        * Creates parameters fields
        * @param action: the action to configure
        */
        public createParameters(action: Action): void {
            // Clear parameters fields and draw help description
            this._action = action;
            this.clearParameters();

            if (action === null) {
                return;
            }

            this._createHelpSection(action);
            this._createNodeSection(action);

            // Get properties
            var properties = action.properties;
            var propertiesResults = action.propertiesResults;

            var targetParameterSelect: HTMLSelectElement = null;
            var targetParameterNameSelect: HTMLSelectElement = null;
            var propertyPathSelect: HTMLSelectElement = null;
            var propertyPathOptionalSelect: HTMLSelectElement = null;

            var booleanSelect: HTMLSelectElement = null;
            var propertyInput: HTMLInputElement = null;

            var propertyPathIndice = -1;

            if (properties.length === 0) {
                return;
            }

            // Draw properties
            for (var i = 0; i < properties.length; i++) {
                // Create separator
                var separator = document.createElement("hr");
                separator.noShade = true;
                separator.className = "ParametersElementSeparatorClass";
                this.parametersContainer.appendChild(separator);

                // Create parameter text
                var parameterName = document.createElement("a");
                parameterName.text = properties[i].text;
                parameterName.className = "ParametersElementTitleClass";
                this.parametersContainer.appendChild(parameterName);

                if (properties[i].text === "parameter" || properties[i].text === "target" || properties[i].text === "parent") {
                    // Create target select element
                    targetParameterSelect = document.createElement("select");
                    targetParameterSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(targetParameterSelect);

                    // Create target name select element
                    targetParameterNameSelect = document.createElement("select");
                    targetParameterNameSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(targetParameterNameSelect);

                    // Events and configure
                    (this._parameterTargetChanged(targetParameterSelect, targetParameterNameSelect, propertyPathSelect, propertyPathOptionalSelect, i))(null);
                    targetParameterSelect.value = propertiesResults[i].targetType;
                    targetParameterNameSelect.value = propertiesResults[i].value;

                    targetParameterSelect.onchange = this._parameterTargetChanged(targetParameterSelect, targetParameterNameSelect, propertyPathSelect, propertyPathOptionalSelect, i);
                    targetParameterNameSelect.onchange = this._parameterTargetNameChanged(targetParameterSelect, targetParameterNameSelect, i);
                }
                else if (properties[i].text === "propertyPath") {
                    propertyPathIndice = i;

                    // Create property path select
                    propertyPathSelect = document.createElement("select");
                    propertyPathSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(propertyPathSelect);

                    // Create additional select
                    propertyPathOptionalSelect = document.createElement("select");
                    propertyPathOptionalSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(propertyPathOptionalSelect);

                    // Events and configure
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

                    // Configure event
                    (this._conditionOperatorSelectChanged(conditionOperatorSelect, i))(null);
                    conditionOperatorSelect.value = propertiesResults[i].value;
                    conditionOperatorSelect.onchange = this._conditionOperatorSelectChanged(conditionOperatorSelect, i);
                }
                else if (properties[i].text === "sound") {
                    var soundSelect = document.createElement("select");
                    soundSelect.className = "ParametersElementSelectClass";
                    this.parametersContainer.appendChild(soundSelect);

                    // Configure event
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

                    // Configure event
                    (this._booleanSelectChanged(booleanSelect, i))(null);
                    booleanSelect.value = propertiesResults[i].value;
                    booleanSelect.onchange = this._booleanSelectChanged(booleanSelect, i);

                    propertyInput = document.createElement("input");
                    propertyInput.value = propertiesResults[i].value;
                    propertyInput.className = "ParametersElementInputClass";
                    this.parametersContainer.appendChild(propertyInput);

                    // Configure event
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
        }

        /*
        * Resizes the parameters view
        * @param: the resize event
        */
        public onResize(event?: Event): void {
            var tools = document.getElementById("ToolsButtonsID");
            this.parametersContainer.style.height = window.innerHeight - tools.getBoundingClientRect().height - 25 - 200 + "px";

            this.parametersHelpElement.style.height = 200 + "px";
        }

        /*
        * Returns the boolean select change event
        * @param booleanSelect: the boolean select element
        * @param indice: the properties result indice
        */
        private _booleanSelectChanged(booleanSelect: HTMLSelectElement, indice: number): (ev: Event) => void {
            return (ev: Event) => {
                if (booleanSelect.options.length === 0) {
                    var values = ["true", "false"];
                    for (var i = 0; i < values.length; i++) {
                        var option = document.createElement("option");
                        option.value = option.text = values[i];
                        booleanSelect.options.add(option);
                    }
                }
                else {
                    this._action.propertiesResults[indice].value = booleanSelect.value;
                }
            };
        }

        /*
        * Returns the sound select change event
        * @param soundSelect: the sound select element
        * @param indice: the properties result indice
        */
        private _soundSelectChanged(soundSelect: HTMLSelectElement, indice: number): (ev: Event) => void {
            return (ev: Event) => {
                if (soundSelect.options.length === 0) {
                    for (var i = 0; i < SceneElements.SOUNDS.length; i++) {
                        var option = document.createElement("option");
                        option.value = option.text = SceneElements.SOUNDS[i];
                        soundSelect.options.add(option);
                    }

                    this._sortList(soundSelect);
                }
                else {
                    this._action.propertiesResults[indice].value = soundSelect.value;
                }
            };
        }

        /*
        * Returns the condition opeator select changed event
        * @param conditionOperatorSelect: the condition operator select element
        * @param indice: the properties result indice
        */
        private _conditionOperatorSelectChanged(conditionOperatorSelect: HTMLSelectElement, indice: number): (ev: Event) => void {
            return (ev: Event) => {
                if (conditionOperatorSelect.options.length === 0) {
                    for (var i = 0; i < SceneElements.OPERATORS.length; i++) {
                        var option = document.createElement("option");
                        option.value = option.text = SceneElements.OPERATORS[i];
                        conditionOperatorSelect.options.add(option);
                    }
                }
                else {
                    this._action.propertiesResults[indice].value = conditionOperatorSelect.value;
                }
            };
        }

        /*
        * Returns the property input changed event
        * @param propertyInput: the property input
        * @param indice: the properties result indice
        */
        private _propertyInputChanged(propertyInput: HTMLInputElement, indice: number): (ev: Event) => void {
            return (ev: Event) => {
                this._action.propertiesResults[indice].value = propertyInput.value;
            };
        }

        /*
        * Returns the propertyPath select changed event
        * @param targetParameterSelect: the target/parameter select element
        * @param propertyPathSelect: the propertyPath select element
        * @param additionalPropertyPathSelect: the additional propertyPath select element
        * @param indice: the properties indice in action.properties
        */
        private _propertyPathSelectChanged(targetParameterSelect: HTMLSelectElement, propertyPathSelect: HTMLSelectElement,
            additionalPropertyPathSelect: HTMLSelectElement, booleanSelect: HTMLSelectElement, propertyInput: HTMLInputElement,
            indice: number): (event: Event) => void
        {
            return (event: Event) => {
                if (propertyPathSelect.options.length === 0) {
                    // Configure start values
                    var properties = this._getPropertiesFromType(targetParameterSelect.value);

                    if (properties !== null) {
                        for (var i = 0; i < properties.length; i++) {
                            var option = document.createElement("option");
                            option.value = option.text = properties[i];
                            propertyPathSelect.options.add(option);
                        }
                    }

                } else {
                    // Set property
                    this._action.propertiesResults[indice].value = propertyPathSelect.value;

                    if (booleanSelect !== null && propertyInput !== null) {
                        var object = this._getObjectFromType(targetParameterSelect.value);
                        var isBoolean = false;

                        if (object !== null) {
                            var property = this._action.propertiesResults[indice].value.split(".");

                            for (var j = 0; j < property.length; j++) {
                                object = object[property[j]];
                                if (j === property.length - 1) {
                                    isBoolean = isBoolean || typeof object === "boolean";
                                }
                            }
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

                // Configure addition property
                this._fillAdditionalPropertyPath(targetParameterSelect, propertyPathSelect, additionalPropertyPathSelect);

                // Sort
                this._sortList(propertyPathSelect);
            };
        }

        private _fillAdditionalPropertyPath(targetParameterSelect: HTMLSelectElement, propertyPathSelect: HTMLSelectElement,
            additionalPropertyPathSelect: HTMLSelectElement): void
        {
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

            // Add options
            var emptyOption = document.createElement("option");
            emptyOption.value = emptyOption.text = "";
            additionalPropertyPathSelect.add(emptyOption);

            for (var thing in object) {
                var type = SceneElements.GetInstanceOf(object[thing]);
                var index = SceneElements.TYPES.indexOf(type);

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
        }

        /*
        * Returns the additional propertyPath select changed event
        * @param propertyPathSelect: the propertyPath select element
        * @param additionalPropertyPathSelect: the additional propertyPath select element
        * @param indice: the properties indice in action.properties
        */
        private _additionalPropertyPathSelectChanged(propertyPathSelect: HTMLSelectElement, additionalPropertyPathSelect: HTMLSelectElement,
            indice: number): (event: Event) => void
        {
            return (event: Event) => {
                var property = propertyPathSelect.value;
                var additionalProperty = additionalPropertyPathSelect.value;

                if (additionalProperty !== "") {
                    property += ".";
                    property += additionalPropertyPathSelect.value;
                }
                this._action.propertiesResults[indice].value = property;
            };
        }

        /*
        * Returns the parameter/target select changed event
        * @param targetParameterSelect: the target/parameter select element
        * @param targetParameterNameSelect: the target/parameter name select element
        * @param propertyPathSelect: the propertyPath select element
        * @param additionalPropertyPathSelect: the additional propertyPath select element
        * @param indice: the properties indice in action.properties
        */
        private _parameterTargetChanged(targetParameterSelect: HTMLSelectElement, targetParameterNameSelect: HTMLSelectElement,
            propertyPathSelect: HTMLSelectElement, additionalPropertyPathSelect: HTMLSelectElement, indice: number): (event: Event) => void
        {
            return (event: Event) => {
                if (targetParameterSelect.options.length === 0) {
                    // Configure start values
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

                    targetParameterSelect.value = this._action.propertiesResults[indice].targetType;
                } else {
                    this._action.propertiesResults[indice].targetType = targetParameterSelect.value;

                    var names = this._getListFromType(targetParameterSelect.value);

                    if (names !== null && names.length > 0) {
                        this._action.propertiesResults[indice].value = names[0];
                    }
                    else {
                        this._action.propertiesResults[indice].value = "";
                    }

                    if (propertyPathSelect !== null) {
                        this._action.propertiesResults[indice + 1].value = ""; // propertyPath
                    }
                }

                // Configure target names
                var targetParameterProperties = this._getTargetFromType(targetParameterSelect.value);
                targetParameterNameSelect.options.length = 0;

                if (targetParameterProperties !== null) {
                    for (var i = 0; i < targetParameterProperties.length; i++) {
                        var option = document.createElement("option");
                        option.text = option.value = targetParameterProperties[i];
                        targetParameterNameSelect.options.add(option);
                    }
                }
                targetParameterNameSelect.value = this._action.propertiesResults[indice].value;

                // Clear property path
                if (propertyPathSelect !== null) {
                    propertyPathSelect.options.length = 0;
                    additionalPropertyPathSelect.options.length = 0;
                    this._propertyPathSelectChanged(targetParameterSelect, propertyPathSelect, additionalPropertyPathSelect, null, null, indice + 1)(null);
                }

                this._sortList(targetParameterNameSelect);
                this._sortList(targetParameterSelect);
            };
        }

        /*
        * Returns the parameter/target name select changed
        * @param indice: the properties indice to change
        */
        private _parameterTargetNameChanged(targetParameterSelect: HTMLSelectElement, targetParameterNameSelect: HTMLSelectElement, indice: number): (event: Event) => void {
            return (event: Event) => {
                this._action.propertiesResults[indice].value = targetParameterNameSelect.value;
            };
        }

        /*
        * Returns the array of objects names in function of its type
        * @param type: the target type
        */
        public _getTargetFromType(type: string): Array<string> {
            if (type === "MeshProperties" || type === "Mesh") {
                return SceneElements.MESHES;
            }
            if (type === "LightProperties" || type === "Light") {
                return SceneElements.LIGHTS;
            }
            if (type === "CameraProperties" || type === "Camera") {
                return SceneElements.CAMERAS;
            }

            return null;
        }

        /*
        * Returns the properties in function of its type
        * @param type: the target type
        */
        private _getPropertiesFromType(type: string): Array<string> {
            if (type === "MeshProperties" || type === "Mesh") {
                return SceneElements.MESH_PROPERTIES;
            }
            if (type === "LightProperties" || type === "Light") {
                return SceneElements.LIGHT_PROPERTIES;
            }
            if (type === "CameraProperties" || type === "Camera") {
                return SceneElements.CAMERA_PROPERTIES;
            }
            if (type === "SceneProperties" || type === "Scene") {
                return SceneElements.SCENE_PROPERTIES;
            }

            return null;
        }

        public _getListFromType(type: string): string[] {
            if (type === "MeshProperties" || type === "Mesh") {
                return SceneElements.MESHES;
            }
            if (type === "LightProperties" || type === "Light") {
                return SceneElements.LIGHTS;
            }
            if (type === "CameraProperties" || type === "Camera") {
                return SceneElements.CAMERAS;
            }

            return null;
        }

        /*
        * Returns the object in function of the given type
        * @param type: the target type
        */
        public _getObjectFromType(type: string): any {
            if (type === "MeshProperties" || type === "Mesh") {
                this._currentObject = SceneElements.MESH;
                return SceneElements.MESH;
            }
            if (type === "LightProperties" || type === "Light") {
                this._currentObject = SceneElements.LIGHT;
                return SceneElements.LIGHT;
            }
            if (type === "CameraProperties" || type === "Camera") {
                this._currentObject = SceneElements.CAMERA;
                return SceneElements.CAMERA;
            }
            if (type === "SceneProperties" || type === "Scene") {
                this._currentObject = SceneElements.SCENE;
                return SceneElements.SCENE;
            }

            return null;
        }

        /*
        * Creates the node section (top of parameters)
        * @param action: the action element to get color, text, name etc.
        */
        private _createNodeSection(action: Action): void {
            var element = document.createElement("div");
            element.style.background = <string>this._viewer.getSelectedNodeColor(action.type, action.node.detached);
            element.className = "ParametersElementNodeClass";

            var text = document.createElement("a");
            text.text = action.name;
            text.className = "ParametersElementNodeTextClass";

            element.appendChild(text);
            this.parametersContainer.appendChild(element);
        }

        /*
        * Creates the help section
        * @param action : the action containing the description
        */
        private _createHelpSection(action: Action): void {
            // Get description
            var element = Elements.GetElementFromName(action.name);

            if (element !== null) {
                this.parametersHelpElement.textContent = element.description;
            }
        }

        /*
        * Alphabetically sorts a HTML select element options
        * @param element : the HTML select element to sort
        */
        private _sortList(element: HTMLSelectElement): void {
            var options = [];

            for (var i = element.options.length - 1; i >= 0; i--) {
                options.push(element.removeChild(element.options[i]));
            }

            options.sort((a, b) => {
                return a.innerHTML.localeCompare(b.innerHTML);
            });

            for (var i = 0; i < options.length; i++) {
                element.options.add(options[i]);
            }
        }
    }
} 