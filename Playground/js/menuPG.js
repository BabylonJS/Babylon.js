/**
 * This JS file is for UI displaying
 */
class MenuPG {
    constructor() {
        this.allSelect = document.querySelectorAll('.select');
        this.allToDisplay = document.querySelectorAll('.toDisplay');
        this.allToDisplayBig = document.querySelectorAll('.toDisplayBig');
        this.allSubItems = document.querySelectorAll('.toDisplaySub');
        this.allSubSelect = document.querySelectorAll('.subSelect');
        this.allNoSubSelect = document.querySelectorAll('.noSubSelect');

        this.jsEditorElement = document.getElementById('jsEditor');
        this.canvasZoneElement = document.getElementById('canvasZone');
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

        // Click on BJS logo redirection to BJS homepage
        let logos = document.getElementsByClassName('logo');
        for (var i = 0; i < logos.length; i++) {
            logos[i].addEventListener('click', function () {
                window.open("https://babylonjs.com", "_target");
            });
        }

        // On click anywhere, remove displayed options
        window.addEventListener('click', this.removeallOptions);

        // In mobile mode, resize JSEditor and canvas
        this.switchWrapperCode.addEventListener('click', this.resizeBigJsEditor.bind(this));
        this.switchWrapperCanvas.addEventListener('click', this.resizeBigCanvas.bind(this));
        document.getElementById('runButtonMobile').addEventListener('click', this.resizeBigCanvas.bind(this));

        // Code editor by default.
        // TO DO - Check why it doesn't work.
        if (this.navBarMobile.offsetHeight > 0) this.resizeBigJsEditor();

        // Handle click on select elements
        for (var index = 0; index < this.allSelect.length; index++) {
            this.allSelect[index].addEventListener('click', this.displayMenu.bind(this));
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

        // Message before unload
        window.onbeforeunload = exitPrompt;
    }

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
            this.switchWrapperCode.style.display = 'none';
            this.fpsLabelElement.style.display = 'none';
            this.jsEditorElement.style.width = '100%';
            this.jsEditorElement.style.display = 'block';
            if (document.getElementsByClassName('gutter-horizontal').length > 0) document.getElementsByClassName('gutter-horizontal')[0].style.display = 'none';
            this.switchWrapperCanvas.style.display = 'block';
        }
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
            this.switchWrapperCode.style.display = 'block';
            this.fpsLabelElement.style.display = 'block';
        }
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
    };

    /**
     * Canvas full page
     */
    goFullPage () {
        var canvasElement = document.getElementById("renderCanvas");
        canvasElement.style.position = "absolute";
        canvasElement.style.top = 0;
        canvasElement.style.left = 0;
        canvasElement.style.zIndex = 100;
    };
    /**
     * Canvas exit full page
     */
    exitFullPage () {
        document.getElementById("renderCanvas").style.position = "relative";
        document.getElementById("renderCanvas").style.zIndex = 0;
    };
    /**
     * Canvas full screen
     */
    goFullscreen (engine) {
        engine.switchFullscreen(true);
    };
    /**
     * Editor full screen
     */
    editorGoFullscreen () {
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
    displayMetadata () {
        document.getElementById("saveLayer").style.display = "block";
    };

    /**
     * Navigation Overwrites
     */
    // TO DO - Apply this when click on TS / JS button
    exitPrompt (e) {
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
};