
import { Observable } from 'babylonjs';
import { isUrl, loadFile, camelToKebab } from './helper';


export interface TemplateConfiguration {
    location?: string; // #template-id OR http://example.com/loading.html
    html?: string; // raw html string
    id?: string;
    config?: { [key: string]: string | number | boolean | object };
    events?: {
        // pointer events
        pointerdown?: boolean | Array<string>;
        pointerup?: boolean | Array<string>;
        pointermove?: boolean | Array<string>;
        pointerover?: boolean | Array<string>;
        pointerout?: boolean | Array<string>;
        pointerenter?: boolean | Array<string>;
        pointerleave?: boolean | Array<string>;
        pointercancel?: boolean | Array<string>;
        //click, just in case
        click?: boolean | Array<string>;
        // drag and drop
        dragstart?: boolean | Array<string>;
        drop?: boolean | Array<string>;

        [key: string]: boolean | Array<string>;
    }
    children?: { [name: string]: TemplateConfiguration };
}

export interface EventCallback {
    event: Event;
    template: Template;
    selector: string;
    payload?: any;
}

export class TemplateManager {

    public onInit: Observable<Template>;
    public onLoaded: Observable<Template>;
    public onStateChange: Observable<Template>;
    public onAllLoaded: Observable<TemplateManager>;

    private templates: { [name: string]: Template };

    constructor(public containerElement: HTMLElement) {
        this.templates = {};

        this.onInit = new Observable<Template>();
        this.onLoaded = new Observable<Template>();
        this.onStateChange = new Observable<Template>();
        this.onAllLoaded = new Observable<TemplateManager>();
    }

    public initTemplate(configuration: TemplateConfiguration, name: string = 'main', parentTemplate?: Template) {
        //init template
        let template = new Template(name, configuration);
        this.templates[name] = template;

        let childrenMap = configuration.children || {};
        let childrenTemplates = Object.keys(childrenMap).map(name => {
            return this.initTemplate(configuration.children[name], name, template);
        });

        // register the observers
        template.onLoaded.add(() => {
            let addToParent = () => {
                let containingElement = parentTemplate && parentTemplate.parent.querySelector(camelToKebab(name)) || this.containerElement;
                template.appendTo(containingElement);
                this.checkLoadedState();
            }

            if (parentTemplate && !parentTemplate.parent) {
                parentTemplate.onAppended.add(() => {
                    addToParent();
                });
            } else {
                addToParent();
            }
        });

        return template;
    }

    // assumiung only ONE(!) canvas
    public getCanvas(): HTMLCanvasElement {
        return this.containerElement.querySelector('canvas');
    }

    public getTemplate(name: string) {
        return this.templates[name];
    }

    private checkLoadedState() {
        let done = Object.keys(this.templates).every((key) => {
            return this.templates[key].isLoaded && !!this.templates[key].parent;
        });

        if (done) {
            this.onAllLoaded.notifyObservers(this);
        }
    }

}


import * as Handlebars from 'handlebars/dist/handlebars.min.js';

export class Template {

    public onInit: Observable<Template>;
    public onLoaded: Observable<Template>;
    public onAppended: Observable<Template>;
    public onStateChange: Observable<Template>;
    public onEventTriggered: Observable<EventCallback>;

    public isLoaded: boolean;

    public parent: HTMLElement;

    private fragment: DocumentFragment;

    constructor(public name: string, private configuration: TemplateConfiguration) {
        this.onInit = new Observable<Template>();
        this.onLoaded = new Observable<Template>();
        this.onAppended = new Observable<Template>();
        this.onStateChange = new Observable<Template>();
        this.onEventTriggered = new Observable<EventCallback>();

        this.isLoaded = false;
        /*
        if (configuration.id) {
            this.parent.id = configuration.id;
        }
        */
        this.onInit.notifyObservers(this);

        let htmlContentPromise = getTemplateAsHtml(configuration);

        htmlContentPromise.then(htmlTemplate => {
            if (htmlTemplate) {
                let compiledTemplate = Handlebars.compile(htmlTemplate);
                let config = this.configuration.config || {};
                let rawHtml = compiledTemplate(config);
                this.fragment = document.createRange().createContextualFragment(rawHtml);
                this.isLoaded = true;
                this.onLoaded.notifyObservers(this);
            }
        });
    }

    public appendTo(parent: HTMLElement) {
        if (this.parent) {
            console.error('Alread appanded to ', this.parent);
        } else {
            this.parent = parent;

            if (this.configuration.id) {
                this.parent.id = this.configuration.id;
            }
            this.parent.appendChild(this.fragment);
            // appended only one frame after.
            setTimeout(() => {
                this.registerEvents();
                this.onAppended.notifyObservers(this);
            });
        }

    }

    public show(visibilityFunction?: (template: Template) => Promise<Template>): Promise<Template> {
        if (visibilityFunction) {
            return visibilityFunction(this).then(() => {
                this.onStateChange.notifyObservers(this);
                return this;
            });
        } else {
            // flex? box? should this be configurable easier than the visibilityFunction?
            this.parent.style.display = 'flex';
            this.onStateChange.notifyObservers(this);
            return Promise.resolve(this);
        }
    }

    public hide(visibilityFunction?: (template: Template) => Promise<Template>): Promise<Template> {
        if (visibilityFunction) {
            return visibilityFunction(this).then(() => {
                this.onStateChange.notifyObservers(this);
                return this;
            });
        } else {
            this.parent.style.display = 'none';
            this.onStateChange.notifyObservers(this);
            return Promise.resolve(this);
        }
    }

    // TODO - Should events be removed as well? when are templates disposed?
    private registerEvents() {
        if (this.configuration.events) {
            Object.keys(this.configuration.events).forEach(eventName => {
                if (this.configuration.events[eventName]) {
                    let functionToFire = (selector, event) => {
                        this.onEventTriggered.notifyObservers({ event: event, template: this, selector: selector });
                    }

                    // if boolean, set the parent as the event listener
                    if (typeof this.configuration.events[eventName] === 'boolean') {
                        this.parent.addEventListener(eventName, functionToFire.bind(this, '#' + this.parent.id), false);
                    } else {
                        let selectorsArray: Array<string> = <Array<string>>this.configuration.events[eventName];
                        selectorsArray.forEach(selector => {
                            let htmlElement = <HTMLElement>this.parent.querySelector(selector);
                            htmlElement && htmlElement.addEventListener(eventName, functionToFire.bind(this, selector), false)
                        });
                    }
                }
            });
        }
    }

}

export function getTemplateAsHtml(templateConfig: TemplateConfiguration): Promise<string> {
    if (!templateConfig) {
        return Promise.resolve(undefined);
    } else if (templateConfig.html) {
        return Promise.resolve(templateConfig.html);
    } else {
        let location = getTemplateLocation(templateConfig);
        if (isUrl(location)) {
            return loadFile(location);
        } else {
            location = location.replace('#', '');
            document.getElementById('#' + location);
        }
    }
}

export function getTemplateLocation(templateConfig): string {
    if (!templateConfig || typeof templateConfig === 'string') {
        return templateConfig;
    } else {
        return templateConfig.location;
    }
}