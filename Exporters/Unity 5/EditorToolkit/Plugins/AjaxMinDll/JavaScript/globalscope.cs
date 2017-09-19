// globalscope.cs
//
// Copyright 2010 Microsoft Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text.RegularExpressions;

namespace Microsoft.Ajax.Utilities
{
    public sealed class GlobalScope : ActivationObject
    {
        // rather than itemizing all the browser- and DOM-specific global API for all the browsers, we're just going to
        // look for a few common prefixes, and the pattern: prefix + Pascal-case identifier.
        // this will allow us to catch things like msRequestAutomationFrame, msmsGetWeakWinRTProperty, mozPaintCount, etc.
        // and will also pick up the dozens of DOM element names like HTMLAnchorElement and HTMLTableColElement.
        private static Regex s_blanketPrefixes = new Regex(@"^(?:ms|MS|o|webkit|moz|Gecko|HTML)(?:[A-Z][a-z0-9]*)+$", RegexOptions.CultureInvariant | RegexOptions.Compiled);

        private HashSet<string> m_globalProperties;
        private HashSet<string> m_globalFunctions;
        private HashSet<string> m_assumedGlobals;
        private HashSet<UndefinedReference> m_undefined;

        public ICollection<UndefinedReference> UndefinedReferences { get { return m_undefined; } }

        internal GlobalScope(CodeSettings settings)
            : base(null, settings)
        {
            ScopeType = ScopeType.Global;

            // define the Global object's properties, and methods
            m_globalProperties = new HashSet<string> { 
                "__proto__", 
                "Crypto", 
                "Infinity", "Intl",
                "JSON", 
                "Math",
                "NaN", 
                "System", 
                "Windows", "WinJS", 
                "applicationCache", 
                "chrome", "clientInformation", "clipboardData", "closed", "console", "crypto", 
                "defaultStatus", "devicePixelRatio", "document", 
                "event", "external", 
                "frameElement", "frames", 
                "history", 
                "indexedDB", "innerHeight", "innerWidth",
                "length", "localStorage", "location", 
                "name", "navigator", 
                "offscreenBuffering", "opener", "outerHeight", "outerWidth",
                "pageXOffset", "pageYOffset", "parent", "performance",
                "screen", "screenLeft", "screenTop", "screenX", "screenY", "self", "sessionStorage", "status", 
                "top", 
                "undefined", 
                "window"};

            m_globalFunctions = new HashSet<string> {
                "ActiveXObject", "Array", "ArrayBuffer", "ArrayBufferView", 
                "Boolean", 
                "DataView", "Date", "Debug", "DocumentTouch", "DOMParser", 
                "Error", "EvalError", "EventSource", 
                "File", "FileList", "FileReader", "Float32Array", "Float64Array", "Function", 
                "Image", "Int16Array", "Int32Array", "Int8Array", "Iterator", 
                "Map",
                "Node", "NodeFilter", "NodeIterator", "NodeList", "NodeSelector", "Number", 
                "Object", 
                "Proxy", 
                "RangeError", "ReferenceError", "RegExp", 
                "Set", "SharedWorker", "String", "SyntaxError", 
                "TypeError", 
                "Uint8Array", "Uint8ClampedArray", "Uint16Array", "Uint32Array", "URIError", "URL",
                "WeakMap", "WebSocket", "Worker",
                "XDomainRequest", "XMLHttpRequest", 
                "addEventListener", "alert", "attachEvent", 
                "blur", 
                "cancelAnimationFrame", "captureEvents", "clearImmediate", "clearInterval", "clearTimeout", "close", "confirm", "createPopup", 
                "decodeURI", "decodeURIComponent", "detachEvent", "dispatchEvent", 
                "encodeURI", "encodeURIComponent", "escape", "eval", "execScript", 
                "focus", 
                "getComputedStyle", "getSelection", 
                "importScripts", "isFinite", "isNaN",
                "matchMedia", "moveBy", "moveTo",
                "navigate", 
                "open", 
                "parseFloat", "parseInt", "postMessage", "prompt", 
                "releaseEvents", "removeEventListener", "requestAnimationFrame", "resizeBy", "resizeTo", 
                "scroll", "scrollBy", "scrollTo", "setActive", "setImmediate", "setInterval", "setTimeout", "showModalDialog", "showModelessDialog", "styleMedia",
                "unescape"};
        }

