#pragma once

#include <Babylon/JsRuntime.h>

#include <string>

namespace Babylon
{
    void InitializeXMLHttpRequest(JsRuntime& runtime, std::string rootUrl);
}
