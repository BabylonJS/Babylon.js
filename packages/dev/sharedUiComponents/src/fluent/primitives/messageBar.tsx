import { MessageBar as FluentMessageBar, MessageBarTitle, MessageBarBody, makeStyles, tokens } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import { Link } from "./link";

const useClasses = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS, // 8px
    },
});

type MessageBarProps = {
    message: string;
    title: string;
    docLink?: string;
    intent: "info" | "success" | "warning" | "error";
};
export const MessageBar: FunctionComponent<MessageBarProps> = (props) => {
    const { message, title: header, intent, docLink } = props;
    const classes = useClasses();

    return (
        <div className={classes.container}>
            <FluentMessageBar intent={intent} layout="multiline">
                <MessageBarBody>
                    <MessageBarTitle>{header}</MessageBarTitle>
                    {message}
                    {docLink && (
                        <>
                            {" - "}
                            <Link href={docLink} target="_blank" rel="noopener noreferrer">
                                Learn More
                            </Link>
                        </>
                    )}
                </MessageBarBody>
            </FluentMessageBar>
        </div>
    );
};
