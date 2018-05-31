interface Ideepmerge {
    (a: any, b: any, options?: any): any;
    all(array: Array<any>, options?: any): any;
}
declare const deepmerge: Ideepmerge;

declare module "deepmerge" {
    export = deepmerge;
}