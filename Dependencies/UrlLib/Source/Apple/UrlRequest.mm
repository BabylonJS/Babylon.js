#include <UrlLib/UrlLib.h>
#include <arcana/threading/task.h>
#include <arcana/threading/task_schedulers.h>

#import <Foundation/Foundation.h>

namespace UrlLib
{
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
            __block arcana::task_completion_source<void, std::exception_ptr> taskCompletionSource{};
            
            NSURL* url{[NSURL URLWithString:[NSString stringWithUTF8String:m_url.data()]]};
            NSString* scheme{url.scheme};
            if ([scheme isEqual:@"app"])
            {
                NSString* path{[[NSBundle mainBundle] pathForResource:url.path ofType:nil]};
                url = [NSURL fileURLWithPath:path];
            }
            
            NSURLSession* session{[NSURLSession sharedSession]};
            NSURLRequest* request{[NSURLRequest requestWithURL:url]};
            
            id completionHandler{^(NSData* data, NSURLResponse* response, NSError* error)
            {
                if (error != nil)
                {
                    throw std::runtime_error{[[error localizedDescription] UTF8String]};
                }
                
                if ([response class] == [NSHTTPURLResponse class])
                {
                    NSHTTPURLResponse* httpResponse{(NSHTTPURLResponse*)response};
                    m_statusCode = static_cast<UrlStatusCode>(httpResponse.statusCode);
                }
                else
                {
                    m_statusCode = UrlStatusCode::Ok;
                }

                if (data != nil)
                {
                    switch (m_responseType)
                    {
                        case UrlResponseType::String:
                        {
                            m_responseString = std::string{static_cast<const char*>(data.bytes), data.length};
                            break;
                        }
                        case UrlResponseType::Buffer:
                        {
                            // TODO: Is it better to avoid copying and retain NSData instead?
                            m_responseBuffer.resize(data.length);
                            std::memcpy(m_responseBuffer.data(), data.bytes, data.length);
                            break;
                        }
                        default:
                        {
                            throw std::runtime_error{"Invalid response type"};
                        }
                    }
                }
                
                taskCompletionSource.complete();
            }};

            NSURLSessionDataTask* task{[session dataTaskWithRequest:request completionHandler:completionHandler]};
            [task resume];

            return taskCompletionSource.as_task();
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
        arcana::cancellation_source m_cancellationSource{};
        UrlResponseType m_responseType{UrlResponseType::String};
        UrlMethod m_method{UrlMethod::Get};
        std::string m_url{};
        UrlStatusCode m_statusCode{UrlStatusCode::None};
        std::string m_responseUrl{};
        std::string m_responseString{};
        std::vector<std::byte> m_responseBuffer{};
    };
}

#include <Shared/UrlRequest.h>
