#include "AppRuntime.h"

#include <JavaScriptCore/JavaScript.h>

namespace Babylon
{
    void AppRuntime::RunEnvironmentTier(const char*)
    {
        auto globalContext = JSGlobalContextCreateInGroup(nullptr, nullptr);
        Napi::Env env = Napi::Attach(globalContext);
        Run(env);
        JSGlobalContextRelease(globalContext);
        Napi::Detach(env);
    }
}
