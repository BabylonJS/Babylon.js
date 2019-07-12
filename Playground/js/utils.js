/**
 * This JS file contains utils functions
 */
class Utils {
    constructor(parent) {
        this.parent = parent;
        
        this.multipleSize = [1280, 1024, 'Mobile'];
    }

    // TO DO - Comment this correctly
    markDirty() {
        if (this.parent.monacoCreator.BlockEditorChange) return;

        this.setToMultipleID("safemodeToggle", "addClass", "checked");!
        this.setToMultipleID('safemodeToggle', 'innerHTML', 'Safe mode <i class="fa fa-check-square" aria-hidden="true"></i>');
    };

    /**
     * Used to show error messages
     * @param {String} errorMessage 
     * @param {String} errorEvent 
     */
    showError(errorMessage, errorEvent) {
        var errorContent =
            '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>';
        if (errorEvent) {
            var regEx = /\(.+:(\d+):(\d+)\)\n/g;

            var match = regEx.exec(errorEvent.stack);
            if (match) {
                errorContent += "Line ";
                var lineNumber = match[1];
                var columnNumber = match[2];

                errorContent += lineNumber + ':' + columnNumber + ' - ';
            }
        }

        errorContent += errorMessage + '</div>';

        document.getElementById("errorZone").style.display = 'block';
        document.getElementById("errorZone").innerHTML = errorContent;

        // Close button error
        document.getElementById("errorZone").querySelector('.close').addEventListener('click', function () {
            document.getElementById("errorZone").style.display = 'none';
        });
    };

    /**
     * Apply things to the differents menu sizes
     */
    setToMultipleID(id, thingToDo, param) {
        this.multipleSize.forEach(function (size) {
            if (thingToDo == "innerHTML") {
                document.getElementById(id + size).innerHTML = param
            }
            else if (thingToDo == "click") {
                if (param.length > 1) {
                    for (var i = 0; i < param.length; i++) {
                        document.getElementById(id + size).addEventListener("click", param[i]);
                    }
                }
                else
                    document.getElementById(id + size).addEventListener("click", param);
            }
            else if (thingToDo == "addClass") {
                document.getElementById(id + size).classList.add(param);
            }
            else if (thingToDo == "removeClass") {
                document.getElementById(id + size).classList.remove(param);
            }
            else if (thingToDo == "display") {
                document.getElementById(id + size).style.display = param;
            }
        });
    };

    /**
     * Function to get the current screen size
     */
    getCurrentSize() {
        for(var i = 0; i < this.multipleSize.length; i++) {
            if(document.getElementById("menuButton" + this.multipleSize[i]).offsetHeight > 0) return this.multipleSize[i];
        }
    };
}