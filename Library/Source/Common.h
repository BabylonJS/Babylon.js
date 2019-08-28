#pragma once

#include <arcana/threading/dispatcher.h>
#ifndef __APPLE__
#include <filesystem>
#endif

namespace babylon
{
    using babylon_dispatcher = arcana::dispatcher<128>;

#ifndef __APPLE__
    std::filesystem::path GetModulePath();

    std::string GetUrlFromPath(const std::filesystem::path& path);
#endif
}
