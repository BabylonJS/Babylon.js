import { FlowGraphEventBlock } from "core/FlowGraph/flowGraphEventBlock";
import { type KeyboardInfo } from "core/Events/keyboardEvents";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeBoolean, RichTypeString } from "core/FlowGraph/flowGraphRichTypes";
import { _IsMacPlatform } from "core/FlowGraph/utils";

/**
 * Configuration for keyboard event blocks.
 */
export interface IFlowGraphKeyboardEventBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * When true, prevent the event from propagating to other listeners.
     */
    stopPropagation?: boolean;
}

/**
 * Shared base class for keyboard event blocks (KeyDown / KeyUp).
 *
 * Provides a `key` input filter, output data connections for the key code,
 * key string, modifier states, and a platform-aware `commandOrCtrl` flag.
 * Subclasses only need to set their event type and class name.
 */
export abstract class FlowGraphKeyboardEventBlock extends FlowGraphEventBlock {
    /**
     * Input connection: optional key code to filter on (e.g. "KeyA", "Space", "ShiftLeft").
     * Uses `KeyboardEvent.code` values. Leave empty / disconnected to fire on any key event.
     */
    public readonly key: FlowGraphDataConnection<string>;

    /**
     * Output connection: the `KeyboardEvent.code` of the key.
     */
    public readonly keyCode: FlowGraphDataConnection<string>;

    /**
     * Output connection: the `KeyboardEvent.key` string (printable character or key name).
     */
    public readonly keyValue: FlowGraphDataConnection<string>;

    /**
     * Output connection: whether the Shift key was held.
     */
    public readonly shiftKey: FlowGraphDataConnection<boolean>;

    /**
     * Output connection: whether the Ctrl key was held.
     */
    public readonly ctrlKey: FlowGraphDataConnection<boolean>;

    /**
     * Output connection: whether the Alt key (Option on macOS) was held.
     */
    public readonly altKey: FlowGraphDataConnection<boolean>;

    /**
     * Output connection: whether the Meta key (Windows / Cmd) was held.
     */
    public readonly metaKey: FlowGraphDataConnection<boolean>;

    /**
     * Output connection: platform-aware "command or control" modifier.
     * True when Meta (Cmd) is held on macOS, or Ctrl is held on Windows/Linux.
     */
    public readonly commandOrCtrl: FlowGraphDataConnection<boolean>;

    protected constructor(config?: IFlowGraphKeyboardEventBlockConfiguration) {
        super(config);
        this.key = this.registerDataInput("key", RichTypeString);
        this.keyCode = this.registerDataOutput("keyCode", RichTypeString);
        this.keyValue = this.registerDataOutput("keyValue", RichTypeString);
        this.shiftKey = this.registerDataOutput("shiftKey", RichTypeBoolean);
        this.ctrlKey = this.registerDataOutput("ctrlKey", RichTypeBoolean);
        this.altKey = this.registerDataOutput("altKey", RichTypeBoolean);
        this.metaKey = this.registerDataOutput("metaKey", RichTypeBoolean);
        this.commandOrCtrl = this.registerDataOutput("commandOrCtrl", RichTypeBoolean);
    }

    /** @internal */
    public override _executeEvent(context: FlowGraphContext, keyboardInfo: KeyboardInfo): boolean {
        const evt = keyboardInfo.event;
        const filterKey = this.key.getValue(context);

        // If a key filter is set, only fire when it matches.
        if (filterKey && filterKey !== evt.code) {
            return true;
        }

        this.keyCode.setValue(evt.code, context);
        this.keyValue.setValue(evt.key, context);
        this.shiftKey.setValue(evt.shiftKey, context);
        this.ctrlKey.setValue(evt.ctrlKey, context);
        this.altKey.setValue(evt.altKey, context);
        this.metaKey.setValue(evt.metaKey, context);
        this.commandOrCtrl.setValue(_IsMacPlatform ? evt.metaKey : evt.ctrlKey, context);

        this._execute(context);
        return !(this.config as IFlowGraphKeyboardEventBlockConfiguration)?.stopPropagation;
    }

    /** @internal */
    public override _preparePendingTasks(_context: FlowGraphContext): void {
        // no-op
    }

    /** @internal */
    public override _cancelPendingTasks(_context: FlowGraphContext): void {
        // no-op
    }
}
