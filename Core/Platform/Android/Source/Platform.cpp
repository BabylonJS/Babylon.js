#include <Babylon/Platform.h>

namespace Babylon
{
    namespace
    {
        constexpr auto JS_PLATFORM_NAME = "platform";
    }

    Platform::Platform(Napi::Env env, JavaVM* javaVM, jobject appContext)
        : m_javaVM{javaVM}
        , m_jniEnv{nullptr}
        , m_jniEnvAttached{false}
        , m_appContext{appContext}
    {
        if (m_javaVM->GetEnv(reinterpret_cast<void**>(&m_jniEnv), JNI_VERSION_1_6) == JNI_EDETACHED)
        {
            if (m_javaVM->AttachCurrentThread(&m_jniEnv, nullptr) != 0) {
                throw std::runtime_error("Failed to attach JavaScript thread to Java VM");
            }

            m_jniEnvAttached = true;
        }

        auto jsNative = env.Global().Get(JsRuntime::JS_NATIVE_NAME).As<Napi::Object>();
        auto deleter = [](Napi::Env, Platform* platform) { delete platform; };
        Napi::Value platform = Napi::External<Platform>::New(env, this, deleter);
        jsNative.Set(JS_PLATFORM_NAME, platform);
    }

    Platform::~Platform()
    {
        if (m_jniEnvAttached)
        {
            m_javaVM->DetachCurrentThread();
        }
    }

    void Platform::Initialize(Napi::Env env, JavaVM* javaVM, jobject appContext)
    {
        new Platform(env, javaVM, appContext);
    }

    Platform& Platform::GetFromJavaScript(Napi::Env env)
    {
        return *env.Global().Get(JsRuntime::JS_NATIVE_NAME).As<Napi::Object>().Get(JS_PLATFORM_NAME).As<Napi::External<Platform>>().Data();
    }

    JNIEnv* Platform::Env() const
    {
        return m_jniEnv;
    }

    jobject Platform::AppContext() const
    {
        return m_appContext;
    }
}
