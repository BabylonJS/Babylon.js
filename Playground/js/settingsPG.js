/**
 * This JS file is for settings :
 * - Theme
 * - Script language
 * - Font size
 */
/**
 * TO DO :
 * - Set the font in the localStorage
 */
class SettingsPG {
    constructor(monacoCreator) {
        this.monacoCreator = monacoCreator;

        // The elements that will color with languages
        this.elementForscriptLanguage = [
            '#exampleList #exampleBanner',
            '.navbar',
            '.navbar .category',
            '.navbar .select .toDisplay',
            '.navbar .select .toDisplay .subSelect .toDisplaySub',
            '#fpsLabel',
            '.save-form',
            '#switchWrapper'
        ];
        // The elements that will color with theme
        this.elementToTheme = [
            '.wrapper #jsEditor',
            '.wrapper .gutter'
        ];
        // Editor font size
        this.fontSize = 14;
        // Editor theme
        this.vsTheme = localStorage.getItem("bjs-playground-theme") || 'light';
        // Editor language
        this.scriptLanguage = localStorage.getItem("bjs-playground-scriptLanguage") || 'JS';
        this.defaultScene = "scripts/basic scene.js";
        if(this.scriptLanguage == "JS") {
            this.defaultScene = "scripts/basic scene.js";
            monacoCreator.monacoMode = "javascript";
        }
        else if(this.scriptLanguage == "TS") {
            this.defaultScene = "scripts/basic scene.txt";
            monacoCreator.monacoMode = "typescript";
        }
    }

    get ScriptLanguage() {
        return this.scriptLanguage;
    };
    set ScriptLanguage(value) {
        localStorage.setItem("bjs-playground-scriptLanguage", value);
        this.scriptLanguage = value;
    };
    get DefaultScene() {
        return this.defaultScene;
    };


    /**
     * Change font size
     */
    setFontSize(size) {
        this.fontSize = size;
        this.monacoCreator.jsEditor.updateOptions({ fontSize: size });
        var array = document.getElementsByClassName("displayFontSize");
        for (var i = 0; i < array.length; i++) {
            var subArray = array[i].children;
            for (var j = 0; j < subArray.length; j++) {
                subArray[j].classList.remove("selected");
                if (subArray[j].innerText == size)
                    subArray[j].classList.add("selected");
            }
        }
    };
    /**
     * Toggle Typescript / Javascript language
     */
    setScriptLanguage() {
        for (var index = 0; index < this.elementForscriptLanguage.length; index++) {
            var obj = this.elementForscriptLanguage[index];
            var domObjArr = document.querySelectorAll(obj);
            for (var domObjIndex = 0; domObjIndex < domObjArr.length; domObjIndex++) {
                var domObj = domObjArr[domObjIndex];
                domObj.classList.remove('languageJS');
                domObj.classList.remove('languageTS');
                domObj.classList.add("language" + this.scriptLanguage);
            }
        }
        if (this.scriptLanguage == "JS") {
            utils.setToMultipleID("toJSbutton", "removeClass", "floatLeft");
        }
        else if (this.scriptLanguage == "TS") {
            utils.setToMultipleID("toJSbutton", "addClass", "floatLeft");
        }
    };
    /**
     * Set the theme (dark / light)
     */
    setTheme(theme) {
        localStorage.setItem("bjs-playground-theme", theme);
        // Get the Monaco theme name.
        // Change the selected button style
        utils.setToMultipleID("darkTheme", "removeClass", "selected");
        utils.setToMultipleID("lightTheme", "removeClass", "selected");
        if (theme == 'dark') {
            this.vsTheme = 'vs-dark';
            utils.setToMultipleID("darkTheme", "addClass", "selected");
        }
        else {
            this.vsTheme = 'vs';
            utils.setToMultipleID("lightTheme", "addClass", "selected");
        }

        this.monacoCreator.createMonacoEditor();

        this.setFontSize(this.fontSize);
        // Color the elements to theme
        for (var index = 0; index < this.elementToTheme.length; index++) {
            var obj = this.elementToTheme[index];
            var domObjArr = document.querySelectorAll(obj);
            for (var domObjIndex = 0; domObjIndex < domObjArr.length; domObjIndex++) {
                var domObj = domObjArr[domObjIndex];
                domObj.classList.remove('light');
                domObj.classList.remove('dark');
                domObj.classList.add(theme);
            }
        }
    };
    restoreTheme(monacoCreator) {
        this.setTheme(this.vsTheme, monacoCreator);
    };
};