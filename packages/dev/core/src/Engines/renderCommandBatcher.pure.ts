/** This file must only contain pure code and pure imports */

/** @internal */
export interface IRenderCommandLowering<Command> {
    tryAppend(command: Command): boolean;
    flush(): boolean;
    reset(): void;
}

/** @internal */
export class RenderCommandBatcher<Command> {
    public constructor(
        private readonly _lowering: IRenderCommandLowering<Command> | null | undefined,
        private readonly _replay: (command: Command) => void
    ) {}

    public submit(command: Command): boolean {
        const lowering = this._lowering;
        if (lowering?.tryAppend(command)) {
            return true;
        }

        lowering?.flush();
        this._replay(command);
        return false;
    }

    public flush(): boolean {
        return this._lowering?.flush() ?? false;
    }

    public reset(): void {
        this._lowering?.reset();
    }
}
