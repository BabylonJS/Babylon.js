import { type IService } from "../modularity/serviceDefinition";

import { type ToastIntent } from "@fluentui/react-components";

export type DialogOptions = {
    type: "alert";
    intent?: ToastIntent;
    title: string;
    content?: JSX.Element;
};

/**
 * The unique identity symbol for the dialog service.
 */
export const DialogServiceIdentity = Symbol("DialogService");

/**
 * Provides the ability to show dialog from non-React code (e.g. Observable callbacks).
 */
export interface IDialogService extends IService<typeof DialogServiceIdentity> {
    /**
     * Shows a dialog with the given content.
     * @param options The dialog options to display.
     */
    showDialog(options: DialogOptions): void;
}
