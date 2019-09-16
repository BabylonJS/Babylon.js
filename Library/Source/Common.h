#pragma once

#include <arcana/threading/dispatcher.h>

#ifdef __APPLE__
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
