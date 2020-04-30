#pragma once

#include <condition_variable>
#include <cstddef>
#include <arcana/threading/dispatcher.h>

#if defined(__APPLE__) || defined(__ANDROID__)
struct Filepath : public std::string
{
    const std::string& u8string() const
    {
        return *this;
    }
};
#else
#include <filesystem>
typedef std::filesystem::path Filepath;
#endif

namespace Babylon
{
    using babylon_dispatcher = arcana::manual_dispatcher<128>;

    Filepath GetModulePath();
    std::string GetUrlFromPath(const Filepath& path);
}
