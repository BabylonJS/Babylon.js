/**
 * This JS file is for UI displaying
 */
class MenuPG {
    constructor(parent) {
        this.parent = parent;

        this.allSelect = document.querySelectorAll('.select');
        this.allToDisplay = document.querySelectorAll('.toDisplay');
        this.allToDisplayBig = document.querySelectorAll('.toDisplayBig');
        this.allSubItems = document.querySelectorAll('.toDisplaySub');
        this.allSubSelect = document.querySelectorAll('.subSelect');
        this.allNoSubSelect = document.querySelectorAll('.noSubSelect');
        this.allDisplayOnDiff = document.querySelectorAll('.displayOnDiff');
        this.allRemoveOnDiff = document.querySelectorAll('.removeOnDiff');

        this.jsEditorElement = document.getElementById('jsEditor');
        this.canvasZoneElement = document.getElementById('canvasZone');
        this.switchWrapper = document.getElementById('switchWrapper');
        this.switchWrapperCode = document.getElementById('switchWrapperCode');
        this.switchWrapperCanvas = document.getElementById('switchWrapperCanvas');
        this.fpsLabelElement = document.getElementById('fpsLabel');
        this.navBarMobile = document.getElementsByClassName('navBarMobile')[0];

        // Check if mobile version
        this.isMobileVersion = false;
        if (this.navBarMobile.offsetHeight > 0) this.isMobileVersion = true;
        window.onresize = function () {
            if (!this.isMobileVersion && this.navBarMobile.offsetHeight > 0) {
                this.isMobileVersion = true;
                this.resizeBigCanvas();
            }
            else if (this.isMobileVersion && this.navBarMobile.offsetHeight == 0) {
                this.isMobileVersion = false;
                this.resizeSplitted();
            }
        }.bind(this);

        // In mobile mode, resize JSEditor and canvas
        this.switchWrapperCode.addEventListener('click', this.resizeBigJsEditor.bind(this));
        this.switchWrapperCanvas.addEventListener('click', this.resizeBigCanvas.bind(this));
        document.getElementById('runButtonMobile').addEventListener('click', this.resizeBigCanvas.bind(this));

        // Code editor by default.
        if (this.navBarMobile.offsetHeight > 0) this.resizeBigJsEditor();

        // Handle click on select elements
        for (var index = 0; index < this.allSelect.length; index++) {
            this.allSelect[index].addEventListener('click', this.displayMenu.bind(this));
        }
        // Handle quit of menus
        for (var i = 0; i < this.allToDisplay.length; i++) {
            this.allToDisplay[i].addEventListener('mouseleave', function () {
                if(this.isMobileVersion) return;
                else this.removeAllOptions();
            }.bind(this));
        }

        // Handle mouseover / click on subSelect
        for (var index = 0; index < this.allSubSelect.length; index++) {
            var ss = this.allSubSelect[index];
            ss.addEventListener('click', this.displaySubitems.bind(this));
            ss.addEventListener('mouseenter', this.displaySubitems.bind(this));
        }
        for (var index = 0; index < this.allNoSubSelect.length; index++) {
            var ss = this.allNoSubSelect[index];
            ss.addEventListener('mouseenter', this.removeAllSubItems.bind(this));
        }

        // Examples must remove all the other menus
        var examplesButton = document.getElementsByClassName("examplesButton");
        for (var i = 0; i < examplesButton.length; i++) {
            examplesButton[i].addEventListener("click", this.removeallOptions);
        }

        // Fullscreen
        document.getElementById("renderCanvas").addEventListener("webkitfullscreenchange", function () {
            if (document.webkitIsFullScreen) this.goFullPage();
            else this.exitFullPage();
        }.bind(this), false);

        // Click on BJS logo redirection to BJS homepage
        let logos = document.getElementsByClassName('logo');
        for (var i = 0; i < logos.length; i++) {
            logos[i].addEventListener('click', function () {
                window.open("https://babylonjs.com", "_target");
            });
        }

        // Message before unload
        window.addEventListener('beforeunload', function () {
            if (this.parent.settingsPG.mustModifyBJSversion()) return;
            this.exitPrompt();
        }.bind(this));

        // On click anywhere, remove displayed options
        // Avoid this if clicking in a menu
        this.skipNextClick = false;
        document.getElementById("exampleList").addEventListener('click', function () { this.skipNextClick = true; }.bind(this)); // Weird, does'nt work on mobile
        document.getElementsByClassName("save-form")[0].addEventListener('click', function () { this.skipNextClick = true; }.bind(this));
        window.addEventListener('click', function () {
            if (this.skipNextClick) {
                this.skipNextClick = false;
                return;
            }

            // we do not want to proceed if a menu is displayed or if we are in diff mode
            const candidates = ["saveLayer", "diffLayer", "diffView"];
            if (candidates.every(c => !(document.getElementById(c).style.display === "block"))) {
                this.removeAllOptions();
            }

        }.bind(this));

        // Version selection
        for (var i = 0; i < this.parent.utils.multipleSize.length; i++) {
            var versionButtons = null;
            if (this.parent.utils.multipleSize[i] == "Mobile") {
                var onclick = function (evt) { this.parent.examples.hideExamples(); };
                document.getElementById("currentVersion" + this.parent.utils.multipleSize[i]).addEventListener("click", onclick.bind(this));
                versionButtons = document.getElementById("currentVersion" + this.parent.utils.multipleSize[i]).parentElement;
                versionButtons.addEventListener("click", onclick.bind(this));
            }
            else {
                versionButtons = document.getElementById("currentVersion" + this.parent.utils.multipleSize[i]).parentElement;
                versionButtons.addEventListener("click", function (evt) {
                    this.parent.examples.hideExamples();
                    this.removeAllOptions();
                    this.displayVersionsMenu(evt);
                }.bind(this));
            }

            for (var j = 0; j < CONFIG_last_versions.length; j++) {
                var newButton = document.createElement("div");
                newButton.classList.add("option");
                if(CONFIG_last_versions[j][0] == "Latest") newButton.innerText = "Latest";
                else newButton.innerText = "v" + CONFIG_last_versions[j][0];
                newButton.value = CONFIG_last_versions[j][0];

                newButton.addEventListener("click", function (evt) {
                    this.parent.settingsPG.setBJSversion(evt, this.parent.monacoCreator.getCode());
                    this.displayWaitDiv();
                }.bind(this));

                versionButtons.lastElementChild.appendChild(newButton);
            }
        }
        this.displayVersionNumber("Latest");

        // There's a metadatas close button on the mobile interface.
        document.getElementById('saveFormButtonClose').addEventListener('click', this.hideMetadata.bind(this));
        // Avoid closing metadatas when "onmouseleave" on menu
        this.skipNextHideMetadatas = false;

        this.showQRCodes();
    };

