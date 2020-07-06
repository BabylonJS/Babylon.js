/**
 * This JS file contains utils functions
 */
class Utils {
    constructor(parent) {
        this.parent = parent;

        this.multipleSize = [1280, 1024, 'Mobile'];
    }

    /**
     * When something is written in the editor, it reset the safe mode
     */
    markDirty() {
        if (this.parent.monacoCreator.BlockEditorChange) return;

        this.setToMultipleID("safemodeToggle", "addClass", "checked");
        this.setToMultipleID('safemodeToggle', 'innerHTML', 'Safe mode <i class="fa fa-check-square" aria-hidden="true"></i>');
    };

    toLocationError(errorMessage, errorEvent) {
        if (!errorEvent) {
            return null;
        }

        // Do we have any location info?
        if (errorEvent.hasOwnProperty('lineNumber') && errorEvent.hasOwnProperty('columnNumber'))
            return errorEvent;

        // Else try to parse the stack to retrieve location...
        var regEx = /\(.+:(\d+):(\d+)\)\n/g;
        var match = regEx.exec(errorEvent.stack);
        if (match) {
            var error = new EvalError(errorMessage);
            error.lineNumber = match[1];
            error.columnNumber = match[2];
            return error;
        }

        // Not an error with proper location
        return null;
    }

    /**
     * Used to show error messages
     * @param {String} errorMessage 
     * @param {String} errorEvent 
     */
    showError(errorMessage, errorEvent) {
        let errorContent = '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>';

        const locationError = this.toLocationError(errorMessage, errorEvent);
        if (locationError == null) {
            // use a regular message
            errorContent += `${errorMessage}</div>`;
        } else {
            // we have location information
            errorContent += `<span id="gotoLocation">Line ${locationError.lineNumber} : ${locationError.columnNumber} - ${errorMessage}</span></div>`;
        }

        document.getElementById("errorZone").style.display = 'block';
        document.getElementById("errorZone").innerHTML = errorContent;

        // Close button error
        document.getElementById("errorZone").querySelector('.close').addEventListener('click', function () {
            document.getElementById("errorZone").style.display = 'none';
        });

        // Go To Location
        const gotoLocation = document.getElementById("gotoLocation");
        const jsEditor = this.parent.monacoCreator.jsEditor;
        if (gotoLocation) {
            gotoLocation.addEventListener('click', function () {
                const position = {
                    lineNumber: Number(locationError.lineNumber),
                    column: Number(locationError.columnNumber)
                };

                jsEditor.revealPositionInCenter(position, monaco.editor.ScrollType.Smooth);
                jsEditor.setPosition(position);
            });
        }
    };

    /**
     * Apply things to the differents menu sizes
     */
    setToMultipleID(id, thingToDo, param) {
        this.multipleSize.forEach(function (size) {
            if (thingToDo == "innerHTML") {
                document.getElementById(id + size).innerHTML = param
            } else if (thingToDo == "click") {
                if (param.length > 1) {
                    for (var i = 0; i < param.length; i++) {
                        document.getElementById(id + size).addEventListener("click", param[i]);
                    }
                } else
                    document.getElementById(id + size).addEventListener("click", param);
            } else if (thingToDo == "addClass") {
                document.getElementById(id + size).classList.add(param);
            } else if (thingToDo == "removeClass") {
                document.getElementById(id + size).classList.remove(param);
            } else if (thingToDo == "display") {
                document.getElementById(id + size).style.display = param;
            } else if (thingToDo === "title") {
                document.getElementById(id + size).setAttribute("title", param);
            }
        });
    };

    /**
     * Function to get the current screen size
     */
    getCurrentSize() {
        for (var i = 0; i < this.multipleSize.length; i++) {
            if (document.getElementById("menuButton" + this.multipleSize[i]).offsetHeight > 0) return this.multipleSize[i];
        }
    };

    debounceAsync(fn, wait = 0, options = {}) {
        let lastCallAt
        let deferred
        let timer
        let pendingArgs = []
        return function debounced(...args) {
            const currentWait = getWait(wait)
            const currentTime = new Date().getTime()

            const isCold = !lastCallAt || (currentTime - lastCallAt) > currentWait

            lastCallAt = currentTime

            if (isCold && options.leading) {
                return options.accumulate ?
                    Promise.resolve(fn.call(this, [args])).then(result => result[0]) :
                    Promise.resolve(fn.call(this, ...args))
            }

            if (deferred) {
                clearTimeout(timer)
            } else {
                deferred = defer()
            }

            pendingArgs.push(args)
            timer = setTimeout(flush.bind(this), currentWait)

            if (options.accumulate) {
                const argsIndex = pendingArgs.length - 1
                return deferred.promise.then(results => results[argsIndex])
            }

            return deferred.promise
        }

        function getWait(wait) {
            return (typeof wait === 'function') ? wait() : wait
        }

        function defer() {
            const deferred = {}
            deferred.promise = new Promise((resolve, reject) => {
                deferred.resolve = resolve
                deferred.reject = reject
            })
            return deferred
        }

        function flush() {
            const thisDeferred = deferred
            clearTimeout(timer)

            Promise.resolve(
                    options.accumulate ?
                    fn.call(this, pendingArgs) :
                    fn.apply(this, pendingArgs[pendingArgs.length - 1])
                )
                .then(thisDeferred.resolve, thisDeferred.reject)

            pendingArgs = []
            deferred = null
        }
    }
}