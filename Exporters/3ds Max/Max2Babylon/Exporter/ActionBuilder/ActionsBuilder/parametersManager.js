/// <reference path="raphael.js" />
/// <reference path="actionKinds.js" />
/// <reference path="viewer.js" />

var AB;
(function (AB) {

    var ParametersManager = (function () {

        function ParametersManager(viewer) {
            // Members
            this.viewer = viewer;
            this.parametersElement = document.getElementById("Parameters");
        }

        // Clears the parameters view (right side)
        ParametersManager.prototype.clearParameters = function () {
            if (this.divHelpText) {
                this.divHelpText.parentNode.removeChild(this.divHelpText);
                this.divHelpText = null;
            }

            while (this.parametersElement.childNodes.length)
                this.parametersElement.removeChild(this.parametersElement.firstChild);
        }

        // Creates the help section
        ParametersManager.prototype.createHelpSection = function (element) {
            var divHelpText = document.createElement("div");
            divHelpText.className = "parametersHelp";
            this.parametersElement.appendChild(divHelpText);

            var helpText = document.createElement("a");
            helpText.innerHTML = AB.ActionsBuilder.GetDescriptionFromActionName(element.action.name);
            helpText.className = "parametersClass";
            divHelpText.appendChild(helpText);
        }

        // Creates parameters for the given element (node / action)
        ParametersManager.prototype.createParameters = function (element) {
            // Events
            var onInputChange = function (input, propertyID) {
                return function () {
                    var value = input.value;
                    element.action.propertiesResults[propertyID] = value;
                };
            };

            var onTargetTypeChanged = function (targetTypeSelect, propertyPathSelect, targetNameSelect, propertyID) {
                return function () {
                    var selected = targetTypeSelect.selectedIndex;
                    var value = targetTypeSelect.options[selected].value;

                    if (targetNameSelect != null && value != "SceneProperties") {
                        var array = null;
                        // Keep target name value
                        var nameValue = targetNameSelect.value;

                        targetNameSelect.length = 0;

                        if (value == "MeshProperties") array = AB.ActionsBuilder.MeshesList;
                        else if (value == "LightProperties") array = AB.ActionsBuilder.LightsList;
                        else if (value == "CameraProperties") array = AB.ActionsBuilder.CamerasList;

                        for (var i = 0; i < array.length; i++) {
                            var option = document.createElement("option");
                            option.value = array[i];
                            option.innerHTML = array[i];
                            targetNameSelect.add(option);
                        }

                        targetNameSelect.value = nameValue;
                    }

                    if (propertyPathSelect != null) {
                        // Get array of properties for selected object type (scene, camera, light, mesh, ...)
                        var array = AB.ActionsBuilder[targetTypeSelect.options[selected].value];
                        propertyPathSelect.length = 0;

                        for (var j = 0; j < array.length; j++) {
                            var option = document.createElement("option");
                            option.value = array[j].name;
                            option.innerHTML = array[j].name;
                            propertyPathSelect.add(option);
                        }
                    }
                    element.action.properties[propertyPathSelect != null ? propertyID - 1 : propertyID].targetType = targetTypeSelect.options[selected].value;
                };
            };

            var onTargetNameChanged = function (targetNameSelect, propertyID) {
                return function () {
                    element.action.propertiesResults[propertyID] = targetNameSelect.options[targetNameSelect.selectedIndex].value;
                }
            }

            var onPropertyPathChanged = function (propertyPathSelect, additionalInput, propertyID) {
                return function () {
                    additionalInput.value = "";
                    element.action.propertiesResults[propertyID] = propertyPathSelect.options[propertyPathSelect.selectedIndex].value;
                };
            };

            var onAdditionalPropertyPathChanged = function (propertyPathSelect, additionalInput, propertyID) {
                return function () {
                    var propertyPath = propertyPathSelect.options[propertyPathSelect.selectedIndex].value;
                    if (additionalInput.value != "")
                        propertyPath += "." + additionalInput.value;
                    element.action.propertiesResults[propertyID] = propertyPath;
                };
            };

            var onConditionOperatorChanged = function (conditionOperatorSelect, propertyID) {
                return function () {
                    element.action.propertiesResults[propertyID] = conditionOperatorSelect.options[conditionOperatorSelect.selectedIndex].value;
                };
            };

            // Special Elements
            var targetTypeSelect = null;
            var targetNameSelect = null;
            var propertyPathSelect = null;
            var soundNameSelect = null;

            // Clear view (div)
            this.clearParameters();

            // Get properties
            var p = element.action.properties;
            var pr = element.action.propertiesResults;

            // Create edition presentation
            var divEditedNode = document.createElement("div");
            divEditedNode.className = "parametersEditedNode";
            divEditedNode.style.backgroundColor = this.viewer.getSelectedNodeColor(element.action, this.viewer.isParentDetached(element.action));
            divEditedNode.style.border = "2px solid white";

            var textEditedNode = document.createElement("a");
            textEditedNode.className = "parametersEditedNode";
            textEditedNode.innerHTML = element.action.name;
            textEditedNode.style.verticalAlign = "middle";
            textEditedNode.style.textAlign = "center";
            if (element.action.type == AB.ActionsBuilder.Type.ACTION)
                textEditedNode.style.color = "black";
            else
                textEditedNode.style.color = "white";
            textEditedNode.style.width = textEditedNode.style.height = "100%";
            divEditedNode.appendChild(textEditedNode);

            this.parametersElement.appendChild(divEditedNode);

            if (p.length == 0) {
                this.createHelpSection(element);
                return;
            }

            // Create parameters
            for (var i = 0; i < p.length; i++) {
                // Create separator
                var separator = document.createElement("hr");
                separator.noShade = true;
                separator.style.width = "90%";

                this.parametersElement.appendChild(separator);

                // Parameter text
                var propertyText = document.createElement("a");
                propertyText.text = p[i].text;

                this.parametersElement.appendChild(propertyText);

                // If target, add the input element + combo box with target type
                if (p[i].text == "sound") {
                    soundNameSelect = document.createElement("select");
                    soundNameSelect.className = "parametersClass";

                    for (var j = 0; j < AB.ActionsBuilder.SoundsList.length; j++) {
                        var name = AB.ActionsBuilder.SoundsList[j];
                        var option = document.createElement("option");
                        option.value = option.innerHTML = name;
                        option.className = "parametersClass";
                        soundNameSelect.add(option);
                    }

                    soundNameSelect.value = pr[i];
                    this.parametersElement.appendChild(document.createElement("br"));
                    this.parametersElement.appendChild(soundNameSelect);

                    soundNameSelect.onchange = onInputChange(soundNameSelect, i);

                    continue;
                }
                else if (p[i].text == "target"
                    || (element.action.type == AB.ActionsBuilder.Type.TRIGGER && p[i].text == "parameter")
                    || p[i].text == "parent")
                {
                    targetTypeSelect = document.createElement("select");
                    targetTypeSelect.className = "parametersClass";

                    for (var j = 0; j < AB.ActionsBuilder.DataTypesNames.length; j++) {
                        var data = AB.ActionsBuilder.DataTypesNames[j];
                        var option = document.createElement("option");
                        option.value = data.data;
                        option.innerHTML = data.name;
                        option.className = "parametersClass";
                        targetTypeSelect.add(option);
                    }

                    targetTypeSelect.value = p[i].targetType;

                    this.parametersElement.appendChild(document.createElement("br"));
                    this.parametersElement.appendChild(targetTypeSelect);

                    // List names
                    targetNameSelect = document.createElement("select");
                    targetNameSelect.className = "parametersClass";

                    this.parametersElement.appendChild(document.createElement("br"));
                    this.parametersElement.appendChild(targetNameSelect);

                    onTargetTypeChanged(targetTypeSelect, null, targetNameSelect, i)();

                    targetNameSelect.value = pr[i];

                    targetTypeSelect.onchange = onTargetTypeChanged(targetTypeSelect, null, targetNameSelect, i);
                    targetNameSelect.onchange = onTargetNameChanged(targetNameSelect, i);

                    continue;
                }
                // If propertyPath, add the combox box to select the property and input element for additional property
                else if (p[i].text == "propertyPath") {
                    propertyPathSelect = document.createElement("select");
                    propertyPathSelect.className = "parametersClass";

                    this.parametersElement.appendChild(document.createElement("br"));
                    this.parametersElement.appendChild(propertyPathSelect);

                    // Special input, then continue after its creation
                    var additionalInput = document.createElement("input");
                    additionalInput.setAttribute("value", "");
                    additionalInput.className = "parametersClass";

                    this.parametersElement.appendChild(document.createElement("br"));
                    this.parametersElement.appendChild(additionalInput);

                    // If propertyPath exists, then target exists
                    targetTypeSelect.onchange = onTargetTypeChanged(targetTypeSelect, propertyPathSelect, targetNameSelect, i);
                    propertyPathSelect.onchange = onPropertyPathChanged(propertyPathSelect, additionalInput, i);
                    additionalInput.onkeyup = onAdditionalPropertyPathChanged(propertyPathSelect, additionalInput, i);

                    // Fill propertyPath combo box
                    onTargetTypeChanged(targetTypeSelect, propertyPathSelect, targetNameSelect, i)();

                    // Set selected property
                    var propertyName = pr[i].split(".");
                    propertyPathSelect.value = propertyName[0];

                    var additionPropertyName = "";
                    for (var j = 1; j < propertyName.length; j++)
                        additionPropertyName += propertyName[j];

                    additionalInput.setAttribute("value", additionPropertyName);

                    // Finish
                    continue;
                }
                    // Value condition, add combo box for operator type
                else if (p[i].text == "operator") {
                    var conditionOperatorSelect = document.createElement("select");
                    conditionOperatorSelect.className = "parametersClass";

                    for (var j = 0; j < AB.ActionsBuilder.FlowActionOperators.length; j++) {
                        var option = document.createElement("option");
                        option.value = AB.ActionsBuilder.FlowActionOperators[j];
                        option.innerHTML = AB.ActionsBuilder.FlowActionOperators[j];
                        conditionOperatorSelect.add(option);
                    }

                    conditionOperatorSelect.value = pr[i];
                    conditionOperatorSelect.onchange = onConditionOperatorChanged(conditionOperatorSelect, i);

                    this.parametersElement.appendChild(document.createElement("br"));
                    this.parametersElement.appendChild(conditionOperatorSelect);

                    continue;
                }

                var propertyInput = document.createElement("input");
                propertyInput.setAttribute("value", pr[i]);
                propertyInput.onkeyup = onInputChange(propertyInput, i);
                propertyInput.className = "parametersClass";

                //this.parametersElement.appendChild(document.createElement("br"));
                this.parametersElement.appendChild(propertyInput);
            }

            // Create help text (bottom)
            this.createHelpSection(element);
        }

        return ParametersManager;

    })();

    AB.ParametersManager = ParametersManager;

})(AB || (AB = {}));