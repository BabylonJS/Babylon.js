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
        this.navBar550 = document.getElementsByClassName('navBar550')[0];
        
        // On click anywhere, remove displayed options
        window.addEventListener('click', this.removeallOptions);

        // In mobile mode, resize JSEditor and canvas
        this.switchWrapperCode.addEventListener('click', this.resizeBigJsEditor.bind(this));
        this.switchWrapperCanvas.addEventListener('click', this.resizeBigCanvas.bind(this));
        document.getElementById('runButton550').addEventListener('click', this.resizeBigCanvas.bind(this));
        
        // Code editor by default.
        // TO DO - Check why it doesn't work.
        if(this.navBar550.offsetHeight > 0) this.resizeBigJsEditor();
        
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
    }

    /**
     * Display children menu of the caller
     */
    displayMenu = function (evt) {
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
    displaySubitems = function (evt) {
        // If it's in mobile mode, avoid the "mouseenter" bug
        if(evt.type == "mouseenter" && this.navBar550.offsetHeight > 0) return;
        this.removeAllSubItems();
    
        var toDisplay = evt.target.querySelector('.toDisplaySub');
        if (toDisplay) toDisplay.style.display = 'block';

        evt.preventDefault();
        evt.stopPropagation();
    };
    // Handle click on subOptions
    clickOptionSub = function(evt) {
        if(!this.navBar550.offsetHeight > 0) return; // If is not in mobile, this doesnt apply
        if(!this.classList) return;
    
        if (this.classList.contains('link')) {
            window.open(this.querySelector('a').href, '_new');
        }
        if (!this.classList.contains('subSelect') && this.parentNode.style.display == 'block') {
            this.parentNode.style.display = 'none'
        }

        evt.preventDefault();
        evt.stopPropagation();
    };

    /**
     * Remove displayed subItems
     */
    removeAllSubItems = function () {
        for (var index = 0; index < this.allSubItems.length; index++) {
            this.allSubItems[index].style.display = 'none';
        }
    };
    /**
     * Remove displayed options
     */
    removeAllOptions = function () {
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
    resizeBigJsEditor = function() {
        if(this.navBar550.offsetHeight > 0) {
            this.removeAllOptions();
            this.canvasZoneElement.style.width = '0';
            this.switchWrapperCode.style.display = 'none';
            this.fpsLabelElement.style.display = 'none';
            this.jsEditorElement.style.width = '100%';
            this.switchWrapperCanvas.style.display = 'block';
        }
    };
    /**
     * Hide the JS editor and display the canvas
     */
    resizeBigCanvas = function() {
        if(this.navBar550.offsetHeight > 0) {
            this.removeAllOptions();
            this.jsEditorElement.style.width = '0';
            this.switchWrapperCanvas.style.display = 'none';
            this.canvasZoneElement.style.width = '100%';
            this.switchWrapperCode.style.display = 'block';
            this.fpsLabelElement.style.display = 'block';
        }
    };
};