    /**
     * The logo displayed while loading the page
     */
    displayWaitDiv() {
        document.getElementById("waitDiv").style.display = "flex";
        document.getElementById("fpsLabel").style.display = "none";
    };
    hideWaitDiv() {
        document.getElementById("waitDiv").style.display = "none";
        document.getElementById("fpsLabel").style.display = "block";
    };

    displayVersionNumber(version) {
        for (var i = 0; i < this.parent.utils.multipleSize.length; i++) {
            if (this.parent.utils.multipleSize[i] == "Mobile") {
                if(version == "Latest") document.getElementById("currentVersion" + this.parent.utils.multipleSize[i]).innerText = version;
                else document.getElementById("currentVersion" + this.parent.utils.multipleSize[i]).innerText = "Version " + version;
            }
            else {
                if(version == "Latest") document.getElementById("currentVersion" + this.parent.utils.multipleSize[i]).parentElement.firstElementChild.innerText = version;
                else document.getElementById("currentVersion" + this.parent.utils.multipleSize[i]).parentElement.firstElementChild.innerText = "v" + version;
            }
        }
    };

    /**
     * Display children menu of the version button
     */
    displayVersionsMenu(evt) {
        if (evt.target.classList.contains("option")) return;

        var toggle = evt.target.lastElementChild;
        if (toggle == null) toggle = evt.target.parentElement.lastElementChild;
        if (toggle.style.display == "none") toggle.style.display = "block";
        else toggle.style.display = "none";
    };
    /**
     * Display children menu of the caller
     */
    displayMenu(evt) {
        if (evt.target.nodeName != "IMG") {
            evt.preventDefault();
            evt.stopPropagation();
            return;
        }
        var toDisplay = evt.target.parentNode.querySelector('.toDisplay');
        if (toDisplay) {
            if (toDisplay.style.display == 'block') {
                this.removeAllOptions();
            } else {
                this.removeAllOptions();
                toDisplay.style.display = 'block';
            }
            
            // Avoid an iPhone bug making the subitems disappear.
            // Was previously done with "overflow-y : auto"
            if(toDisplay.clientHeight < toDisplay.scrollHeight)
                toDisplay.style.overflowY = "auto";
            else
                toDisplay.style.overflowY = "visible";
        }
        toDisplay = evt.target.parentNode.querySelector('.toDisplayBig');
        if (toDisplay) {
            if (toDisplay.style.display == 'block') {
                this.removeAllOptions();
            } else {
                this.removeAllOptions();
                toDisplay.style.display = 'block';
            }
        }
        evt.preventDefault();
        evt.stopPropagation();
    };
    /**
     * Display children subMenu of the caller
     */
    displaySubitems(evt) {
        
        // If it's in mobile mode, avoid the "mouseenter" bug
        if (evt.type == "mouseenter" && this.navBarMobile.offsetHeight > 0) return;
        this.removeAllSubItems();

        var target = evt.target;
        if (target.nodeName == "IMG") target = evt.target.parentNode;

        var toDisplay = target.querySelector('.toDisplaySub');
        if(toDisplay == null) toDisplay = target.parentElement.querySelector('.toDisplaySub');

        if (toDisplay) {
            toDisplay.style.display = 'block';

            if (document.getElementsByClassName('navBarMobile')[0].offsetHeight > 0) {
                var height = toDisplay.children.length * 33;
                var parentTop = toDisplay.parentNode.getBoundingClientRect().top;
                if ((height + parentTop) <= window.innerHeight) {
                    toDisplay.style.top = parentTop + "px";
                }
                else {
                    toDisplay.style.top = window.innerHeight - height + "px";
                }
            }
        }

        evt.preventDefault();
        evt.stopPropagation();
    };
    /**
     * Handle click on subOptions
     */
    clickOptionSub(evt) {
        var target = evt.target;
        if (evt.target.tagName == "A") target = evt.target.parentNode;
        if (!document.getElementsByClassName('navBarMobile')[0].offsetHeight > 0) return; // If is not in mobile, this doesnt apply
        if (!target.classList) return;

        if (target.classList.contains('link')) {
            window.open(target.querySelector('a').href, '_new');
        }
        if (!target.classList.contains('subSelect') && target.parentNode.style.display == 'block') {
            target.parentNode.style.display = 'none'

        }

        evt.preventDefault();
        evt.stopPropagation();
    };

