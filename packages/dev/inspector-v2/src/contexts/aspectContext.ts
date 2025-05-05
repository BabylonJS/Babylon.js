// eslint-disable-next-line import/no-internal-modules
import type { Nullable, Observable } from "core/index";
import type { ObservableCollection } from "../misc/observableCollection";

import { createContext, useContext, useEffect, useState } from "react";
import { useObservableCollection } from "../hooks/observableHooks";

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

export const AspectContext = createContext<AspectContext | undefined>(undefined);

export function useAspects() {
    // const aspectContext = useContext(AppContext)?.aspectContext;
    const aspectContext = useContext(AspectContext);
    if (!aspectContext) {
        throw new Error("AspectContext is missing.");
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
