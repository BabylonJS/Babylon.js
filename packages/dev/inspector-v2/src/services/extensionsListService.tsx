import type { SelectTabData, SelectTabEvent } from "@fluentui/react-components";
import type { FunctionComponent } from "react";
import type { IExtension } from "../extensibility/extensionManager";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IShellService } from "./shellService";

import {
    Accordion,
    AccordionHeader,
    AccordionItem,
    AccordionPanel,
    Button,
    Dialog,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger,
    Divider,
    makeStyles,
    shorthands,
    Spinner,
    Tab,
    TabList,
    Text,
    tokens,
    Tooltip,
} from "@fluentui/react-components";
import { AppsAddInRegular, DismissRegular } from "@fluentui/react-icons";
import { memo, useCallback, useEffect, useState } from "react";
import { TeachingMoment } from "../components/teachingMoment";
import { useExtensionManager } from "../contexts/extensionManagerContext";
import { MakePopoverTeachingMoment } from "../hooks/teachingMomentHooks";
import { ShellServiceIdentity } from "./shellService";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    extensionButton: {},
    extensionsDialogSurface: {
        height: "auto",
        width: "70vw",
        maxWidth: "600px",
        maxHeight: "70vh",
    },
    extensionDialogBody: {
        maxWidth: "100%",
        maxHeight: "100%",
    },
    extensionDialogContent: {
        marginLeft: `calc(-1 * ${tokens.spacingHorizontalM})`,
        marginRight: `calc(-1 * ${tokens.spacingHorizontalS})`,
    },
    extensionHeader: {
        // ...shorthands.borderStyle("solid"),
        // ...shorthands.borderWidth(tokens.strokeWidthThick, 0),
        // ...shorthands.borderColor(tokens.colorNeutralStroke1),
    },
    extensionItem: {
        // ...shorthands.borderStyle("solid"),
        // ...shorthands.borderWidth(tokens.strokeWidthThin),
        // ...shorthands.borderColor(tokens.colorNeutralStroke1),
        // ...shorthands.borderRadius(tokens.borderRadiusLarge),
        // //...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
        // backgroundColor: tokens.colorNeutralBackground2,
    },
    extensionPanel: {
        // ...shorthands.borderStyle("solid"),
        // ...shorthands.borderWidth(0, 0, tokens.strokeWidthThin, 0),
        // ...shorthands.borderColor(tokens.colorNeutralStroke1),
        ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
        backgroundColor: tokens.colorNeutralBackground2,
    },
    extensionIntro: {
        display: "flex",
        alignItems: "center",
        columnGap: tokens.spacingHorizontalM,
    },
    extensionDescription: {
        ...shorthands.padding(tokens.spacingVerticalM, 0),
    },
    extensionButtonContainer: {
        display: "flex",
        columnGap: tokens.spacingHorizontalS,
    },
    spinner: {
        animationDuration: "1s",
        animationName: {
            from: { opacity: 0 },
            to: { opacity: 1 },
        },
    },
});

// eslint-disable-next-line @typescript-eslint/naming-convention
const useTeachingMoment = MakePopoverTeachingMoment("Extensions");

