module INSPECTOR {
    export class Helpers {
        
        
        /** 
         * Returns the type of the given object. First
         * uses getClassName. If nothing is returned, used the type of the constructor
         */
        public static GET_TYPE(obj:any) : string{
            if (obj != null && obj != undefined) {
                let classname = BABYLON.Tools.getClassName(obj);
                if (!classname || classname === 'object'){
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
            } else {
                return 'type_not_defined';
            }
        }
        
        /**
         * Check if some properties are defined for the given type.
         */
        private static _CheckIfTypeExists(type:string) {
            let properties = PROPERTIES[type];
            if (properties) {
                return true;
            } 
            return false;
        }
        
        /**
         * Returns true if the user browser is edge.
         */
        public static IsBrowserEdge() : boolean {
            //Detect if we are running on a faulty buggy OS.
            var regexp = /Edge/
            return regexp.test(navigator.userAgent);
        }

        /** 
         * Returns the name of the type of the given object, where the name 
         * is in PROPERTIES constant.
         * Returns 'Undefined' if no type exists for this object
         */
        private static _GetTypeFor(obj:any) {
            for (let type in PROPERTIES) {
                let typeBlock = PROPERTIES[type];
                if (typeBlock.type) {
                    if (obj instanceof typeBlock.type) {
                        return type;
                    }
                }
            }
            return 'type_not_defined';
        }
        /**
         * Returns the name of a function (workaround to get object type for IE11)
         */
        private static _GetFnName(fn) {
            var f = typeof fn == 'function';
            var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
            return (!f && 'not a function') || (s && s[1] || 'anonymous');
        }
        
        /** Send the event which name is given in parameter to the window */
        public static SEND_EVENT(eventName:string){
            let event;
            if (Inspector.DOCUMENT.createEvent) {
                event = Inspector.DOCUMENT.createEvent('HTMLEvents');
                event.initEvent(eventName, true, true);
            } else {
                event = new Event(eventName);
            }
            window.dispatchEvent(event);
        }
        
        /** Returns the given number with 2 decimal number max if a decimal part exists */
        public static Trunc(nb) :number {
            if(Math.round(nb) !== nb) {
                return nb.toFixed(2);
            }
            return nb;
        };
        
        /**
         * Useful function used to create a div
         */
        public static CreateDiv(className?:string, parent?: HTMLElement) : HTMLElement{
            return Helpers.CreateElement('div', className, parent);
        }
        
        public static CreateElement(element:string, className?:string, parent?: HTMLElement) : HTMLElement{
            let elem = Inspector.DOCUMENT.createElement(element);
            
            if (className) {
                elem.className = className;
            }
            if (parent) {
                parent.appendChild(elem);
            }
            return elem;
        }
        
        /**
         * Removes all children of the given div.
         */
        public static CleanDiv(div:HTMLElement) {
            while ( div.firstChild ) {
                div.removeChild(div.firstChild);
            }
        }

        /**
         * Returns the true value of the given CSS Attribute from the given element (in percentage or in pixel, as it was specified in the css)
         */
        public static Css(elem:HTMLElement, cssAttribute:string) : string{
            let clone = elem.cloneNode(true) as HTMLElement;
            let div = Helpers.CreateDiv('', Inspector.DOCUMENT.body);
            div.style.display = 'none';
            div.appendChild(clone);
            let value = Inspector.WINDOW.getComputedStyle(clone)[cssAttribute];
            div.parentNode.removeChild(div);
            return value;
        }
        
        public static LoadScript() {
            BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/highlight.min.js", (elem) => {
                let script = Helpers.CreateElement('script', '', Inspector.DOCUMENT.body);
                script.textContent = elem;                
                
                // Load glsl detection
                BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/languages/glsl.min.js", (elem) => {
                    let script = Helpers.CreateElement('script', '', Inspector.DOCUMENT.body);
                    script.textContent = elem;                    
                    
                    // Load css style
                    BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/styles/zenburn.min.css", (elem) => {
                        let style = Helpers.CreateElement('style', '', Inspector.DOCUMENT.body);
                        style.textContent = elem;
                    });
                }, null, null, null, () => {
                    console.log("erreur");
                });      
                
            }, null, null, null, () => {
                console.log("erreur");
            });
            
        }

        public static IsSystemName(name: string): boolean {
            if (name==null) {
                return false;
            }
            return name.indexOf("###")===0 && name.lastIndexOf("###")===(name.length-3);
        }
    }
}