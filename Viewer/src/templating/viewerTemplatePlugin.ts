import { EventCallback, Template } from "./templateManager";

export interface IViewerTemplatePlugin {

    readonly templateName: string;
    readonly eventsToAttach?: Array<string>;

    interactionPredicate(event: EventCallback): boolean;
    onEvent?(event: EventCallback): void;
    addHTMLTemplate?(template: Template): void;
}

export abstract class AbstractViewerNavbarButton implements IViewerTemplatePlugin {



    public readonly templateName: string = "navBar";
    public readonly eventsToAttach: Array<string> = ['pointerdown'];
    protected _prepend: boolean = true;

    abstract interactionPredicate(event: EventCallback): boolean;
    abstract onEvent(event: EventCallback): void;

    public addHTMLTemplate(template: Template): void {
        let element = this._generateHTMLElement(template);
        let container = template.parent.querySelector("div.default-control");
        if (container) {
            if (this._prepend) {
                container.insertBefore(element, container.firstChild);
            } else {
                container.appendChild(element);
            }
        }
    }

    protected abstract _generateHTMLElement(template: Template): HTMLElement;
}