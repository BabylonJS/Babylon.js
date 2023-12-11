export interface IObjectAccessor {
    object: any;
    type: any;
    get(...args: any[]): any;
    set?(value: any, ...args: any[]): void;
    extras?: any;
}

export interface IPathToObjectConverter {
    convert(path: string): IObjectAccessor | undefined;
}
