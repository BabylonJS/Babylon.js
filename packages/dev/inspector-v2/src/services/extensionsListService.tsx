import type { SelectTabData, SelectTabEvent } from "@fluentui/react-components";
import type { TriggerProps } from "@fluentui/react-utilities";
import type { FunctionComponent } from "react";
import type { PersonMetadata } from "../extensibility/extensionFeed";
import type { IExtension } from "../extensibility/extensionManager";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "./shellService";

import {
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel,
    AvatarGroup,
    AvatarGroupItem,
    Body1,
    Body1Strong,
    Button,
    Caption1,
    Card,
    CardFooter,
    CardHeader,
    CardPreview,
    Dialog,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    makeStyles,
    Persona,
    Popover,
    PopoverSurface,
    PopoverTrigger,
    PresenceBadge,
    Spinner,
    Tab,
    TabList,
    tokens,
    Tooltip,
} from "@fluentui/react-components";
import {
    AppsAddInRegular,
    ArrowDownloadRegular,
    BranchForkRegular,
    BugRegular,
    DeleteRegular,
    DismissRegular,
    LinkRegular,
    MailRegular,
    PeopleCommunityRegular,
} from "@fluentui/react-icons";
import { Fade } from "@fluentui/react-motion-components-preview";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { Logger } from "core/Misc/logger";

import { Link } from "shared-ui-components/fluent/primitives/link";
import { useExtensionManager } from "../contexts/extensionManagerContext";
import { ShellServiceIdentity } from "./shellService";

const useStyles = makeStyles({
    extensionButton: {},
    extensionsDialogSurface: {
        height: "auto",
        width: "70vw",
        maxWidth: "600px",
        maxHeight: "70vh",
        backgroundColor: tokens.colorNeutralBackground2,
    },
    extensionDialogBody: {
        maxWidth: "100%",
        maxHeight: "100%",
    },
    extensionDialogContent: {
        marginLeft: `calc(-1 * ${tokens.spacingHorizontalM})`,
        marginRight: `calc(-1 * ${tokens.spacingHorizontalS})`,
    },
    extensionHeader: {},
    extensionItem: {},
    extensionCardPreview: {
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalL,
    },
    extensionIntro: {
        display: "flex",
        alignItems: "center",
        columnGap: tokens.spacingHorizontalM,
    },
    extensionDescription: {
        display: "flex",
        flexDirection: "row",
        columnGap: tokens.spacingHorizontalS,
    },
    extensionButtonContainer: {
        marginLeft: "auto",
        alignSelf: "flex-start",
    },
    spinner: {
        animationDuration: "1s",
        animationName: {
            from: { opacity: 0 },
            to: { opacity: 1 },
        },
    },
    webResourceDiv: {
        display: "flex",
        flexDirection: "column",
    },
    webResourceLink: {
        display: "flex",
        flexDirection: "row",
        columnGap: tokens.spacingHorizontalS,
        alignItems: "center",
    },
    personPopoverSurfaceDiv: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalS,
    },
    accordionHeaderDiv: {
        display: "flex",
        flexDirection: "row",
        columnGap: tokens.spacingHorizontalS,
        alignItems: "center",
    },
    resourceDetailsDiv: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalS,
    },
    peopleDetailsDiv: {
        display: "flex",
        flexDirection: "row",
        columnGap: tokens.spacingHorizontalXL,
    },
    avatarGroupItem: {
        cursor: "pointer",
    },
});

function AsPersonMetadata(person: string | PersonMetadata): PersonMetadata {
    if (typeof person === "string") {
        return { name: person } satisfies PersonMetadata;
    }
    return person;
}

function usePeopleMetadata(people?: readonly (string | PersonMetadata | undefined)[]) {
    const definedPeople = useMemo(() => (people ? people.filter((person): person is string | PersonMetadata => !!person) : []), [people]);

    //const [peopleMetadataEx, setPeopleMetadataEx] = useState<(PersonMetadata & { avatarUrl?: string })[]>(definedPeople.map(AsPersonMetadata));
    const [peopleMetadataEx] = useState(definedPeople.map(AsPersonMetadata));

    // TODO: Would be nice if we could pull author/contributor profile pictures from the forum, but need to see if this is ok and whether we want to adjust CORS to allow it.
    // useEffect(() => {
    //     definedPeople.forEach(async (person, index) => {
    //         const personMetadata = AsPersonMetadata(person);
    //         if (personMetadata.forumUserName) {
    //             try {
    //                 const json = await (await fetch(`https://forum.babylonjs.com/u/${personMetadata.forumUserName}.json`)).json();
    //                 const avatarRelativeUrl = json.user?.avatar_template?.replace("{size}", "96");
    //                 if (avatarRelativeUrl) {
    //                     const avatarUrl = `https://forum.babylonjs.com${avatarRelativeUrl}`;
    //                     setPeopleMetadataEx((prev) => {
    //                         const newMetadata = [...prev];
    //                         newMetadata[index] = { ...personMetadata, avatarUrl };
    //                         return newMetadata;
    //                     });
    //                 }
    //             } catch {
    //                 // Ignore, non-fatal
    //             }
    //         }
    //     });
    // }, [definedPeople]);

    return peopleMetadataEx.filter(Boolean);
}

