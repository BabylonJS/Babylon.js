import type { EventCallback, Template } from "./templateManager";
import * as Handlebars from "handlebars";

export interface IViewerTemplatePlugin {
    readonly templateName: string;
    readonly eventsToAttach?: Array<string>;

    interactionPredicate(event: EventCallback): boolean;
    onEvent?(event: EventCallback): void;
    addHTMLTemplate?(template: Template): void;
}

export abstract class AbstractViewerNavbarButton implements IViewerTemplatePlugin {
    public readonly templateName: string = "navBar";
    public readonly eventsToAttach: Array<string> = ["pointerdown"];
    protected _prepend: boolean = true;
    protected _buttonName: string;
    protected _buttonClass: string;
    protected _htmlTemplate: string;

    constructor(buttonName: string, buttonClass?: string, htmlTemplate?: string) {
        this._buttonName = buttonName;
        if (buttonClass) {
            this._buttonClass = buttonClass;
        } else {
            this._buttonClass = buttonName + "-button";
        }
        if (htmlTemplate) {
            this._htmlTemplate = htmlTemplate;
        } else {
            this._htmlTemplate = `
<button class="${this._buttonClass}">
    <span class="icon ${this._buttonName}-icon"></span>
</button>
`;
        }
    }

    interactionPredicate(event: EventCallback): boolean {
        const pointerDown = <PointerEvent>event.event;
        if (pointerDown.button !== 0) {
            return false;
        }
        const element = <HTMLElement>event.event.target;

        if (!element) {
            return false;
        }

        const elementClasses = element.classList;

        for (let i = 0; i < elementClasses.length; ++i) {
            const className = elementClasses[i];
            if (className.indexOf(this._buttonClass) !== -1) {
                return true;
            }
        }

        return false;
    }
    abstract onEvent(event: EventCallback): void;

    public addHTMLTemplate(template: Template): void {
        const element = this._generateHTMLElement(template);
        const container = template.parent.querySelector("div.default-control");
        if (container) {
            if (this._prepend) {
                container.insertBefore(element, container.firstChild);
            } else {
                container.appendChild(element);
            }
        }
    }

    protected _generateHTMLElement(template: Template): Element | DocumentFragment {
        const compiledTemplate = Handlebars.compile(this._htmlTemplate, { noEscape: template.configuration.params && !!template.configuration.params.noEscape });
        const config = template.configuration.params || {};
        const rawHtml = compiledTemplate(config);
        let fragment: Element | DocumentFragment;
        try {
            fragment = document.createRange().createContextualFragment(rawHtml);
        } catch (e) {
            const test = document.createElement(this._buttonClass);
            test.innerHTML = rawHtml;
            fragment = test;
        }
        return fragment;
    }
}
