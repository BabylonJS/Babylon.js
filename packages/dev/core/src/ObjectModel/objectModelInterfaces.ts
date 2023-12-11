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

/**
 * Interface for holding parameters that can substitute part of paths.
 */
export interface ITemplatedPath {
    substitutionTemplates: { [key: string]: number };
}

export function isTemplated(x: any): x is ITemplatedPath {
    return x.substitutionTemplates !== undefined;
}
