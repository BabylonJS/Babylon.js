module BABYLON {
    export class SmartArray<T> {
        public data: Array<T>;
        public length: number = 0;

        constructor(capacity: number) {
            this.data = new Array(capacity);
        }

        public push(value): void {
            this.data[this.length++] = value;

            if (this.length > this.data.length) {
                this.data.length *= 2;
            }
        }

        public pushNoDuplicate(value): void {
            if (this.indexOf(value) > -1) {
                return;
            }
            this.push(value);
        }

        public sort(compareFn): void {
            this.data.sort(compareFn);
        }

        public reset(): void {
            this.length = 0;
        }

        public concat(array: SmartArray<T>): void {
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

        public concatWithNoDuplicate(array: SmartArray<T>): void {
            if (array.length === 0) {
                return;
            }
            if (this.length + array.length > this.data.length) {
                this.data.length = (this.length + array.length) * 2;
            }

            for (var index = 0; index < array.length; index++) {
                var item = (array.data || array)[index];
                var pos = this.data.indexOf(item);

                if (pos === -1 || pos >= this.length) {
                    this.data[this.length++] = item;
                }
            }
        }

        public indexOf(value): number {
            var position = this.data.indexOf(value);

            if (position >= this.length) {
                return -1;
            }

            return position;
        }
    }
} 