/**
 * Define an interface for all classes that will hold resources
 */
export interface IDisposable {
    /**
     * Releases all held resources
     */
    dispose(): void;
}
