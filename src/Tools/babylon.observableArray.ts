module BABYLON {
    export class ObservableArray<T> {
        public data: Array<T>;
        public length: number = 0;

        public onDataAdded = new Observable<T>();
        public onDataRemoved = new Observable<T>();

        constructor() {
            this.data = new Array<T>();
        }

        public splice(start: number, deleteCount?: number): T[] {
            var removed = this.data.splice(start, deleteCount);

            if (this.onDataRemoved.hasObservers) {
                for (var item of removed) {
                    this.onDataRemoved.notifyObservers(item);
                }
            }

            return removed;
        }

        public push(...items: T[]): void {
            this.data.push(...items);

            if (this.onDataAdded.hasObservers) {
                for (var item of items) {
                    this.onDataAdded.notifyObservers(item);
                }
            }
        }

        public forEach(func: (content: T) => void): void {
            for (var index = 0; index < this.length; index++) {
                func(this.data[index]);
            }
        }

        public sort(compareFn): void {
            this.data.sort(compareFn);
        }

        public reset(): void {
            this.length = 0;
        }

        public dispose(): void {
            this.reset();
            this.data.length = 0;
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