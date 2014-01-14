//!----------------------------------------------------------
//! Copyright (C) Microsoft Corporation. All rights reserved.
//!----------------------------------------------------------
//! MicrosoftMvcValidation.js


Type.registerNamespace('Sys.Mvc');

////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.Validation

Sys.Mvc.$create_Validation = function Sys_Mvc_Validation() { return {}; }


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.JsonValidationField

Sys.Mvc.$create_JsonValidationField = function Sys_Mvc_JsonValidationField() { return {}; }


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.JsonValidationOptions

Sys.Mvc.$create_JsonValidationOptions = function Sys_Mvc_JsonValidationOptions() { return {}; }


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.JsonValidationRule

Sys.Mvc.$create_JsonValidationRule = function Sys_Mvc_JsonValidationRule() { return {}; }


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.ValidationContext

Sys.Mvc.$create_ValidationContext = function Sys_Mvc_ValidationContext() { return {}; }


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.NumberValidator

Sys.Mvc.NumberValidator = function Sys_Mvc_NumberValidator() {
}
Sys.Mvc.NumberValidator.create = function Sys_Mvc_NumberValidator$create(rule) {
    /// <param name="rule" type="Sys.Mvc.JsonValidationRule">
    /// </param>
    /// <returns type="Sys.Mvc.Validator"></returns>
    return Function.createDelegate(new Sys.Mvc.NumberValidator(), new Sys.Mvc.NumberValidator().validate);
}
Sys.Mvc.NumberValidator.prototype = {
    
    validate: function Sys_Mvc_NumberValidator$validate(value, context) {
        /// <param name="value" type="String">
        /// </param>
        /// <param name="context" type="Sys.Mvc.ValidationContext">
        /// </param>
        /// <returns type="Object"></returns>
        if (Sys.Mvc._validationUtil.stringIsNullOrEmpty(value)) {
            return true;
        }
        var n = Number.parseLocale(value);
        return (!isNaN(n));
    }
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.FormContext

Sys.Mvc.FormContext = function Sys_Mvc_FormContext(formElement, validationSummaryElement) {
    /// <param name="formElement" type="Object" domElement="true">
    /// </param>
    /// <param name="validationSummaryElement" type="Object" domElement="true">
    /// </param>
    /// <field name="_validationSummaryErrorCss" type="String" static="true">
    /// </field>
    /// <field name="_validationSummaryValidCss" type="String" static="true">
    /// </field>
    /// <field name="_formValidationTag" type="String" static="true">
    /// </field>
    /// <field name="_onClickHandler" type="Sys.UI.DomEventHandler">
    /// </field>
    /// <field name="_onSubmitHandler" type="Sys.UI.DomEventHandler">
    /// </field>
    /// <field name="_errors" type="Array">
    /// </field>
    /// <field name="_submitButtonClicked" type="Object" domElement="true">
    /// </field>
    /// <field name="_validationSummaryElement" type="Object" domElement="true">
    /// </field>
    /// <field name="_validationSummaryULElement" type="Object" domElement="true">
    /// </field>
    /// <field name="fields" type="Array" elementType="FieldContext">
    /// </field>
    /// <field name="_formElement" type="Object" domElement="true">
    /// </field>
    /// <field name="replaceValidationSummary" type="Boolean">
    /// </field>
    this._errors = [];
    this.fields = new Array(0);
    this._formElement = formElement;
    this._validationSummaryElement = validationSummaryElement;
    formElement[Sys.Mvc.FormContext._formValidationTag] = this;
    if (validationSummaryElement) {
        var ulElements = validationSummaryElement.getElementsByTagName('ul');
        if (ulElements.length > 0) {
            this._validationSummaryULElement = ulElements[0];
        }
    }
    this._onClickHandler = Function.createDelegate(this, this._form_OnClick);
    this._onSubmitHandler = Function.createDelegate(this, this._form_OnSubmit);
}
Sys.Mvc.FormContext._Application_Load = function Sys_Mvc_FormContext$_Application_Load() {
    var allFormOptions = window.mvcClientValidationMetadata;
    if (allFormOptions) {
        while (allFormOptions.length > 0) {
            var thisFormOptions = allFormOptions.pop();
            Sys.Mvc.FormContext._parseJsonOptions(thisFormOptions);
        }
    }
}
Sys.Mvc.FormContext._getFormElementsWithName = function Sys_Mvc_FormContext$_getFormElementsWithName(formElement, name) {
    /// <param name="formElement" type="Object" domElement="true">
    /// </param>
    /// <param name="name" type="String">
    /// </param>
    /// <returns type="Array" elementType="Object" elementDomElement="true"></returns>
    var allElementsWithNameInForm = [];
    var allElementsWithName = document.getElementsByName(name);
    for (var i = 0; i < allElementsWithName.length; i++) {
        var thisElement = allElementsWithName[i];
        if (Sys.Mvc.FormContext._isElementInHierarchy(formElement, thisElement)) {
            Array.add(allElementsWithNameInForm, thisElement);
        }
    }
    return allElementsWithNameInForm;
}
Sys.Mvc.FormContext.getValidationForForm = function Sys_Mvc_FormContext$getValidationForForm(formElement) {
    /// <param name="formElement" type="Object" domElement="true">
    /// </param>
    /// <returns type="Sys.Mvc.FormContext"></returns>
    return formElement[Sys.Mvc.FormContext._formValidationTag];
}
Sys.Mvc.FormContext._isElementInHierarchy = function Sys_Mvc_FormContext$_isElementInHierarchy(parent, child) {
    /// <param name="parent" type="Object" domElement="true">
    /// </param>
    /// <param name="child" type="Object" domElement="true">
    /// </param>
    /// <returns type="Boolean"></returns>
    while (child) {
        if (parent === child) {
            return true;
        }
        child = child.parentNode;
    }
    return false;
}
Sys.Mvc.FormContext._parseJsonOptions = function Sys_Mvc_FormContext$_parseJsonOptions(options) {
    /// <param name="options" type="Sys.Mvc.JsonValidationOptions">
    /// </param>
    /// <returns type="Sys.Mvc.FormContext"></returns>
    var formElement = $get(options.FormId);
    var validationSummaryElement = (!Sys.Mvc._validationUtil.stringIsNullOrEmpty(options.ValidationSummaryId)) ? $get(options.ValidationSummaryId) : null;
    var formContext = new Sys.Mvc.FormContext(formElement, validationSummaryElement);
    formContext.enableDynamicValidation();
    formContext.replaceValidationSummary = options.ReplaceValidationSummary;
    for (var i = 0; i < options.Fields.length; i++) {
        var field = options.Fields[i];
        var fieldElements = Sys.Mvc.FormContext._getFormElementsWithName(formElement, field.FieldName);
        var validationMessageElement = (!Sys.Mvc._validationUtil.stringIsNullOrEmpty(field.ValidationMessageId)) ? $get(field.ValidationMessageId) : null;
        var fieldContext = new Sys.Mvc.FieldContext(formContext);
        Array.addRange(fieldContext.elements, fieldElements);
        fieldContext.validationMessageElement = validationMessageElement;
        fieldContext.replaceValidationMessageContents = field.ReplaceValidationMessageContents;
        for (var j = 0; j < field.ValidationRules.length; j++) {
            var rule = field.ValidationRules[j];
            var validator = Sys.Mvc.ValidatorRegistry.getValidator(rule);
            if (validator) {
                var validation = Sys.Mvc.$create_Validation();
                validation.fieldErrorMessage = rule.ErrorMessage;
                validation.validator = validator;
                Array.add(fieldContext.validations, validation);
            }
        }
        fieldContext.enableDynamicValidation();
        Array.add(formContext.fields, fieldContext);
    }
    var registeredValidatorCallbacks = formElement.validationCallbacks;
    if (!registeredValidatorCallbacks) {
        registeredValidatorCallbacks = [];
        formElement.validationCallbacks = registeredValidatorCallbacks;
    }
    registeredValidatorCallbacks.push(Function.createDelegate(null, function() {
        return Sys.Mvc._validationUtil.arrayIsNullOrEmpty(formContext.validate('submit'));
    }));
    return formContext;
}
Sys.Mvc.FormContext.prototype = {
    _onClickHandler: null,
    _onSubmitHandler: null,
    _submitButtonClicked: null,
    _validationSummaryElement: null,
    _validationSummaryULElement: null,
    _formElement: null,
    replaceValidationSummary: false,
    
    addError: function Sys_Mvc_FormContext$addError(message) {
        /// <param name="message" type="String">
        /// </param>
        this.addErrors([ message ]);
    },
    
    addErrors: function Sys_Mvc_FormContext$addErrors(messages) {
        /// <param name="messages" type="Array" elementType="String">
        /// </param>
        if (!Sys.Mvc._validationUtil.arrayIsNullOrEmpty(messages)) {
            Array.addRange(this._errors, messages);
            this._onErrorCountChanged();
        }
    },
    
    clearErrors: function Sys_Mvc_FormContext$clearErrors() {
        Array.clear(this._errors);
        this._onErrorCountChanged();
    },
    
    _displayError: function Sys_Mvc_FormContext$_displayError() {
        if (this._validationSummaryElement) {
            if (this._validationSummaryULElement) {
                Sys.Mvc._validationUtil.removeAllChildren(this._validationSummaryULElement);
                for (var i = 0; i < this._errors.length; i++) {
                    var liElement = document.createElement('li');
                    Sys.Mvc._validationUtil.setInnerText(liElement, this._errors[i]);
                    this._validationSummaryULElement.appendChild(liElement);
                }
            }
            Sys.UI.DomElement.removeCssClass(this._validationSummaryElement, Sys.Mvc.FormContext._validationSummaryValidCss);
            Sys.UI.DomElement.addCssClass(this._validationSummaryElement, Sys.Mvc.FormContext._validationSummaryErrorCss);
        }
    },
    
    _displaySuccess: function Sys_Mvc_FormContext$_displaySuccess() {
        var validationSummaryElement = this._validationSummaryElement;
        if (validationSummaryElement) {
            var validationSummaryULElement = this._validationSummaryULElement;
            if (validationSummaryULElement) {
                validationSummaryULElement.innerHTML = '';
            }
            Sys.UI.DomElement.removeCssClass(validationSummaryElement, Sys.Mvc.FormContext._validationSummaryErrorCss);
            Sys.UI.DomElement.addCssClass(validationSummaryElement, Sys.Mvc.FormContext._validationSummaryValidCss);
        }
    },
    
    enableDynamicValidation: function Sys_Mvc_FormContext$enableDynamicValidation() {
        Sys.UI.DomEvent.addHandler(this._formElement, 'click', this._onClickHandler);
        Sys.UI.DomEvent.addHandler(this._formElement, 'submit', this._onSubmitHandler);
    },
    
    _findSubmitButton: function Sys_Mvc_FormContext$_findSubmitButton(element) {
        /// <param name="element" type="Object" domElement="true">
        /// </param>
        /// <returns type="Object" domElement="true"></returns>
        if (element.disabled) {
            return null;
        }
        var tagName = element.tagName.toUpperCase();
        var inputElement = element;
        if (tagName === 'INPUT') {
            var type = inputElement.type;
            if (type === 'submit' || type === 'image') {
                return inputElement;
            }
        }
        else if ((tagName === 'BUTTON') && (inputElement.type === 'submit')) {
            return inputElement;
        }
        return null;
    },
    
    _form_OnClick: function Sys_Mvc_FormContext$_form_OnClick(e) {
        /// <param name="e" type="Sys.UI.DomEvent">
        /// </param>
        this._submitButtonClicked = this._findSubmitButton(e.target);
    },
    
    _form_OnSubmit: function Sys_Mvc_FormContext$_form_OnSubmit(e) {
        /// <param name="e" type="Sys.UI.DomEvent">
        /// </param>
        var form = e.target;
        var submitButton = this._submitButtonClicked;
        if (submitButton && submitButton.disableValidation) {
            return;
        }
        var errorMessages = this.validate('submit');
        if (!Sys.Mvc._validationUtil.arrayIsNullOrEmpty(errorMessages)) {
            e.preventDefault();
        }
    },
    
    _onErrorCountChanged: function Sys_Mvc_FormContext$_onErrorCountChanged() {
        if (!this._errors.length) {
            this._displaySuccess();
        }
        else {
            this._displayError();
        }
    },
    
    validate: function Sys_Mvc_FormContext$validate(eventName) {
        /// <param name="eventName" type="String">
        /// </param>
        /// <returns type="Array" elementType="String"></returns>
        var fields = this.fields;
        var errors = [];
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (!field.elements[0].disabled) {
                var thisErrors = field.validate(eventName);
                if (thisErrors) {
                    Array.addRange(errors, thisErrors);
                }
            }
        }
        if (this.replaceValidationSummary) {
            this.clearErrors();
            this.addErrors(errors);
        }
        return errors;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.FieldContext

Sys.Mvc.FieldContext = function Sys_Mvc_FieldContext(formContext) {
    /// <param name="formContext" type="Sys.Mvc.FormContext">
    /// </param>
    /// <field name="_hasTextChangedTag" type="String" static="true">
    /// </field>
    /// <field name="_hasValidationFiredTag" type="String" static="true">
    /// </field>
    /// <field name="_inputElementErrorCss" type="String" static="true">
    /// </field>
    /// <field name="_inputElementValidCss" type="String" static="true">
    /// </field>
    /// <field name="_validationMessageErrorCss" type="String" static="true">
    /// </field>
    /// <field name="_validationMessageValidCss" type="String" static="true">
    /// </field>
    /// <field name="_onBlurHandler" type="Sys.UI.DomEventHandler">
    /// </field>
    /// <field name="_onChangeHandler" type="Sys.UI.DomEventHandler">
    /// </field>
    /// <field name="_onInputHandler" type="Sys.UI.DomEventHandler">
    /// </field>
    /// <field name="_onPropertyChangeHandler" type="Sys.UI.DomEventHandler">
    /// </field>
    /// <field name="_errors" type="Array">
    /// </field>
    /// <field name="defaultErrorMessage" type="String">
    /// </field>
    /// <field name="elements" type="Array" elementType="Object" elementDomElement="true">
    /// </field>
    /// <field name="formContext" type="Sys.Mvc.FormContext">
    /// </field>
    /// <field name="replaceValidationMessageContents" type="Boolean">
    /// </field>
    /// <field name="validationMessageElement" type="Object" domElement="true">
    /// </field>
    /// <field name="validations" type="Array" elementType="Validation">
    /// </field>
    this._errors = [];
    this.elements = new Array(0);
    this.validations = new Array(0);
    this.formContext = formContext;
    this._onBlurHandler = Function.createDelegate(this, this._element_OnBlur);
    this._onChangeHandler = Function.createDelegate(this, this._element_OnChange);
    this._onInputHandler = Function.createDelegate(this, this._element_OnInput);
    this._onPropertyChangeHandler = Function.createDelegate(this, this._element_OnPropertyChange);
}
Sys.Mvc.FieldContext.prototype = {
    _onBlurHandler: null,
    _onChangeHandler: null,
    _onInputHandler: null,
    _onPropertyChangeHandler: null,
    defaultErrorMessage: null,
    formContext: null,
    replaceValidationMessageContents: false,
    validationMessageElement: null,
    
    addError: function Sys_Mvc_FieldContext$addError(message) {
        /// <param name="message" type="String">
        /// </param>
        this.addErrors([ message ]);
    },
    
    addErrors: function Sys_Mvc_FieldContext$addErrors(messages) {
        /// <param name="messages" type="Array" elementType="String">
        /// </param>
        if (!Sys.Mvc._validationUtil.arrayIsNullOrEmpty(messages)) {
            Array.addRange(this._errors, messages);
            this._onErrorCountChanged();
        }
    },
    
    clearErrors: function Sys_Mvc_FieldContext$clearErrors() {
        Array.clear(this._errors);
        this._onErrorCountChanged();
    },
    
    _displayError: function Sys_Mvc_FieldContext$_displayError() {
        var validationMessageElement = this.validationMessageElement;
        if (validationMessageElement) {
            if (this.replaceValidationMessageContents) {
                Sys.Mvc._validationUtil.setInnerText(validationMessageElement, this._errors[0]);
            }
            Sys.UI.DomElement.removeCssClass(validationMessageElement, Sys.Mvc.FieldContext._validationMessageValidCss);
            Sys.UI.DomElement.addCssClass(validationMessageElement, Sys.Mvc.FieldContext._validationMessageErrorCss);
        }
        var elements = this.elements;
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            Sys.UI.DomElement.removeCssClass(element, Sys.Mvc.FieldContext._inputElementValidCss);
            Sys.UI.DomElement.addCssClass(element, Sys.Mvc.FieldContext._inputElementErrorCss);
        }
    },
    
    _displaySuccess: function Sys_Mvc_FieldContext$_displaySuccess() {
        var validationMessageElement = this.validationMessageElement;
        if (validationMessageElement) {
            if (this.replaceValidationMessageContents) {
                Sys.Mvc._validationUtil.setInnerText(validationMessageElement, '');
            }
            Sys.UI.DomElement.removeCssClass(validationMessageElement, Sys.Mvc.FieldContext._validationMessageErrorCss);
            Sys.UI.DomElement.addCssClass(validationMessageElement, Sys.Mvc.FieldContext._validationMessageValidCss);
        }
        var elements = this.elements;
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            Sys.UI.DomElement.removeCssClass(element, Sys.Mvc.FieldContext._inputElementErrorCss);
            Sys.UI.DomElement.addCssClass(element, Sys.Mvc.FieldContext._inputElementValidCss);
        }
    },
    
    _element_OnBlur: function Sys_Mvc_FieldContext$_element_OnBlur(e) {
        /// <param name="e" type="Sys.UI.DomEvent">
        /// </param>
        if (e.target[Sys.Mvc.FieldContext._hasTextChangedTag] || e.target[Sys.Mvc.FieldContext._hasValidationFiredTag]) {
            this.validate('blur');
        }
    },
    
    _element_OnChange: function Sys_Mvc_FieldContext$_element_OnChange(e) {
        /// <param name="e" type="Sys.UI.DomEvent">
        /// </param>
        e.target[Sys.Mvc.FieldContext._hasTextChangedTag] = true;
    },
    
    _element_OnInput: function Sys_Mvc_FieldContext$_element_OnInput(e) {
        /// <param name="e" type="Sys.UI.DomEvent">
        /// </param>
        e.target[Sys.Mvc.FieldContext._hasTextChangedTag] = true;
        if (e.target[Sys.Mvc.FieldContext._hasValidationFiredTag]) {
            this.validate('input');
        }
    },
    
    _element_OnPropertyChange: function Sys_Mvc_FieldContext$_element_OnPropertyChange(e) {
        /// <param name="e" type="Sys.UI.DomEvent">
        /// </param>
        if (e.rawEvent.propertyName === 'value') {
            e.target[Sys.Mvc.FieldContext._hasTextChangedTag] = true;
            if (e.target[Sys.Mvc.FieldContext._hasValidationFiredTag]) {
                this.validate('input');
            }
        }
    },
    
    enableDynamicValidation: function Sys_Mvc_FieldContext$enableDynamicValidation() {
        var elements = this.elements;
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            if (Sys.Mvc._validationUtil.elementSupportsEvent(element, 'onpropertychange')) {
                var compatMode = document.documentMode;
                if (compatMode && compatMode >= 8) {
                    Sys.UI.DomEvent.addHandler(element, 'propertychange', this._onPropertyChangeHandler);
                }
            }
            else {
                Sys.UI.DomEvent.addHandler(element, 'input', this._onInputHandler);
            }
            Sys.UI.DomEvent.addHandler(element, 'change', this._onChangeHandler);
            Sys.UI.DomEvent.addHandler(element, 'blur', this._onBlurHandler);
        }
    },
    
    _getErrorString: function Sys_Mvc_FieldContext$_getErrorString(validatorReturnValue, fieldErrorMessage) {
        /// <param name="validatorReturnValue" type="Object">
        /// </param>
        /// <param name="fieldErrorMessage" type="String">
        /// </param>
        /// <returns type="String"></returns>
        var fallbackErrorMessage = fieldErrorMessage || this.defaultErrorMessage;
        if (Boolean.isInstanceOfType(validatorReturnValue)) {
            return (validatorReturnValue) ? null : fallbackErrorMessage;
        }
        if (String.isInstanceOfType(validatorReturnValue)) {
            return ((validatorReturnValue).length) ? validatorReturnValue : fallbackErrorMessage;
        }
        return null;
    },
    
    _getStringValue: function Sys_Mvc_FieldContext$_getStringValue() {
        /// <returns type="String"></returns>
        var elements = this.elements;
        return (elements.length > 0) ? elements[0].value : null;
    },
    
    _markValidationFired: function Sys_Mvc_FieldContext$_markValidationFired() {
        var elements = this.elements;
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            element[Sys.Mvc.FieldContext._hasValidationFiredTag] = true;
        }
    },
    
    _onErrorCountChanged: function Sys_Mvc_FieldContext$_onErrorCountChanged() {
        if (!this._errors.length) {
            this._displaySuccess();
        }
        else {
            this._displayError();
        }
    },
    
    validate: function Sys_Mvc_FieldContext$validate(eventName) {
        /// <param name="eventName" type="String">
        /// </param>
        /// <returns type="Array" elementType="String"></returns>
        var validations = this.validations;
        var errors = [];
        var value = this._getStringValue();
        for (var i = 0; i < validations.length; i++) {
            var validation = validations[i];
            var context = Sys.Mvc.$create_ValidationContext();
            context.eventName = eventName;
            context.fieldContext = this;
            context.validation = validation;
            var retVal = validation.validator(value, context);
            var errorMessage = this._getErrorString(retVal, validation.fieldErrorMessage);
            if (!Sys.Mvc._validationUtil.stringIsNullOrEmpty(errorMessage)) {
                Array.add(errors, errorMessage);
            }
        }
        this._markValidationFired();
        this.clearErrors();
        this.addErrors(errors);
        return errors;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.RangeValidator

Sys.Mvc.RangeValidator = function Sys_Mvc_RangeValidator(minimum, maximum) {
    /// <param name="minimum" type="Number">
    /// </param>
    /// <param name="maximum" type="Number">
    /// </param>
    /// <field name="_minimum" type="Number">
    /// </field>
    /// <field name="_maximum" type="Number">
    /// </field>
    this._minimum = minimum;
    this._maximum = maximum;
}
Sys.Mvc.RangeValidator.create = function Sys_Mvc_RangeValidator$create(rule) {
    /// <param name="rule" type="Sys.Mvc.JsonValidationRule">
    /// </param>
    /// <returns type="Sys.Mvc.Validator"></returns>
    var min = rule.ValidationParameters['min'];
    var max = rule.ValidationParameters['max'];
    return Function.createDelegate(new Sys.Mvc.RangeValidator(min, max), new Sys.Mvc.RangeValidator(min, max).validate);
}
Sys.Mvc.RangeValidator.prototype = {
    _minimum: null,
    _maximum: null,
    
    validate: function Sys_Mvc_RangeValidator$validate(value, context) {
        /// <param name="value" type="String">
        /// </param>
        /// <param name="context" type="Sys.Mvc.ValidationContext">
        /// </param>
        /// <returns type="Object"></returns>
        if (Sys.Mvc._validationUtil.stringIsNullOrEmpty(value)) {
            return true;
        }
        var n = Number.parseLocale(value);
        return (!isNaN(n) && this._minimum <= n && n <= this._maximum);
    }
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.RegularExpressionValidator

Sys.Mvc.RegularExpressionValidator = function Sys_Mvc_RegularExpressionValidator(pattern) {
    /// <param name="pattern" type="String">
    /// </param>
    /// <field name="_pattern" type="String">
    /// </field>
    this._pattern = pattern;
}
Sys.Mvc.RegularExpressionValidator.create = function Sys_Mvc_RegularExpressionValidator$create(rule) {
    /// <param name="rule" type="Sys.Mvc.JsonValidationRule">
    /// </param>
    /// <returns type="Sys.Mvc.Validator"></returns>
    var pattern = rule.ValidationParameters['pattern'];
    return Function.createDelegate(new Sys.Mvc.RegularExpressionValidator(pattern), new Sys.Mvc.RegularExpressionValidator(pattern).validate);
}
Sys.Mvc.RegularExpressionValidator.prototype = {
    _pattern: null,
    
    validate: function Sys_Mvc_RegularExpressionValidator$validate(value, context) {
        /// <param name="value" type="String">
        /// </param>
        /// <param name="context" type="Sys.Mvc.ValidationContext">
        /// </param>
        /// <returns type="Object"></returns>
        if (Sys.Mvc._validationUtil.stringIsNullOrEmpty(value)) {
            return true;
        }
        var regExp = new RegExp(this._pattern);
        var matches = regExp.exec(value);
        return (!Sys.Mvc._validationUtil.arrayIsNullOrEmpty(matches) && matches[0].length === value.length);
    }
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.RequiredValidator

Sys.Mvc.RequiredValidator = function Sys_Mvc_RequiredValidator() {
}
Sys.Mvc.RequiredValidator.create = function Sys_Mvc_RequiredValidator$create(rule) {
    /// <param name="rule" type="Sys.Mvc.JsonValidationRule">
    /// </param>
    /// <returns type="Sys.Mvc.Validator"></returns>
    return Function.createDelegate(new Sys.Mvc.RequiredValidator(), new Sys.Mvc.RequiredValidator().validate);
}
Sys.Mvc.RequiredValidator._isRadioInputElement = function Sys_Mvc_RequiredValidator$_isRadioInputElement(element) {
    /// <param name="element" type="Object" domElement="true">
    /// </param>
    /// <returns type="Boolean"></returns>
    if (element.tagName.toUpperCase() === 'INPUT') {
        var inputType = (element.type).toUpperCase();
        if (inputType === 'RADIO') {
            return true;
        }
    }
    return false;
}
Sys.Mvc.RequiredValidator._isSelectInputElement = function Sys_Mvc_RequiredValidator$_isSelectInputElement(element) {
    /// <param name="element" type="Object" domElement="true">
    /// </param>
    /// <returns type="Boolean"></returns>
    if (element.tagName.toUpperCase() === 'SELECT') {
        return true;
    }
    return false;
}
Sys.Mvc.RequiredValidator._isTextualInputElement = function Sys_Mvc_RequiredValidator$_isTextualInputElement(element) {
    /// <param name="element" type="Object" domElement="true">
    /// </param>
    /// <returns type="Boolean"></returns>
    if (element.tagName.toUpperCase() === 'INPUT') {
        var inputType = (element.type).toUpperCase();
        switch (inputType) {
            case 'TEXT':
            case 'PASSWORD':
            case 'FILE':
                return true;
        }
    }
    if (element.tagName.toUpperCase() === 'TEXTAREA') {
        return true;
    }
    return false;
}
Sys.Mvc.RequiredValidator._validateRadioInput = function Sys_Mvc_RequiredValidator$_validateRadioInput(elements) {
    /// <param name="elements" type="Array" elementType="Object" elementDomElement="true">
    /// </param>
    /// <returns type="Object"></returns>
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        if (element.checked) {
            return true;
        }
    }
    return false;
}
Sys.Mvc.RequiredValidator._validateSelectInput = function Sys_Mvc_RequiredValidator$_validateSelectInput(optionElements) {
    /// <param name="optionElements" type="DOMElementCollection">
    /// </param>
    /// <returns type="Object"></returns>
    for (var i = 0; i < optionElements.length; i++) {
        var element = optionElements[i];
        if (element.selected) {
            if (!Sys.Mvc._validationUtil.stringIsNullOrEmpty(element.value)) {
                return true;
            }
        }
    }
    return false;
}
Sys.Mvc.RequiredValidator._validateTextualInput = function Sys_Mvc_RequiredValidator$_validateTextualInput(element) {
    /// <param name="element" type="Object" domElement="true">
    /// </param>
    /// <returns type="Object"></returns>
    return (!Sys.Mvc._validationUtil.stringIsNullOrEmpty(element.value));
}
Sys.Mvc.RequiredValidator.prototype = {
    
    validate: function Sys_Mvc_RequiredValidator$validate(value, context) {
        /// <param name="value" type="String">
        /// </param>
        /// <param name="context" type="Sys.Mvc.ValidationContext">
        /// </param>
        /// <returns type="Object"></returns>
        var elements = context.fieldContext.elements;
        if (!elements.length) {
            return true;
        }
        var sampleElement = elements[0];
        if (Sys.Mvc.RequiredValidator._isTextualInputElement(sampleElement)) {
            return Sys.Mvc.RequiredValidator._validateTextualInput(sampleElement);
        }
        if (Sys.Mvc.RequiredValidator._isRadioInputElement(sampleElement)) {
            return Sys.Mvc.RequiredValidator._validateRadioInput(elements);
        }
        if (Sys.Mvc.RequiredValidator._isSelectInputElement(sampleElement)) {
            return Sys.Mvc.RequiredValidator._validateSelectInput((sampleElement).options);
        }
        return true;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.StringLengthValidator

Sys.Mvc.StringLengthValidator = function Sys_Mvc_StringLengthValidator(minLength, maxLength) {
    /// <param name="minLength" type="Number" integer="true">
    /// </param>
    /// <param name="maxLength" type="Number" integer="true">
    /// </param>
    /// <field name="_maxLength" type="Number" integer="true">
    /// </field>
    /// <field name="_minLength" type="Number" integer="true">
    /// </field>
    this._minLength = minLength;
    this._maxLength = maxLength;
}
Sys.Mvc.StringLengthValidator.create = function Sys_Mvc_StringLengthValidator$create(rule) {
    /// <param name="rule" type="Sys.Mvc.JsonValidationRule">
    /// </param>
    /// <returns type="Sys.Mvc.Validator"></returns>
    var minLength = (rule.ValidationParameters['min'] || 0);
    var maxLength = (rule.ValidationParameters['max'] || Number.MAX_VALUE);
    return Function.createDelegate(new Sys.Mvc.StringLengthValidator(minLength, maxLength), new Sys.Mvc.StringLengthValidator(minLength, maxLength).validate);
}
Sys.Mvc.StringLengthValidator.prototype = {
    _maxLength: 0,
    _minLength: 0,
    
    validate: function Sys_Mvc_StringLengthValidator$validate(value, context) {
        /// <param name="value" type="String">
        /// </param>
        /// <param name="context" type="Sys.Mvc.ValidationContext">
        /// </param>
        /// <returns type="Object"></returns>
        if (Sys.Mvc._validationUtil.stringIsNullOrEmpty(value)) {
            return true;
        }
        return (this._minLength <= value.length && value.length <= this._maxLength);
    }
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc._validationUtil

Sys.Mvc._validationUtil = function Sys_Mvc__validationUtil() {
}
Sys.Mvc._validationUtil.arrayIsNullOrEmpty = function Sys_Mvc__validationUtil$arrayIsNullOrEmpty(array) {
    /// <param name="array" type="Array" elementType="Object">
    /// </param>
    /// <returns type="Boolean"></returns>
    return (!array || !array.length);
}
Sys.Mvc._validationUtil.stringIsNullOrEmpty = function Sys_Mvc__validationUtil$stringIsNullOrEmpty(value) {
    /// <param name="value" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    return (!value || !value.length);
}
Sys.Mvc._validationUtil.elementSupportsEvent = function Sys_Mvc__validationUtil$elementSupportsEvent(element, eventAttributeName) {
    /// <param name="element" type="Object" domElement="true">
    /// </param>
    /// <param name="eventAttributeName" type="String">
    /// </param>
    /// <returns type="Boolean"></returns>
    return (eventAttributeName in element);
}
Sys.Mvc._validationUtil.removeAllChildren = function Sys_Mvc__validationUtil$removeAllChildren(element) {
    /// <param name="element" type="Object" domElement="true">
    /// </param>
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}
Sys.Mvc._validationUtil.setInnerText = function Sys_Mvc__validationUtil$setInnerText(element, innerText) {
    /// <param name="element" type="Object" domElement="true">
    /// </param>
    /// <param name="innerText" type="String">
    /// </param>
    var textNode = document.createTextNode(innerText);
    Sys.Mvc._validationUtil.removeAllChildren(element);
    element.appendChild(textNode);
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.ValidatorRegistry

Sys.Mvc.ValidatorRegistry = function Sys_Mvc_ValidatorRegistry() {
    /// <field name="validators" type="Object" static="true">
    /// </field>
}
Sys.Mvc.ValidatorRegistry.getValidator = function Sys_Mvc_ValidatorRegistry$getValidator(rule) {
    /// <param name="rule" type="Sys.Mvc.JsonValidationRule">
    /// </param>
    /// <returns type="Sys.Mvc.Validator"></returns>
    var creator = Sys.Mvc.ValidatorRegistry.validators[rule.ValidationType];
    return (creator) ? creator(rule) : null;
}
Sys.Mvc.ValidatorRegistry._getDefaultValidators = function Sys_Mvc_ValidatorRegistry$_getDefaultValidators() {
    /// <returns type="Object"></returns>
    return { required: Function.createDelegate(null, Sys.Mvc.RequiredValidator.create), length: Function.createDelegate(null, Sys.Mvc.StringLengthValidator.create), regex: Function.createDelegate(null, Sys.Mvc.RegularExpressionValidator.create), range: Function.createDelegate(null, Sys.Mvc.RangeValidator.create), number: Function.createDelegate(null, Sys.Mvc.NumberValidator.create) };
}


Sys.Mvc.NumberValidator.registerClass('Sys.Mvc.NumberValidator');
Sys.Mvc.FormContext.registerClass('Sys.Mvc.FormContext');
Sys.Mvc.FieldContext.registerClass('Sys.Mvc.FieldContext');
Sys.Mvc.RangeValidator.registerClass('Sys.Mvc.RangeValidator');
Sys.Mvc.RegularExpressionValidator.registerClass('Sys.Mvc.RegularExpressionValidator');
Sys.Mvc.RequiredValidator.registerClass('Sys.Mvc.RequiredValidator');
Sys.Mvc.StringLengthValidator.registerClass('Sys.Mvc.StringLengthValidator');
Sys.Mvc._validationUtil.registerClass('Sys.Mvc._validationUtil');
Sys.Mvc.ValidatorRegistry.registerClass('Sys.Mvc.ValidatorRegistry');
Sys.Mvc.FormContext._validationSummaryErrorCss = 'validation-summary-errors';
Sys.Mvc.FormContext._validationSummaryValidCss = 'validation-summary-valid';
Sys.Mvc.FormContext._formValidationTag = '__MVC_FormValidation';
Sys.Mvc.FieldContext._hasTextChangedTag = '__MVC_HasTextChanged';
Sys.Mvc.FieldContext._hasValidationFiredTag = '__MVC_HasValidationFired';
Sys.Mvc.FieldContext._inputElementErrorCss = 'input-validation-error';
Sys.Mvc.FieldContext._inputElementValidCss = 'input-validation-valid';
Sys.Mvc.FieldContext._validationMessageErrorCss = 'field-validation-error';
Sys.Mvc.FieldContext._validationMessageValidCss = 'field-validation-valid';
Sys.Mvc.ValidatorRegistry.validators = Sys.Mvc.ValidatorRegistry._getDefaultValidators();

// ---- Do not remove this footer ----
// Generated using Script# v0.5.0.0 (http://projects.nikhilk.net)
// -----------------------------------

// register validation
Sys.Application.add_load(function() {
  Sys.Application.remove_load(arguments.callee);
  Sys.Mvc.FormContext._Application_Load();
});
