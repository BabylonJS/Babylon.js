import { AbstractViewerNavbarButton } from "../viewerTemplatePlugin";
import { DefaultViewer } from "../../viewer/defaultViewer";
import { EventCallback, Template } from "../templateManager";

export class HDButtonPlugin extends AbstractViewerNavbarButton {

    protected _buttonClass = "hd-button";

    constructor(private _viewer: DefaultViewer) {
        super();
    }

    onEvent(event: EventCallback): void {
        let button = event.template.parent.querySelector(".hd-button");
        if (button) {
            button.classList.contains("hd-toggled") ? button.classList.remove("hd-toggled") : button.classList.add("hd-toggled");
        }
        this._viewer.toggleHD();
    }

    protected _htmlTemplate: string = `
{{#unless hideHd}}
<style>
.hd-icon:after {
    font-size: 16px;
    content: "\\F765";
}

.hd-toggled span.hd-icon:after {
    content: "\\F766";
}
</style>
<button class="hd-button" title="{{text.hdButton}}">
     <span class="icon hd-icon"></span>
 </button>
 {{/unless}}
`;
}