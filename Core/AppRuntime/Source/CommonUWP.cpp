#include "Common.h"
#include <Windows.h>

namespace Babylon
{
    std::filesystem::path GetModulePath()
    {
        char buffer[1024];
        ::GetModuleFileNameA(nullptr, buffer, ARRAYSIZE(buffer));
        return std::filesystem::path{buffer};
    }

    std::string GetUrlFromPath(const std::filesystem::path& path)
    {
        // TODO: implement with Windows::Foundation::Uri
        throw std::exception("Not implemented!");
    }
}
