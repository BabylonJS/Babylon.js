#pragma once

#include <arcana/threading/dispatcher.h>
#include <string>

namespace babylon
{
    using babylon_dispatcher = arcana::dispatcher<128>;

    const std::string& GetExecutablePath();
    std::string GetAbsolutePath(const char* relativePath);
}
