import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { saveAs } from 'file-saver';

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
    public static DownloadAsFile(document: HTMLDocument, content: string, filename: string) {
        let blob = new Blob([content],
            {
                type: "application/octet-stream"
            });

        saveAs(blob, filename);        
    }
}