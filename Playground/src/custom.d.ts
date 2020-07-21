declare module "*.svg" {
    const content: string;
    export default content;
}

declare module "monaco-editor/esm/vs/language/typescript/languageFeatures" {        
    const SuggestAdapter: any;
    export type SuggestAdapter = any;
}