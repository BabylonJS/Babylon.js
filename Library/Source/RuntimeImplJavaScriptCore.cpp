#include "RuntimeImpl.h"

#include <JavaScriptCore/JavaScriptCore.h>

#include <napi/env.h>

namespace Babylon
{
    void RuntimeImpl::BaseThreadProcedure()
    {
        auto contextGroup = JSContextGroupCreate();
        auto globalContext = JSGlobalContextCreateInGroup(contextGroup, nullptr);

        Napi::Env env = Napi::Attach(globalContext);
        RunJavaScript(env);
        Napi::Detach(env);

        JSGlobalContextRelease(globalContext);
        JSContextGroupRelease(contextGroup);
    }
}