    /** 
     * Remove displayed subItems
     */
    removeAllSubItems() {
        for (var index = 0; index < this.allSubItems.length; index++) {
            this.allSubItems[index].style.display = 'none';
        }
    };
    /**
     * Remove displayed options
     */
    removeAllOptions() {
        this.parent.examples.hideExamples();
        this.hideMetadata();
        this.removeAllSubItems();

        for (var index = 0; index < this.allToDisplay.length; index++) {
            var a = this.allToDisplay[index];
            if (a.style.display == 'block') {
                a.style.display = 'none';
            }
        }

        for (var index = 0; index < this.allToDisplayBig.length; index++) {
            var b = this.allToDisplayBig[index];
            if (b.style.display == 'block') {
                b.style.display = 'none';
            }
        }
    };

    /**
     * Hide the canvas and display JS editor
     */
    resizeBigJsEditor() {
        if (this.navBarMobile.offsetHeight > 0) {
            this.removeAllOptions();
            this.canvasZoneElement.style.width = '0';
            this.switchWrapper.style.left = '';
            this.switchWrapper.style.right = '0';
            this.switchWrapperCode.style.display = 'none';
            this.fpsLabelElement.style.display = 'none'
            this.jsEditorElement.style.width = '100%';
            this.jsEditorElement.style.display = 'block';
            if (document.getElementsByClassName('gutter-horizontal').length > 0) document.getElementsByClassName('gutter-horizontal')[0].style.display = 'none';
            this.switchWrapperCanvas.style.display = 'block';
        }
        this.setSelectorVisibility(this.allRemoveOnDiff, 'inline-block');
        this.setSelectorVisibility(this.allDisplayOnDiff, 'none');
    };
    /**
     * Hide the JS editor and display the canvas
     */
    resizeBigCanvas() {
        if (this.navBarMobile.offsetHeight > 0) {
            this.removeAllOptions();
            this.jsEditorElement.style.width = '0';
            this.jsEditorElement.style.display = 'none';
            document.getElementsByClassName('gutter-horizontal')[0].style.display = 'none';
            this.switchWrapperCanvas.style.display = 'none';
            this.canvasZoneElement.style.width = '100%';
            this.switchWrapper.style.left = '0';
            this.switchWrapper.style.right = '';
            this.switchWrapperCode.style.display = 'block';
            this.fpsLabelElement.style.display = 'block';
        }
        this.setSelectorVisibility(this.allRemoveOnDiff, 'inline-block');
        this.setSelectorVisibility(this.allDisplayOnDiff, 'none');
    };
    /**
     * When someone resize from mobile to large screen version
     */
    resizeSplitted() {
        this.removeAllOptions();
        this.jsEditorElement.style.width = '50%';
        this.jsEditorElement.style.display = 'block';
        document.getElementsByClassName('gutter-horizontal')[0].style.display = 'block';
        this.switchWrapperCanvas.style.display = 'block';
        this.canvasZoneElement.style.width = '50%';
        this.switchWrapperCode.style.display = 'block';
        this.fpsLabelElement.style.display = 'block';
        this.setSelectorVisibility(this.allRemoveOnDiff, 'inline-block');
        this.setSelectorVisibility(this.allDisplayOnDiff, 'none');
    };
    /**
     * Switch to diff mode
     */
    resizeForDiff() {
        this.jsEditorElement.style.width = '0';
        this.jsEditorElement.style.display = 'none';
        document.getElementsByClassName('gutter-horizontal')[0].style.display = 'none';
        this.canvasZoneElement.style.width = '0';
        this.switchWrapper.style.left = '';
        this.switchWrapper.style.right = '0';
        this.switchWrapperCode.style.display = 'none';
        this.fpsLabelElement.style.display = 'none';
        // make sure to hide all incompatible buttons with diff mode, and display dedicated buttons
        this.setSelectorVisibility(this.allRemoveOnDiff, 'none');
        this.setSelectorVisibility(this.allDisplayOnDiff, 'inline-block');
    }
    /**
     * Canvas full page
     */
    goFullPage() {
        var canvasElement = document.getElementById("renderCanvas");
        canvasElement.style.position = "absolute";
        canvasElement.style.top = 0;
        canvasElement.style.left = 0;
        canvasElement.style.zIndex = 100;
    };
    /**
     * Canvas exit full page
     */
    exitFullPage() {
        document.getElementById("renderCanvas").style.position = "relative";
        document.getElementById("renderCanvas").style.zIndex = 0;
    };
    /**
     * Canvas full screen
     */
    goFullscreen(engine) {
        engine.switchFullscreen(false);
    };
    /**
     * Editor full screen
     */
    editorGoFullscreen() {
        var editorDiv = document.getElementById("jsEditor");
        if (editorDiv.requestFullscreen) {
            editorDiv.requestFullscreen();
        } else if (editorDiv.mozRequestFullScreen) {
            editorDiv.mozRequestFullScreen();
        } else if (editorDiv.webkitRequestFullscreen) {
            editorDiv.webkitRequestFullscreen();
        }

    };

