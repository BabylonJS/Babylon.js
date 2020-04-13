// Shared pimpl code (not an actual header)

namespace UrlLib
{
    UrlRequest::UrlRequest()
        : m_impl{std::make_unique<Impl>()}
    {
    }

    UrlRequest::UrlRequest(const UrlRequest&) = default;

    UrlRequest::UrlRequest(UrlRequest&&) = default;

    UrlRequest::~UrlRequest() = default;

    void UrlRequest::Abort()
    {
        m_impl->Abort();
    }

    void UrlRequest::Open(UrlMethod method, std::string url)
    {
        m_impl->Open(method, std::move(url));
    }

    UrlResponseType UrlRequest::ResponseType() const
    {
        return m_impl->ResponseType();
    }

    void UrlRequest::ResponseType(UrlResponseType value)
    {
        m_impl->ResponseType(value);
    }

    arcana::task<void, std::exception_ptr> UrlRequest::SendAsync()
    {
        return m_impl->SendAsync();
    }

    UrlStatusCode UrlRequest::StatusCode() const
    {
        return m_impl->StatusCode();
    }

    gsl::cstring_span<> UrlRequest::ResponseUrl() const
    {
        return m_impl->ResponseUrl();
    }

    gsl::cstring_span<> UrlRequest::ResponseString() const
    {
        return m_impl->ResponseString();
    }

    gsl::span<const std::byte> UrlRequest::ResponseBuffer() const
    {
        return m_impl->ResponseBuffer();
    }
}
