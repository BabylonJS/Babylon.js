import { type IObjectInfo, type IPathToObjectConverter } from "core/ObjectModel/objectModelInterfaces";
import { type IObjectAccessor } from "core/FlowGraph/typeDefinitions";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { EventReferencePrefix } from "core/FlowGraph/flowGraphEventReference";
import { DelayReferencePrefix, IsDelayActive } from "core/FlowGraph/flowGraphDelayReference";

/**
 * Sentinel target returned by the validity accessors. The KHR_interactivity
 * ref-validity pointers are not backed by a glTF object, so the accessor uses a
 * non-null sentinel to satisfy callers that expect a truthy target.
 */
const RefValidityTarget = { isKhrInteractivityRef: true };

/**
 * Path-to-object converter that resolves the KHR_interactivity ref-validity
 * pointers `pointer/get` can query (KHR_interactivity spec §4.2.3 Event
 * References and §4.2.4 Delay References):
 *
 *  - `/extensions/KHR_interactivity/events/{}` — valid when the input reference
 *    was produced by an event operation (an event reference). Stateless: any
 *    event-reference path that reaches this converter is valid; a null ref is
 *    rejected earlier by the path-template substitution.
 *  - `/extensions/KHR_interactivity/delays/{}` — valid only while the referenced
 *    delay index is in the runtime active-delay set (i.e. the delay is scheduled
 *    and has not yet fired or been cancelled). This requires the runtime
 *    {@link FlowGraphContext}, which is supplied to the accessor `get` as its
 *    payload argument by `FlowGraphJsonPointerParserBlock`.
 *
 * On success `get` returns the input reference value (matching the spec, which
 * sets the `value` output to the input reference); on failure it returns
 * `undefined`, which the `pointer/get` block surfaces as `isValid = false`.
 */
export class InteractivityRefPathToObjectConverter implements IPathToObjectConverter<IObjectAccessor> {
    /**
     * @param path the (template-substituted) JSON Pointer to resolve
     * @returns an object accessor whose `get` validates the reference
     */
    public convert(path: string): IObjectInfo<IObjectAccessor> {
        const normalized = path.endsWith("/") ? path.slice(0, -1) : path;

        if (normalized.startsWith(EventReferencePrefix)) {
            const key = normalized.substring(EventReferencePrefix.length);
            return {
                object: RefValidityTarget,
                info: {
                    type: "object",
                    isReadOnly: true,
                    // A non-empty key means a real event reference was supplied (the
                    // template substitution rejects null refs before we get here).
                    get: () => (key.length > 0 ? normalized : undefined),
                    getTarget: () => RefValidityTarget,
                },
            };
        }

        // Delay reference: the substituted segment is the integer delay index.
        const index = parseInt(normalized.substring(DelayReferencePrefix.length), 10);
        return {
            object: RefValidityTarget,
            info: {
                type: "object",
                isReadOnly: true,
                get: (_target: unknown, _index?: number, payload?: unknown) => {
                    const context = payload as FlowGraphContext | undefined;
                    if (!context || isNaN(index) || index < 0) {
                        return undefined;
                    }
                    return IsDelayActive(context, index) ? new FlowGraphInteger(index) : undefined;
                },
                getTarget: () => RefValidityTarget,
            },
        };
    }
}
