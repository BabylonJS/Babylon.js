import { Observable } from 'babylonjs';
/**
 * A single template configuration object
 */
export interface ITemplateConfiguration {
    /**
     * can be either the id of the template's html element or a URL.
     * See - http://doc.babylonjs.com/extensions/the_templating_system#location-vs-html
     */
    location?: string;
    /**
     * If no location is provided you can provide here the raw html of this template.
     * See http://doc.babylonjs.com/extensions/the_templating_system#location-vs-html
     */
    html?: string;
    id?: string;
    /**
     * Parameters that will be delivered to the template and will render it accordingly.
     */
    params?: {
        [key: string]: string | number | boolean | object;
    };
    /**
     * Events to attach to this template.
     * event name is the key. the value can either be a boolean (attach to the parent element)
     * or a map of html id elements.
     *
     * See - http://doc.babylonjs.com/extensions/the_templating_system#event-binding
     */
    events?: {
        pointerdown?: boolean | {
            [id: string]: boolean;
        };
        pointerup?: boolean | {
            [id: string]: boolean;
        };
        pointermove?: boolean | {
            [id: string]: boolean;
        };
        pointerover?: boolean | {
            [id: string]: boolean;
        };
        pointerout?: boolean | {
            [id: string]: boolean;
        };
        pointerenter?: boolean | {
            [id: string]: boolean;
        };
        pointerleave?: boolean | {
            [id: string]: boolean;
        };
        pointercancel?: boolean | {
            [id: string]: boolean;
        };
        click?: boolean | {
            [id: string]: boolean;
        };
        dragstart?: boolean | {
            [id: string]: boolean;
        };
        drop?: boolean | {
            [id: string]: boolean;
        };
        [key: string]: boolean | {
            [id: string]: boolean;
        } | undefined;
    };
}
/**
 * The object sent when an event is triggered
 */
export interface EventCallback {
    event: Event;
    template: Template;
    selector: string;
    payload?: any;
}
/**
 * The template manager, a member of the viewer class, will manage the viewer's templates and generate the HTML.
 * The template manager managers a single viewer and can be seen as the collection of all sub-templates of the viewer.
 */
export declare class TemplateManager {
    containerElement: HTMLElement;
    /**
     * Will be triggered when any template is initialized
     */
    onTemplateInit: Observable<Template>;
    /**
     * Will be triggered when any template is fully loaded
     */
    onTemplateLoaded: Observable<Template>;
    /**
     * Will be triggered when a template state changes
     */
    onTemplateStateChange: Observable<Template>;
    /**
     * Will be triggered when all templates finished loading
     */
    onAllLoaded: Observable<TemplateManager>;
    /**
     * Will be triggered when any event on any template is triggered.
     */
    onEventTriggered: Observable<EventCallback>;
    /**
     * This template manager's event manager. In charge of callback registrations to native event types
     */
    eventManager: EventManager;
    private templates;
    constructor(containerElement: HTMLElement);
    /**
     * Initialize the template(s) for the viewer. Called bay the Viewer class
     * @param templates the templates to be used to initialize the main template
     */
    initTemplate(templates: {
        [key: string]: ITemplateConfiguration;
    }): Promise<void>;
    /**
     *
     * This function will create a simple map with child-dependencies of the template html tree.
     * It will compile each template, check if its children exist in the configuration and will add them if they do.
     * It is expected that the main template will be called main!
     *
     * @param templates
     */
    private _buildHTMLTree(templates);
    /**
     * Get the canvas in the template tree.
     * There must be one and only one canvas inthe template.
     */
    getCanvas(): HTMLCanvasElement | null;
    /**
     * Get a specific template from the template tree
     * @param name the name of the template to load
     */
    getTemplate(name: string): Template | undefined;
    private _checkLoadedState();
    /**
     * Dispose the template manager
     */
    dispose(): void;
}
import { EventManager } from './eventManager';
/**
 * This class represents a single template in the viewer's template tree.
 * An example for a template is a single canvas, an overlay (containing sub-templates) or the navigation bar.
 * A template is injected using the template manager in the correct position.
 * The template is rendered using Handlebars and can use Handlebars' features (such as parameter injection)
 *
 * For further information please refer to the documentation page, https://doc.babylonjs.com
 */
export declare class Template {
    name: string;
    private _configuration;
    /**
     * Will be triggered when the template is loaded
     */
    onLoaded: Observable<Template>;
    /**
     * will be triggered when the template is appended to the tree
     */
    onAppended: Observable<Template>;
    /**
     * Will be triggered when the template's state changed (shown, hidden)
     */
    onStateChange: Observable<Template>;
    /**
     * Will be triggered when an event is triggered on ths template.
     * The event is a native browser event (like mouse or pointer events)
     */
    onEventTriggered: Observable<EventCallback>;
    /**
     * is the template loaded?
     */
    isLoaded: boolean;
    /**
     * This is meant to be used to track the show and hide functions.
     * This is NOT (!!) a flag to check if the element is actually visible to the user.
     */
    isShown: boolean;
    /**
     * Is this template a part of the HTML tree (the template manager injected it)
     */
    isInHtmlTree: boolean;
    /**
     * The HTML element containing this template
     */
    parent: HTMLElement;
    /**
     * A promise that is fulfilled when the template finished loading.
     */
    initPromise: Promise<Template>;
    private _fragment;
    private _addedFragment;
    private _htmlTemplate;
    private _rawHtml;
    private loadRequests;
    constructor(name: string, _configuration: ITemplateConfiguration);
    /**
     * Some templates have parameters (like background color for example).
     * The parameters are provided to Handlebars which in turn generates the template.
     * This function will update the template with the new parameters
     *
     * Note that when updating parameters the events will be registered again (after being cleared).
     *
     * @param params the new template parameters
     */
    updateParams(params: {
        [key: string]: string | number | boolean | object;
    }, append?: boolean): void;
    /**
     * Get the template'S configuration
     */
    readonly configuration: ITemplateConfiguration;
    /**
     * A template can be a parent element for other templates or HTML elements.
     * This function will deliver all child HTML elements of this template.
     */
    getChildElements(): Array<string>;
    /**
     * Appending the template to a parent HTML element.
     * If a parent is already set and you wish to replace the old HTML with new one, forceRemove should be true.
     * @param parent the parent to which the template is added
     * @param forceRemove if the parent already exists, shoud the template be removed from it?
     */
    appendTo(parent: HTMLElement, forceRemove?: boolean): void;
    private _isShowing;
    private _isHiding;
    /**
     * Show the template using the provided visibilityFunction, or natively using display: flex.
     * The provided function returns a promise that should be fullfilled when the element is shown.
     * Since it is a promise async operations are more than possible.
     * See the default viewer for an opacity example.
     * @param visibilityFunction The function to execute to show the template.
     */
    show(visibilityFunction?: (template: Template) => Promise<Template>): Promise<Template>;
    /**
     * Hide the template using the provided visibilityFunction, or natively using display: none.
     * The provided function returns a promise that should be fullfilled when the element is hidden.
     * Since it is a promise async operations are more than possible.
     * See the default viewer for an opacity example.
     * @param visibilityFunction The function to execute to show the template.
     */
    hide(visibilityFunction?: (template: Template) => Promise<Template>): Promise<Template>;
    /**
     * Dispose this template
     */
    dispose(): void;
    private _getTemplateAsHtml(templateConfig);
    private _registeredEvents;
    private _registerEvents();
    private _getTemplateLocation(templateConfig);
}
