#include <napi/env.h>
#include <napi/js_native_api_types.h>
#include "JavaScriptCore/JavaScript.h"
#include "js_native_api_JavaScriptCore.h"

namespace Napi
{
    template<>
    Napi::Env Attach<JSContextRef>(JSContextRef context)
    {
        napi_env env_ptr{new napi_env__};
        env_ptr->context = context;
        env_ptr->last_exception = nullptr;
        env_ptr->last_error = { nullptr, nullptr, 0, napi_ok };
        return {env_ptr};
    }

    void Detach(Napi::Env env)
    {
        napi_env env_ptr{env};
        delete env_ptr;
    }

    template<> JSContextRef GetContext(Napi::Env env)
    {
        napi_env env_ptr{env};
        return env_ptr->context;
    }
}
