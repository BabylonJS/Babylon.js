var INSPECTOR;
(function (INSPECTOR) {
    var Helpers = (function () {
        function Helpers() {
        }
        /**
         * Returns the type of the given object. First
         * uses getClassName. If nothing is returned, used the type of the constructor
         */
        Helpers.GET_TYPE = function (obj) {
            if (obj != null && obj != undefined) {
                var classname = BABYLON.Tools.getClassName(obj);
                if (!classname || classname === 'object') {
                    classname = obj.constructor.name;
                    // classname is undefined in IE11
                    if (!classname) {
                        classname = this._GetFnName(obj.constructor);
                    }
                }
                return classname;
            }
            else {
                return '';
            }
        };
        /**
         * Returns the name of a function (workaround to get object type for IE11)
         */
        Helpers._GetFnName = function (fn) {
            var f = typeof fn == 'function';
            var s = f && ((fn.name && ['', fn.name]) || fn.toString().match(/function ([^\(]+)/));
            return (!f && 'not a function') || (s && s[1] || 'anonymous');
        };
        /** Send the event which name is given in parameter to the window */
        Helpers.SEND_EVENT = function (eventName) {
            var event;
            if (INSPECTOR.Inspector.DOCUMENT.createEvent) {
                event = INSPECTOR.Inspector.DOCUMENT.createEvent('HTMLEvents');
                event.initEvent(eventName, true, true);
            }
            else {
                event = new Event(eventName);
            }
            window.dispatchEvent(event);
        };
        /** Returns the given number with 2 decimal number max if a decimal part exists */
        Helpers.Trunc = function (nb) {
            if (Math.round(nb) !== nb) {
                return nb.toFixed(2);
            }
            return nb;
        };
        ;
        /**
         * Useful function used to create a div
         */
        Helpers.CreateDiv = function (className, parent) {
            return Helpers.CreateElement('div', className, parent);
        };
        Helpers.CreateElement = function (element, className, parent) {
            var elem = INSPECTOR.Inspector.DOCUMENT.createElement(element);
            if (className) {
                elem.className = className;
            }
            if (parent) {
                parent.appendChild(elem);
            }
            return elem;
        };
        /**
         * Removes all children of the given div.
         */
        Helpers.CleanDiv = function (div) {
            while (div.firstChild) {
                div.removeChild(div.firstChild);
            }
        };
        Helpers.LoadScript = function () {
            BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/highlight.min.js", function (elem) {
                var script = Helpers.CreateElement('script', '', INSPECTOR.Inspector.DOCUMENT.body);
                script.textContent = elem;
                // Load glsl detection
                BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/languages/glsl.min.js", function (elem) {
                    var script = Helpers.CreateElement('script', '', INSPECTOR.Inspector.DOCUMENT.body);
                    script.textContent = elem;
                    // Load css style
                    BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/styles/zenburn.min.css", function (elem) {
                        var style = Helpers.CreateElement('style', '', INSPECTOR.Inspector.DOCUMENT.body);
                        style.textContent = elem;
                    });
                }, null, null, null, function () {
                    console.log("erreur");
                });
            }, null, null, null, function () {
                console.log("erreur");
            });
        };
        return Helpers;
    }());
    INSPECTOR.Helpers = Helpers;
})(INSPECTOR || (INSPECTOR = {}));
//# sourceMappingURL=Helpers.js.map