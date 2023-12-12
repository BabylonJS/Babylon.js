export interface IObjectAccessorContainer {
    object: any;
    type?: any;
    extras?: any;
    accessor: any; // Ideally, IObjectAccessor
}

export interface IObjectAccessor {
    get(...args: any[]): any;
    set?(value: any, ...args: any[]): void;
}

export interface IPathToObjectConverter {
    convert(path: string): IObjectAccessorContainer | undefined;
}
