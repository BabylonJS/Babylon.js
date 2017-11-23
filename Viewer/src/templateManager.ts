
import { Observable } from 'babylonjs';
import { isUrl, loadFile, camelToKebab, kebabToCamel } from './helper';

export interface ITemplateConfiguration {
    location?: string; // #template-id OR http://example.com/loading.html
    html?: string; // raw html string
    id?: string;
    params?: { [key: string]: string | number | boolean | object };
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
    }
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

    public initTemplate(templates: { [key: string]: ITemplateConfiguration }) {

        let internalInit = (dependencyMap, name: string, parentTemplate?: Template) => {
            //init template
            let template = this.templates[name];

            let childrenTemplates = Object.keys(dependencyMap).map(childName => {
                return internalInit(dependencyMap[childName], childName, template);
            });

            // register the observers
            //template.onLoaded.add(() => {
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
            //});

            return template;
        }

        //build the html tree
        this.buildHTMLTree(templates).then(htmlTree => {
            internalInit(htmlTree, 'main');
        });
    }

    /**
     * 
     * This function will create a simple map with child-dependencies of the template html tree.
     * It will compile each template, check if its children exist in the configuration and will add them if they do.
     * It is expected that the main template will be called main!
     * 
     * @private
     * @param {{ [key: string]: ITemplateConfiguration }} templates 
     * @memberof TemplateManager
     */
    private buildHTMLTree(templates: { [key: string]: ITemplateConfiguration }): Promise<object> {
        let promises = Object.keys(templates).map(name => {
            let template = new Template(name, templates[name]);
            this.templates[name] = template;
            return template.initPromise;
        });

        return Promise.all(promises).then(() => {
            let templateStructure = {};
            // now iterate through all templates and check for children:
            let buildTree = (parentObject, name) => {
                let childNodes = this.templates[name].getChildElements().filter(n => !!this.templates[n]);
                childNodes.forEach(element => {
                    parentObject[element] = {};
                    buildTree(parentObject[element], element);
                });
            }

            buildTree(templateStructure, "main");
            return templateStructure;
        });
    }

    // assumiung only ONE(!) canvas
    public getCanvas(): HTMLCanvasElement | null {
        return this.containerElement.querySelector('canvas');
    }

    public getTemplate(name: string): Template | undefined {
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
// register a new helper. modified https://stackoverflow.com/questions/9838925/is-there-any-method-to-iterate-a-map-with-handlebars-js
Handlebars.registerHelper('eachInMap', function (map, block) {
    var out = '';
    Object.keys(map).map(function (prop) {
        let data = map[prop];
        if (typeof data === 'object') {
            data.id = data.id || prop;
            out += block.fn(data);
        } else {
            out += block.fn({ id: prop, value: data });
        }
    });
    return out;
});

export class Template {

    public onInit: Observable<Template>;
    public onLoaded: Observable<Template>;
    public onAppended: Observable<Template>;
    public onStateChange: Observable<Template>;
    public onEventTriggered: Observable<EventCallback>;

    public isLoaded: boolean;

    public parent: HTMLElement;

    public initPromise: Promise<Template>;

    private fragment: DocumentFragment;

    constructor(public name: string, private _configuration: ITemplateConfiguration) {
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

        let htmlContentPromise = getTemplateAsHtml(_configuration);

        this.initPromise = htmlContentPromise.then(htmlTemplate => {
            if (htmlTemplate) {
                let compiledTemplate = Handlebars.compile(htmlTemplate);
                let config = this._configuration.params || {};
                let rawHtml = compiledTemplate(config);
                this.fragment = document.createRange().createContextualFragment(rawHtml);
                this.isLoaded = true;
                this.onLoaded.notifyObservers(this);
            }
            return this;
        });
    }

    public get configuration(): ITemplateConfiguration {
        return this._configuration;
    }

    public getChildElements(): Array<string> {
        let childrenArray: string[] = [];
        //Edge and IE don't support frage,ent.children
        let children = this.fragment.children;
        if (!children) {
            // casting to HTMLCollection, as both NodeListOf and HTMLCollection have 'item()' and 'length'.
            children = <HTMLCollection>this.fragment.querySelectorAll('*');
        }
        for (let i = 0; i < children.length; ++i) {
            childrenArray.push(kebabToCamel(children.item(i).nodeName.toLowerCase()));
        }
        return childrenArray;
    }

    public appendTo(parent: HTMLElement) {
        if (this.parent) {
            console.error('Already appanded to ', this.parent);
        } else {
            this.parent = parent;

            if (this._configuration.id) {
                this.parent.id = this._configuration.id;
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
        if (this._configuration.events) {
            for (let eventName in this._configuration.events) {
                if (this._configuration.events && this._configuration.events[eventName]) {
                    let functionToFire = (selector, event) => {
                        this.onEventTriggered.notifyObservers({ event: event, template: this, selector: selector });
                    }

                    // if boolean, set the parent as the event listener
                    if (typeof this._configuration.events[eventName] === 'boolean') {
                        this.parent.addEventListener(eventName, functionToFire.bind(this, '#' + this.parent.id), false);
                    } else if (typeof this._configuration.events[eventName] === 'object') {
                        let selectorsArray: Array<string> = Object.keys(this._configuration.events[eventName] || {});
                        // strict null checl is working incorrectly, must override:
                        let event = this._configuration.events[eventName] || {};
                        selectorsArray.filter(selector => event[selector]).forEach(selector => {
                            if (selector.indexOf('#') !== 0) {
                                selector = '#' + selector;
                            }
                            let htmlElement = <HTMLElement>this.parent.querySelector(selector);
                            htmlElement && htmlElement.addEventListener(eventName, functionToFire.bind(this, selector), false)
                        });
                    }
                }
            }
        }
    }

}

export function getTemplateAsHtml(templateConfig: ITemplateConfiguration): Promise<string> {
    if (!templateConfig) {
        return Promise.reject('No templateConfig provided');
    } else if (templateConfig.html) {
        return Promise.resolve(templateConfig.html);
    } else {
        let location = getTemplateLocation(templateConfig);
        if (isUrl(location)) {
            return loadFile(location);
        } else {
            location = location.replace('#', '');
            let element = document.getElementById(location);
            if (element) {
                return Promise.resolve(element.innerHTML);
            } else {
                return Promise.reject('Template ID not found');
            }
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