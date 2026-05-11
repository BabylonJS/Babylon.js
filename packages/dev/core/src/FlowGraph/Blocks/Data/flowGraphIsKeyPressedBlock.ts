import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { RegisterClass } from "core/Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { RichTypeBoolean, RichTypeString } from "core/FlowGraph/flowGraphRichTypes";

/**
 * A data block that outputs whether a specific keyboard key is currently pressed,
 * optionally requiring one or more modifier keys to also be held.
 *
 * This block queries the scene event coordinator's `pressedKeys` set,
 * which is updated in real-time by the keyboard observers. It is designed
 * to be polled every frame (e.g. from a Scene Tick event chain) but can
 * also be read on demand from any execution context.
 *
 * The `key` input uses `KeyboardEvent.code` values (e.g. "KeyA", "Space",
 * "ShiftLeft", "ControlLeft", "AltLeft", "MetaLeft" for Mac Cmd).
 *
 * Modifier inputs (`withShift`, `withCtrl`, `withAlt`, `withMeta`,
 * `withCommandOrCtrl`) default to false. Set any to true to require that
 * modifier to also be held for `isPressed` to be true.
 * For example, key = "KeyA" + withCommandOrCtrl = true checks for
 * Cmd+A on macOS or Ctrl+A on Windows/Linux.
 */
export class FlowGraphIsKeyPressedBlock extends FlowGraphBlock {
    /**
     * Input connection: the `KeyboardEvent.code` of the key to check
     * (e.g. "KeyA", "Space", "ShiftLeft").
     */
    public readonly key: FlowGraphDataConnection<string>;

    /**
     * Input connection: when true, Shift must also be held.
     */
    public readonly withShift: FlowGraphDataConnection<boolean>;

    /**
     * Input connection: when true, Ctrl must also be held.
     */
    public readonly withCtrl: FlowGraphDataConnection<boolean>;

    /**
     * Input connection: when true, Alt (Option on macOS) must also be held.
     */
    public readonly withAlt: FlowGraphDataConnection<boolean>;

    /**
     * Input connection: when true, Meta (Win key / Cmd) must also be held.
     */
    public readonly withMeta: FlowGraphDataConnection<boolean>;

    /**
     * Input connection: when true, the platform-appropriate "command" modifier
     * must also be held (Cmd on macOS, Ctrl on Windows/Linux).
     * This uses the virtual "CommandOrControl" key tracked by the coordinator.
     */
    public readonly withCommandOrCtrl: FlowGraphDataConnection<boolean>;

    /**
     * Output connection: true if the key (and all required modifiers) are currently held down.
     */
    public readonly isPressed: FlowGraphDataConnection<boolean>;

    /**
     * Creates a new FlowGraphIsKeyPressedBlock.
     * @param config optional configuration
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.key = this.registerDataInput("key", RichTypeString);
        this.withShift = this.registerDataInput("withShift", RichTypeBoolean);
        this.withCtrl = this.registerDataInput("withCtrl", RichTypeBoolean);
        this.withAlt = this.registerDataInput("withAlt", RichTypeBoolean);
        this.withMeta = this.registerDataInput("withMeta", RichTypeBoolean);
        this.withCommandOrCtrl = this.registerDataInput("withCommandOrCtrl", RichTypeBoolean);
        this.isPressed = this.registerDataOutput("isPressed", RichTypeBoolean);
    }

    /** @internal */
    public override _updateOutputs(context: FlowGraphContext): void {
        const keys = context.configuration.sceneEventCoordinator.pressedKeys;
        const keyCode = this.key.getValue(context);

        // Primary key must be held (unless empty, in which case only modifiers are checked)
        let pressed = keyCode ? keys.has(keyCode) : true;

        // Check required modifiers
        if (pressed && this.withShift.getValue(context)) {
            pressed = keys.has("ShiftLeft") || keys.has("ShiftRight");
        }
        if (pressed && this.withCtrl.getValue(context)) {
            pressed = keys.has("ControlLeft") || keys.has("ControlRight");
        }
        if (pressed && this.withAlt.getValue(context)) {
            pressed = keys.has("AltLeft") || keys.has("AltRight");
        }
        if (pressed && this.withMeta.getValue(context)) {
            pressed = keys.has("MetaLeft") || keys.has("MetaRight");
        }
        if (pressed && this.withCommandOrCtrl.getValue(context)) {
            pressed = keys.has("CommandOrControl");
        }

        this.isPressed.setValue(pressed, context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.IsKeyPressed;
    }
}
RegisterClass(FlowGraphBlockNames.IsKeyPressed, FlowGraphIsKeyPressedBlock);
