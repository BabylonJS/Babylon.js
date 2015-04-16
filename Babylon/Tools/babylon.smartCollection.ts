module BABYLON {
    export class SmartCollection {
        public count = 0;
        public items: any;

        private _keys: string[];
        private _initialCapacity: number;

        constructor(capacity: number = 10) {
            this._initialCapacity = capacity;
            this.items = {};
            this._keys = new Array(this._initialCapacity);
        }

        public add(key: any, item: any): number {
            if (this.items[key] != undefined) {
                return -1;
            }
            this.items[key] = item;
            
            //literal keys are always strings, but we keep source type of key in _keys array
            this._keys[this.count++] = key;
            if (this.count > this._keys.length) {
                this._keys.length *= 2;
            }

            return this.count;
        }

        public remove(key: any): number {
            if (this.items[key] == undefined) {
                return -1;
            }

            return this.removeItemOfIndex(this.indexOf(key));
        }

        public removeItemOfIndex(index: number): number {
            if (index < this.count && index > -1) {
                delete this.items[this._keys[index]];
                    
                //here, shifting by hand is better optimised than .splice
                while (index < this.count) {
                    this._keys[index] = this._keys[index + 1]; index++;
                }
            }
            else {
                return -1;
            }

            return --this.count;
        }

        public indexOf(key: any): number {
            for (var i = 0; i !== this.count; i++) {
                if (this._keys[i] === key) {
                    return i;
                }
            }
            return -1;
        }

        public item(key: any): any {
            return this.items[key];
        }

        public getAllKeys(): any[] {
            if (this.count > 0) {
                var keys = new Array(this.count);
                for (var i = 0; i < this.count; i++) {
                    keys[i] = this._keys[i];
                }
                return keys;
            }
            else {
                return undefined;
            }
        }

        public getKeyByIndex(index: number): any {
            if (index < this.count && index > -1) {
                return this._keys[index];
            }
            else {
                return undefined;
            }
        }

        public getItemByIndex(index: number): any {
            if (index < this.count && index > -1) {
                return this.items[this._keys[index]];
            }
            else {
                return undefined;
            }
        }

        public empty(): void {
            if (this.count > 0) {
                this.count = 0;
                this.items = {};
                this._keys = new Array(this._initialCapacity);
            }
        }

        public forEach(block: (item: any) => void) {
            var key: string;
            for (key in this.items) {
                if (this.items.hasOwnProperty(key)) {
                    block(this.items[key]);
                }
            }
        }
    }
} 