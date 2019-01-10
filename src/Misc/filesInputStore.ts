/**
 * Class used to help managing file picking and drag'n'drop
 * File Storage
 */
export class FilesInputStore {
    /**
     * List of files ready to be loaded
     */
    public static FilesToLoad: { [key: string]: File } = {};
}
