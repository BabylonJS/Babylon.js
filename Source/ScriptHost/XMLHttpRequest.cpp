#include "XMLHttpRequest.h"

#define CURL_STATICLIB
#include <curl/curl.h>

#include <sstream>

namespace babylon
{
    namespace
    {
        arcana::task<std::vector<char>, std::exception_ptr> HttpRequestWithCurl(
            const std::string& url,
            babylon_dispatcher& dispatcher,
            arcana::cancellation& cancelSource)
        {
            return arcana::make_task(dispatcher, cancelSource, [url]()
            {
                std::vector<char> data{};

                auto curl = curl_easy_init();
                if (curl)
                {
                    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
                    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

                    curl_write_callback callback = [](char *buffer, size_t size, size_t nitems, void *userData)
                    {
                        auto& data = *static_cast<std::vector<char>*>(userData);
                        data.insert(data.end(), buffer, buffer + nitems);
                        return nitems;
                    };

                    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, callback);
                    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &data);

                    auto result = curl_easy_perform(curl);
                    if (result != CURLE_OK)
                    {
                        throw std::exception("HTTP request failed.");
                    }

                    curl_easy_cleanup(curl);
                }

                return data;
            });
        }

        std::string GetAbsoluteUrl(const std::string& input, const std::string& locationUrl)
        {
            auto url = curl_url();

            auto code = curl_url_set(url, CURLUPART_URL, input.c_str(), 0);

            // If input could not be turned into a valid URL, try using it as a regular URL.
            if (code == CURLUE_MALFORMED_INPUT)
            {
                std::stringstream ss;
                ss << locationUrl << "/" << input;
                code = curl_url_set(url, CURLUPART_URL, ss.str().c_str(), 0);
            }

            if (code != CURLUE_OK)
            {
                throw std::exception{ "Invalid URL, neither absolute nor relative." };
            }

            char* buf;
            code = curl_url_get(url, CURLUPART_URL, &buf, 0);

            if (code != CURLUE_OK)
            {
                throw std::exception{ "Invalid URL, unable to create final URL." };
            }

            std::string absoluteUrl{ buf };

            curl_free(buf);
            curl_url_cleanup(url);

            return absoluteUrl;
        }
    }

    Napi::FunctionReference XMLHttpRequest::constructor;

    void XMLHttpRequest::Initialize(Napi::Env& env, RuntimeImpl& runtimeImpl)
    {
        Napi::HandleScope scope{ env };

        Napi::Function func = DefineClass(
            env,
            "XMLHttpRequest",
            {
                StaticValue("UNSENT", Napi::Value::From(env, 0)),
                StaticValue("OPENED", Napi::Value::From(env, 1)),
                StaticValue("HEADERS_RECEIVED", Napi::Value::From(env, 2)),
                StaticValue("LOADING", Napi::Value::From(env, 3)),
                StaticValue("DONE", Napi::Value::From(env, 4)),
                InstanceAccessor("readyState", &XMLHttpRequest::GetReadyState, nullptr),
                InstanceAccessor("response", &XMLHttpRequest::GetResponse, nullptr),
                InstanceAccessor("responseText", &XMLHttpRequest::GetResponseText, nullptr),
                InstanceAccessor("responseType", &XMLHttpRequest::GetResponseType, &XMLHttpRequest::SetResponseType),
                InstanceAccessor("responseURL", &XMLHttpRequest::GetResponseURL, nullptr),
                InstanceAccessor("status", &XMLHttpRequest::GetStatus, nullptr),
                InstanceMethod("addEventListener", &XMLHttpRequest::AddEventListener),
                InstanceMethod("removeEventListener", &XMLHttpRequest::RemoveEventListener),
                InstanceMethod("open", &XMLHttpRequest::Open),
                InstanceMethod("send", &XMLHttpRequest::Send),
            },
            &runtimeImpl);

        constructor = Napi::Persistent(func);
        constructor.SuppressDestruct();

        env.Global().Set("XMLHttpRequest", func);
    }

    XMLHttpRequest::XMLHttpRequest(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<XMLHttpRequest>{ info }
        , m_runtimeImpl{ *static_cast<RuntimeImpl*>(info.Data()) }
    {
    }

    Napi::Value XMLHttpRequest::GetReadyState(const Napi::CallbackInfo&)
    {
        return Napi::Value::From(Env(), arcana::underlying_cast(m_readyState));
    }

    Napi::Value XMLHttpRequest::GetResponse(const Napi::CallbackInfo&)
    {
        return m_response.Value();
    }

    Napi::Value XMLHttpRequest::GetResponseText(const Napi::CallbackInfo&)
    {
        return Napi::Value::From(Env(), m_responseText);
    }

    Napi::Value XMLHttpRequest::GetResponseType(const Napi::CallbackInfo&)
    {
        return Napi::Value::From(Env(), m_responseType);
    }

    void XMLHttpRequest::SetResponseType(const Napi::CallbackInfo&, const Napi::Value& value)
    {
        m_responseType = value.As<Napi::String>().Utf8Value();
    }

    Napi::Value XMLHttpRequest::GetResponseURL(const Napi::CallbackInfo&)
    {
        return Napi::Value::From(Env(), m_responseURL);
    }

    Napi::Value XMLHttpRequest::GetStatus(const Napi::CallbackInfo&)
    {
        return Napi::Value::From(Env(), arcana::underlying_cast(m_status));
    }

    void XMLHttpRequest::AddEventListener(const Napi::CallbackInfo& info)
    {
        std::string eventType = info[0].As<Napi::String>().Utf8Value();
        Napi::Function eventHandler = info[1].As<Napi::Function>();

        const auto& eventHandlerRefs = m_eventHandlerRefs[eventType];
        for (auto it = eventHandlerRefs.begin(); it != eventHandlerRefs.end(); ++it)
        {
            if (it->Value() == eventHandler)
            {
                throw Napi::Error::New(info.Env(), "Cannot add the same event handler twice");
            }
        }

        m_eventHandlerRefs[eventType].push_back(Napi::Persistent(eventHandler));
    }

    void XMLHttpRequest::RemoveEventListener(const Napi::CallbackInfo& info)
    {
        std::string eventType = info[0].As<Napi::String>().Utf8Value();
        Napi::Function eventHandler = info[1].As<Napi::Function>();
        auto itType = m_eventHandlerRefs.find(eventType);
        if (itType != m_eventHandlerRefs.end())
        {
            auto& eventHandlerRefs = itType->second;
            for (auto it = eventHandlerRefs.begin(); it != eventHandlerRefs.end(); ++it)
            {
                if (it->Value() == eventHandler)
                {
                    eventHandlerRefs.erase(it);
                    break;
                }
            }
        }
    }

    void XMLHttpRequest::Open(const Napi::CallbackInfo& info)
    {
        m_method = info[0].As<Napi::String>().Utf8Value();
        m_url = GetAbsoluteUrl(info[1].As<Napi::String>().Utf8Value(), m_runtimeImpl.RootUrl());
        SetReadyState(ReadyState::Opened);
    }

    void XMLHttpRequest::Send(const Napi::CallbackInfo& info)
    {
        auto lock = m_runtimeImpl.AcquireTaskLock();
        m_runtimeImpl.Task = m_runtimeImpl.Task.then(arcana::inline_scheduler, arcana::cancellation::none(), [this]
        {
            return SendAsync();
        });
    }

    // TODO: Make this just be SendAsync() once the UWP file access bug is fixed.
    arcana::task<void, std::exception_ptr> XMLHttpRequest::SendAsyncImpl()
    {
        return HttpRequestWithCurl(m_url, m_runtimeImpl.Dispatcher(), m_runtimeImpl.Cancellation())
            .then(arcana::inline_scheduler, m_runtimeImpl.Cancellation(), [this](const std::vector<char>& data)
        {
            if (m_responseType.empty() || m_responseType == XMLHttpRequestTypes::ResponseType::Text)
            {
                m_responseText = std::string{ data.data(), data.size() };
            }
            else if (m_responseType == XMLHttpRequestTypes::ResponseType::ArrayBuffer)
            {
                m_response = Napi::Persistent(Napi::ArrayBuffer::New(Env(), data.size()));
                memcpy(m_response.Value().Data(), data.data(), data.size());
            }

            m_status = winrt::Windows::Web::Http::HttpStatusCode::Ok;
            SetReadyState(ReadyState::Done);
        });
    }

    void XMLHttpRequest::SetReadyState(ReadyState readyState)
    {
        m_readyState = readyState;

        auto it = m_eventHandlerRefs.find(XMLHttpRequestTypes::EventType::ReadyStateChange);
        if (it != m_eventHandlerRefs.end())
        {
            const auto& eventHandlerRefs = it->second;
            for (const auto& eventHandlerRef : eventHandlerRefs)
            {
                eventHandlerRef.Call({});
            }
        }
    }
}
