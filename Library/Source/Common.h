#pragma once

#include <arcana/threading/dispatcher.h>
#include <filesystem>

namespace babylon
{
    using babylon_dispatcher = arcana::dispatcher<128>;

    std::filesystem::path GetModulePath();

    std::string GetUrlFromPath(const std::filesystem::path& path);
}
