import { Dialog as FluentDialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, DialogTrigger } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import { type ReactNode, type FC } from "react";
import { Button } from "./button";

/**
 * Props for an action button in the dialog footer.
 */
export type DialogActionProps = {
    /** Button label text. */
    label: string;
    /** Click handler. */
    onClick: () => void;
    /** Button appearance. Defaults to "secondary". */
    appearance?: "primary" | "secondary";
};

/**
 * Props for the shared Dialog primitive.
 */
export type DialogProps = {
    /** Whether the dialog is open. */
    open: boolean;
    /** Dialog title. */
    title: string;
    /** Dialog content (body). */
    children: ReactNode;
    /** Action buttons rendered in the footer. */
    actions?: DialogActionProps[];
    /** Called when the dialog is dismissed via the close button. */
    onDismiss?: () => void;
};

/**
 * A shared dialog component wrapping Fluent UI Dialog with Babylon conventions.
 *
 * @example
 * ```tsx
 * <Dialog
 *     open={isOpen}
 *     title="Confirm Action"
 *     onDismiss={() => setIsOpen(false)}
 *     actions={[
 *         { label: "Cancel", onClick: () => setIsOpen(false) },
 *         { label: "Confirm", onClick: handleConfirm, appearance: "primary" },
 *     ]}
 * >
 *     <Text>Are you sure you want to proceed?</Text>
 * </Dialog>
 * ```
 *
 * @param props - The dialog props.
 * @returns The dialog element.
 */
export const Dialog: FC<DialogProps> = (props) => {
    const { open, title, children, actions, onDismiss } = props;

    return (
        <FluentDialog
            open={open}
            modalType="modal"
            onOpenChange={(_, data) => {
                if (!data.open && onDismiss) {
                    onDismiss();
                }
            }}
        >
            <DialogSurface>
                <DialogBody>
                    <DialogTitle
                        action={
                            onDismiss ? (
                                <DialogTrigger action="close">
                                    <Button appearance="subtle" aria-label="close" icon={DismissRegular} />
                                </DialogTrigger>
                            ) : undefined
                        }
                    >
                        {title}
                    </DialogTitle>
                    <DialogContent>{children}</DialogContent>
                    {actions && actions.length > 0 && (
                        <DialogActions>
                            {actions.map((action, index) => (
                                <Button key={index} appearance={action.appearance ?? "secondary"} onClick={action.onClick} label={action.label} />
                            ))}
                        </DialogActions>
                    )}
                </DialogBody>
            </DialogSurface>
        </FluentDialog>
    );
};
