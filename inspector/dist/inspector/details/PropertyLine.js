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
            // PrimitiveAlignment
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
                this._property.value = newValue;
                // Remove input
                this.update();
            }
            else if (e.keyCode == 27) {
                // Esc : remove input
                this.update();
            }
        };
        /** Removes the input without validating the new value */
        PropertyLine.prototype._removeInputWithoutValidating = function () {
            INSPECTOR.Helpers.CleanDiv(this._valueDiv);
            this._valueDiv.addEventListener('click', this._displayInputHandler);
        };
        /** Replaces the default display with an input */
        PropertyLine.prototype._displayInput = function (e) {
            // Remove the displayInput event listener
            this._valueDiv.removeEventListener('click', this._displayInputHandler);
            // Removes the input on a click in the window
            // window.addEventListener('click', this._removeInputHandler);
            // Set input value
            var valueTxt = this._valueDiv.textContent;
            this._valueDiv.textContent = "";
            this._input.value = valueTxt;
            this._valueDiv.appendChild(this._input);
        };
        /** Retrieve the correct object from its parent.
         * If no parent exists, returns the property value.
         * This method is used at each update in case the property object is removed from the original object
         * (example : mesh.position = new BABYLON.Vector3 ; the original vector3 object is deleted from the mesh).
        */
        PropertyLine.prototype.updateObject = function () {
            if (!this._parent) {
                return this._property.value;
            }
            else {
                this._property.obj = this._parent.updateObject();
            }
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
            this._valueDiv.textContent = " ";
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
            if (this.value != null) {
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
        // Array representing the simple type. All others are considered 'complex'
        PropertyLine._SIMPLE_TYPE = ['number', 'string', 'boolean'];
        // The number of pixel at each children step
        PropertyLine._MARGIN_LEFT = 15;
        return PropertyLine;
    }());
    INSPECTOR.PropertyLine = PropertyLine;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=PropertyLine.js.map