const WebResource: FunctionComponent<{ url: string; urlDisplay?: string; icon: JSX.Element; label: string }> = (props) => {
    const { url, urlDisplay, icon, label } = props;
    const classes = useStyles();

    return (
        <div className={classes.webResourceDiv}>
            <Tooltip content={label} relationship="label" positioning="before" withArrow>
                <div className={classes.webResourceLink}>
                    {icon}
                    <Link url={url} value={urlDisplay || url} />
                </div>
            </Tooltip>
        </div>
    );
};

const PersonDetailsPopover: FunctionComponent<TriggerProps & { person: PersonMetadata; title: string; disabled?: boolean }> = (props) => {
    const { person, title, disabled, children } = props;
    const classes = useStyles();

    if (disabled) {
        return <>{children}</>;
    }

    return (
        <Popover withArrow>
            <PopoverTrigger disableButtonEnhancement>{children}</PopoverTrigger>
            <PopoverSurface>
                <div className={classes.personPopoverSurfaceDiv}>
                    <Persona name={person.name} secondaryText={title} />
                    {person.email && <WebResource url={`mailto:${person.email}`} urlDisplay={person.email} icon={<MailRegular />} label="Email" />}
                    {person.url && <WebResource url={person.url} urlDisplay={person.url} icon={<LinkRegular />} label="Website" />}
                    {person.forumUserName && (
                        <WebResource
                            url={`https://forum.babylonjs.com/u/${person.forumUserName}`}
                            urlDisplay={person.forumUserName}
                            icon={<PeopleCommunityRegular />}
                            label="Forum"
                        />
                    )}
                </div>
            </PopoverSurface>
        </Popover>
    );
};

const ExtensionDetails: FunctionComponent<{ extension: IExtension }> = memo((props) => {
    const { extension } = props;
    const { metadata } = extension;

    const classes = useStyles();

    const [canInstall, setCanInstall] = useState(false);
    const [canUninstall, setCanUninstall] = useState(false);
    const [isStateChanging, setIsStateChanging] = useState(false);

    useEffect(() => {
        const updateState = () => {
            setCanInstall(!extension.isInstalled && !extension.isStateChanging);
            setCanUninstall(extension.isInstalled && !extension.isStateChanging);
            setIsStateChanging(extension.isStateChanging);
        };

        const stateChangedHandlerRegistration = extension.addStateChangedHandler(updateState);
        updateState();

        return stateChangedHandlerRegistration.dispose;
    }, [extension]);

    const [author] = usePeopleMetadata(useMemo(() => [metadata.author], [metadata.author]));
    const contributors = usePeopleMetadata(metadata.contributors);

    const hasResourceDetails = metadata.homepage || metadata.repository || metadata.bugs;
    const hasPeopleDetails = author || contributors.length > 0;
    const hasPreviewDetails = hasResourceDetails || hasPeopleDetails;
    const hasAuthorDetails = author?.email || author?.url || author?.forumUserName;
    const subHeader = [metadata.version ? `${metadata.version}` : null, metadata.license ? `${metadata.license}` : null].filter(Boolean).join(" | ");

    const install = useCallback(async () => {
        try {
            await extension.installAsync();
        } catch {
            // Ignore errors. Other parts of the infrastructure handle them and communicate them to the user.
        }
    }, [extension]);

    const uninstall = useCallback(async () => {
        try {
            await extension.uninstallAsync();
        } catch {
            // Ignore errors. Other parts of the infrastructure handle them and communicate them to the user.
        }
    }, [extension]);

    return (
        <AccordionItem className={classes.extensionItem} value={extension.metadata.name}>
            <AccordionHeader className={classes.extensionHeader} expandIconPosition="end">
                <div className={classes.accordionHeaderDiv}>
                    <Body1Strong>{extension.metadata.name}</Body1Strong>
                    <Fade visible={extension.isInstalled}>
                        <PresenceBadge size="small" />
                    </Fade>
                </div>
            </AccordionHeader>
            <AccordionPanel>
                <Card>
                    <CardHeader header={<Body1>{metadata.description}</Body1>} description={<Caption1 italic>{subHeader}</Caption1>} />
                    {hasPreviewDetails && (
                        <CardPreview className={classes.extensionCardPreview}>
                            {hasResourceDetails && (
                                <div className={classes.resourceDetailsDiv} style={{ display: "flex" }}>
                                    {metadata.homepage && <WebResource url={metadata.homepage} icon={<LinkRegular />} label="Website" />}
                                    {metadata.repository && <WebResource url={metadata.repository} icon={<BranchForkRegular />} label="Repository" />}
                                    {metadata.bugs && <WebResource url={metadata.bugs} icon={<BugRegular />} label="Report Issues" />}
                                </div>
                            )}
                            {hasPeopleDetails && (
                                <div className={classes.peopleDetailsDiv} style={{ display: "flex" }}>
                                    {author && (
                                        <PersonDetailsPopover person={author} title="Author" disabled={!hasAuthorDetails}>
                                            <Persona name={author.name} secondaryText="Author" style={{ cursor: hasAuthorDetails ? "pointer" : "default" }} />
                                        </PersonDetailsPopover>
                                    )}
                                    {contributors.length > 0 && (
                                        <AvatarGroup layout="stack">
                                            {contributors.map((contributor) => {
                                                return (
                                                    <PersonDetailsPopover key={contributor.name} person={contributor} title="Contributor">
                                                        <AvatarGroupItem name={contributor.name} className={classes.avatarGroupItem} />
                                                    </PersonDetailsPopover>
                                                );
                                            })}
                                        </AvatarGroup>
                                    )}
                                </div>
                            )}
                        </CardPreview>
                    )}
                    <CardFooter>
                        {canInstall && (
                            <Button appearance="primary" size="small" icon={<ArrowDownloadRegular />} onClick={install}>
                                Get
                            </Button>
                        )}
                        {canUninstall && (
                            <Button appearance="secondary" size="small" icon={<DeleteRegular />} onClick={uninstall}>
                                Remove
                            </Button>
                        )}
                        {isStateChanging && <Spinner className={classes.spinner} size="extra-small" />}
                    </CardFooter>
                </Card>
            </AccordionPanel>
        </AccordionItem>
    );
});

