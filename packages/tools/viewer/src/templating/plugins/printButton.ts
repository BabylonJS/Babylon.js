import { AbstractViewerNavbarButton } from "../viewerTemplatePlugin";
import { DefaultViewer } from "../../viewer/defaultViewer";
import { EventCallback } from "../templateManager";
import { Tools } from "babylonjs/Misc/tools";

export class PrintButtonPlugin extends AbstractViewerNavbarButton {

    private _currentModelUrl: string;

    constructor(private _viewer: DefaultViewer) {
        super("print", "print-button", PrintButtonPlugin.HtmlTemplate);

        this._viewer.onModelLoadedObservable.add((model) => {
            this._currentModelUrl = "";
            if (model.configuration.url) {
                let filename = Tools.GetFilename(model.configuration.url) || model.configuration.url;
                let baseUrl = model.configuration.root || Tools.GetFolderPath(model.configuration.url);

                //gltf, obj, stl
                let extension = model.configuration.loader || filename.split(".").pop() || "";
                let printable = false;
                // not using .some sue to IE11
                ["gltf", "glb", "obj", "stl"].forEach((ext) => {
                    if (extension.indexOf(ext) !== -1) {
                        printable = true;
                    }
                });
                if (printable) {
                    this._currentModelUrl = baseUrl + filename;
                }
            }
        });
    }

    onEvent(event: EventCallback): void {
        if (this._currentModelUrl) {
            let printUrl = this._currentModelUrl.replace(/https?:\/\//, "com.microsoft.builder3d://");
            window.open(printUrl, "_self");
        }
    }

    protected static HtmlTemplate: string = `
{{#unless hidePrint}}
<style>

/* Show only if it's a windows 10 printer  */
.print-icon.not-win-10 {
    display: none;
}

.print-icon:after {
    font-size: 16px;
    content: "\\E914";
}

</style>
<button class="print-button ${window.navigator.userAgent.indexOf("Windows NT 10.0") === -1 ? "no-win-10" : ""}" title="{{text.printButton}}">
     <span class="icon print-icon"></span>
 </button>
 {{/unless}}
`;
}
