import type { ComponentType, PropsWithChildren, Ref } from "react";

import type { AccordionProps, AccordionSectionProps } from "shared-ui-components/fluent/primitives/accordion";

import { makeStyles } from "@fluentui/react-components";
import { Children, isValidElement, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { UXContextProvider } from "../components/uxContextProvider";

function AsReadonlyArray<T>(array: T[]): readonly T[] {
    return array;
}

export type DynamicAccordionSection = Readonly<{
    /**
     * A unique identity for the section, which can be referenced by section content.
     */
    identity: string;

    /**
     * An optional order for the section, relative to other sections.
     * Defaults to 0.
     */
    order?: number;

    /**
     * An optional flag indicating whether the section should be collapsed by default.
     * Defaults to false.
     */
    collapseByDefault?: boolean;
}>;

export type DynamicAccordionSectionContent<ContextT> = Readonly<{
    /**
     * A unique key for the the content.
     */
    key: string;

    /**
     * The section this content belongs to.
     */
    section: string;

    /**
     * An optional order for the content within the section.
     * Defaults to 0.
     */
    order?: number;

    /**
     * The React component that will be rendered for this content.
     */
    component: ComponentType<{ context: ContextT }>;
}>;

const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
});

export type SectionsImperativeRef = {
    highlightSections: (sections: readonly string[]) => void;
};

export function ExtensibleAccordion<ContextT = unknown>(
    props: PropsWithChildren<
        {
            sections: readonly DynamicAccordionSection[];
            sectionContent: readonly DynamicAccordionSectionContent<ContextT>[];
            context: ContextT;
            sectionsRef?: Ref<SectionsImperativeRef>;
        } & AccordionProps
    >
) {
    const classes = useStyles();

    const { children, sections, sectionContent, context, sectionsRef, ...rest } = props;

    const defaultSections = useMemo(() => {
        const defaultSections: DynamicAccordionSection[] = [];
        if (children) {
            Children.forEach(children, (child) => {
                if (isValidElement(child)) {
                    const childProps = child.props as AccordionSectionProps;
                    defaultSections.push({
                        identity: childProps.title,
                        collapseByDefault: childProps.collapseByDefault,
                    });
                }
            });
        }
        return AsReadonlyArray(defaultSections);
    }, [children]);

    // Cache stable component wrappers for static (children-based) sections so that
    // React does not unmount/remount them on every re-render. The components read
    // the latest child element from `elements` so they always render fresh content.
    const staticComponentCacheRef = useRef<{
        elements: Map<string, React.ReactNode>;
        components: Map<string, ComponentType<{ context: ContextT }>>;
    }>({ elements: new Map(), components: new Map() });

    const defaultSectionContent = useMemo(() => {
        const cache = staticComponentCacheRef.current;
        cache.elements.clear();
        const defaultSectionContent: DynamicAccordionSectionContent<ContextT>[] = [];
        if (children) {
            Children.forEach(children, (child, index) => {
                if (isValidElement(child)) {
                    const childProps = child.props as AccordionSectionProps;
                    const key = child.key ?? childProps.title;

                    // Update the element so the stable component renders the latest content.
                    cache.elements.set(key, child);

                    // Create a stable component wrapper only once per key.
                    if (!cache.components.has(key)) {
                        const capturedKey = key;
                        cache.components.set(capturedKey, () => <>{cache.elements.get(capturedKey)}</>);
                    }

                    defaultSectionContent.push({
                        key,
                        section: defaultSections[index].identity,
                        component: cache.components.get(key)!,
                    });
                }
            });
        }
        return AsReadonlyArray(defaultSectionContent);
    }, [children, defaultSections]);

    const mergedSectionContent = useMemo(() => {
        return AsReadonlyArray(
            [...defaultSectionContent, ...sectionContent].map((content, index) => {
                return {
                    ...content,
                    key: `${content.key}-${index}`,
                    order: content.order ?? index,
                } as const;
            })
        );
    }, [defaultSectionContent, sectionContent]);

    const mergedSections = useMemo(() => {
        const mergedSections = [...defaultSections.map((s) => ({ ...s, isDefault: true as const })), ...sections.map((s) => ({ ...s, isDefault: false as const }))];

        // Check for implicit sections (e.g. sections that were not explicitly defined, but referenced by content).
        const implicitSections: DynamicAccordionSection[] = [];
        for (const sectionContent of mergedSectionContent) {
            if (!mergedSections.some((s) => s.identity === sectionContent.section) && !implicitSections.some((s) => s.identity === sectionContent.section)) {
                implicitSections.push({ identity: sectionContent.section });
            }
        }

        return AsReadonlyArray(
            [...implicitSections.map((s) => ({ ...s, isDefault: false as const })), ...mergedSections].map((section, index) => {
                return {
                    ...section,
                    order: section.order ?? index,
                    collapseByDefault: section.collapseByDefault ?? false,
                } as const;
            })
        );
    }, [defaultSections, sections, mergedSectionContent]);

    const visibleSections = useMemo(() => {
        if (!context) {
            return [];
        }

        const sortedSections = [...mergedSections].sort((a, b) => {
            // Default sections always come before non-default sections.
            if (a.isDefault !== b.isDefault) {
                return a.isDefault ? -1 : 1;
            }
            return a.order - b.order;
        });

        return sortedSections
            .map((section) => {
                // Get a flat list of the section content, preserving the key so it can be used when each component for each section is rendered.
                const contentForSection = mergedSectionContent.filter((content) => content.section === section.identity);

                // If there is no content for this section, we skip it.
                if (contentForSection.length === 0) {
                    return null; // No content for this section
                }

                // Sort the content for this section by order, defaulting to 0 if not specified.
                contentForSection.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                // Return the section with its identity, collapseByDefault flag, and the content components to render.
                return {
                    identity: section.identity,
                    collapseByDefault: section.collapseByDefault ?? false,
                    components: contentForSection.map((content) => <content.component key={content.key} context={context} />),
                };
            })
            .filter((section) => section !== null);
    }, [mergedSections, mergedSectionContent, context]);

    const [highlightSections, setHighlightSections] = useState<readonly string[]>();

    // When the context changes, clear any existing highlights.
    useLayoutEffect(() => {
        setHighlightSections(undefined);
    }, [context]);

    // This just assigns the returned object to any type of React ref, whether it is
    // a mutable ref with a 'current' property or whether it is a callback, useImperativeHandle
    // will deal with it.
    useImperativeHandle(sectionsRef, () => {
        return {
            highlightSections: (sectionsToHighlight: readonly string[]) => {
                if (sectionsToHighlight.length > 0) {
                    setHighlightSections(sectionsToHighlight);
                }
            },
        };
    }, []);

    return (
        <div className={classes.rootDiv}>
            {visibleSections.length > -1 && (
                <UXContextProvider>
                    <Accordion highlightSections={highlightSections} {...rest}>
                        {...visibleSections.map((section) => {
                            return (
                                <AccordionSection key={section.identity} title={section.identity} collapseByDefault={section.collapseByDefault}>
                                    {section.components}
                                </AccordionSection>
                            );
                        })}
                    </Accordion>
                </UXContextProvider>
            )}
        </div>
    );
}
