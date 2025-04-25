import type { ServiceDefinition } from "../modularity/serviceDefinition";

import { Dropdown, makeStyles, Option } from "@fluentui/react-components";
import { useEffect, useMemo, useRef } from "react";
import { TeachingMoment } from "../components/teachingMoment";
import { useAspects } from "../contexts/aspectContext";
import { MakePopoverTeachingMoment } from "../hooks/teachingMomentHooks";
import { ShellService } from "../services/shellService";

const useStyles = makeStyles({
    dropdown: {
        minWidth: "15em",
    },
    option: {
        minWidth: 0,
    },
});

const useTeachingMoment = MakePopoverTeachingMoment("Aspects");

export const aspectSelectorServiceDefinition: ServiceDefinition<[], [ShellService]> = {
    friendlyName: "AspectSelector",
    consumes: [ShellService],
    factory: (shellService) => {
        const registration = shellService.addToTopBar({
            key: "AspectSelector",
            alignment: "right",
            suppressTeachingMoment: true,
            order: -100,
            component: () => {
                const classes = useStyles();

                const teachingMoment = useTeachingMoment();

                const { activeAspect, availableAspects } = useAspects();
                const previousAspects = useRef(availableAspects);
                const newAspects = useMemo(() => {
                    const newAspects = availableAspects.filter((aspect) => !previousAspects.current.includes(aspect));
                    previousAspects.current = availableAspects;
                    return newAspects;
                }, [availableAspects]);

                useEffect(() => {
                    if (newAspects.length > 0) {
                        teachingMoment.reset();
                    }
                }, [newAspects, teachingMoment.reset]);

                return (
                    <>
                        {availableAspects.length > 1 && (
                            <>
                                <TeachingMoment
                                    {...teachingMoment}
                                    title="Tools"
                                    description={`A new top level tool has been added. You can activate "${newAspects[0]?.friendlyName}" here.`}
                                />
                                <Dropdown
                                    ref={teachingMoment.targetRef}
                                    className={classes.dropdown}
                                    appearance="underline"
                                    listbox={{ className: classes.option }}
                                    value={activeAspect?.friendlyName ?? undefined}
                                    selectedOptions={activeAspect ? [activeAspect.identity.toString()] : undefined}
                                    onOptionSelect={(event, data) => {
                                        const selectedAspect = availableAspects.find((aspect) => aspect.identity.toString() === data.optionValue);
                                        selectedAspect?.activate();
                                    }}
                                >
                                    {availableAspects.map((aspect) => (
                                        <Option key={aspect.identity.toString()} text={aspect.friendlyName} value={aspect.identity.toString()}>
                                            {aspect.friendlyName}
                                        </Option>
                                    ))}
                                </Dropdown>
                            </>
                        )}
                    </>
                );
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};
