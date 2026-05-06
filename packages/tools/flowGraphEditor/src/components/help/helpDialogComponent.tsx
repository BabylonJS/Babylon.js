import { type FunctionComponent, useEffect, useMemo, useRef } from "react";

import { Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, Subtitle2, makeStyles, tokens } from "@fluentui/react-components";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";

import { type HelpTopicId, HelpTopics } from "./helpContent";

interface IHelpDialogProps {
    /** When set, the dialog opens and scrolls to this topic. Null/undefined = closed. */
    initialTopicId?: HelpTopicId;
    /** Called when the user closes the dialog. */
    onClose: () => void;
}

const useStyles = makeStyles({
    surface: {
        width: "640px",
        maxWidth: "90%",
        // Constrain the surface to 80vh so it doesn't fill the screen on tall content.
        maxHeight: "80vh",
        // Fluent's DialogBody has its own baseline `max-height: calc(100dvh - 2*24px)` which
        // mirrors the surface's default `max-height: 100dvh` minus the surface's 24px top/bottom
        // padding. When we shrink the surface to 80vh, the body's baseline is *larger* than the
        // surface's inner content area, so it overflows. Mirror Fluent's pattern with our
        // shrunk surface so the body fits exactly inside the surface's padding box.
        "& .fui-DialogBody": {
            maxHeight: "calc(80vh - 2 * 24px)",
            minHeight: 0,
        },
    },
    body: {
        overflowY: "auto",
        minHeight: 0,
    },
    topicContent: {
        padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM}`,
        color: tokens.colorNeutralForeground2,
        lineHeight: tokens.lineHeightBase300,
        // Style the developer-authored HTML rendered via dangerouslySetInnerHTML.
        "& h4": {
            margin: `${tokens.spacingVerticalM} 0 ${tokens.spacingVerticalXS}`,
            fontWeight: tokens.fontWeightSemibold,
            color: tokens.colorNeutralForeground1,
        },
        "& h4:first-child": {
            marginTop: 0,
        },
        "& p": {
            margin: `${tokens.spacingVerticalXS} 0`,
        },
        "& ul, & ol": {
            margin: `${tokens.spacingVerticalXS} 0`,
            paddingLeft: tokens.spacingHorizontalXXL,
        },
        "& li": {
            margin: `${tokens.spacingVerticalXXS} 0`,
        },
        "& code": {
            background: tokens.colorNeutralBackground3,
            padding: `1px ${tokens.spacingHorizontalXS}`,
            borderRadius: tokens.borderRadiusSmall,
            fontFamily: tokens.fontFamilyMonospace,
            fontSize: tokens.fontSizeBase200,
            color: tokens.colorPaletteDarkOrangeForeground1,
        },
        "& table": {
            width: "100%",
            borderCollapse: "collapse",
            margin: `${tokens.spacingVerticalS} 0`,
        },
        "& th": {
            textAlign: "left",
            padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
            background: tokens.colorNeutralBackground3,
            color: tokens.colorNeutralForeground1,
            borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
            fontWeight: tokens.fontWeightSemibold,
        },
        "& td": {
            padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
            borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
            color: tokens.colorNeutralForeground2,
        },
        "& tr:last-child td": {
            borderBottom: "none",
        },
    },
});

/**
 * Modal help dialog with collapsible topic sections, using Fluent UI primitives.
 * @returns The rendered help dialog.
 */
export const HelpDialogComponent: FunctionComponent<IHelpDialogProps> = ({ initialTopicId, onClose }) => {
    const classes = useStyles();

    // Memoise the highlight set so the Accordion only opens the requested topic when it
    // changes. Other topics start collapsed.
    const highlightSections = useMemo(() => (initialTopicId ? [initialTopicId] : []), [initialTopicId]);

    // Track topic refs so we can scroll into view when an initial topic is requested.
    const topicRefs = useRef(new Map<HelpTopicId, HTMLDivElement | null>());

    useEffect(() => {
        if (!initialTopicId) {
            return;
        }
        // Defer to next frame so the Accordion has expanded the requested section.
        const handle = requestAnimationFrame(() => {
            const node = topicRefs.current.get(initialTopicId);
            node?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return () => cancelAnimationFrame(handle);
    }, [initialTopicId]);

    return (
        <Dialog open onOpenChange={(_, data) => !data.open && onClose()}>
            <DialogSurface className={classes.surface}>
                <DialogBody>
                    <DialogTitle>Flow Graph Editor — Help</DialogTitle>
                    <DialogContent className={classes.body}>
                        <Accordion uniqueId="FlowGraphEditorHelp" highlightSections={highlightSections}>
                            {HelpTopics.map((topic) => (
                                <AccordionSection key={topic.id} title={topic.title} collapseByDefault={topic.id !== initialTopicId}>
                                    <div ref={(el) => topicRefs.current.set(topic.id, el)} className={classes.topicContent}>
                                        {topic.sections.map((section, idx) => (
                                            <div key={idx}>
                                                {section.heading && <Subtitle2 block>{section.heading}</Subtitle2>}
                                                {/* Content is developer-authored from helpContent.ts — safe to render as HTML.
                                                    If this ever accepts user/external content, sanitize with DOMPurify first. */}
                                                {/* eslint-disable-next-line @typescript-eslint/naming-convention */}
                                                <div dangerouslySetInnerHTML={{ __html: section.html }} />
                                            </div>
                                        ))}
                                    </div>
                                </AccordionSection>
                            ))}
                        </Accordion>
                    </DialogContent>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};
