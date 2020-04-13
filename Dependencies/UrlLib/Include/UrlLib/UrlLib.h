#pragma once

#include <memory>
#include <arcana/threading/task.h>

namespace UrlLib
{
    enum class UrlStatusCode
    {
        None = 0,
        Ok = 200,
    };

    enum class UrlMethod
    {
        Get,
    };

    enum class UrlResponseType
    {
        String,
        Buffer,
    };

    class UrlRequest final
    {
    public:
        UrlRequest();

        UrlRequest(const UrlRequest&);

        UrlRequest(UrlRequest&&);

        ~UrlRequest();

        void Abort();

        void Open(UrlMethod method, std::string url);

        UrlResponseType ResponseType() const;

        void ResponseType(UrlResponseType value);

        arcana::task<void, std::exception_ptr> SendAsync();

        UrlStatusCode StatusCode() const;

        gsl::cstring_span<> ResponseUrl() const;

        gsl::cstring_span<> ResponseString() const;

        gsl::span<const std::byte> ResponseBuffer() const;

    private:
        class Impl;
        std::shared_ptr<Impl> m_impl{};
    };
}