    /**
     * Display the metadatas form
     */
    displayMetadata() {
        this.skipNextHideMetadatas = true;
        document.getElementById("saveLayer").style.display = "block";
    };
    /**
     * Hide the metadatas form
     */
    hideMetadata() {
        if (this.skipNextHideMetadatas) {
            this.skipNextHideMetadatas = false;
            return;
        }
        else {
            this.skipNextHideMetadatas = false;
            document.getElementById("saveLayer").style.display = "none";
        }
    };


    /**
     * Navigation Overwrites
     */
    exitPrompt(e) {
        var safeToggle = document.getElementById("safemodeToggle1280");
        if (safeToggle.classList.contains('checked')) {
            e = e || window.event;
            var message =
                'This page is asking you to confirm that you want to leave - data you have entered may not be saved.';
            if (e) {
                e.returnValue = message;
            }
            return message;

        }
    };

    showQRCodes() {
        for (var i = 0; i < this.parent.utils.multipleSize.length; i++) {
            $("#qrCodeImage" + this.parent.utils.multipleSize[i]).empty();
            var playgroundCode = window.location.href.split("#");
            playgroundCode.shift();
            $("#qrCodeImage" + this.parent.utils.multipleSize[i]).qrcode({ text: "https://playground.babylonjs.com/frame.html#" + (playgroundCode.join("#")) });
        }
    };

    /**
     * When running code, display the loader
     */
    showBJSPGMenu() {
        var headings = document.getElementsByClassName('category');
        for (var i = 0; i < headings.length; i++) {
            headings[i].style.visibility = 'visible';
        }
    };

    setSelectorVisibility(selector, displayState) {
        if (selector) {
            for (var index = 0; index < selector.length; index++) {
                var item = selector[index];
                item.style.display = displayState;
            }
        }
    }
};