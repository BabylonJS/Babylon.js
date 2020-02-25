#pragma once

#include <Babylon/JsRuntime.h>

#include <napi/napi.h>
#include <arcana/threading/task.h>
#include <arcana/type_traits.h>
#include <unordered_map>

namespace Babylon
{
    enum class HTTPStatusCode : int32_t
    {
        None = 0,
        Continue = 100,
        SwitchingProtocols = 101,
        Processing = 102,
        Ok = 200,
        Created = 201,
        Accepted = 202,
        NonAuthoritativeInformation = 203,
        NoContent = 204,
        ResetContent = 205,
        PartialContent = 206,
        MultiStatus = 207,
        AlreadyReported = 208,
        IMUsed = 226,
        MultipleChoices = 300,
        MovedPermanently = 301,
        Found = 302,
        SeeOther = 303,
        NotModified = 304,
        UseProxy = 305,
        TemporaryRedirect = 307,
        PermanentRedirect = 308,
        BadRequest = 400,
        Unauthorized = 401,
        PaymentRequired = 402,
        Forbidden = 403,
        NotFound = 404,
        MethodNotAllowed = 405,
        NotAcceptable = 406,
        ProxyAuthenticationRequired = 407,
        RequestTimeout = 408,
        Conflict = 409,
        Gone = 410,
        LengthRequired = 411,
        PreconditionFailed = 412,
        RequestEntityTooLarge = 413,
        RequestUriTooLong = 414,
        UnsupportedMediaType = 415,
        RequestedRangeNotSatisfiable = 416,
        ExpectationFailed = 417,
        UnprocessableEntity = 422,
        Locked = 423,
        FailedDependency = 424,
        UpgradeRequired = 426,
        PreconditionRequired = 428,
        TooManyRequests = 429,
        RequestHeaderFieldsTooLarge = 431,
        InternalServerError = 500,
        NotImplemented = 501,
        BadGateway = 502,
        ServiceUnavailable = 503,
        GatewayTimeout = 504,
        HttpVersionNotSupported = 505,
        VariantAlsoNegotiates = 506,
        InsufficientStorage = 507,
        LoopDetected = 508,
        NotExtended = 510,
        NetworkAuthenticationRequired = 511,
    };

    // TODO: Move these down into the CPP file once the UWP file access bug is fixed.
    namespace XMLHttpRequestTypes
    {
        namespace ResponseType
        {
            constexpr const char* Text = "text";
            constexpr const char* ArrayBuffer = "arraybuffer";
        }

        namespace EventType
        {
            constexpr const char* ReadyStateChange = "readystatechange";
            constexpr const char* Progress = "progress";
            constexpr const char* LoadEnd = "loadend";
        }
    }

    class XMLHttpRequest final : public Napi::ObjectWrap<XMLHttpRequest>
    {
        static constexpr auto JS_XML_HTTP_REQUEST_CONSTRUCTOR_NAME = "XMLHttpRequest";

    public:
        static void Initialize(Napi::Env env, const char* rootUrl);

        explicit XMLHttpRequest(const Napi::CallbackInfo& info);

    private:
        enum class ReadyState
        {
            Unsent = 0,
            Opened = 1,
            Done = 4,
        };

        Napi::Value GetReadyState(const Napi::CallbackInfo& info);
        Napi::Value GetResponse(const Napi::CallbackInfo& info);
        Napi::Value GetResponseText(const Napi::CallbackInfo& info);
        Napi::Value GetResponseType(const Napi::CallbackInfo& info);
        void SetResponseType(const Napi::CallbackInfo& info, const Napi::Value& value);
        Napi::Value GetResponseURL(const Napi::CallbackInfo& info);
        Napi::Value GetStatus(const Napi::CallbackInfo& info);
        void AddEventListener(const Napi::CallbackInfo& info);
        void RemoveEventListener(const Napi::CallbackInfo& info);
        void Open(const Napi::CallbackInfo& info);
        void Send(const Napi::CallbackInfo& info);

        arcana::task<void, std::exception_ptr> SendAsync();
        arcana::task<void, std::exception_ptr> SendAsyncImpl(); // TODO: Eliminate this function once the UWP file access bug is fixed.
        void SetReadyState(ReadyState readyState);

        JsRuntime& m_runtime;
        const std::string m_rootUrl{};

        ReadyState m_readyState{ReadyState::Unsent};
        Napi::Reference<Napi::ArrayBuffer> m_response;
        std::string m_responseText;
        std::string m_responseType;
        HTTPStatusCode m_status{HTTPStatusCode::None};
        std::string m_responseURL;
        std::unordered_map<std::string, std::vector<Napi::FunctionReference>> m_eventHandlerRefs;

        std::string m_method;
        std::string m_url;
    };
}
