/**
 * A single template configuration object
 */
export interface ITemplateConfiguration {
    /**
     * can be either the id of the template's html element or a URL.
     * See - https://doc.babylonjs.com/extensions/the_templating_system#location-vs-html
     */
    location?: string; // #template-id OR http://example.com/loading.html
    /**
     * If no location is provided you can provide here the raw html of this template.
     * See https://doc.babylonjs.com/extensions/the_templating_system#location-vs-html
     */
    html?: string; // raw html string
    id?: string;
    /**
     * Parameters that will be delivered to the template and will render it accordingly.
     */
    params?: { [key: string]: string | number | boolean | object };
    /**
     * Events to attach to this template.
     * event name is the key. the value can either be a boolean (attach to the parent element)
     * or a map of html id elements.
     *
     * See - https://doc.babylonjs.com/extensions/the_templating_system#event-binding
     */
    events?: {
        // pointer events
        pointerdown?: boolean | { [id: string]: boolean; };
        pointerup?: boolean | { [id: string]: boolean; };
        pointermove?: boolean | { [id: string]: boolean; };
        pointerover?: boolean | { [id: string]: boolean; };
        pointerout?: boolean | { [id: string]: boolean; };
        pointerenter?: boolean | { [id: string]: boolean; };
        pointerleave?: boolean | { [id: string]: boolean; };
        pointercancel?: boolean | { [id: string]: boolean; };
        //click, just in case
        click?: boolean | { [id: string]: boolean; };
        // drag and drop
        dragstart?: boolean | { [id: string]: boolean; };
        drop?: boolean | { [id: string]: boolean; };

        [key: string]: boolean | { [id: string]: boolean; } | undefined;
    };
}