#pragma once

#include <Babylon/JsRuntime.h>
#include <jni.h>

namespace Babylon
{
    class Platform final
    {
    public:
        Platform(Napi::Env env, JavaVM* javaVM, jobject appContext);
        ~Platform();

        static void Initialize(Napi::Env env, JavaVM* javaVM, jobject appContext);

        static Platform& GetFromJavaScript(Napi::Env env);

        JNIEnv* Env() const;

        jobject AppContext() const;

    private:
        JavaVM* m_javaVM;
        JNIEnv* m_jniEnv;
        bool m_jniEnvAttached;
        jobject m_appContext;
    };
}
