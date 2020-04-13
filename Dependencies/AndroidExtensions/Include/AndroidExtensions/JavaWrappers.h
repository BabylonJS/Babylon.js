#pragma once

#include <jni.h>
#include <string>
#include <vector>
#include <cstddef>
#include <android/asset_manager.h>

// --------------------
// Forward Declarations
// --------------------

namespace java::lang
{
    class ByteArray;
    class Object;
    class String;
}

namespace java::io
{
    class ByteArrayOutputStream;
    class InputStream;
}

namespace java::net
{
    class HttpURLConnection;
    class URL;
    class URLConnection;
}

namespace android::content
{
    class Context;
}

namespace android::content::res
{
    class AssetManager;
}

namespace android::net
{
    class Uri;
}

// ------------
// Declarations
// ------------

namespace java::lang
{
    class ByteArray
    {
    public:
        ByteArray(int size);
        ByteArray(jbyteArray byteArray);

        operator jbyteArray() const;

        operator std::vector<std::byte>() const;

    protected:
        JNIEnv* m_env;
        jbyteArray m_byteArray;
    };

    class Object
    {
    public:
        operator jobject() const;

    protected:
        Object(const char* className, jobject object);

        JNIEnv* m_env;
        const jclass m_class;
        jobject m_object;
    };

    class String
    {
    public:
        String(jstring string);
        String(const char* string);

        operator jstring() const;

        operator std::string() const;

    protected:
        JNIEnv* m_env;
        jstring m_string;
    };
}

namespace java::io
{
    class ByteArrayOutputStream : public lang::Object
    {
    public:
        ByteArrayOutputStream();
        ByteArrayOutputStream(jobject object);

        void Write(lang::ByteArray b, int off, int len);

        lang::ByteArray ToByteArray() const;

        lang::String ToString(const char* charsetName) const;
    };

    class InputStream : public lang::Object
    {
    public:
        InputStream(jobject object);

        int Read(lang::ByteArray byteArray) const;
    };
}

namespace java::net
{
    class HttpURLConnection : public lang::Object
    {
    public:
        HttpURLConnection(jobject object);

        int GetResponseCode() const;
    };

    class URL : public lang::Object
    {
    public:
        URL(jobject object);
        URL(lang::String url);

        URLConnection OpenConnection();

        lang::String ToString();
    };

    class URLConnection : public lang::Object
    {
    public:
        URLConnection(jobject object);

        void Connect();

        URL GetURL() const;

        io::InputStream GetInputStream() const;

        explicit operator HttpURLConnection() const;
    };
}

namespace android::content
{
    class Context : public java::lang::Object
    {
    public:
        Context(jobject object);

        res::AssetManager getAssets() const;
    };
}

namespace android::content::res
{
    class AssetManager : public java::lang::Object
    {
    public:
        AssetManager(jobject object);

        operator AAssetManager*() const;
    };
}

namespace android::net
{
    class Uri : public java::lang::Object
    {
    public:
        Uri(jobject object);

        java::lang::String getScheme() const;

        java::lang::String getPath() const;

        static Uri Parse(java::lang::String uriString);
    };
}
