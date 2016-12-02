declare module INSPECTOR {
    interface SortDirection {
        [property: string]: number;
    }
    class DetailPanel extends BasicElement {
        private _headerRow;
        private _detailRows;
        private _sortDirection;
        constructor(dr?: Array<PropertyLine>);
        details: Array<PropertyLine>;
        protected _build(): void;
        /** Updates the HTML of the detail panel */
        update(): void;
        /** Add all lines in the html div. Does not sort them! */
        private _addDetails();
        /**
         * Sort the details row by comparing the given property of each row
         */
        private _sortDetails(property, _direction?);
        /**
         * Removes all data in the detail panel but keep the header row
         */
        clean(): void;
        /** Overrides basicelement.dispose */
        dispose(): void;
        /**
         * Creates the header row : name, value, id
         */
        private _createHeaderRow();
    }
}
