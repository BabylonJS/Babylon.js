export var toto3 = 0;

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