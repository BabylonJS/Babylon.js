#include <napi/env.h>
#include <napi/js_native_api_types.h>
#include "js_native_api_v8.h"
#include "libplatform/libplatform.h"

namespace Napi
{
    template<>
    Env Attach<v8::Local<v8::Context>>(v8::Local<v8::Context> isolate)
    {
        return{ new napi_env__(isolate) };
    }

    void Detach(Env env)
    {
        delete env.operator napi_env();
    }
}
