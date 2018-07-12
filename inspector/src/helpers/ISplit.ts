interface ISplit {
    (elements: HTMLElement[], options: any): void;
}
declare const Split: ISplit;

declare module "Split" {
    export default Split;
}