#include "CommonWin32.h"
#include <Windows.h>

namespace
{
    std::string executablePath;
}

namespace babylon
{
    const std::string& GetExecutablePath()
    {
        if (executablePath.empty())
        {
            char path[1024];
            ::GetModuleFileNameA(nullptr, path, ARRAYSIZE(path));
            executablePath.assign(path);
        }

        return executablePath;
    }

    std::string GetAbsolutePath(const char* relativePath)
    {
        const std::string& path = GetExecutablePath();
        return path.substr(0, path.find_last_of('\\') + 1) + relativePath;
    }
}
