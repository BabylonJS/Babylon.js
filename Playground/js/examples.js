/**
 * This JS file is for examples list and actions linked to examples.
 */
class Examples {
    constructor(parent) {
        this.parent = parent;

        this.isExamplesDisplayed = false;

        this.fpsLabel = document.getElementById('fpsLabel');
        this.examplesButtons = document.getElementsByClassName('examplesButton');
        this.exampleList = document.getElementById('exampleList');

        /**
         * Display / hide with the "examples" button. On any size interface
         */
        if (this.examplesButtons.length > 0) {
            for (var i = 0; i < this.examplesButtons.length; i++) {
                this.examplesButtons[i].parentElement.onclick = function () {
                    if (!this.isExamplesDisplayed) this.displayExamples();
                    else this.hideExamples();
                }.bind(this);
            }
        }

        // There's a "close" button on the mobile interface.
        document.getElementById('examplesButtonClose').addEventListener('click', this.hideExamples.bind(this));

        /**
         * The filter bar is used to search a thing on the examples.
         * This react on any input on the bar, or on a click on the search button.
         */
        var filterBar = document.getElementById('filterBar');
        if (filterBar) {
            var filterBarClear = document.getElementById('filterBarClear');
            var filter = function () {
                var filterText = filterBar.value.toLowerCase();
                if (filterText == '') filterBarClear.style.display = 'none';
                else filterBarClear.style.display = 'inline-block';

                var lines = document.getElementsByClassName('itemLine');
                for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                    var line = lines[lineIndex];
                    if (line.innerText.toLowerCase().indexOf(filterText) > -1) {
                        line.style.display = '';
                    } else {
                        line.style.display = 'none';
                    }
                }

                var categories = document.getElementsByClassName('categoryContainer');
                var displayCount = categories.length;

                for (var categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
                    var category = categories[categoryIndex];
                    category.style.display = 'block';
                    if (category.clientHeight < 25) {
                        category.style.display = 'none';
                        displayCount--;
                    }
                }

                if (displayCount == 0) document.getElementById('noResultsContainer').style.display = 'block';
                else document.getElementById('noResultsContainer').style.display = 'none';
            }
            filterBar.oninput = function () {
                filter();
            }
            filterBarClear.onclick = function () {
                filterBar.value = '';
                filter();
            }
        }
    }

    /**
     * Function to display the examples menu
     */
    displayExamples() {
        this.parent.menuPG.removeAllOptions();

        this.isExamplesDisplayed = true;
        this.exampleList.style.display = 'block';
        document.getElementsByClassName('wrapper')[0].style.width = 'calc(100% - 400px)';

        this.fpsLabel.style.display = 'none';
        this.toggleExamplesButtons.call(this, true);
    };

    /**
     * Function to hide the examples menu
     */
    hideExamples() {
        this.isExamplesDisplayed = false;
        this.exampleList.style.display = 'none';
        document.getElementsByClassName('wrapper')[0].style.width = '100%';
        
        if(this.parent.menuPG && this.parent.menuPG.isMobileVersion && document.getElementById('jsEditor').style.display == 'block') {}
        else this.fpsLabel.style.display = 'block';
        this.toggleExamplesButtons.call(this, false);
    };

    toggleExamplesButtons(selected) {
        if (this.examplesButtons.length > 0) {
            for (var i = 0; i < this.examplesButtons.length; i++) {
                if(selected)
                    this.examplesButtons[i].parentElement.classList.add("selected");
                else
                    this.examplesButtons[i].parentElement.classList.remove("selected");
            }
        }
    };
}
