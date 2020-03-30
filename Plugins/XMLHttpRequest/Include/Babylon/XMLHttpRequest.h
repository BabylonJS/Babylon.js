#pragma once

#include <napi/env.h>

#include <string>

namespace Babylon
{
    void InitializeXMLHttpRequest(Napi::Env env, std::string rootUrl);
}
