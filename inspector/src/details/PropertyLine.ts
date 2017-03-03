module INSPECTOR {

    export class PropertyFormatter {

        /**
         * Format the value of the given property of the given object.
         */
        public static format(obj: any, prop:string) : string {
            // Get original value;
            let value = obj[prop];
            // test if type PrimitiveAlignment is available (only included in canvas2d)
            if (BABYLON.PrimitiveAlignment) {                
                if (obj instanceof BABYLON.PrimitiveAlignment) {
                    if (prop === 'horizontal') {
                        switch(value) {
                            case BABYLON.PrimitiveAlignment.AlignLeft:
                                return 'left';
                            case BABYLON.PrimitiveAlignment.AlignRight:
                                return 'right';
                            case BABYLON.PrimitiveAlignment.AlignCenter:
                                return 'center';
                            case BABYLON.PrimitiveAlignment.AlignStretch:
                                return 'stretch';
                        }
                    } else if (prop === 'vertical') {
                        switch(value) {
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
        private _property : Property;    
        //The HTML element corresponding to this line
        private _div : HTMLElement;
        // The div containing the value to display. Used to update dynamically the property
        private _valueDiv : HTMLElement;
        // If the type is complex, this property will have child to update
        private _children : Array<PropertyLine> = [];        
        // Array representing the simple type. All others are considered 'complex'
        private static _SIMPLE_TYPE = ['number', 'string', 'boolean'];
        // The number of pixel at each children step
        private static _MARGIN_LEFT = 15;
        // The margin-left used to display to row
        private _level : number;
        /** The list of viewer element displayed at the end of the line (color, texture...) */
        private _elements : Array<BasicElement> = [];
        /** The property parent of this one. Used to update the value of this property and to retrieve the correct object */
        private _parent : PropertyLine;
        /** The input element to display if this property is 'simple' in order to update it */
        private _input : HTMLInputElement;
        /** Display input handler (stored to be removed afterwards) */
        private _displayInputHandler : EventListener;
        /** Handler used to validate the input by pressing 'enter' */
        private _validateInputHandler : EventListener;
        
        constructor(prop : Property, parent?: PropertyLine, level:number=0) {
            this._property = prop;
            this._level    = level;       
            this._parent   = parent;   
                         
            this._div = Helpers.CreateDiv('row');
            this._div.style.marginLeft = `${this._level}px`;
            
            // Property name
            let propName : HTMLElement = Helpers.CreateDiv('prop-name', this._div);
            propName.textContent = `${this.name}`;

            // Value
            this._valueDiv = Helpers.CreateDiv('prop-value', this._div);
            this._valueDiv.textContent = this._displayValueContent() || '-'; // Init value text node
            
            this._createElements();
            
            for (let elem of this._elements) {
                this._valueDiv.appendChild(elem.toHtml());
            }
            
            this._updateValue();

            // If the property type is not simple, add click event to unfold its children
            if (!this._isSimple()) { 
                this._valueDiv.classList.add('clickable');
                this._valueDiv.addEventListener('click', this._addDetails.bind(this));
            } else {
                this._initInput();
                this._valueDiv.addEventListener('click', this._displayInputHandler);
                this._input.addEventListener('keypress', this._validateInputHandler);
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
            this._displayInputHandler  = this._displayInput.bind(this);
            this._validateInputHandler = this._validateInput.bind(this);
        }

        /** 
         * On enter : validates the new value and removes the input
         * On escape : removes the input
         */
        private _validateInput(e : KeyboardEvent) {
            if (e.keyCode == 13) {
                // Enter : validate the new value
                let newValue = this._input.value;
                this.updateObject();
                this._property.value = newValue;
                // Remove input
                this.update();
                // resume scheduler
                Scheduler.getInstance().pause = false;
                
            } else if (e.keyCode == 27) { 
                // Esc : remove input
                this.update();
            }
        }

        /** Removes the input without validating the new value */
        private _removeInputWithoutValidating() {
            Helpers.CleanDiv(this._valueDiv);
            this._valueDiv.textContent = "-";
            // restore elements
            for (let elem of this._elements) {
                this._valueDiv.appendChild(elem.toHtml());
            }            
            this._valueDiv.addEventListener('click', this._displayInputHandler);
        }

        /** Replaces the default display with an input */
        private _displayInput(e) {
            // Remove the displayInput event listener
            this._valueDiv.removeEventListener('click', this._displayInputHandler);

            // Set input value
            let valueTxt = this._valueDiv.textContent;
            this._valueDiv.textContent = "";
            this._input.value = valueTxt;
            this._valueDiv.appendChild(this._input);
            
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
        public get name() : string {
            return this._property.name;
        }

        // Returns the value of the property
        public get value() : any {
            return PropertyFormatter.format(this._property.obj, this._property.name);
        }

        // Returns the type of the property
        public get type() : string {
            return this._property.type;
        }
        
        /**
         * Creates elements that wil be displayed on a property line, depending on the
         * type of the property.
         */
        private _createElements() {
            
            // Colors
            if (this.type == 'Color3' ||this.type == 'Color4') {
                this._elements.push(new ColorElement(this.value));
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
        private _displayValueContent () {
            
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
            this._valueDiv.childNodes[0].nodeValue = this._displayValueContent();
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
         * Returns true if the given instance is a simple type  
         */
        private static _IS_TYPE_SIMPLE(inst:any) {
            let type = Helpers.GET_TYPE(inst);
            return PropertyLine._SIMPLE_TYPE.indexOf(type) != -1;
        }

        /**
         * Returns true if the type of this property is simple, false otherwise.
         * Returns true if the value is null
         */
        private _isSimple() : boolean {
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

        public toHtml() : HTMLElement {
            return this._div;
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
                if (this._children.length ==0) {                    
                    let objToDetail = this.value;
                    let propToDisplay = PROPERTIES[Helpers.GET_TYPE(objToDetail)].properties.reverse();
                    let propertyLine = null;
                    
                    for (let prop of propToDisplay) {
                        let infos = new Property(prop, this._property.value);
                        let child = new PropertyLine(infos, this, this._level+PropertyLine._MARGIN_LEFT);
                        this._children.push(child);
                    }
                } 
                // otherwise display it                    
                for (let child of this._children) {
                    this._div.parentNode.insertBefore(child.toHtml(), this._div.nextSibling);
                }
            }            
        }        
    } 
    
}