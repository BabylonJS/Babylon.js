import { EventCallback, Template } from "./templateManager";

export interface IViewerPlugin {

    readonly templateName: string;
    readonly eventsToAttach?: Array<string>;

    interactionPredicate(event: EventCallback): boolean;
    onEvent?(event: EventCallback): void;
    addHTMLTemplate?(template: Template): void;
}

export abstract class AbstractViewerNavbarButton implements IViewerPlugin {



    public readonly templateName: string = "navBar";
    public readonly eventsToAttach: Array<string> = ['pointerdown'];

    abstract interactionPredicate(event: EventCallback): boolean;
    abstract onEvent(event: EventCallback): void;
    abstract addHTMLTemplate(template: Template): void;
}