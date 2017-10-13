 module INSPECTOR {
    export interface SortDirection {
        [property: string]: number;
    }

    export class DetailPanel extends BasicElement {

        // The header row
        private _headerRow : HTMLElement;
        // Contains all details rows that belongs to the item above
        private _detailRows : Array<PropertyLine> = [];
        // Store the sort direction of each header column
        private _sortDirection : SortDirection = {};

        constructor(dr? : Array<PropertyLine>) {
            super();
            this._build();
            
            if (dr) {
                this._detailRows = dr;
                this.update();
            }
        }

        set details(detailsRow : Array<PropertyLine>) {
            this.clean();   
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
        public update() {                 
            this._sortDetails('name', 1);  
            this._addDetails();
        }

        /** Add all lines in the html div. Does not sort them! */
        private _addDetails() {
            let details = Helpers.CreateDiv('details', this._div);
            for (let row of this._detailRows) {
                details.appendChild(row.toHtml());
            }
        }

        /**
         * Sort the details row by comparing the given property of each row
         */
        private _sortDetails(property:string, _direction?:number) {
                
            // Clean header
            let elems = Inspector.DOCUMENT.querySelectorAll('.sort-direction');
            for (let e=0; e<elems.length; e++) {
                elems[e].classList.remove('fa-chevron-up');
                elems[e].classList.remove('fa-chevron-down');
            }


            if (_direction || !this._sortDirection[property]) {
                this._sortDirection[property] = _direction || 1;
            } else {
                this._sortDirection[property] *= -1;
            }
            let direction = this._sortDirection[property];
            if (direction == 1) {
                this._headerRow.querySelector(`#sort-direction-${property}`).classList.remove('fa-chevron-down');
                this._headerRow.querySelector(`#sort-direction-${property}`).classList.add('fa-chevron-up');
            } else {
                this._headerRow.querySelector(`#sort-direction-${property}`).classList.remove('fa-chevron-up');
                this._headerRow.querySelector(`#sort-direction-${property}`).classList.add('fa-chevron-down');
            }

            let isString = (s: any) => {
                return typeof(s) === 'string' || s instanceof String;
            };

            this._detailRows.forEach((property) => {
                property.closeDetails();
            })

            this._detailRows.sort((detail1: any, detail2: any) : number => {
                let str1 = String(detail1[property]);
                let str2 = String(detail2[property]);
                if (!isString(str1)) {
                    str1 = detail1[property].toString();
                }
                if (!isString(str2)) {
                    str2 = detail2[property].toString();
                }
                // Compare numbers as numbers and string as string with 'numeric=true'
                return str1.localeCompare(str2, [], {numeric:true}) * direction;
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

            let createDiv = (name:string, cssClass:string)  : HTMLElement => {
                let div =  Helpers.CreateDiv(cssClass+' header-col');

                // Column title - first letter in uppercase
                let spanName = Inspector.DOCUMENT.createElement('span');
                spanName.textContent = name.charAt(0).toUpperCase() + name.slice(1); 
                
                // sort direction
                let spanDirection = Inspector.DOCUMENT.createElement('i');
                spanDirection.className = 'sort-direction fa';
                spanDirection.id = 'sort-direction-'+name; 

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
 }