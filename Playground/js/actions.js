(function () {

    var allSelect = document.querySelectorAll('.select');
    var allToDisplay = document.querySelectorAll('.toDisplay');
    var allToDisplayBig = document.querySelectorAll('.toDisplayBig');

    var removeAllOptions = function () {
        for (var a of allToDisplay) {
            if (a.style.display == 'block') {
                a.style.display = 'none';
            }
        }
        for (var b of allToDisplayBig) {
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
        s.addEventListener('click', function (e) {
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
        });
    }

    document.querySelector('#safemodeToggle').addEventListener('click', function () {
        this.classList.toggle('checked');
        if (this.classList.contains('checked')) {
            this.innerHTML = 'Safe mode <i class="fa fa-check-square" aria-hidden="true"></i>';
        } else {
            this.innerHTML = 'Safe mode <i class="fa fa-square-o" aria-hidden="true"></i>';
        }
    })
})();