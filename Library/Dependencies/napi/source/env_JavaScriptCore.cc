#include <napi/env.h>
#include <napi/js_native_api_types.h>

namespace babylon
{
    Env::Env(const char* executablePath, std::function<void(std::function<void()>)> executeOnScriptThread)
        : Napi::Env{  }
    {
    }

    Env::~Env()
    {
    }
}
