export {};

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Note that users may not import this file, so each time we want to call one of them, we must check if it exists.
 * @internal
 */

declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /** @internal */
        _debugPushGroup(groupName: string): void;

        /** @internal */
        _debugPopGroup(): void;

        /** @internal */
        _debugInsertMarker(text: string): void;
    }
}
