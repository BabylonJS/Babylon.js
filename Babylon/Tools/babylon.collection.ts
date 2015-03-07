module BABYLON {
    export class Collection {
        public count: number = 0;
        public items: any;

        constructor() {
            this.items = {};
        }

        public add(key: string, item: any): number {        
            if (this.items[key] != undefined) {
                return undefined;
            }
            this.items[key] = item;
            return ++this.count;
        }
     
        public remove(key: string): number {
            if (this.items[key] == undefined) {
                return undefined;
            }
            delete this.items[key];
            return --this.count;
        }
 
        public item(key: string): any {
            return this.items[key];
        }

    }
} 