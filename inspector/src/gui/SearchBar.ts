module INSPECTOR {

    /**
     * A search bar can be used to filter elements in the tree panel.
     * At each keypress on the input, the treepanel will be filtered.
     */
    export class SearchBar extends BasicElement {

        private _tab   : PropertyTab;
        private _inputElement: HTMLInputElement;

        constructor(tab:PropertyTab) {
            super();
            this._tab = tab;
            this._div.classList.add('searchbar');
            
            let filter = Inspector.DOCUMENT.createElement('i');
            filter.className = 'fa fa-search';
            
            this._div.appendChild(filter);
            // Create input
            this._inputElement = Inspector.DOCUMENT.createElement('input');
            this._inputElement.placeholder = 'Filter by name...';
            this._div.appendChild(this._inputElement);
            
            this._inputElement.addEventListener('keyup', (evt : KeyboardEvent)=> {
                let filter = this._inputElement.value;
                this._tab.filter(filter);
            })
        }

        /** Delete all characters typped in the input element */
        public reset() {
            this._inputElement.value = '';
        }

        public update() {
            // Nothing to update
        }

    }
}