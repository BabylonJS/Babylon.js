#include <napi/env.h>
#include "js_native_api_chakra.h"
#include <jsrt.h>
#include <strsafe.h>

namespace
{
    void ThrowIfFailed(JsErrorCode errorCode)
    {
        if (errorCode != JsErrorCode::JsNoError)
        {
            throw std::exception();
        }
    }
}

namespace Napi
{
    template<>
    Napi::Env Attach<>()
    {
        Napi:Env env{new napi_env__({})};

        JsValueRef global;
        ThrowIfFailed(JsGetGlobalObject(&global));
        JsPropertyIdRef propertyId;
        ThrowIfFailed(JsGetPropertyIdFromName(L"Object", &propertyId));
        JsValueRef object;
        ThrowIfFailed(JsGetProperty(global, propertyId, &object));
        JsValueRef prototype;
        ThrowIfFailed(JsGetPrototype(object, &prototype));
        ThrowIfFailed(JsGetPropertyIdFromName(L"hasOwnProperty", &propertyId));
        ThrowIfFailed(JsGetProperty(prototype, propertyId, &static_cast<napi_env>(env)->has_own_property_function));

        return env;
    }

    void Detach(Napi::Env env)
    {
        delete env.operator napi_env();
    }
}
