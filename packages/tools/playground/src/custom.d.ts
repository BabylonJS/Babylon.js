/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable jsdoc/require-jsdoc */
declare module "*.svg" {
    const content: string;
    export default content;
}

declare module "*.module.scss" {
    const content: { [className: string]: string };
    export = content;
}

declare module "monaco-editor/esm/vs/base/common/lifecycle" {
    export interface IDisposable {
        dispose(): void;
    }
}

declare module "monaco-editor/esm/vs/editor/common/services/languageFeatures" {
    const SuggestAdapter: any;
    export type SuggestAdapter = any;
}

declare module "monaco-editor/esm/vs/base/common/color.js" {
    export const Color: any;
    export const HSLA: any;
}
