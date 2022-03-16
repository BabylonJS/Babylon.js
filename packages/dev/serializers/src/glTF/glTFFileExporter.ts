/** @hidden */
export var __IGLTFExporterExtension = 0; // I am here to allow dts to be created

/**
 * Interface for extending the exporter
 * @hidden
 */
export interface IGLTFExporterExtension {
    /**
     * The name of this extension
     */
    readonly name: string;
    /**
     * Defines whether this extension is enabled
     */
    enabled: boolean;

    /**
     * Defines whether this extension is required
     */
    required: boolean;
}