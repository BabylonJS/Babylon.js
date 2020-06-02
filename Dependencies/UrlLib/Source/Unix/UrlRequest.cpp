#include <UrlLib/UrlLib.h>
#include <arcana/threading/task.h>
#include <arcana/threading/task_schedulers.h>
#include <curl/curl.h>

namespace UrlLib
{
    class UrlRequest::Impl
    {
        using ByteArray = std::vector<std::byte>;
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
            return arcana::make_task(arcana::threadpool_scheduler, m_cancellationSource, [this]()
            {
                switch (m_responseType)
                {
                    case UrlResponseType::String:
                    {
                        LoadFile(m_responseString);
                        break;
                    }
                    case UrlResponseType::Buffer:
                    {
                        LoadFile(m_responseBuffer);
                        break;
                    }
                }
            });
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
            return m_responseBuffer;
        }

    private:

        static void Append(std::string& string, char* buffer, size_t nitems)
        {
            string.insert(string.end(), buffer, buffer + nitems);
        }

        static void Append(ByteArray& byteArray, char* buffer, size_t nitems)
        {
            auto bytes = reinterpret_cast<std::byte const*>(buffer);
            byteArray.insert(byteArray.end(), bytes, bytes + nitems);   
        }

        template<typename DataT> void LoadFile(DataT& data)
        {
            auto curl = curl_easy_init();
            if (curl)
            {
                data.clear();
                curl_easy_setopt(curl, CURLOPT_URL, m_url.data());
                curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

                curl_write_callback callback = [](char* buffer, size_t /*size*/, size_t nitems, void* userData) {
                    auto& data = *static_cast<DataT*>(userData);
                    Append(data, buffer, nitems);
                    return nitems;
                };

                curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, callback);
                curl_easy_setopt(curl, CURLOPT_WRITEDATA, &data);

                auto result = curl_easy_perform(curl);
                if (result != CURLE_OK)
                {
                    throw std::exception();
                }

                curl_easy_cleanup(curl);
                m_statusCode = UrlStatusCode::Ok;
            }
        }

        arcana::cancellation_source m_cancellationSource{};
        UrlResponseType m_responseType{UrlResponseType::String};
        UrlMethod m_method{UrlMethod::Get};
        UrlStatusCode m_statusCode{UrlStatusCode::None};
        std::string m_url{};
        std::string m_responseUrl{};
        std::string m_responseString{};
        ByteArray m_responseBuffer{};
    };
}

#include <Shared/UrlRequest.h>
