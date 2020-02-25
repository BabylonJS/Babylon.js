#include <napi/env.h>
#include <napi/js_native_api_types.h>
#include "JavaScriptCore/JavaScriptCore.h"
#include "js_native_api_JavaScriptCore.h"

namespace Napi
{
    template<>
    Napi::Env Attach<JSGlobalContextRef>(JSGlobalContextRef globalContext)
    {
        auto envPtr = new napi_env__();
        envPtr->m_globalContext = globalContext;
        return{ envPtr };
    }

    void Detach(Napi::Env env)
    {
        delete env.operator napi_env();
    }
}
