import { EventCallback, TemplateManager } from "./templateManager";

/**
 * The EventManager is in charge of registering user interctions with the viewer.
 * It is used in the TemplateManager
 */
export class EventManager {

    private _callbacksContainer: { [key: string]: Array<{ eventType?: string, selector?: string, callback: (eventData: EventCallback) => void }> };

    constructor(private _templateManager: TemplateManager) {
        this._callbacksContainer = {};
        this._templateManager.onEventTriggered.add((eventData) => {
            this._eventTriggered(eventData);
        });
    }

    /**
     * Register a new callback to a specific template.
     * The best example for the usage can be found in the DefaultViewer
     *
     * @param templateName the templateName to register the event to
     * @param callback The callback to be executed
     * @param eventType the type of event to register
     * @param selector an optional selector. if not defined the parent object in the template will be selected
     */
    public registerCallback(templateName: string, callback: (eventData: EventCallback) => void, eventType?: string, selector?: string) {
        if (!this._callbacksContainer[templateName]) {
            this._callbacksContainer[templateName] = [];
        }
        this._callbacksContainer[templateName].push({
            eventType,
            callback,
            selector
        });
    }

    /**
     * This will remove a registered event from the defined template.
     * Each one of the variables apart from the template name are optional, but one must be provided.
     *
     * @param templateName the templateName
     * @param callback the callback to remove (optional)
     * @param eventType the event type to remove (optional)
     * @param selector the selector from which to remove the event (optional)
     */
    public unregisterCallback(templateName: string, callback: (eventData: EventCallback) => void, eventType?: string, selector?: string) {
        let callbackDefs = this._callbacksContainer[templateName] || [];
        this._callbacksContainer[templateName] = callbackDefs.filter((callbackDef) => (!callbackDef.eventType || callbackDef.eventType === eventType) && (!callbackDef.selector || callbackDef.selector === selector));
    }

    private _eventTriggered(data: EventCallback) {
        let templateName = data.template.name;
        let eventType = data.event.type;
        let selector = data.selector;

        let callbackDefs = this._callbacksContainer[templateName] || [];
        callbackDefs.filter((callbackDef) => (!callbackDef.eventType || callbackDef.eventType === eventType) && (!callbackDef.selector || callbackDef.selector === selector)).forEach((callbackDef) => {
            callbackDef.callback(data);
        });
    }

    /**
     * Dispose the event manager
     */
    public dispose() {
        this._callbacksContainer = {};
    }
}