import { EventCallback, TemplateManager } from "./templateManager";


export class ActionManager {

    private callbacksContainer: { [key: string]: Array<{ eventType?: string, selector?: string, callback: (eventData: EventCallback) => void }> }

    constructor(private templateManager: TemplateManager) {
        this.callbacksContainer = {};
        this.templateManager.onEventTriggered.add(eventData => {
            this.eventTriggered(eventData);
        })
    }

    public registerCallback(templateName: string, callback: (eventData: EventCallback) => void, eventType?: string, selector?: string) {
        if (!this.callbacksContainer[templateName]) {
            this.callbacksContainer[templateName] = [];
        }
        this.callbacksContainer[templateName].push({
            eventType: eventType,
            callback: callback
        });
    }

    public unregisterCallback(templateName: string, callback?: (eventData: EventCallback) => void, eventType?: string, selector?: string) {
        let callbackDefs = this.callbacksContainer[templateName] || [];
        this.callbacksContainer[templateName] = callbackDefs.filter(callbackDef => (!callbackDef.eventType || callbackDef.eventType === eventType) && (!callbackDef.selector || callbackDef.selector === selector));
    }

    private eventTriggered(data: EventCallback) {
        let templateName = data.template.name;
        let eventType = data.event.type;
        let selector = data.selector;

        let callbackDefs = this.callbacksContainer[templateName] || [];
        callbackDefs.filter(callbackDef => (!callbackDef.eventType || callbackDef.eventType === eventType) && (!callbackDef.selector || callbackDef.selector === selector)).forEach(callbackDef => {
            callbackDef.callback(data);
        });
    }
}