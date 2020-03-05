#include "NetworkUtils.h"

namespace Babylon
{
    std::string GetAbsoluteUrl(const std::string& url, const std::string& rootUrl)
    {
        return url;
    }

    template<typename DataT>
    arcana::task<DataT, std::exception_ptr> LoadUrlAsync(std::string url)
    {
        return {};
    }

    arcana::task<std::string, std::exception_ptr> LoadTextAsync(std::string url)
    {
        return LoadUrlAsync<std::string>(std::move(url));
    }

    arcana::task<std::vector<uint8_t>, std::exception_ptr> LoadBinaryAsync(std::string url)
    {
        return LoadUrlAsync<std::vector<uint8_t>>(std::move(url));
    }
}
