import { BasicElement } from "../gui/BasicElement";
import { SearchBarDetails } from "../gui/SearchBar";
import { Helpers } from "../helpers/Helpers";
import { Inspector } from "../Inspector";
import { PropertyLine } from "./PropertyLine";

export interface SortDirection {
    [property: string]: number;
}

export class DetailPanel extends BasicElement {

    // The header row
    private _headerRow: HTMLElement;
    // Contains all details rows that belongs to the item above
    private _detailRows: Array<PropertyLine> = [];
    // Store the sort direction of each header column
    private _sortDirection: SortDirection = {};
    // The search bar
    private _searchDetails: SearchBarDetails;
    private _details: HTMLDivElement;

    constructor(dr?: Array<PropertyLine>) {
        super();
        this._build();

        if (dr) {
            this._detailRows = dr;
            this.update();
        }
    }

    set details(detailsRow: Array<PropertyLine>) {
        this.clean();
        //add the searchBar
        this._addSearchBarDetails();
        this._details = Helpers.CreateDiv('details', this._div);
        this._detailRows = detailsRow;
        // Refresh HTML
        this.update();
    }

    protected _build() {
        this._div.className = 'insp-details';
        this._div.id = 'insp-details';
        // Create header row
        this._createHeaderRow();
        this._div.appendChild(this._headerRow);

    }

    /** Updates the HTML of the detail panel */
    public update(_items?: Array<PropertyLine>) {
        this._sortDetails('name', 1);
        // Check the searchbar
        if (_items) {
            this.cleanRow();
            this._addSearchDetails(_items);
            //console.log(_items);
        } else {
            this._addDetails();
            //console.log("np");
        }
    }

    /** Add the search bar for the details */
    private _addSearchBarDetails() {
        let searchDetails = Helpers.CreateDiv('searchbar-details', this._div);
        // Create search bar
        this._searchDetails = new SearchBarDetails(this);

        searchDetails.appendChild(this._searchDetails.toHtml());
        this._div.appendChild(searchDetails);
    }

    /** Search an element by name  */
    public searchByName(searchName: string) {
        let rows = [];
        for (let row of this._detailRows) {
            if (row.name.indexOf(searchName) >= 0) {
                rows.push(row);
            }
        }
        this.update(rows);
    }

    /** Add all lines in the html div. Does not sort them! */
    private _addDetails() {
        for (let row of this._detailRows) {
            this._details.appendChild(row.toHtml());
        }
    }

    private _addSearchDetails(_items: Array<PropertyLine>) {
        for (let row of _items) {
            this._details.appendChild(row.toHtml());
        }
    }

    /**
     * Sort the details row by comparing the given property of each row
     */
    private _sortDetails(property: string, _direction?: number) {

        // Clean header
        let elems = Inspector.DOCUMENT.querySelectorAll('.sort-direction');
        for (let e = 0; e < elems.length; e++) {
            elems[e].classList.remove('fa-chevron-up');
            elems[e].classList.remove('fa-chevron-down');
        }

        if (_direction || !this._sortDirection[property]) {
            this._sortDirection[property] = _direction || 1;
        } else {
            this._sortDirection[property] *= -1;
        }
        let direction = this._sortDirection[property];
        let query = this._headerRow.querySelector(`#sort-direction-${property}`);
        if (query) {
            if (direction == 1) {
                query.classList.remove('fa-chevron-down');
                query.classList.add('fa-chevron-up');
            } else {
                query.classList.remove('fa-chevron-up');
                query.classList.add('fa-chevron-down');
            }
        }

        let isString = (s: any) => {
            return typeof (s) === 'string' || s instanceof String;
        };

        this._detailRows.forEach((property) => {
            property.closeDetails();
        });

        this._detailRows.sort((detail1: any, detail2: any): number => {
            let str1 = String(detail1[property]);
            let str2 = String(detail2[property]);
            if (!isString(str1)) {
                str1 = detail1[property].toString();
            }
            if (!isString(str2)) {
                str2 = detail2[property].toString();
            }
            // Compare numbers as numbers and string as string with 'numeric=true'
            return str1.localeCompare(str2, [], { numeric: true }) * direction;
        });
    }

    /**
     * Removes all data in the detail panel but keep the header row
     */
    public clean() {
        // Delete all details row
        for (let pline of this._detailRows) {
            pline.dispose();
        }
        Helpers.CleanDiv(this._div);
        // Header row
        this._div.appendChild(this._headerRow);
    }

    /**
     * Clean the rows only
     */
    public cleanRow() {
        // Delete all details row
        for (let pline of this._detailRows) {
            pline.dispose();
        }
        Helpers.CleanDiv(this._details);
    }

    /** Overrides basicelement.dispose */
    public dispose() {
        // Delete all details row
        for (let pline of this._detailRows) {
            pline.dispose();
        }
    }

    /**
     * Creates the header row : name, value, id
     */
    private _createHeaderRow() {
        this._headerRow = Helpers.CreateDiv('header-row');

        let createDiv = (name: string, cssClass: string): HTMLElement => {
            let div = Helpers.CreateDiv(cssClass + ' header-col');

            // Column title - first letter in uppercase
            let spanName = Inspector.DOCUMENT.createElement('span');
            spanName.textContent = name.charAt(0).toUpperCase() + name.slice(1);

            // sort direction
            let spanDirection = Inspector.DOCUMENT.createElement('i');
            spanDirection.className = 'sort-direction fa';
            spanDirection.id = 'sort-direction-' + name;

            div.appendChild(spanName);
            div.appendChild(spanDirection);

            div.addEventListener('click', (e) => {
                this._sortDetails(name);
                this._addDetails();
            });
            return div;
        };

        this._headerRow.appendChild(createDiv('name', 'prop-name'));
        this._headerRow.appendChild(createDiv('value', 'prop-value'));
    }
}
