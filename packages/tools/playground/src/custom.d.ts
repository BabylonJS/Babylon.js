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

declare module "monaco-editor/esm/vs/base/common/scrollable" {
    export const enum ScrollbarVisibility {
        Auto = 1,
        Hidden = 2,
        Visible = 3,
    }
}

declare module "monaco-editor/esm/vs/base/common/lifecycle" {
    export interface IDisposable {
        dispose(): void;
    }
}

declare module "monaco-editor/esm/vs/base/browser/ui/scrollbar/scrollableElement" {
    import type { ScrollbarVisibility } from "monaco-editor/esm/vs/base/common/scrollable";
    import type { IDisposable } from "monaco-editor/esm/vs/base/common/lifecycle";

    export interface ScrollableElementOptions {
        className?: string;
        useShadows?: boolean;
        lazyRender?: boolean;
        handleMouseWheel?: boolean;
        alwaysConsumeMouseWheel?: boolean;
        mouseWheelScrollSensitivity?: number;
        fastScrollSensitivity?: number;
        scrollPredominantAxis?: boolean;
        horizontal?: ScrollbarVisibility;
        horizontalHasArrows?: boolean;
        horizontalScrollbarSize?: number;
        horizontalSliderSize?: number;
        vertical?: ScrollbarVisibility;
        verticalHasArrows?: boolean;
        verticalScrollbarSize?: number;
        verticalSliderSize?: number;
        arrowSize?: number;
    }

    export class ScrollableElement implements IDisposable {
        constructor(element: HTMLElement, options?: ScrollableElementOptions);

        dispose(): void;

        // DOM nodes
        getDomNode(): HTMLElement;
        getOverflowingContentDomNode(): HTMLElement;
        getScrollableElement(): HTMLElement;

        // Options / measurements
        updateOptions(newOptions: Partial<ScrollableElementOptions>): void;
        scanDomNode(): void;

        // Scroll state
        setScrollPosition(update: { scrollLeft?: number; scrollTop?: number }): void;
        setScrollPositionNow(update: { scrollLeft?: number; scrollTop?: number; width?: number; height?: number }): void;

        getScrollLeft(): number;
        setScrollLeft(v: number): void;
        getScrollTop(): number;
        setScrollTop(v: number): void;

        getScrollWidth(): number;
        getScrollHeight(): number;
        getClientWidth(): number;
        getClientHeight(): number;

        onScroll(listener: (e: { scrollLeft: number; scrollTop: number }) => void): IDisposable;
    }
}

declare module "monaco-editor/esm/vs/editor/common/services/languageFeatures" {
    const SuggestAdapter: any;
    export type SuggestAdapter = any;
}
