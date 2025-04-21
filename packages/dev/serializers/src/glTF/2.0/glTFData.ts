import { GetMimeType } from "core/Misc/fileTools";
import { Tools } from "core/Misc/tools";

/**
 * Class for holding and downloading glTF file data
 */
export class GLTFData {
    /**
     * Object which contains the file name as the key and its data as the value
     */
    public readonly files: { [fileName: string]: string | Blob } = {};

    /**
     * @deprecated Use files instead
     */
    public get glTFFiles() {
        return this.files;
    }

    /**
     * Downloads the glTF data as files based on their names and data
     */
    public downloadFiles(): void {
        for (const key in this.files) {
            const value = this.files[key];
            const blob = new Blob([value], { type: GetMimeType(key) });
            Tools.Download(blob, key);
        }
    }
}
