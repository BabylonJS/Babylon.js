import { type Context } from "react";

import { type IDisposable } from "core/index";
import { type IService } from "../modularity/serviceDefinition";

/**
 * The unique identity symbol for the react context service.
 */
export const ReactContextServiceIdentity = Symbol("ReactContextService");

export type ReactContextHandle<T> = IDisposable & {
    updateValue: (newValue: T) => void;
};

/**
 * ReactContextService allows global React contexts to be added/removed/updated.
 */
export interface IReactContextService extends IService<typeof ReactContextServiceIdentity> {
    addContext<T>(provider: Context<T>["Provider"], initialValue: T, options?: { order?: number }): ReactContextHandle<T>;
}
