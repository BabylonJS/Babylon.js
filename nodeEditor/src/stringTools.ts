import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';

export class StringTools {
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
    public static DownloadAsFile(content: string, filename: string) {
        let blob = new Blob([content],
            {
                type: "application/octet-stream"
            });

        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
            return;
        }

        var file = new Blob([content], { type: "application/octet-stream" });

        var reader = new FileReader();
        reader.onload = function(e) {
            var bdata = btoa(reader.result as string);

            var datauri = 'data:text/plain;base64,' + bdata;
            setTimeout(() => {
                let link = document.createElement("a");
                link.setAttribute("href", datauri);
                link.setAttribute("download", filename);
                link.target = "_self";
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                setTimeout(function() {
                    document.body.removeChild(link);
                }, 0);
            }, 10);
        };
        reader.readAsBinaryString(file);
    }
}