type TabValue = "available" | "installed";

export const ExtensionListServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "ExtensionList",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addToolbarItem({
            key: "ExtensionList",
            horizontalLocation: "right",
            verticalLocation: "top",
            teachingMoment: {
                title: "Extensions",
                description: "Extensions provide new optional features that can be useful to your specific task or workflow. Click this button to manage extensions.",
            },
            order: -200,
            component: () => {
                const classes = useStyles();

                const [selectedTab, setSelectedTab] = useState<TabValue>("available");
                const extensionManager = useExtensionManager();
                const [extensions, setExtensions] = useState<IExtension[]>([]);

                useEffect(() => {
                    if (extensionManager) {
                        const populateExtensionsAsync = async () => {
                            const query = await extensionManager.queryExtensionsAsync(undefined, undefined, selectedTab === "installed");
                            const extensions = await query.getExtensionsAsync(0, query.totalCount);
                            setExtensions(extensions);
                        };

                        // eslint-disable-next-line github/no-then
                        populateExtensionsAsync().catch((error) => {
                            Logger.Warn(`Failed to populate extensions: ${error}`);
                        });
                    }
                }, [extensionManager, selectedTab]);

                return (
                    <Dialog>
                        <DialogTrigger disableButtonEnhancement>
                            <Tooltip content="Manage Extensions" relationship="label">
                                <Button className={classes.extensionButton} appearance="subtle" icon={<AppsAddInRegular />} />
                            </Tooltip>
                        </DialogTrigger>
                        <DialogSurface className={classes.extensionsDialogSurface}>
                            <DialogBody className={classes.extensionDialogBody}>
                                <DialogTitle
                                    action={
                                        <DialogTrigger action="close">
                                            <Button appearance="subtle" aria-label="close" icon={<DismissRegular />} />
                                        </DialogTrigger>
                                    }
                                >
                                    <>
                                        Extensions
                                        <TabList
                                            className={classes.extensionDialogContent}
                                            selectedValue={selectedTab}
                                            onTabSelect={(event: SelectTabEvent, data: SelectTabData) => {
                                                setSelectedTab(data.value as TabValue);
                                            }}
                                        >
                                            <Tab value={"available" satisfies TabValue}>Available</Tab>
                                            <Tab value={"installed" satisfies TabValue}>Installed</Tab>
                                        </TabList>
                                    </>
                                </DialogTitle>
                                <DialogContent className={classes.extensionDialogContent}>
                                    <Accordion collapsible>
                                        {extensions.map((extension) => (
                                            <ExtensionDetails key={extension.metadata.name} extension={extension} />
                                        ))}
                                    </Accordion>
                                </DialogContent>
                            </DialogBody>
                        </DialogSurface>
                    </Dialog>
                );
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
