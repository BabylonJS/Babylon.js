#include <napi/env.h>

namespace Napi
{
    Napi::Value Eval(Napi::Env env, const char* string, const char* sourceUrl)
    {
        napi_value result;
        NAPI_THROW_IF_FAILED(env, napi_run_script(env, Napi::String::New(env, string), sourceUrl, &result));
        return{ env, result };
    }
}
