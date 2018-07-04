import { EventCallback, TemplateManager } from "./templateManager";
/**
 * The EventManager is in charge of registering user interctions with the viewer.
 * It is used in the TemplateManager
 */
export declare class EventManager {
    private _templateManager;
    private _callbacksContainer;
    constructor(_templateManager: TemplateManager);
    /**
     * Register a new callback to a specific template.
     * The best example for the usage can be found in the DefaultViewer
     *
     * @param templateName the templateName to register the event to
     * @param callback The callback to be executed
     * @param eventType the type of event to register
     * @param selector an optional selector. if not defined the parent object in the template will be selected
     */
    registerCallback(templateName: string, callback: (eventData: EventCallback) => void, eventType?: string, selector?: string): void;
    /**
     * This will remove a registered event from the defined template.
     * Each one of the variables apart from the template name are optional, but one must be provided.
     *
     * @param templateName the templateName
     * @param callback the callback to remove (optional)
     * @param eventType the event type to remove (optional)
     * @param selector the selector from which to remove the event (optional)
     */
    unregisterCallback(templateName: string, callback: (eventData: EventCallback) => void, eventType?: string, selector?: string): void;
    private _eventTriggered(data);
    /**
     * Dispose the event manager
     */
    dispose(): void;
}
