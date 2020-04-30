#include <UrlLib/UrlLib.h>
#include <Unknwn.h>
#include <arcana/threading/task.h>
#include <arcana/threading/task_conversions.h>
#include <robuffer.h>
#include <winrt/Windows.Storage.Streams.h>
#include <winrt/Windows.Web.Http.h>
#include <winrt/Windows.ApplicationModel.h>

namespace UrlLib
{
    using namespace winrt::Windows;

    namespace
    {
        Web::Http::HttpMethod ConvertHttpMethod(UrlMethod method)
        {
            switch (method)
            {
                case UrlMethod::Get:
                    return Web::Http::HttpMethod::Get();
                default:
                    throw std::runtime_error("Unsupported method");
            }
        }

        std::wstring GetLocalPath(Foundation::Uri url)
        {
            std::wstring path{std::wstring_view{Foundation::Uri::UnescapeComponent(url.Path())}.substr(1)};
            std::replace(path.begin(), path.end(), '/', '\\');
            return std::move(path);
        }
    }

    class UrlRequest::Impl
    {
    public:
        ~Impl()
        {
            Abort();
        }

        void Abort()
        {
            m_cancellationSource.cancel();
        }

        void Open(UrlMethod method, std::string url)
        {
            m_method = method;
            m_url = std::move(url);
        }

        UrlResponseType ResponseType() const
        {
            return m_responseType;
        }

        void ResponseType(UrlResponseType value)
        {
            m_responseType = value;
        }

        arcana::task<void, std::exception_ptr> SendAsync()
        {
            Foundation::Uri url{winrt::to_hstring(m_url)};

            if (url.SchemeName() == L"app")
            {
                return arcana::create_task<std::exception_ptr>(ApplicationModel::Package::Current().InstalledLocation().GetFileAsync(GetLocalPath(url)))
                    .then(arcana::inline_scheduler, m_cancellationSource, [this](Storage::StorageFile file) {
                        return LoadFileAsync(file);
                    });
            }
            else if (url.SchemeName() == L"file")
            {
                return arcana::create_task<std::exception_ptr>(Storage::StorageFile::GetFileFromPathAsync(GetLocalPath(url)))
                    .then(arcana::inline_scheduler, m_cancellationSource, [this](Storage::StorageFile file) {
                        return LoadFileAsync(file);
                    });
            }
            else
            {
                Web::Http::HttpRequestMessage requestMessage;
                requestMessage.RequestUri(url);
                requestMessage.Method(ConvertHttpMethod(m_method));

                Web::Http::HttpClient client;
                return arcana::create_task<std::exception_ptr>(client.SendRequestAsync(requestMessage))
                    .then(arcana::inline_scheduler, m_cancellationSource, [this](Web::Http::HttpResponseMessage responseMessage)
                    {
                        m_statusCode = static_cast<UrlStatusCode>(responseMessage.StatusCode());
                        if (!responseMessage.IsSuccessStatusCode())
                        {
                            return arcana::task_from_result<std::exception_ptr>();
                        }

                        m_responseUrl = winrt::to_string(responseMessage.RequestMessage().RequestUri().RawUri());

                        switch (m_responseType)
                        {
                            case UrlResponseType::String:
                            {
                                return arcana::create_task<std::exception_ptr>(responseMessage.Content().ReadAsStringAsync())
                                    .then(arcana::inline_scheduler, m_cancellationSource, [this](winrt::hstring string)
                                    {
                                        m_responseString = winrt::to_string(string);
                                        m_statusCode = UrlStatusCode::Ok;
                                    });
                            }
                            case UrlResponseType::Buffer:
                            {
                                return arcana::create_task<std::exception_ptr>(responseMessage.Content().ReadAsBufferAsync())
                                    .then(arcana::inline_scheduler, m_cancellationSource, [this](Storage::Streams::IBuffer buffer)
                                    {
                                        m_responseBuffer = std::move(buffer);
                                        m_statusCode = UrlStatusCode::Ok;
                                    });
                            }
                            default:
                            {
                                throw std::runtime_error{"Invalid response type"};
                            }
                        }
                    });
            }
        }

        UrlStatusCode StatusCode() const
        {
            return m_statusCode;
        }

        gsl::cstring_span<> ResponseUrl()
        {
            return m_responseUrl;
        }

        gsl::cstring_span<> ResponseString()
        {
            return m_responseString;
        }

        gsl::span<const std::byte> ResponseBuffer() const
        {
            std::byte* bytes;
            auto bufferByteAccess = m_responseBuffer.as<::Windows::Storage::Streams::IBufferByteAccess>();
            winrt::check_hresult(bufferByteAccess->Buffer(reinterpret_cast<byte**>(&bytes)));
            return {bytes, gsl::narrow_cast<std::ptrdiff_t>(m_responseBuffer.Length())};
        }

    private:
        arcana::task<void, std::exception_ptr> LoadFileAsync(Storage::StorageFile file)
        {
            switch (m_responseType)
            {
                case UrlResponseType::String:
                {
                    return arcana::create_task<std::exception_ptr>(Storage::FileIO::ReadTextAsync(file))
                        .then(arcana::inline_scheduler, m_cancellationSource, [this](winrt::hstring text) {
                            m_responseString = winrt::to_string(text);
                            m_statusCode = UrlStatusCode::Ok;
                        });
                }
                case UrlResponseType::Buffer:
                {
                    return arcana::create_task<std::exception_ptr>(Storage::FileIO::ReadBufferAsync(file))
                        .then(arcana::inline_scheduler, m_cancellationSource, [this](Storage::Streams::IBuffer buffer) {
                            m_responseBuffer = std::move(buffer);
                            m_statusCode = UrlStatusCode::Ok;
                        });
                }
                default:
                {
                    throw std::runtime_error{"Invalid response type"};
                }
            }
        }


        arcana::cancellation_source m_cancellationSource{};
        UrlResponseType m_responseType{UrlResponseType::String};
        UrlMethod m_method{UrlMethod::Get};
        std::string m_url{};
        UrlStatusCode m_statusCode{UrlStatusCode::None};
        std::string m_responseUrl{};
        std::string m_responseString{};
        Storage::Streams::IBuffer m_responseBuffer{};
    };
}

#include <Shared/UrlRequest.h>
