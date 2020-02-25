#pragma once

#ifndef WIN32
#include <alloca.h>
#define alloca(size) __builtin_alloca(size)
#endif

#include <bgfx/bgfx.h>
#include <bgfx/platform.h>
#include <vector>

namespace Babylon
{
    struct BgfxCallback : public bgfx::CallbackI
    {
        virtual ~BgfxCallback() = default;

        std::vector<uint8_t> m_screenShotBitmap;

    protected:
        void fatal(const char* filePath, uint16_t line, bgfx::Fatal::Enum code, const char* str) override;
        void traceVargs(const char* filePath, uint16_t line, const char* format, va_list argList) override;
        void profilerBegin(const char* name, uint32_t abgr, const char* filePath, uint16_t line) override;
        void profilerBeginLiteral(const char* name, uint32_t abgr, const char* filePath, uint16_t line) override;
        void profilerEnd() override;
        uint32_t cacheReadSize(uint64_t id) override;
        bool cacheRead(uint64_t id, void* data, uint32_t size) override;
        void cacheWrite(uint64_t id, const void* data, uint32_t size) override;
        void screenShot(const char* filePath, uint32_t width, uint32_t height, uint32_t pitch, const void* data, uint32_t size, bool yflip) override;
        void captureBegin(uint32_t width, uint32_t height, uint32_t pitch, bgfx::TextureFormat::Enum format, bool yflip) override;
        void captureEnd() override;
        void captureFrame(const void* _data, uint32_t _size) override;
        void trace(const char* _filePath, uint16_t _line, const char* _format, ...);
    };
}