const ExtensionDetails: FunctionComponent<{ extension: IExtension }> = memo((props) => {
    const classes = useStyles();

    const [canInstall, setCanInstall] = useState(false);
    const [canUninstall, setCanUninstall] = useState(false);
    const [canEnable, setCanEnable] = useState(false);
    const [canDisable, setCanDisable] = useState(false);
    const [isStateChanging, setIsStateChanging] = useState(false);

    useEffect(() => {
        const extension = props.extension;
        const updateState = () => {
            setCanInstall(!extension.isInstalled && !extension.isStateChanging);
            setCanUninstall(extension.isInstalled && !extension.isStateChanging);
            setCanEnable(extension.isInstalled && !extension.isEnabled && !extension.isStateChanging);
            setCanDisable(extension.isEnabled && !extension.isStateChanging);
            setIsStateChanging(extension.isStateChanging);
        };

        const stateChangedHandlerRegistration = extension.addStateChangedHandler(updateState);
        updateState();

        return stateChangedHandlerRegistration.dispose;
    }, [props.extension]);

    const install = useCallback(() => props.extension.installAsync(), [props.extension]);
    const uninstall = useCallback(() => props.extension.uninstallAsync(), [props.extension]);
    const enable = useCallback(() => props.extension.enableAsync(), [props.extension]);
    const disable = useCallback(() => props.extension.disableAsync(), [props.extension]);

    return (
        <>
            <div className={classes.extensionIntro}>
                <Text>{props.extension.metadata.author}</Text>
                <Divider vertical style={{ flexGrow: 0 }} />
                <Text>v{props.extension.metadata.version}</Text>
                <Divider vertical style={{ flexGrow: 0 }} />
                <Text>{props.extension.metadata.license}</Text>
            </div>

            <div className={classes.extensionDescription}>
                <Text>{props.extension.metadata.description}</Text>
            </div>

            <div className={classes.extensionButtonContainer}>
                {canInstall && (
                    <Button appearance="primary" size="small" onClick={install}>
                        Install
                    </Button>
                )}
                {canUninstall && (
                    <Button appearance="primary" size="small" onClick={uninstall}>
                        Uninstall
                    </Button>
                )}
                {canEnable && (
                    <Button appearance="primary" size="small" onClick={enable}>
                        Enable
                    </Button>
                )}
                {canDisable && (
                    <Button appearance="primary" size="small" onClick={disable}>
                        Disable
                    </Button>
                )}
                {isStateChanging && <Spinner className={classes.spinner} size="extra-small" />}
            </div>
        </>
    );
});

type TabValue = "available" | "installed";

export const ExtensionListServiceDefinition: ServiceDefinition<[], [IShellService]> = {
    friendlyName: "ExtensionList",
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addToTopBar({
            key: "ExtensionList",
            alignment: "right",
            suppressTeachingMoment: true,
            order: -200,
            component: () => {
                const classes = useStyles();

                const [selectedTab, setSelectedTab] = useState<TabValue>("available");
                const extensionManager = useExtensionManager();
                const [extensions, setExtensions] = useState<IExtension[]>([]);

                useEffect(() => {
                    const populateExtensionsAsync = async () => {
                        // TODO: Use https://www.npmjs.com/package/react-window to virtualize the extension list
                        // https://codesandbox.io/p/sandbox/x70ly749rq?file=%2Fsrc%2FExampleWrapper.js
                        const query = await extensionManager.queryExtensionsAsync(undefined, undefined, selectedTab === "installed");
                        const extensions = await query.getExtensionsAsync(0, query.totalCount);
                        setExtensions(extensions);
                    };

                    // TODO: handle errors
                    populateExtensionsAsync();
                }, [selectedTab]);

                const teachingMoment = useTeachingMoment();

                return (
                    <>
                        <TeachingMoment
                            {...teachingMoment}
                            title="Extensions"
                            description="Extensions provide new optional features that can be useful to your specific task or workflow. Click this button to manage extensions."
                        />
                        <Dialog>
                            <DialogTrigger disableButtonEnhancement>
                                <Tooltip content="Manage Extensions" relationship="label">
                                    <Button ref={teachingMoment.targetRef} className={classes.extensionButton} appearance="subtle" icon={<AppsAddInRegular />} />
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
                                        {/* <ProgressBar /> */}
                                        <Accordion collapsible>
                                            {extensions.map((extension) => (
                                                <AccordionItem className={classes.extensionItem} key={extension.metadata.name} value={extension.metadata.name}>
                                                    <AccordionHeader className={classes.extensionHeader} expandIconPosition="end">
                                                        <Text>{extension.metadata.name}</Text>
                                                    </AccordionHeader>
                                                    <AccordionPanel className={classes.extensionPanel}>
                                                        <ExtensionDetails extension={extension} />
                                                    </AccordionPanel>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </DialogContent>
                                </DialogBody>
                            </DialogSurface>
                        </Dialog>
                    </>
                );
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
