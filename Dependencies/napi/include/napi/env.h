#pragma once

#include "napi.h"

typedef const struct OpaqueJSContext* JSContextRef;
typedef struct OpaqueJSContext* JSGlobalContextRef;


namespace Napi
{
    template<typename ...Ts> Napi::Env Attach(Ts... args);

    void Detach(Napi::Env);

    Napi::Value Eval(Napi::Env env, const char* source, const char* sourceUrl);

#ifdef __APPLE__
    JSGlobalContextRef GetJavaScriptCoreGlobalContext(Napi::Env env);
#endif
}
