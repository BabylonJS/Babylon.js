module INSPECTOR {

    export class PropertyFormatter {

        /**
         * Format the value of the given property of the given object.
         */
        public static format(obj: any, prop: string): string {
            // Get original value;
            let value = obj[prop];
            // test if type PrimitiveAlignment is available (only included in canvas2d)           
            return value;
        }

    }

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
    export class PropertyLine {

        // The property can be of any type (Property internally can have any type), relative to this._obj
        private _property: Property;
        //The HTML element corresponding to this line
        private _div: HTMLElement;
        // The div containing the value to display. Used to update dynamically the property
        private _valueDiv: HTMLElement;
        // If the type is complex, this property will have child to update
        private _children: Array<PropertyLine> = [];
        // Array representing the simple type. All others are considered 'complex'
        private static _SIMPLE_TYPE = ['number', 'string', 'boolean'];
        // The number of pixel at each children step
        private static _MARGIN_LEFT = 15;
        // The margin-left used to display to row
        private _level: number;
        /** The list of viewer element displayed at the end of the line (color, texture...) */
        private _elements: Array<BasicElement> = [];
        /** The property parent of this one. Used to update the value of this property and to retrieve the correct object */
        private _parent: PropertyLine;
        /** The input element to display if this property is 'simple' in order to update it */
        private _input: HTMLInputElement;
        /** Display input handler (stored to be removed afterwards) */
        private _displayInputHandler: EventListener;
        /** Handler used to validate the input by pressing 'enter' */
        private _validateInputHandler: EventListener;
        /** Handler used to validate the input by pressing 'esc' */
        private _escapeInputHandler: EventListener;
        /** Handler used on focus out */
        private _focusOutInputHandler: EventListener;
        /** Handler used to get mouse position */
        private _onMouseDownHandler: EventListener;
        private _onMouseDragHandler: EventListener;
        private _onMouseUpHandler: EventListener;

        private _textValue: HTMLElement;
        /** Save previous Y mouse position */
        private _prevY: number;
        /**Save value while slider is on */
        private _preValue: number;

        constructor(prop: Property, parent?: PropertyLine, level: number = 0) {
            this._property = prop;
            this._level = level;
            this._parent = parent;

            this._div = Helpers.CreateDiv('row');
            this._div.style.marginLeft = `${this._level}px`;

            // Property name
            let propName: HTMLElement = Helpers.CreateDiv('prop-name', this._div);
            propName.textContent = `${this.name}`;

            // Value
            this._valueDiv = Helpers.CreateDiv('prop-value', this._div);

            if (typeof this.value !== 'boolean' && !this._isSliderType()) {
                this._valueDiv.textContent = this._displayValueContent() || '-'; // Init value text node
            }

            this._createElements();

            for (let elem of this._elements) {
                this._valueDiv.appendChild(elem.toHtml());
            }

            this._updateValue();
            // If the property type is not simple, add click event to unfold its children
            if (typeof this.value === 'boolean') {
                this._checkboxInput();
            } else if (this._isSliderType()) {
                this._rangeInput();
            } else if (!this._isSimple()) {
                this._valueDiv.classList.add('clickable');
                this._valueDiv.addEventListener('click', this._addDetails.bind(this));
            } else {
                this._initInput();
                this._valueDiv.addEventListener('click', this._displayInputHandler);
                this._input.addEventListener('focusout', this._focusOutInputHandler);
                this._input.addEventListener('keydown', this._validateInputHandler);
                this._input.addEventListener('keydown', this._escapeInputHandler);
            }
            // Add this property to the scheduler
            Scheduler.getInstance().add(this);
        }

        /** 
         * Init the input element and al its handler : 
         * - a click in the window remove the input and restore the old property value
         * - enters updates the property
         */
        private _initInput() {
            // Create the input element
            this._input = document.createElement('input') as HTMLInputElement;
            this._input.setAttribute('type', 'text');

            // if the property is 'simple', add an event listener to create an input
            this._displayInputHandler = this._displayInput.bind(this);
            this._validateInputHandler = this._validateInput.bind(this);
            this._escapeInputHandler = this._escapeInput.bind(this);
            this._focusOutInputHandler = this.update.bind(this);

            this._onMouseDownHandler = this._onMouseDown.bind(this);
            this._onMouseDragHandler = this._onMouseDrag.bind(this);
            this._onMouseUpHandler = this._onMouseUp.bind(this);
        }

        /** 
         * On enter : validates the new value and removes the input
         * On escape : removes the input
         */
        private _validateInput(e: KeyboardEvent) {
            this._input.removeEventListener('focusout', this._focusOutInputHandler);
            if (e.keyCode == 13) { // Enter
                this.validateInput(this._input.value);
            } else if (e.keyCode == 9) { // Tab
                e.preventDefault();
                this.validateInput(this._input.value);
            } else if (e.keyCode == 27) {
                // Esc : remove input
                this.update();
            }
        }

        public validateInput(value: any, forceupdate:boolean = true): void {
            this.updateObject();
            if (typeof this._property.value === 'number') {
                this._property.value = parseFloat(value);
            } else {
                this._property.value = value;
            }
            // Remove input
            if (forceupdate) {
                this.update();
                // resume scheduler
                Scheduler.getInstance().pause = false;
            }
        }

        /** 
         * On escape : removes the input
         */
        private _escapeInput(e: KeyboardEvent) {
            // Remove focus out handler
            this._input.removeEventListener('focusout', this._focusOutInputHandler);
            if (e.keyCode == 27) {
                // Esc : remove input
                this.update();
            }
        }

        /** Removes the input without validating the new value */
        private _removeInputWithoutValidating() {
            Helpers.CleanDiv(this._valueDiv);
            if (typeof this.value !== 'boolean' && !this._isSliderType()) {
                this._valueDiv.textContent = "-";
            } 
            // restore elements
            for (let elem of this._elements) {
                this._valueDiv.appendChild(elem.toHtml());
            }

            if (typeof this.value !== 'boolean' && !this._isSliderType()) {
                this._valueDiv.addEventListener('click', this._displayInputHandler);
            }
        }

        /** Replaces the default display with an input */
        private _displayInput(e: any) {
            // Remove the displayInput event listener
            this._valueDiv.removeEventListener('click', this._displayInputHandler);
            // Set input value
            let valueTxt = this._valueDiv.textContent;
            this._valueDiv.textContent = "";
            this._input.value = valueTxt;
            this._valueDiv.appendChild(this._input);
            this._input.focus();

            if (typeof this.value !== 'boolean' && !this._isSliderType()) {
                this._input.addEventListener('focusout', this._focusOutInputHandler);
            } else if (typeof this.value === 'number') {
                this._input.addEventListener('mousedown', this._onMouseDownHandler);
            }

            // Pause the scheduler
            Scheduler.getInstance().pause = true;
        }

        /** Retrieve the correct object from its parent. 
         * If no parent exists, returns the property value.
         * This method is used at each update in case the property object is removed from the original object 
         * (example : mesh.position = new BABYLON.Vector3 ; the original vector3 object is deleted from the mesh).
        */
        public updateObject() {
            if (this._parent) {
                this._property.obj = this._parent.updateObject();
            }
            return this._property.value;
        }

        // Returns the property name
        public get name(): string {
            // let arrayName = Helpers.Capitalize(this._property.name).match(/[A-Z][a-z]+|[0-9]+/g)
            // if (arrayName) {
            //     return arrayName.join(" ");
            // }
            return this._property.name;
        }

        // Returns the value of the property
        public get value(): any {
            return PropertyFormatter.format(this._property.obj, this._property.name);
        }

        // Returns the type of the property
        public get type(): string {
            return this._property.type;
        }

        /**
         * Creates elements that wil be displayed on a property line, depending on the
         * type of the property.
         */
        private _createElements() {
            // Colors
            if (this.type == 'Color3' || this.type == 'Color4') {
                this._elements.push(new ColorPickerElement(this.value, this));
                //this._elements.push(new ColorElement(this.value));
            }
            // Texture
            if (this.type == 'Texture') {
                this._elements.push(new TextureElement(this.value));
            }
            // HDR Texture
            if (this.type == 'HDRCubeTexture') {
                this._elements.push(new HDRCubeTextureElement(this.value));
            }
            if (this.type == 'CubeTexture') {
                this._elements.push(new CubeTextureElement(this.value));
            }
        }

        // Returns the text displayed on the left of the property name : 
        // - If the type is simple, display its value
        // - If the type is complex, but instance of Vector2, Size, display the type and its tostring
        // - If the type is another one, display the Type
        private _displayValueContent() {
            let value = this.value;
            // If the value is a number, truncate it if needed
            if (typeof value === 'number') {
                return Helpers.Trunc(value);
            }

            // If it's a string or a boolean, display its value
            if (typeof value === 'string' || typeof value === 'boolean') {
                return value;
            }
            return PROPERTIES.format(value);
        }

        /** Delete properly this property line. 
         * Removes itself from the scheduler.
         * Dispose all viewer element (color, texture...)
         */
        public dispose() {
            // console.log('delete properties', this.name);
            Scheduler.getInstance().remove(this);
            for (let child of this._children) {
                // console.log('delete properties', child.name);
                Scheduler.getInstance().remove(child);
            }
            for (let elem of this._elements) {
                elem.dispose();
            }
            this._elements = [];
        }

        /** Updates the content of _valueDiv with the value of the property, 
         * and all HTML element correpsonding to this type.
         * Elements are updated as well
         */
        private _updateValue() {
            // Update the property object first
            this.updateObject();
            // Then update its value
            // this._valueDiv.textContent = " "; // TOFIX this removes the elements after
            if (typeof this.value === 'boolean') {
                 this._checkboxInput();
            } else if (this._isSliderType()) { // Add slider when parent have slider property
                this._rangeInput();
            } else {
                this._valueDiv.childNodes[0].nodeValue = this._displayValueContent();
            }
            for (let elem of this._elements) {
                elem.update(this.value);
            }
        }

        /**
         * Update the property division with the new property value. 
         * If this property is complex, update its child, otherwise update its text content
         */
        public update() {
            this._removeInputWithoutValidating();
            this._updateValue();
        }

        /**
         * Returns true if the type of this property is simple, false otherwise.
         * Returns true if the value is null
         */
        private _isSimple(): boolean {
            if (this.value != null && this.type !== 'type_not_defined') {
                if (PropertyLine._SIMPLE_TYPE.indexOf(this.type) == -1) {
                    // complex type : return the type name
                    return false;
                } else {
                    // simple type : return value
                    return true;
                }
            } else {
                return true;
            }
        }

        public toHtml(): HTMLElement {
            return this._div;
        }

        public closeDetails() {
            if (this._div.classList.contains('unfolded')) {
                // Remove class unfolded
                this._div.classList.remove('unfolded');
                // remove html children
                for (let child of this._children) {
                    this._div.parentNode.removeChild(child.toHtml());
                }
            }
        }

        /**
         * Add sub properties in case of a complex type
         */
        private _addDetails() {
            if (this._div.classList.contains('unfolded')) {
                // Remove class unfolded
                this._div.classList.remove('unfolded');
                // remove html children
                for (let child of this._children) {
                    this._div.parentNode.removeChild(child.toHtml());
                }
            } else {
                // if children does not exists, generate it
                this._div.classList.toggle('unfolded');
                if (this._children.length == 0) {
                    let objToDetail = this.value;
                    let propToDisplay = (<any>PROPERTIES)[Helpers.GET_TYPE(objToDetail)].properties.slice().reverse();

                    for (let prop of propToDisplay) {
                        let infos = new Property(prop, this._property.value);
                        let child = new PropertyLine(infos, this, this._level + PropertyLine._MARGIN_LEFT);
                        this._children.push(child);
                    }
                }
                // otherwise display it                    
                for (let child of this._children) {
                    this._div.parentNode.insertBefore(child.toHtml(), this._div.nextSibling);
                }
            }
        }

        /**
         * Refresh mouse position on y axis
         * @param e 
         */
        private _onMouseDrag(e: MouseEvent): void {
            const diff = this._prevY - e.clientY;
            this._input.value = (this._preValue + diff).toString();
        }

        /**
         * Save new value from slider
         * @param e 
         */
        private _onMouseUp(e: MouseEvent): void {
            window.removeEventListener('mousemove', this._onMouseDragHandler);
            window.removeEventListener('mouseup', this._onMouseUpHandler);
            this._prevY = e.clientY;
        }

        /**
         * Start record mouse position
         * @param e 
         */
        private _onMouseDown(e: MouseEvent): void {
            this._prevY = e.clientY;
            this._preValue = this.value;
            window.addEventListener('mousemove', this._onMouseDragHandler);
            window.addEventListener('mouseup', this._onMouseUpHandler);
        }

        /**
         * Create input entry
         */
        private _checkboxInput() {
            if(this._valueDiv.childElementCount < 1) { // Prevent display two checkbox
                this._input = Helpers.CreateInput('checkbox-element', this._valueDiv);
                this._input.type = 'checkbox'
                this._input.checked = this.value;
                this._input.addEventListener('change', () => {
                    Scheduler.getInstance().pause = true;
                    this.validateInput(!this.value)
                })
            }            
        }

        private _rangeInput() {
            if(this._valueDiv.childElementCount < 1) { // Prevent display two input range
                this._input = Helpers.CreateInput('slider-element', this._valueDiv);
                this._input.type = 'range';
                this._input.style.display = 'inline-block';
                this._input.min = this._getSliderProperty().min;
                this._input.max = this._getSliderProperty().max;
                this._input.step = this._getSliderProperty().step;
                this._input.value = this.value;
                
                this._validateInputHandler = this._rangeHandler.bind(this)
                this._input.addEventListener('input', this._validateInputHandler)
                this._input.addEventListener('change', () => {
                    Scheduler.getInstance().pause = false;
                })

                this._textValue = Helpers.CreateDiv('value-text', this._valueDiv);
                this._textValue.innerText = Helpers.Trunc(this.value).toString();
                this._textValue.style.paddingLeft = '10px';
                this._textValue.style.display = 'inline-block';
            }
        }

        private _rangeHandler() {
            Scheduler.getInstance().pause = true;
            //this._input.style.backgroundSize = ((parseFloat(this._input.value) - parseFloat(this._input.min)) * 100 / ( parseFloat(this._input.max) - parseFloat(this._input.min))) + '% 100%'
            this._textValue.innerText = this._input.value;
            this.validateInput(this._input.value, false);
        }

        private _isSliderType() { //Check if property have slider definition
            return this._property  && 
            PROPERTIES.hasOwnProperty(this._property.obj.constructor.name) &&
            (<any>PROPERTIES)[this._property.obj.constructor.name].hasOwnProperty('slider') && 
            (<any>PROPERTIES)[this._property.obj.constructor.name].slider.hasOwnProperty(this.name);
        }

        private _getSliderProperty() {
            return (<any>PROPERTIES)[this._property.obj.constructor.name].slider[this.name]
        }
    }
}