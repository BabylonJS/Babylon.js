import { EventCallback, TemplateManager } from "./templateManager";


export class EventManager {

    private _callbacksContainer: { [key: string]: Array<{ eventType?: string, selector?: string, callback: (eventData: EventCallback) => void }> }

    constructor(private _templateManager: TemplateManager) {
        this._callbacksContainer = {};
        this._templateManager.onEventTriggered.add(eventData => {
            this._eventTriggered(eventData);
        })
    }

    public registerCallback(templateName: string, callback: (eventData: EventCallback) => void, eventType?: string, selector?: string) {
        if (!this._callbacksContainer[templateName]) {
            this._callbacksContainer[templateName] = [];
        }
        this._callbacksContainer[templateName].push({
            eventType: eventType,
            callback: callback
        });
    }

    public unregisterCallback(templateName: string, callback?: (eventData: EventCallback) => void, eventType?: string, selector?: string) {
        let callbackDefs = this._callbacksContainer[templateName] || [];
        this._callbacksContainer[templateName] = callbackDefs.filter(callbackDef => (!callbackDef.eventType || callbackDef.eventType === eventType) && (!callbackDef.selector || callbackDef.selector === selector));
    }

    private _eventTriggered(data: EventCallback) {
        let templateName = data.template.name;
        let eventType = data.event.type;
        let selector = data.selector;

        let callbackDefs = this._callbacksContainer[templateName] || [];
        callbackDefs.filter(callbackDef => (!callbackDef.eventType || callbackDef.eventType === eventType) && (!callbackDef.selector || callbackDef.selector === selector)).forEach(callbackDef => {
            callbackDef.callback(data);
        });
    }

    public dispose() {
        this._callbacksContainer = {};
    }
}