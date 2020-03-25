#include "AppRuntime.h"

#include <JavaScriptCore/JavaScript.h>

namespace Babylon
{
    void AppRuntime::RunEnvironmentTier()
    {
        auto contextGroup = JSContextGroupCreate();
        auto globalContext = JSGlobalContextCreateInGroup(contextGroup, nullptr);

        Napi::Env env = Napi::Attach(globalContext);
        Run(env);
        Napi::Detach(env);

        JSGlobalContextRelease(globalContext);
        JSContextGroupRelease(contextGroup);
    }
}
