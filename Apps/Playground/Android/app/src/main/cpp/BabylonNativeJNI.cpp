#include <jni.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <time.h>
#include <memory>
#include <android/native_window.h> // requires ndk r5 or newer
#include <android/native_window_jni.h> // requires ndk r5 or newer
#include <android/log.h>

#include <AndroidExtensions/Globals.h>
#include <Babylon/AppRuntime.h>
#include <Babylon/ScriptLoader.h>
#include <Babylon/Plugins/NativeEngine.h>
#include <Babylon/Plugins/NativeWindow.h>
#include <Babylon/Plugins/NativeXr.h>
#include <Babylon/Polyfills/Console.h>
#include <Babylon/Polyfills/Window.h>
#include <Babylon/Polyfills/XMLHttpRequest.h>
#include <InputManager.h>

namespace
{
    std::unique_ptr<Babylon::AppRuntime> g_runtime{};
    std::unique_ptr<InputManager::InputBuffer> g_inputBuffer{};
    std::unique_ptr<Babylon::ScriptLoader> g_scriptLoader{};
}

extern "C"
{
    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_initEngine(JNIEnv* env, jclass clazz)
    {
    }

    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_finishEngine(JNIEnv* env, jclass clazz)
    {
        g_scriptLoader.reset();
        g_inputBuffer.reset();
        g_runtime.reset();
        Babylon::Plugins::NativeEngine::DeinitializeGraphics();
    }

    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_surfaceCreated(JNIEnv* env, jclass clazz, jobject surface, jobject context)
    {
        if (!g_runtime)
        {
            g_runtime = std::make_unique<Babylon::AppRuntime>();

            JavaVM* javaVM{};
            if (env->GetJavaVM(&javaVM) != JNI_OK)
            {
                throw std::runtime_error("Failed to get Java VM");
            }

            android::global::Initialize(javaVM, context);

            ANativeWindow* window = ANativeWindow_fromSurface(env, surface);
            int32_t width  = ANativeWindow_getWidth(window);
            int32_t height = ANativeWindow_getHeight(window);

            g_runtime->Dispatch([javaVM, window, width, height](Napi::Env env)
            {
                Babylon::Polyfills::Console::Initialize(env, [](const char* message, Babylon::Polyfills::Console::LogLevel level)
                {
                    switch (level)
                    {
                    case Babylon::Polyfills::Console::LogLevel::Log:
                        __android_log_write(ANDROID_LOG_INFO, "BabylonNative", message);
                        break;
                    case Babylon::Polyfills::Console::LogLevel::Warn:
                        __android_log_write(ANDROID_LOG_WARN, "BabylonNative", message);
                        break;
                    case Babylon::Polyfills::Console::LogLevel::Error:
                        __android_log_write(ANDROID_LOG_ERROR, "BabylonNative", message);
                        break;
                    }
                });

                Babylon::Plugins::NativeWindow::Initialize(env, window, width, height);

                Babylon::Plugins::NativeEngine::InitializeGraphics(window, width, height);
                Babylon::Plugins::NativeEngine::Initialize(env);

                Babylon::Plugins::NativeXr::Initialize(env);

                Babylon::Polyfills::Window::Initialize(env);
                Babylon::Polyfills::XMLHttpRequest::Initialize(env);

                auto& jsRuntime = Babylon::JsRuntime::GetFromJavaScript(env);

                g_inputBuffer = std::make_unique<InputManager::InputBuffer>(jsRuntime);
                InputManager::Initialize(jsRuntime, *g_inputBuffer);
            });

            g_scriptLoader = std::make_unique<Babylon::ScriptLoader>(*g_runtime);
            g_scriptLoader->Eval("document = {}", "");
            g_scriptLoader->LoadScript("app:///Scripts/ammo.js");
            g_scriptLoader->LoadScript("app:///Scripts/recast.js");
            g_scriptLoader->LoadScript("app:///Scripts/babylon.max.js");
            g_scriptLoader->LoadScript("app:///Scripts/babylon.glTF2FileLoader.js");
            g_scriptLoader->LoadScript("app:///Scripts/babylonjs.materials.js");
        }
    }

    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_surfaceChanged(JNIEnv* env, jclass clazz, jint width, jint height, jobject surface)
    {
        if (g_runtime)
        {
            ANativeWindow *window = ANativeWindow_fromSurface(env, surface);
            g_runtime->Dispatch([window, width, height](Napi::Env env)
            {
                Babylon::Plugins::NativeEngine::Reinitialize(env, window, static_cast<size_t>(width), static_cast<size_t>(height));
            });
        }
    }

    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_setCurrentActivity(JNIEnv* env, jclass clazz, jobject currentActivity)
    {
        android::global::SetCurrentActivity(currentActivity);
    }

    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_activityOnPause(JNIEnv* env, jclass clazz)
    {
        android::global::Pause();
        if (g_runtime)
        {
            g_runtime->Suspend();
        }
    }

    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_activityOnResume(JNIEnv* env, jclass clazz)
    {
        if (g_runtime)
        {
            g_runtime->Resume();
        }
        android::global::Resume();
    }

    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_activityOnRequestPermissionsResult(JNIEnv* env, jclass clazz, jint requestCode, jobjectArray permissions, jintArray grantResults)
    {
        std::vector<std::string> nativePermissions{};
        for (int i = 0; i < env->GetArrayLength(permissions); i++)
        {
            jstring permission = (jstring)env->GetObjectArrayElement(permissions, i);
            const char* utfString{env->GetStringUTFChars(permission, nullptr)};
            nativePermissions.push_back(utfString);
            env->ReleaseStringUTFChars(permission, utfString);
        }

        auto grantResultElements{env->GetIntArrayElements(grantResults, nullptr)};
        auto grantResultElementCount = env->GetArrayLength(grantResults);
        std::vector<int32_t> nativeGrantResults{grantResultElements, grantResultElements + grantResultElementCount};
        env->ReleaseIntArrayElements(grantResults, grantResultElements, 0);

        android::global::RequestPermissionsResult(requestCode, nativePermissions, nativeGrantResults);
    }

    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_loadScript(JNIEnv* env, jclass clazz, jstring path)
    {
        if (g_scriptLoader)
        {
            g_scriptLoader->LoadScript(env->GetStringUTFChars(path, nullptr));
        }
    }

    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_eval(JNIEnv* env, jclass clazz, jstring source, jstring sourceURL)
    {
        if (g_runtime)
        {
            std::string url = env->GetStringUTFChars(sourceURL, nullptr);
            std::string src = env->GetStringUTFChars(source, nullptr);
            g_scriptLoader->Eval(std::move(src), std::move(url));
        }
    }

    JNIEXPORT void JNICALL
    Java_BabylonNative_Wrapper_setTouchInfo(JNIEnv* env, jclass clazz, jfloat x, jfloat y, jboolean down)
    {
        if (g_inputBuffer != nullptr)
        {
            g_inputBuffer->SetPointerPosition(x, y);
            g_inputBuffer->SetPointerDown(down);
        }
    }
}
