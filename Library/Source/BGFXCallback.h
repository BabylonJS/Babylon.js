#pragma once

#ifndef WIN32
#include <alloca.h>
#define alloca(size)   __builtin_alloca(size)
#endif

#include <bgfx/bgfx.h>
#include <bgfx/platform.h>
#include <vector>

namespace Babylon
{
    struct BGFXCallback : public bgfx::CallbackI
    {
        virtual ~BGFXCallback() = default;

        virtual void fatal(const char* filePath, uint16_t line, bgfx::Fatal::Enum code, const char* str) override;
        virtual void traceVargs(const char* filePath, uint16_t line, const char* format, va_list argList) override;
        virtual void profilerBegin(const char* name, uint32_t abgr, const char* filePath, uint16_t line) override;
        virtual void profilerBeginLiteral(const char* name, uint32_t abgr, const char* filePath, uint16_t line) override;
        virtual void profilerEnd() override;
        virtual uint32_t cacheReadSize(uint64_t id) override;
        virtual bool cacheRead(uint64_t id, void* data, uint32_t size) override;
        virtual void cacheWrite(uint64_t id, const void* data, uint32_t size) override;
        virtual void screenShot(const char* filePath, uint32_t width, uint32_t height, uint32_t pitch, const void* data, uint32_t size, bool yflip) override;
        virtual void captureBegin(uint32_t width, uint32_t height, uint32_t pitch, bgfx::TextureFormat::Enum format, bool yflip) override;
        virtual void captureEnd() override;
        virtual void captureFrame(const void* _data, uint32_t _size) override;

        static std::vector<uint8_t> screenShotBitmap;

    protected:
        void trace(const char* _filePath, uint16_t _line, const char* _format, ...);
    };
}