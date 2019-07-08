/**
 * This JS file contains utils functions
 */
class Utils {
    constructor() {
    }

    // TO DO - Comment this
    markDirty = function () {
        if (monacoCreator.BlockEditorChange) return;

        // setToMultipleID("currentScript", "innerHTML", "Custom");
        setToMultipleID("safemodeToggle", "addClass", "checked");
        // setToMultipleID("minimapToggle", "addClass", "checked"); // Why ?!
        setToMultipleID('safemodeToggle', 'innerHTML', 'Safe mode <i class="fa fa-check-square" aria-hidden="true"></i>');
    };

    /**
     * Used to show error messages
     * @param {String} errorMessage 
     * @param {String} errorEvent 
     */
    showError = function(errorMessage, errorEvent) {
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
}