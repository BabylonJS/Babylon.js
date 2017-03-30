module BABYLON {
    export class SmartArray<T> {
        public data: Array<T>;
        public length: number = 0;

        private _id: number;
        private _duplicateId = 0;

        constructor(capacity: number) {
            this.data = new Array(capacity);
            this._id = SmartArray._GlobalId++;
        }

        public push(value): void {
            this.data[this.length++] = value;

            if (this.length > this.data.length) {
                this.data.length *= 2;
            }

            if (!value.__smartArrayFlags) {
                value.__smartArrayFlags = {};
            }

            value.__smartArrayFlags[this._id] = this._duplicateId;
        }

        public forEach(func: (content: T) => void): void {
            for (var index = 0; index < this.length; index++) {
                func(this.data[index]);
            }
        }

        public pushNoDuplicate(value): boolean {
            if (value.__smartArrayFlags && value.__smartArrayFlags[this._id] === this._duplicateId) {
                return false;
            }
            this.push(value);
            return true;
        }

        public sort(compareFn): void {
            this.data.sort(compareFn);
        }

        public reset(): void {
            this.length = 0;
            this._duplicateId++;
        }

        public dispose(): void {
            this.reset();
            this.data.length = 0;
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