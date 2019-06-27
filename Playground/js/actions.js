(function () {

    var allSelect = document.querySelectorAll('.select');
    var allToDisplay = document.querySelectorAll('.toDisplay');
    var allToDisplayBig = document.querySelectorAll('.toDisplayBig');
    var allSubItems = document.querySelectorAll('.toDisplaySub');
    var allSubSelect = document.querySelectorAll('.subSelect');
    var allNoSubSelect = document.querySelectorAll('.noSubSelect');

    // Remove displayed subItems
    var removeAllSubItems = function () {
        for (var index = 0; index < allSubItems.length; index++) {
            allSubItems[index].style.display = 'none';
        }
    }
    // Remove displayed options
    var removeAllOptions = function () {
        removeAllSubItems();

        for (var index = 0; index < allToDisplay.length; index++) {
            var a = allToDisplay[index];
            if (a.style.display == 'block') {
                a.style.display = 'none';
            }
        }
        for (var index = 0; index < allToDisplayBig.length; index++) {
            var b = allToDisplayBig[index];
            if (b.style.display == 'block') {
                b.style.display = 'none';
            }
        }
    }

    // Remove displayed options
    window.addEventListener('click', function (evt) {
        removeAllOptions();
    });

    // Resize jsEditor and canvas when in mobile mode
    var jsEditor = document.getElementById('jsEditor');
    var canvasZone = document.getElementById('canvasZone');
    var navBar550 = document.getElementsByClassName('navBar550')[0];
    var reiszeBigJsEditor = function() {
        if(navBar550.offsetHeight > 0) {
            canvasZone.style.width = '40px';
            jsEditor.style.width = 'calc(100% - 40px)';
        }
    };
    var resizeBigCanvas = function() {
        if(navBar550.offsetHeight > 0) {
            jsEditor.style.width = '40px';
            canvasZone.style.width = 'calc(100% - 40px)';
        }
    };
    jsEditor.addEventListener('click', reiszeBigJsEditor);
    canvasZone.addEventListener('click', resizeBigCanvas);
    document.getElementById('runButton550').addEventListener('click', resizeBigCanvas);

    // Handle click on select elements
    for (var index = 0; index < allSelect.length; index++) {
        var s = allSelect[index];
        // Get child called to display
        var displayItems = function (e) {
            if (e.target.nodeName != "IMG") {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            var toDisplay = this.querySelector('.toDisplay');
            if (toDisplay) {
                if (toDisplay.style.display == 'block') {
                    removeAllOptions();
                } else {
                    removeAllOptions();
                    toDisplay.style.display = 'block';
                }
            }
            toDisplay = this.querySelector('.toDisplayBig');
            if (toDisplay) {
                if (toDisplay.style.display == 'block') {
                    removeAllOptions();
                } else {
                    removeAllOptions();
                    toDisplay.style.display = 'block';
                }
            }
            e.preventDefault();
            e.stopPropagation();
        }
        s.addEventListener('click', displayItems);
    }

    // Handle mouseover / click on subSelect
    var onSubselect = function (evt) {
        // If it's in mobile mode, avoid the "mouseenter" bug
        if(evt.type == "mouseenter" && navBar550.offsetHeight > 0) return;

        removeAllSubItems();
        var toDisplay = this.querySelector('.toDisplaySub');
        if (toDisplay)
            toDisplay.style.display = 'block';
        evt.preventDefault();
        evt.stopPropagation();
    };
    for (var index = 0; index < allSubSelect.length; index++) {
        var ss = allSubSelect[index];
        ss.addEventListener('click', onSubselect);
        ss.addEventListener('mouseenter', onSubselect);
    }
    for (var index = 0; index < allNoSubSelect.length; index++) {
        var ss = allNoSubSelect[index];
        ss.addEventListener('mouseenter', removeAllSubItems);
    }

    // Examples must remove all the other menus
    var examplesButton = document.getElementsByClassName("examplesButton");
    for (var i = 0; i < examplesButton.length; i++) {
        examplesButton[i].addEventListener("click", function () {
            removeAllOptions();
        });
    }

    // Handle click on subOptions
    clickOptionSub = function(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        if(!navBar550.offsetHeight > 0) return; // If is not in mobile, this doesnt apply
        if(!this.classList) return;

        if (this.classList.contains('link')) {
            window.open(this.querySelector('a').href, '_new');
        }
        if (!this.classList.contains('subSelect') && this.parentNode.style.display == 'block') {
            this.parentNode.style.display = 'none'
        }
    }
})();