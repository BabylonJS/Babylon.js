declare module BABYLON {
    class SmartArray<T> {
        public data: T[];
        public length: number;
        private _id;
        private _duplicateId;
        constructor(capacity: number);
        public push(value: any): void;
        public pushNoDuplicate(value: any): void;
        public sort(compareFn: any): void;
        public reset(): void;
        public concat(array: any): void;
        public concatWithNoDuplicate(array: any): void;
        public indexOf(value: any): number;
        private static _GlobalId;
    }
}
