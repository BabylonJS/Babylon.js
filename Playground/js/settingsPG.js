/**
 * This JS file is for settings :
 * - Theme
 * - Script language
 * - Font size
 */
class SettingsPG {
    constructor(parent) {
        this.parent = parent;

        // The elements that will color with languages
        this.elementForscriptLanguage = [
            '#exampleList #exampleBanner',
            '.navbar',
            '.navbar .category',
            '.navbar .select .toDisplay',
            '.navbar .select .toDisplay .subSelect .toDisplaySub',
            '#fpsLabel',
            '.save-form',
            '#switchWrapper',
            '.navbarBottom',
            '.navbarBottom .links .link a',
            '.buttonPG'
        ];
        // The elements that will color with theme
        this.elementToTheme = [
            '.wrapper #jsEditor',
            '.wrapper .gutter'
        ];
        // Editor font size
        this.fontSize = localStorage.getItem("bjs-playground-font") || 14;
        // Editor theme
        this.vsTheme = localStorage.getItem("bjs-playground-theme") || 'light';
        // Editor language
        this.scriptLanguage = localStorage.getItem("bjs-playground-scriptLanguage") || 'JS';
        this.defaultScene = "scripts/basic scene.js";
        if (this.scriptLanguage == "JS") {
            this.defaultScene = "scripts/basic scene.js";
            this.parent.monacoCreator.monacoMode = "javascript";
        } else if (this.scriptLanguage == "TS") {
            this.defaultScene = "scripts/basic scene.txt";
            this.parent.monacoCreator.monacoMode = "typescript";
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
        localStorage.setItem("bjs-playground-font", size);
        this.fontSize = size;
        this.parent.monacoCreator.jsEditor.updateOptions({
            fontSize: size
        });
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
    restoreFont() {
        this.setFontSize(this.fontSize);
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
            this.parent.utils.setToMultipleID("toJSbutton", "removeClass", "floatLeft");
            this.parent.utils.setToMultipleID("toJSbutton", "addClass", "selectedLanguage");
            this.parent.utils.setToMultipleID("toJSbutton", "innerHTML", "Javascript");
            this.parent.utils.setToMultipleID("toTSbutton", "title", "Switch to TypeScript");
        } else if (this.scriptLanguage == "TS") {
            this.parent.utils.setToMultipleID("toJSbutton", "addClass", "floatLeft");
            this.parent.utils.setToMultipleID("toTSbutton", "addClass", "selectedLanguage");
            this.parent.utils.setToMultipleID("toTSbutton", "innerHTML", "Typescript");
            this.parent.utils.setToMultipleID("toJSbutton", "title", "Switch to JavaScript");
        }
    };

    /**
     * Set the theme (dark / light)
     */
    setTheme(theme) {
        localStorage.setItem("bjs-playground-theme", theme);
        // Get the Monaco theme name.
        // Change the selected button style
        this.parent.utils.setToMultipleID("darkTheme", "removeClass", "selected");
        this.parent.utils.setToMultipleID("lightTheme", "removeClass", "selected");
        if (theme == 'dark') {
            this.vsTheme = 'vs-dark';
            this.parent.utils.setToMultipleID("darkTheme", "addClass", "selected");
        } else {
            this.vsTheme = 'vs';
            this.parent.utils.setToMultipleID("lightTheme", "addClass", "selected");
        }

        this.parent.monacoCreator.createMonacoEditor();

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
    restoreTheme() {
        this.setTheme(this.vsTheme, this.parent.monacoCreator);
    };

    /**
     * Set BJS version on click
     */
    setBJSversion(evt, code) {
        localStorage.setItem("bjs-playground-apiversion", evt.target.value);
        localStorage.setItem("bjs-playground-apiversion-tempcode", code);
        window.location.reload();
    };
    /**
     * Check if we need to restore a BJS version
     */
    restoreVersion() {
        if (this.mustModifyBJSversion()) {
            this.parent.menuPG.displayWaitDiv();

            window.def = window.define;
            window.define = undefined;

            var apiVersion = localStorage.getItem("bjs-playground-apiversion");
            BABYLON = null;

            var position = 0;
            for (var i = 0; i < CONFIG_last_versions.length; i++) {
                if (CONFIG_last_versions[i][0] == apiVersion) {
                    position = i;
                    break;
                }
            }

            var count = CONFIG_last_versions[position][1].length - 1;
            var newBJSscript = document.createElement('script');
            newBJSscript.src = CONFIG_last_versions[position][1][0];
            newBJSscript.onload = function () {
                for (var i = 1; i < CONFIG_last_versions[position][1].length; i++) {
                    var newBJSscript = document.createElement('script');
                    newBJSscript.src = CONFIG_last_versions[position][1][i];
                    newBJSscript.onload = function () {
                        count--;
                        if (count == 0) {
                            if (BABYLON.Engine.Version.search('-') != -1) this.parent.menuPG.displayVersionNumber("Latest");
                            else this.parent.menuPG.displayVersionNumber(BABYLON.Engine.Version);
                            this.parent.utils.setToMultipleID("mainTitle", "innerHTML", "v" + BABYLON.Engine.Version);
                            this.parent.monacoCreator.addOnMonacoLoadedCallback(() => {
                                this.parent.monacoCreator.setCode(localStorage.getItem("bjs-playground-apiversion-tempcode"));


                                localStorage.removeItem("bjs-playground-apiversion");
                                localStorage.removeItem("bjs-playground-apiversion-tempcode");
                                this.parent.main.compileAndRunFromOutside();
                            });

                            if (window.def) {
                                window.define = window.def;
                            }

                        }
                    }.bind(this);

                    document.head.appendChild(newBJSscript);
                }
            }.bind(this);
            document.head.appendChild(newBJSscript);
        } else return false;
    };

    mustModifyBJSversion() {
        if (localStorage.getItem("bjs-playground-apiversion") && localStorage.getItem("bjs-playground-apiversion") != null && localStorage.getItem("bjs-playground-apiversion") != "Latest") return true;
        else return false;
    };
};