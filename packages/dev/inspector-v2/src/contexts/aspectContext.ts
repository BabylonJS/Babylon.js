// eslint-disable-next-line import/no-internal-modules
import type { Nullable, Observable } from "core/index";
import type { ObservableCollection } from "../misc/observableCollection";

import { useObservableCollection } from "../hooks/observableHooks";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "./appContext";

type Aspect = {
    identity: symbol;
    friendlyName: string;
};

type AvailableAspect = Aspect & {
    activate(): void;
};

export type AspectContext = {
    readonly activeAspect: Nullable<Aspect>;
    readonly activeAspectChanged: Observable<void>;
    readonly availableAspects: ObservableCollection<AvailableAspect>;
};

declare module "./AppContext" {
    interface AppContext {
        aspectContext?: AspectContext;
    }
}

export function useAspects() {
    const aspectContext = useContext(AppContext)?.aspectContext;
    if (!aspectContext) {
        throw new Error("AppContext or AspectContext is missing.");
    }

    const [activeAspect, setActiveAspect] = useState(aspectContext.activeAspect);
    const availableAspects = useObservableCollection(aspectContext.availableAspects);

    useEffect(() => {
        const observer = aspectContext.activeAspectChanged.add(() => {
            setActiveAspect(aspectContext.activeAspect);
        });

        return () => {
            observer.remove();
        };
    }, [aspectContext]);

    return {
        activeAspect,
        availableAspects,
    };
}
