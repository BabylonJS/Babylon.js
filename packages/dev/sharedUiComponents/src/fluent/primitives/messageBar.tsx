import { MessageBar as FluentMessageBar, MessageBarTitle, MessageBarBody, makeStyles, tokens } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import { Link } from "./link";
import { AccordionSectionItem } from "./accordion";

const useClasses = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS, // 8px
    },
});

type MessageBarProps = {
    message: string;
    title?: string;
    docLink?: string;
    intent: "info" | "success" | "warning" | "error";
    staticItem?: boolean;
};

export const MessageBar: FunctionComponent<MessageBarProps> = (props) => {
    MessageBar.displayName = "MessageBar";
    const { message, title, intent, docLink, staticItem } = props;
    const classes = useClasses();

    return (
        <AccordionSectionItem uniqueId={title ?? message} staticItem={staticItem ?? true}>
            <div className={classes.container}>
                <FluentMessageBar intent={intent} layout="multiline">
                    <MessageBarBody>
                        {title && <MessageBarTitle>{title}</MessageBarTitle>}
                        {message}
                        {docLink && (
                            <>
                                {" - "}
                                <Link url={docLink} value="Learn More" />
                            </>
                        )}
                    </MessageBarBody>
                </FluentMessageBar>
            </div>
        </AccordionSectionItem>
    );
};
