(function () {

    var allSelect = document.querySelectorAll('.select');
    var allToDisplay = document.querySelectorAll('.toDisplay');
    var allToDisplayBig = document.querySelectorAll('.toDisplayBig');

    var removeAllOptions = function () {
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
    window.addEventListener('click', function () {
        removeAllOptions();
    });

    // Handle click on select elements
    for (var index = 0; index < allSelect.length; index++) {
        var s = allSelect[index];
        // Get child called to display
        var displayItems = function (e) {
            var toDisplay = this.querySelector('.toDisplay');
            if (toDisplay) {
                if (toDisplay.style.display == 'block') {
                    toDisplay.style.display = 'none';
                } else {
                    removeAllOptions();
                    toDisplay.style.display = 'block';
                }
            }
            toDisplay = this.querySelector('.toDisplayBig');
            if (toDisplay) {
                if (toDisplay.style.display == 'block') {
                    toDisplay.style.display = 'none';
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

    // Handle mouseover on subSelect
    var allSubItems = document.querySelectorAll('.toDisplaySub');
    var removeAllSubItems = function () {
        for (var index = 0; index < allSubItems.length; index++) {
            var tds = allSubItems[index];
            if (tds.style.display == 'block') {
                tds.style.display = 'none';
            }
        }
    }

    var allSubSelect = document.querySelectorAll('.subSelect');
    for (var index = 0; index < allSubSelect.length; index++) {
        var ss = allSubSelect[index];
        ss.addEventListener('mouseenter', function () {
            var toDisplay = this.querySelector('.toDisplaySub');
            if (toDisplay) {
                if (toDisplay.style.display == 'block') {
                    toDisplay.style.display = 'none';
                } else {
                    removeAllSubItems();
                    toDisplay.style.display = 'block';
                }
            }
        })

    }
})();