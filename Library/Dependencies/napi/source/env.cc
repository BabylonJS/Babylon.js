#include <napi/env.h>

namespace Babylon
{
    void Env::Eval(const char* string, const char* sourceUrl)
    {
        // TODO throw error if failed? Probably should move this functionality into napi
        napi_value result;
        napi_run_script(*this, Napi::String::New(*this, string), sourceUrl, &result);
    }
}
