#pragma once

#include <arcana/threading/dispatcher.h>

#if defined( __APPLE__) || defined(__ANDROID__)
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

namespace babylon
{
    using babylon_dispatcher = arcana::dispatcher<128>;

    Filepath GetModulePath();
    std::string GetUrlFromPath(const Filepath& path);
}
