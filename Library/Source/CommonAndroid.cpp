#include "Common.h"

namespace babylon
{

    std::filesystem::path GetModulePath()
    {
        return std::filesystem::path{ "." };
    }

    std::string GetUrlFromPath(const std::filesystem::path& path)
    {
        // stub
        return std::string("");
    }
}
