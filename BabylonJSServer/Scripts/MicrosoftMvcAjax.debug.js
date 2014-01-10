//!----------------------------------------------------------
//! Copyright (C) Microsoft Corporation. All rights reserved.
//!----------------------------------------------------------
//! MicrosoftMvcAjax.js

Type.registerNamespace('Sys.Mvc');

////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.AjaxOptions

Sys.Mvc.$create_AjaxOptions = function Sys_Mvc_AjaxOptions() { return {}; }


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.InsertionMode

Sys.Mvc.InsertionMode = function() { 
    /// <field name="replace" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="insertBefore" type="Number" integer="true" static="true">
    /// </field>
    /// <field name="insertAfter" type="Number" integer="true" static="true">
    /// </field>
};
Sys.Mvc.InsertionMode.prototype = {
    replace: 0, 
    insertBefore: 1, 
    insertAfter: 2
}
Sys.Mvc.InsertionMode.registerEnum('Sys.Mvc.InsertionMode', false);


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.AjaxContext

Sys.Mvc.AjaxContext = function Sys_Mvc_AjaxContext(request, updateTarget, loadingElement, insertionMode) {
    /// <param name="request" type="Sys.Net.WebRequest">
    /// </param>
    /// <param name="updateTarget" type="Object" domElement="true">
    /// </param>
    /// <param name="loadingElement" type="Object" domElement="true">
    /// </param>
    /// <param name="insertionMode" type="Sys.Mvc.InsertionMode">
    /// </param>
    /// <field name="_insertionMode" type="Sys.Mvc.InsertionMode">
    /// </field>
    /// <field name="_loadingElement" type="Object" domElement="true">
    /// </field>
    /// <field name="_response" type="Sys.Net.WebRequestExecutor">
    /// </field>
    /// <field name="_request" type="Sys.Net.WebRequest">
    /// </field>
    /// <field name="_updateTarget" type="Object" domElement="true">
    /// </field>
    this._request = request;
    this._updateTarget = updateTarget;
    this._loadingElement = loadingElement;
    this._insertionMode = insertionMode;
}
Sys.Mvc.AjaxContext.prototype = {
    _insertionMode: 0,
    _loadingElement: null,
    _response: null,
    _request: null,
    _updateTarget: null,
    
    get_data: function Sys_Mvc_AjaxContext$get_data() {
        /// <value type="String"></value>
        if (this._response) {
            return this._response.get_responseData();
        }
        else {
            return null;
        }
    },
    
    get_insertionMode: function Sys_Mvc_AjaxContext$get_insertionMode() {
        /// <value type="Sys.Mvc.InsertionMode"></value>
        return this._insertionMode;
    },
    
    get_loadingElement: function Sys_Mvc_AjaxContext$get_loadingElement() {
        /// <value type="Object" domElement="true"></value>
        return this._loadingElement;
    },
    
    get_object: function Sys_Mvc_AjaxContext$get_object() {
        /// <value type="Object"></value>
        var executor = this.get_response();
        return (executor) ? executor.get_object() : null;
    },
    
    get_response: function Sys_Mvc_AjaxContext$get_response() {
        /// <value type="Sys.Net.WebRequestExecutor"></value>
        return this._response;
    },
    set_response: function Sys_Mvc_AjaxContext$set_response(value) {
        /// <value type="Sys.Net.WebRequestExecutor"></value>
        this._response = value;
        return value;
    },
    
    get_request: function Sys_Mvc_AjaxContext$get_request() {
        /// <value type="Sys.Net.WebRequest"></value>
        return this._request;
    },
    
    get_updateTarget: function Sys_Mvc_AjaxContext$get_updateTarget() {
        /// <value type="Object" domElement="true"></value>
        return this._updateTarget;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.AsyncHyperlink

Sys.Mvc.AsyncHyperlink = function Sys_Mvc_AsyncHyperlink() {
}
Sys.Mvc.AsyncHyperlink.handleClick = function Sys_Mvc_AsyncHyperlink$handleClick(anchor, evt, ajaxOptions) {
    /// <param name="anchor" type="Object" domElement="true">
    /// </param>
    /// <param name="evt" type="Sys.UI.DomEvent">
    /// </param>
    /// <param name="ajaxOptions" type="Sys.Mvc.AjaxOptions">
    /// </param>
    evt.preventDefault();
    Sys.Mvc.MvcHelpers._asyncRequest(anchor.href, 'post', '', anchor, ajaxOptions);
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.MvcHelpers

Sys.Mvc.MvcHelpers = function Sys_Mvc_MvcHelpers() {
}
Sys.Mvc.MvcHelpers._serializeSubmitButton = function Sys_Mvc_MvcHelpers$_serializeSubmitButton(element, offsetX, offsetY) {
    /// <param name="element" type="Object" domElement="true">
    /// </param>
    /// <param name="offsetX" type="Number" integer="true">
    /// </param>
    /// <param name="offsetY" type="Number" integer="true">
    /// </param>
    /// <returns type="String"></returns>
    if (element.disabled) {
        return null;
    }
    var name = element.name;
    if (name) {
        var tagName = element.tagName.toUpperCase();
        var encodedName = encodeURIComponent(name);
        var inputElement = element;
        if (tagName === 'INPUT') {
            var type = inputElement.type;
            if (type === 'submit') {
                return encodedName + '=' + encodeURIComponent(inputElement.value);
            }
            else if (type === 'image') {
                return encodedName + '.x=' + offsetX + '&' + encodedName + '.y=' + offsetY;
            }
        }
        else if ((tagName === 'BUTTON') && (name.length) && (inputElement.type === 'submit')) {
            return encodedName + '=' + encodeURIComponent(inputElement.value);
        }
    }
    return null;
}
Sys.Mvc.MvcHelpers._serializeForm = function Sys_Mvc_MvcHelpers$_serializeForm(form) {
    /// <param name="form" type="Object" domElement="true">
    /// </param>
    /// <returns type="String"></returns>
    var formElements = form.elements;
    var formBody = new Sys.StringBuilder();
    var count = formElements.length;
    for (var i = 0; i < count; i++) {
        var element = formElements[i];
        var name = element.name;
        if (!name || !name.length) {
            continue;
        }
        var tagName = element.tagName.toUpperCase();
        if (tagName === 'INPUT') {
            var inputElement = element;
            var type = inputElement.type;
            if ((type === 'text') || (type === 'password') || (type === 'hidden') || (((type === 'checkbox') || (type === 'radio')) && element.checked)) {
                formBody.append(encodeURIComponent(name));
                formBody.append('=');
                formBody.append(encodeURIComponent(inputElement.value));
                formBody.append('&');
            }
        }
        else if (tagName === 'SELECT') {
            var selectElement = element;
            var optionCount = selectElement.options.length;
            for (var j = 0; j < optionCount; j++) {
                var optionElement = selectElement.options[j];
                if (optionElement.selected) {
                    formBody.append(encodeURIComponent(name));
                    formBody.append('=');
                    formBody.append(encodeURIComponent(optionElement.value));
                    formBody.append('&');
                }
            }
        }
        else if (tagName === 'TEXTAREA') {
            formBody.append(encodeURIComponent(name));
            formBody.append('=');
            formBody.append(encodeURIComponent((element.value)));
            formBody.append('&');
        }
    }
    var additionalInput = form._additionalInput;
    if (additionalInput) {
        formBody.append(additionalInput);
        formBody.append('&');
    }
    return formBody.toString();
}
Sys.Mvc.MvcHelpers._asyncRequest = function Sys_Mvc_MvcHelpers$_asyncRequest(url, verb, body, triggerElement, ajaxOptions) {
    /// <param name="url" type="String">
    /// </param>
    /// <param name="verb" type="String">
    /// </param>
    /// <param name="body" type="String">
    /// </param>
    /// <param name="triggerElement" type="Object" domElement="true">
    /// </param>
    /// <param name="ajaxOptions" type="Sys.Mvc.AjaxOptions">
    /// </param>
    if (ajaxOptions.confirm) {
        if (!confirm(ajaxOptions.confirm)) {
            return;
        }
    }
    if (ajaxOptions.url) {
        url = ajaxOptions.url;
    }
    if (ajaxOptions.httpMethod) {
        verb = ajaxOptions.httpMethod;
    }
    if (body.length > 0 && !body.endsWith('&')) {
        body += '&';
    }
    body += 'X-Requested-With=XMLHttpRequest';
    var upperCaseVerb = verb.toUpperCase();
    var isGetOrPost = (upperCaseVerb === 'GET' || upperCaseVerb === 'POST');
    if (!isGetOrPost) {
        body += '&';
        body += 'X-HTTP-Method-Override=' + upperCaseVerb;
    }
    var requestBody = '';
    if (upperCaseVerb === 'GET' || upperCaseVerb === 'DELETE') {
        if (url.indexOf('?') > -1) {
            if (!url.endsWith('&')) {
                url += '&';
            }
            url += body;
        }
        else {
            url += '?';
            url += body;
        }
    }
    else {
        requestBody = body;
    }
    var request = new Sys.Net.WebRequest();
    request.set_url(url);
    if (isGetOrPost) {
        request.set_httpVerb(verb);
    }
    else {
        request.set_httpVerb('POST');
        request.get_headers()['X-HTTP-Method-Override'] = upperCaseVerb;
    }
    request.set_body(requestBody);
    if (verb.toUpperCase() === 'PUT') {
        request.get_headers()['Content-Type'] = 'application/x-www-form-urlencoded;';
    }
    request.get_headers()['X-Requested-With'] = 'XMLHttpRequest';
    var updateElement = null;
    if (ajaxOptions.updateTargetId) {
        updateElement = $get(ajaxOptions.updateTargetId);
    }
    var loadingElement = null;
    if (ajaxOptions.loadingElementId) {
        loadingElement = $get(ajaxOptions.loadingElementId);
    }
    var ajaxContext = new Sys.Mvc.AjaxContext(request, updateElement, loadingElement, ajaxOptions.insertionMode);
    var continueRequest = true;
    if (ajaxOptions.onBegin) {
        continueRequest = ajaxOptions.onBegin(ajaxContext) !== false;
    }
    if (loadingElement) {
        Sys.UI.DomElement.setVisible(ajaxContext.get_loadingElement(), true);
    }
    if (continueRequest) {
        request.add_completed(Function.createDelegate(null, function(executor) {
            Sys.Mvc.MvcHelpers._onComplete(request, ajaxOptions, ajaxContext);
        }));
        request.invoke();
    }
}
Sys.Mvc.MvcHelpers._onComplete = function Sys_Mvc_MvcHelpers$_onComplete(request, ajaxOptions, ajaxContext) {
    /// <param name="request" type="Sys.Net.WebRequest">
    /// </param>
    /// <param name="ajaxOptions" type="Sys.Mvc.AjaxOptions">
    /// </param>
    /// <param name="ajaxContext" type="Sys.Mvc.AjaxContext">
    /// </param>
    ajaxContext.set_response(request.get_executor());
    if (ajaxOptions.onComplete && ajaxOptions.onComplete(ajaxContext) === false) {
        return;
    }
    var statusCode = ajaxContext.get_response().get_statusCode();
    if ((statusCode >= 200 && statusCode < 300) || statusCode === 304 || statusCode === 1223) {
        if (statusCode !== 204 && statusCode !== 304 && statusCode !== 1223) {
            var contentType = ajaxContext.get_response().getResponseHeader('Content-Type');
            if ((contentType) && (contentType.indexOf('application/x-javascript') !== -1)) {
                eval(ajaxContext.get_data());
            }
            else {
                Sys.Mvc.MvcHelpers.updateDomElement(ajaxContext.get_updateTarget(), ajaxContext.get_insertionMode(), ajaxContext.get_data());
            }
        }
        if (ajaxOptions.onSuccess) {
            ajaxOptions.onSuccess(ajaxContext);
        }
    }
    else {
        if (ajaxOptions.onFailure) {
            ajaxOptions.onFailure(ajaxContext);
        }
    }
    if (ajaxContext.get_loadingElement()) {
        Sys.UI.DomElement.setVisible(ajaxContext.get_loadingElement(), false);
    }
}
Sys.Mvc.MvcHelpers.updateDomElement = function Sys_Mvc_MvcHelpers$updateDomElement(target, insertionMode, content) {
    /// <param name="target" type="Object" domElement="true">
    /// </param>
    /// <param name="insertionMode" type="Sys.Mvc.InsertionMode">
    /// </param>
    /// <param name="content" type="String">
    /// </param>
    if (target) {
        switch (insertionMode) {
            case Sys.Mvc.InsertionMode.replace:
                target.innerHTML = content;
                break;
            case Sys.Mvc.InsertionMode.insertBefore:
                if (content && content.length > 0) {
                    target.innerHTML = content + target.innerHTML.trimStart();
                }
                break;
            case Sys.Mvc.InsertionMode.insertAfter:
                if (content && content.length > 0) {
                    target.innerHTML = target.innerHTML.trimEnd() + content;
                }
                break;
        }
    }
}


////////////////////////////////////////////////////////////////////////////////
// Sys.Mvc.AsyncForm

Sys.Mvc.AsyncForm = function Sys_Mvc_AsyncForm() {
}
Sys.Mvc.AsyncForm.handleClick = function Sys_Mvc_AsyncForm$handleClick(form, evt) {
    /// <param name="form" type="Object" domElement="true">
    /// </param>
    /// <param name="evt" type="Sys.UI.DomEvent">
    /// </param>
    var additionalInput = Sys.Mvc.MvcHelpers._serializeSubmitButton(evt.target, evt.offsetX, evt.offsetY);
    form._additionalInput = additionalInput;
}
Sys.Mvc.AsyncForm.handleSubmit = function Sys_Mvc_AsyncForm$handleSubmit(form, evt, ajaxOptions) {
    /// <param name="form" type="Object" domElement="true">
    /// </param>
    /// <param name="evt" type="Sys.UI.DomEvent">
    /// </param>
    /// <param name="ajaxOptions" type="Sys.Mvc.AjaxOptions">
    /// </param>
    evt.preventDefault();
    var validationCallbacks = form.validationCallbacks;
    if (validationCallbacks) {
        for (var i = 0; i < validationCallbacks.length; i++) {
            var callback = validationCallbacks[i];
            if (!callback()) {
                return;
            }
        }
    }
    var body = Sys.Mvc.MvcHelpers._serializeForm(form);
    Sys.Mvc.MvcHelpers._asyncRequest(form.action, form.method || 'post', body, form, ajaxOptions);
}


Sys.Mvc.AjaxContext.registerClass('Sys.Mvc.AjaxContext');
Sys.Mvc.AsyncHyperlink.registerClass('Sys.Mvc.AsyncHyperlink');
Sys.Mvc.MvcHelpers.registerClass('Sys.Mvc.MvcHelpers');
Sys.Mvc.AsyncForm.registerClass('Sys.Mvc.AsyncForm');

// ---- Do not remove this footer ----
// Generated using Script# v0.5.0.0 (http://projects.nikhilk.net)
// -----------------------------------
