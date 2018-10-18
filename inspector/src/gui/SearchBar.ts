import { DetailPanel } from "../details/DetailPanel";
import { Inspector } from "../Inspector";
import { PropertyTab } from "../tabs/PropertyTab";
import { BasicElement } from "./BasicElement";

/**
 * A search bar can be used to filter elements in the tree panel.
 * At each keypress on the input, the treepanel will be filtered.
 */
export class SearchBar extends BasicElement {

    private _propTab: PropertyTab;
    private _inputElement: HTMLInputElement;

    constructor(tab: PropertyTab) {
        super();
        this._propTab = tab;
        this._div.classList.add('searchbar');

        let filter = Inspector.DOCUMENT.createElement('i');
        filter.className = 'fa fa-search';

        this._div.appendChild(filter);
        // Create input
        this._inputElement = Inspector.DOCUMENT.createElement('input');
        this._inputElement.placeholder = 'Filter by name...';
        this._div.appendChild(this._inputElement);

        this._inputElement.addEventListener('keyup', (evt: KeyboardEvent) => {
            let filter = this._inputElement.value;
            this._propTab.filter(filter);
        });
    }

    /** Delete all characters typped in the input element */
    public reset() {
        this._inputElement.value = '';
    }

    public update() {
        // Nothing to update
    }

}

export class SearchBarDetails extends BasicElement {

    private _detailTab: DetailPanel;
    private _inputElement: HTMLInputElement;

    constructor(tab: DetailPanel) {
        super();
        this._detailTab = tab;
        this._div.classList.add('searchbar');

        let filter = Inspector.DOCUMENT.createElement('i');
        filter.className = 'fa fa-search';

        this._div.appendChild(filter);
        // Create input
        this._inputElement = Inspector.DOCUMENT.createElement('input');
        this._inputElement.placeholder = 'Filter by name...';
        this._div.appendChild(this._inputElement);

        this._inputElement.addEventListener('keyup', (evt: KeyboardEvent) => {
            let filter = this._inputElement.value;
            this._detailTab.searchByName(filter);
        });
    }

    /** Delete all characters typped in the input element */
    public reset() {
        this._inputElement.value = '';
    }

    public update() {
        // Nothing to update
    }

}
