#include <AndroidExtensions/JavaWrappers.h>
#include <AndroidExtensions/Globals.h>
#include <android/asset_manager_jni.h>

using namespace android::global;

namespace java::lang
{
    ByteArray::ByteArray(int size)
        : m_env{GetEnvForCurrentThread()}
        , m_byteArray{m_env->NewByteArray(size)}
    {
    }

    ByteArray::ByteArray(jbyteArray byteArray)
        : m_env{GetEnvForCurrentThread()}
        , m_byteArray{byteArray}
    {
    }

    ByteArray::operator jbyteArray() const
    {
        return m_byteArray;
    }

    ByteArray::operator std::vector<std::byte>() const
    {
        std::vector<std::byte> result{static_cast<size_t>(m_env->GetArrayLength(m_byteArray))};
        std::memcpy(result.data(), m_env->GetByteArrayElements(m_byteArray, nullptr), result.size());
        return std::move(result);
    }

    Object::operator jobject() const
    {
        return m_object;
    }

    Object::Object(const char* className, jobject object)
        : m_env{GetEnvForCurrentThread()}
        , m_class{m_env->FindClass(className)}
        , m_object{object}
    {
    }

    String::String(jstring string)
        : m_env{GetEnvForCurrentThread()}
        , m_string{string}
    {
    }

    String::String(const char* string)
        : m_env{GetEnvForCurrentThread()}
        , m_string{m_env->NewStringUTF(string)}
    {
    }

    String::operator jstring() const
    {
        return m_string;
    }

    String::operator std::string() const
    {
        return m_env->GetStringUTFChars(m_string, nullptr);
    }
}

namespace java::io
{
    ByteArrayOutputStream::ByteArrayOutputStream()
        : Object{"java/io/ByteArrayOutputStream", nullptr}
    {
        m_object = m_env->NewObject(m_class, m_env->GetMethodID(m_class, "<init>", "()V"));
    }

    ByteArrayOutputStream::ByteArrayOutputStream(jobject object)
        : Object{"java/io/ByteArrayOutputStream", object}
    {
    }

    void ByteArrayOutputStream::Write(lang::ByteArray b, int off, int len)
    {
        m_env->CallVoidMethod(m_object, m_env->GetMethodID(m_class, "write", "([BII)V"), (jbyteArray)b, off, len);
    }

    lang::ByteArray ByteArrayOutputStream::ToByteArray() const
    {
        return {(jbyteArray)m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "toByteArray", "()[B"))};
    }

    lang::String ByteArrayOutputStream::ToString(const char* charsetName) const
    {
        jmethodID method{m_env->GetMethodID(m_class, "toString", "(Ljava/lang/String;)Ljava/lang/String;")};
        return {(jstring)m_env->CallObjectMethod(m_object, method, m_env->NewStringUTF(charsetName))};
    }

    InputStream::InputStream(jobject object)
        : Object{"java/io/InputStream", object}
    {
    }

    int InputStream::Read(lang::ByteArray byteArray) const
    {
        return m_env->CallIntMethod(m_object, m_env->GetMethodID(m_class, "read", "([B)I"), (jbyteArray)byteArray);
    }
}

namespace java::net
{
    HttpURLConnection::HttpURLConnection(jobject object)
        : Object{"java/net/HttpURLConnection", object}
    {
    }

    int HttpURLConnection::GetResponseCode() const
    {
        return m_env->CallIntMethod(m_object, m_env->GetMethodID(m_class, "getResponseCode", "()I"));
    }

    URL::URL(lang::String url)
        : Object{"java/net/URL", nullptr}
    {
        m_object = m_env->NewObject(m_class, m_env->GetMethodID(m_class, "<init>", "(Ljava/lang/String;)V"), (jstring)url);
    }

    URL::URL(jobject object)
        : Object{"java/net/URL", object}
    {
    }

    URLConnection URL::OpenConnection()
    {
        return {m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "openConnection", "()Ljava/net/URLConnection;"))};
    }

    lang::String URL::ToString()
    {
        return {(jstring)m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "toString", "()Ljava/lang/String;"))};
    }

    URLConnection::URLConnection(jobject object)
        : Object{"java/net/URLConnection", object}
    {
    }

    void URLConnection::Connect()
    {
        m_env->CallVoidMethod(m_object, m_env->GetMethodID(m_class, "connect", "()V"));
    }

    URL URLConnection::GetURL() const
    {
        return {m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "getURL", "()Ljava/net/URL;"))};
    }

    io::InputStream URLConnection::GetInputStream() const
    {
        return {m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "getInputStream", "()Ljava/io/InputStream;"))};
    }

    URLConnection::operator HttpURLConnection() const
    {
        return {m_object};
    }
}

namespace android::content
{
    Context::Context(jobject object)
        : Object{"android/content/Context", object}
    {
    }

    Context Context::getApplicationContext()
    {
        return {m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "getApplicationContext", "()Landroid/content/Context;"))};
    }

    res::AssetManager Context::getAssets() const
    {
        return {m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "getAssets", "()Landroid/content/res/AssetManager;"))};
    }

    jobject Context::getSystemService(const char* serviceName)
    {
        return m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "getSystemService", "(Ljava/lang/String;)Ljava/lang/Object;"), m_env->NewStringUTF(serviceName));
    }
}

namespace android::content::res
{
    AssetManager::AssetManager(jobject object)
        : Object("android/content/res/AssetManager", object)
    {
    }

    AssetManager::operator AAssetManager*() const
    {
        return AAssetManager_fromJava(m_env, m_object);
    }
}

namespace android::view
{
    Display::Display(jobject object)
            : Object("android/view/Display", object)
    {
    }

    int Display::getRotation()
    {
        return m_env->CallIntMethod(m_object, m_env->GetMethodID(m_class, "getRotation", "()I"));
    }

    WindowManager::WindowManager(jobject object)
        : Object("android/view/WindowManager", object)
    {
    }

    Display WindowManager::getDefaultDisplay()
    {
        return {m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "getDefaultDisplay", "()Landroid/view/Display;"))};
    }
}

namespace android::net
{
    Uri::Uri(jobject object)
        : Object{"android/net/Uri", object}
    {
    }

    java::lang::String Uri::getScheme() const
    {
        return {(jstring)m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "getScheme", "()Ljava/lang/String;"))};
    }

    java::lang::String Uri::getPath() const
    {
        return {(jstring)m_env->CallObjectMethod(m_object, m_env->GetMethodID(m_class, "getPath", "()Ljava/lang/String;"))};
    }

    Uri Uri::Parse(java::lang::String uriString)
    {
        JNIEnv* env{GetEnvForCurrentThread()};
        jclass cls{env->FindClass("android/net/Uri")};
        return {env->CallStaticObjectMethod(cls, env->GetStaticMethodID(cls, "parse", "(Ljava/lang/String;)Landroid/net/Uri;"), (jstring)uriString)};
    }
}