        public void AddUndefinedReference(UndefinedReference exception)
        {
            if (m_undefined == null)
            {
                m_undefined = new HashSet<UndefinedReference>();
            }

            m_undefined.Add(exception);
        }

        internal void SetAssumedGlobals(CodeSettings settings)
        {
            if (settings != null)
            {
                // start off with any known globals
                m_assumedGlobals = settings.KnownGlobalCollection == null ? new HashSet<string>() : new HashSet<string>(settings.KnownGlobalCollection);

                // chek to see if there are any debug lookups
                foreach (var debugLookup in settings.DebugLookupCollection)
                {
                    m_assumedGlobals.Add(debugLookup.SubstringUpToFirst('.'));
                }

                // and the root name of any resource strings is also an assumed global
                foreach (var resourceStrings in settings.ResourceStrings)
                {
                    if (!resourceStrings.Name.IsNullOrWhiteSpace())
                    {
                        m_assumedGlobals.Add(resourceStrings.Name.SubstringUpToFirst('.'));
                    }
                }
            }
            else
            {
                // empty set
                m_assumedGlobals = new HashSet<string>();
            }
        }

        internal override void AnalyzeScope()
        {
            // rename fields if we need to
            ManualRenameFields();

            // recurse 
            foreach (var activationObject in ChildScopes)
            {
                // but not for existing child scopes
                if (!activationObject.Existing)
                {
                    activationObject.AnalyzeScope();
                }
            }
        }

        internal override void AutoRenameFields()
        {
            // don't crunch global values -- they might be referenced in other scripts
            // within the page but outside this module.

            // traverse through our children scopes
            foreach (ActivationObject scope in ChildScopes)
            {
                // don't recurse existing child scopes
                if (!scope.Existing)
                {
                    scope.AutoRenameFields();
                }
            }
        }

        public override JSVariableField this[string name]
        {
            get
            {
                // check the name table
                JSVariableField variableField = base[name];

                // not found so far, check the global properties
                if (variableField == null)
                {
                    variableField = ResolveFromCollection(name, m_globalProperties, FieldType.Predefined, false);
                }

                // not found so far, check the global properties
                if (variableField == null)
                {
                    variableField = ResolveFromCollection(name, m_globalFunctions, FieldType.Predefined, true);
                }

                // if not found so far, check to see if this value is provided in our "assumed" 
                // global list specified on the command line
                if (variableField == null)
                {
                    variableField = ResolveFromCollection(name, m_assumedGlobals, FieldType.Global, false);
                }

                // if it's not something explicitly defined so far, check to see if it
                // matches the browser-specific pattern (prefixes followed by Pascal-cased identifiers).
                // Plus, most browsers expose dozens of DOM elements prefixed by "HTML" 
                // (eg: HTMLAnchorElement and HTMLTableColElement).
                if (variableField == null && s_blanketPrefixes.IsMatch(name))
                {
                    variableField = new JSVariableField(FieldType.Predefined, name, 0, null);
                    AddField(variableField);
                }

                return variableField;
            }
        }

        private JSVariableField ResolveFromCollection(string name, HashSet<string> collection, FieldType fieldType, bool isFunction)
        {
            if (collection.Contains(name))
            {
                var variableField = new JSVariableField(fieldType, name, 0, null);
                variableField.IsFunction = isFunction;
                return AddField(variableField);
            }

            return null;
        }

        /// <summary>
        /// Set up this scope's fields from the declarations it contains
        /// </summary>
        public override void DeclareScope()
        {
            // bind lexical declarations
            DefineLexicalDeclarations();

            // bind the variable declarations
            DefineVarDeclarations();
        }

        public override JSVariableField CreateField(string name, object value, FieldAttributes attributes)
        {
            return new JSVariableField(FieldType.Global, name, attributes, value);
        }

        public override JSVariableField CreateField(JSVariableField outerField)
        {
            // should NEVER try to create an inner field in a global scope
            throw new NotImplementedException();
        }
    }
}
