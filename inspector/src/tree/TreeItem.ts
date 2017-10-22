module INSPECTOR {

    export class TreeItem extends BasicElement {

        // Reference to the tab
        private _tab: Tab;
        // The object this item is linked to (should be a primitive or a canvas) TODO should be superclass of all primitives
        private _adapter: Adapter;
        private _tools: Array<AbstractTreeTool>;
        public children: Array<TreeItem> = [];
        // Div element that contains all children of this node.
        private _lineContent: HTMLElement;

        constructor(tab: Tab, obj: Adapter) {
            super();
            this._tab = tab;
            this._adapter = obj;

            this._tools = this._adapter.getTools();

            this._build();

        }

        /** Returns the item ID == its adapter ID */
        public get id(): string {
            return this._adapter.id();
        }

        /** Add the given item as a child of this one */
        public add(child: TreeItem) {
            this.children.push(child);
            this.update();
        }

        /**
         * Returns the original adapter
         */
        public get adapter(): Adapter {
            return this._adapter;
        }

        /**
         * Function used to compare this item to another tree item.
         * Returns the alphabetical sort of the adapter ID
         */
        public compareTo(item: TreeItem): number {
            let str1 = this.id;
            let str2 = item.id;
            return str1.localeCompare(str2, [], { numeric: true });
        }

        /** Returns true if the given obj correspond to the adapter linked to this tree item */
        public correspondsTo(obj: any): boolean {
            return this._adapter.correspondsTo(obj);
        }

        /** hide all children of this item */
        public fold() {
            // Do nothing id no children
            if (this.children.length > 0) {
                for (let elem of this.children) {
                    elem.toHtml().style.display = 'none';
                }
                this._div.classList.add('folded');
                this._div.classList.remove('unfolded');
            }
        }
        /** Show all children of this item */
        public unfold() {
            // Do nothing id no children
            if (this.children.length > 0) {
                for (let elem of this.children) {
                    elem.toHtml().style.display = 'block';
                }
                this._div.classList.add('unfolded');
                this._div.classList.remove('folded');
            }
        }

        /** Build the HTML of this item */
        protected _build() {
            this._div.className = 'line';


            for (let tool of this._tools) {
                this._div.appendChild(tool.toHtml());
            }


            // Id
            let text = Inspector.DOCUMENT.createElement('span');
            text.textContent = this._adapter.id();
            this._div.appendChild(text);

            // Type
            let type = Inspector.DOCUMENT.createElement('span');
            type.className = 'property-type';
            if (this._adapter.type() !== 'type_not_defined') {
                type.textContent = ' - ' + this._adapter.type();
            }
            this._div.appendChild(type);

            this._lineContent = Helpers.CreateDiv('line-content', this._div);

            this._addEvent();
        }

        /**
         * Returns one HTML element (.details) containing all  details of this primitive
         */
        public getDetails(): Array<PropertyLine> {
            return this._adapter.getProperties();
        }

        public update() {
            // Clean division holding all children
            Helpers.CleanDiv(this._lineContent);

            for (let child of this.children) {
                let elem = child.toHtml();
                this._lineContent.appendChild(elem);
            }
            if (this.children.length > 0) {
                // Check if folded or not
                if (!this._div.classList.contains('folded') && !this._div.classList.contains('unfolded')) {
                    this._div.classList.add('folded');
                }
            }
            this.fold();
        }

        /**
         * Add an event listener on the item : 
         * - one click display details
         */
        protected _addEvent() {
            this._div.addEventListener('click', (e) => {
                this._tab.select(this);
                // Fold/unfold the tree
                if (this._isFolded()) {
                    this.unfold();
                } else {
                    this.fold();
                }
                e.stopPropagation();
            });
        }

        /** Returns true if the node is folded, false otherwise */
        private _isFolded(): boolean {
            return !this._div.classList.contains('unfolded');
        }

        /** Set this item as active (background lighter) in the tree panel */
        public active(b: boolean) {
            this._div.classList.remove('active');
            for (let child of this.children) {
                child.active(false);
            }
            if (b) {
                this._div.classList.add('active');
            }
        }

        public getDiv() {
            return this._div;
        }
    }
}