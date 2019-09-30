import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';

export class StringTools {
    /*
     * Based on FileSaver.js
     * A saveAs() FileSaver implementation.
     *
     * By Eli Grey, http://eligrey.com
     *
     * License : https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md (MIT)
     * source  : http://purl.eligrey.com/github/FileSaver.js
     */
    private static _SaveAs(blob: Blob, name: string, document: HTMLDocument) {
        if ('download' in HTMLAnchorElement.prototype) {
            var URL = window.URL || window.webkitURL;
            var a = document.createElement('a');
        
            a.download = name;
            a.rel = 'noopener'; // tabnabbing

            a.href = URL.createObjectURL(blob)
            setTimeout(() => { URL.revokeObjectURL(a.href) }, 4E4) // 40s
            setTimeout(() => { this._Click(a, document) }, 0);
            return;
        }

        // Open a popup immediately do go around popup blocker
        // Mostly only available on user interaction and the fileReader is async so...
        var popup = open('', '_blank');
        if (popup) {
            popup.document.title = popup.document.body.innerText = 'downloading...';
        }

        var force = blob.type === 'application/octet-stream';
        var isSafari = /constructor/i.test((window as any).HTMLElement) || (window as any).safari;
        var isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);

        if ((isChromeIOS || (force && isSafari)) && typeof FileReader !== 'undefined') {
            // Safari doesn't allow downloading of blob URLs
            var reader = new FileReader();
            reader.onloadend = () => {
                var url:any = reader.result;
                url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, 'data:attachment/file;');
                if (popup) {
                    popup.location.href = url;
                }
                else {
                    location = url;
                }
                popup = null;
            }
            reader.readAsDataURL(blob);
        } else {
            var URL = window.URL || window.webkitURL
            var url = URL.createObjectURL(blob)
            if (popup) {
                popup.location.href = url;
            }
            else {
                location.href = url;
            }
            popup = null;
            setTimeout(function () { URL.revokeObjectURL(url) }, 4E4);
        }
    }

    private static _Click(node: HTMLElement, document: HTMLDocument) {
        try {
            node.dispatchEvent(new MouseEvent('click'))
        } catch (e) {
            var evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
            node.dispatchEvent(evt);
        }
    }

    /**
     * Gets the base math type of node material block connection point.
     * @param type Type to parse.
     */
    public static GetBaseType(type: NodeMaterialBlockConnectionPointTypes): string {
        return NodeMaterialBlockConnectionPointTypes[type];
    }

    /**
     * Download a string into a file that will be saved locally by the browser
     * @param content defines the string to download locally as a file
     */
    public static DownloadAsFile(document: HTMLDocument, content: string, filename: string) {
        let blob = new Blob([content],
            {
                type: "application/octet-stream"
            });

        this._SaveAs(blob, filename, document);        
    }
}