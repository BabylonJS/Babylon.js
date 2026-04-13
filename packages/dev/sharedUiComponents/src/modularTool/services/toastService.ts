import { type IService } from "../modularity/serviceDefinition";
import { type ToastOptions } from "shared-ui-components/fluent/primitives/toast";

/**
 * The unique identity symbol for the toast service.
 */
export const ToastServiceIdentity = Symbol("ToastService");

/**
 * Provides the ability to show toast notifications from non-React code (e.g. Observable callbacks).
 */
export interface IToastService extends IService<typeof ToastServiceIdentity> {
    /**
     * Shows a toast notification with the given message.
     * @param message The message to display.
     * @param options Optional toast configuration such as intent.
     */
    showToast(message: string, options?: ToastOptions): void;
}
