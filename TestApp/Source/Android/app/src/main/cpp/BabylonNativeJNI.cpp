#include <jni.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <time.h>
#include <memory>
#include <android/native_window.h> // requires ndk r5 or newer
#include <android/native_window_jni.h> // requires ndk r5 or newer
#include <android/log.h>
#include <Babylon/RuntimeAndroid.h>
#include <android/asset_manager.h>
#include <android/asset_manager_jni.h>
#include <InputManager.h>

extern "C" {
    JNIEXPORT void JNICALL Java_com_android_appviewer_AndroidViewAppActivity_initEngine(JNIEnv* env, jobject obj, jobject assetMgr, jstring path);
    JNIEXPORT void JNICALL Java_com_android_appviewer_AndroidViewAppActivity_finishEngine(JNIEnv* env, jobject obj);
    JNIEXPORT void JNICALL Java_com_android_appviewer_AndroidViewAppActivity_surfaceCreated(JNIEnv* env, jobject obj, jobject surface);
    JNIEXPORT void JNICALL Java_com_android_appviewer_AndroidViewAppActivity_surfaceChanged(JNIEnv* env, jobject obj, jint width, jint height);
    JNIEXPORT void JNICALL Java_com_android_appviewer_AndroidViewAppActivity_openFile(JNIEnv* env, jobject obj, jstring path);
    JNIEXPORT void JNICALL Java_com_android_appviewer_AndroidViewAppActivity_openStream(JNIEnv* env, jobject obj, jobjectArray input);
    JNIEXPORT void JNICALL Java_com_android_appviewer_AndroidViewAppActivity_setTouchInfo(JNIEnv* env, jobject obj, jfloat dx, jfloat dy, jboolean down);
    JNIEXPORT void JNICALL Java_com_android_appviewer_AndroidViewAppActivity_setPinchInfo(JNIEnv* env, jobject obj, jfloat zoom);
    JNIEXPORT void JNICALL Java_com_android_appviewer_AndroidViewAppActivity_step(JNIEnv* env, jobject obj);
};

std::unique_ptr<babylon::RuntimeAndroid> runtime{};
std::string androidPackagePath;
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};

static AAssetManager* g_assetMgrNative = nullptr;

namespace babylon
{
    // this is the way to load apk embedded assets.
    std::vector<char> GetFileContents(const std::string &file_name)
    {
        std::vector<char> buffer;
        AAsset *asset = AAssetManager_open(g_assetMgrNative, file_name.c_str(),
                                           AASSET_MODE_UNKNOWN);
        size_t size = AAsset_getLength64(asset);
        buffer.resize(size);
        AAsset_read(asset, buffer.data(), size);
        AAsset_close(asset);
        return buffer;
    }
}

JNIEXPORT void JNICALL
Java_com_android_appviewer_AndroidViewAppActivity_initEngine(JNIEnv* env, jobject obj,
                                                       jobject assetMgr, jstring path)
{
    auto asset_manager = AAssetManager_fromJava(env, assetMgr);
    g_assetMgrNative = asset_manager;
    jboolean iscopy;
    androidPackagePath = env->GetStringUTFChars(path, &iscopy) ;
}

JNIEXPORT void JNICALL
Java_com_android_appviewer_AndroidViewAppActivity_finishEngine(JNIEnv* env, jobject obj)
{
}

void LogMessage(const char* message, babylon::LogLevel level)
{
    switch (level)
    {
    case babylon::LogLevel::Log:
        __android_log_write(ANDROID_LOG_INFO, "BabylonNative", message);
        break;
    case babylon::LogLevel::Warn:
        __android_log_write(ANDROID_LOG_WARN, "BabylonNative", message);
        break;
    case babylon::LogLevel::Error:
        __android_log_write(ANDROID_LOG_ERROR, "BabylonNative", message);
        break;
    }
}

JNIEXPORT void JNICALL
Java_com_android_appviewer_AndroidViewAppActivity_surfaceCreated(JNIEnv* env, jobject obj, jobject surface)
{
    if (!runtime)
    {
        ANativeWindow *window = ANativeWindow_fromSurface(env, surface);

        runtime = std::make_unique<babylon::RuntimeAndroid>(window, "file:///data/local/tmp", LogMessage);

        inputBuffer = std::make_unique<InputManager::InputBuffer>(*runtime);
        InputManager::Initialize(*runtime, *inputBuffer);

        runtime->LoadScript("Scripts/babylon.max.js");
        runtime->LoadScript("Scripts/babylon.glTF2FileLoader.js");
        runtime->LoadScript("Scripts/experience.js");
    }
}

JNIEXPORT void JNICALL
Java_com_android_appviewer_AndroidViewAppActivity_surfaceChanged(JNIEnv* env, jobject obj, jint width, jint height)
{
}

JNIEXPORT void JNICALL
Java_com_android_appviewer_AndroidViewAppActivity_openFile(JNIEnv* env, jobject obj, jstring path)
{
}

JNIEXPORT void JNICALL
Java_com_android_appviewer_AndroidViewAppActivity_openStream(JNIEnv* env, jobject obj, jobjectArray input)
{
}

JNIEXPORT void JNICALL
Java_com_android_appviewer_AndroidViewAppActivity_step(JNIEnv* env, jobject obj)
{
}

JNIEXPORT void JNICALL
Java_com_android_appviewer_AndroidViewAppActivity_setTouchInfo(JNIEnv* env, jobject obj, jfloat x, jfloat y, jboolean down)
{
    inputBuffer->SetPointerPosition(x, y);
    inputBuffer->SetPointerDown(down);
}

JNIEXPORT void JNICALL
Java_com_android_appviewer_AndroidViewAppActivity_setPinchInfo(JNIEnv* env, jobject obj, jfloat zoom)
{
}

