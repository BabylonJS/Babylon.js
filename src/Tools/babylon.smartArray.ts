module BABYLON {
    export class SmartArray<T> {
        public data: Array<T>;
        public length: number = 0;

        private _id: number;
        private _duplicateId = 0;

        [index: number]: T;

        constructor(capacity: number) {
            this.data = new Array(capacity);
            this._id = SmartArray._GlobalId++;
        }

        public push(value: T): void {
            this.data[this.length++] = value;

            if (this.length > this.data.length) {
                this.data.length *= 2;
            }

            if (!(<any>value).__smartArrayFlags) {
                (<any>value).__smartArrayFlags = {};
            }

            (<any>value).__smartArrayFlags[this._id] = this._duplicateId;
        }

        public forEach(func: (content: T) => void): void {
            for (var index = 0; index < this.length; index++) {
                func(this.data[index]);
            }
        }

        public pushNoDuplicate(value: T): boolean {
            if ((<any>value).__smartArrayFlags && (<any>value).__smartArrayFlags[this._id] === this._duplicateId) {
                return false;
            }
            this.push(value);
            return true;
        }

        public sort(compareFn: (a: T, b: T) => number): void {
            this.data.sort(compareFn);
        }

        public reset(): void {
            this.length = 0;
            this._duplicateId++;
        }

        public dispose(): void {
            this.reset();

            if (this.data) {
                this.data.length = 0;
                this.data = [];
            }
        }

        public concat(array: any): void {
            if (array.length === 0) {
                return;
            }
            if (this.length + array.length > this.data.length) {
                this.data.length = (this.length + array.length) * 2;
            }

            for (var index = 0; index < array.length; index++) {
                this.data[this.length++] = (array.data || array)[index];
            }
        }

        public concatWithNoDuplicate(array: any): void {
            if (array.length === 0) {
                return;
            }
            if (this.length + array.length > this.data.length) {
                this.data.length = (this.length + array.length) * 2;
            }

            for (var index = 0; index < array.length; index++) {
                var item = (array.data || array)[index];
                this.pushNoDuplicate(item);
            }
        }

        public indexOf(value: T): number {
            var position = this.data.indexOf(value);

            if (position >= this.length) {
                return -1;
            }

            return position;
        }

        public contains(value: T): boolean {
            return this.data.indexOf(value) !== -1;
        }

        // Statics
        private static _GlobalId = 0;
    }
} 