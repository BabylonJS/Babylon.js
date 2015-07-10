//-------------------------------------------------------------------------------------
// DirectXTexUtil.cpp
//  
// DirectX Texture Library - Utilities
//
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// http://go.microsoft.com/fwlink/?LinkId=248926
//-------------------------------------------------------------------------------------

#include "directxtexp.h"

//-------------------------------------------------------------------------------------
// WIC Pixel Format Translation Data
//-------------------------------------------------------------------------------------
struct WICTranslate
{
    GUID        wic;
    DXGI_FORMAT format;
    bool        srgb;
};

static WICTranslate g_WICFormats[] = 
{
    { GUID_WICPixelFormat128bppRGBAFloat,       DXGI_FORMAT_R32G32B32A32_FLOAT,         false },

    { GUID_WICPixelFormat64bppRGBAHalf,         DXGI_FORMAT_R16G16B16A16_FLOAT,         false },
    { GUID_WICPixelFormat64bppRGBA,             DXGI_FORMAT_R16G16B16A16_UNORM,         true },

    { GUID_WICPixelFormat32bppRGBA,             DXGI_FORMAT_R8G8B8A8_UNORM,             true },
    { GUID_WICPixelFormat32bppBGRA,             DXGI_FORMAT_B8G8R8A8_UNORM,             true }, // DXGI 1.1
    { GUID_WICPixelFormat32bppBGR,              DXGI_FORMAT_B8G8R8X8_UNORM,             true }, // DXGI 1.1

    { GUID_WICPixelFormat32bppRGBA1010102XR,    DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM, true }, // DXGI 1.1
    { GUID_WICPixelFormat32bppRGBA1010102,      DXGI_FORMAT_R10G10B10A2_UNORM,          true },

    { GUID_WICPixelFormat16bppBGRA5551,         DXGI_FORMAT_B5G5R5A1_UNORM,             true },
    { GUID_WICPixelFormat16bppBGR565,           DXGI_FORMAT_B5G6R5_UNORM,               true },

    { GUID_WICPixelFormat32bppGrayFloat,        DXGI_FORMAT_R32_FLOAT,                  false },
    { GUID_WICPixelFormat16bppGrayHalf,         DXGI_FORMAT_R16_FLOAT,                  false },
    { GUID_WICPixelFormat16bppGray,             DXGI_FORMAT_R16_UNORM,                  true },
    { GUID_WICPixelFormat8bppGray,              DXGI_FORMAT_R8_UNORM,                   true },

    { GUID_WICPixelFormat8bppAlpha,             DXGI_FORMAT_A8_UNORM,                   false },

    { GUID_WICPixelFormatBlackWhite,            DXGI_FORMAT_R1_UNORM,                   false },
};

static bool g_WIC2 = false;

namespace DirectX
{

//=====================================================================================
// WIC Utilities
//=====================================================================================

_Use_decl_annotations_
DXGI_FORMAT _WICToDXGI( const GUID& guid )
{
    for( size_t i=0; i < _countof(g_WICFormats); ++i )
    {
        if ( memcmp( &g_WICFormats[i].wic, &guid, sizeof(GUID) ) == 0 )
            return g_WICFormats[i].format;
    }

#if (_WIN32_WINNT >= _WIN32_WINNT_WIN8) || defined(_WIN7_PLATFORM_UPDATE)
    if ( g_WIC2 )
    {
        if ( memcmp( &GUID_WICPixelFormat96bppRGBFloat, &guid, sizeof(GUID) ) == 0 )
            return DXGI_FORMAT_R32G32B32_FLOAT;
    }
#endif

    return DXGI_FORMAT_UNKNOWN;
}

_Use_decl_annotations_
bool _DXGIToWIC( DXGI_FORMAT format, GUID& guid, bool ignoreRGBvsBGR )
{
    switch( format )
    {
    case DXGI_FORMAT_R8G8B8A8_UNORM:
    case DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
        if ( ignoreRGBvsBGR )
        {
            // If we are not doing conversion so don't really care about BGR vs RGB color-order,
            // we can use the canonical WIC 32bppBGRA format which avoids an extra format conversion when using the WIC scaler
            memcpy( &guid, &GUID_WICPixelFormat32bppBGRA, sizeof(GUID) );
        }
        else
        {
            memcpy( &guid, &GUID_WICPixelFormat32bppRGBA, sizeof(GUID) );      
        }
        return true;

    case DXGI_FORMAT_D32_FLOAT:
        memcpy( &guid, &GUID_WICPixelFormat32bppGrayFloat, sizeof(GUID) );
        return true;

    case DXGI_FORMAT_D16_UNORM:
        memcpy( &guid, &GUID_WICPixelFormat16bppGray, sizeof(GUID) );
        return true;    

    case DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
        memcpy( &guid, &GUID_WICPixelFormat32bppBGRA, sizeof(GUID) );
        return true;

    case DXGI_FORMAT_B8G8R8X8_UNORM_SRGB:
        memcpy( &guid, &GUID_WICPixelFormat32bppBGR, sizeof(GUID) );
        return true;

#if (_WIN32_WINNT >= _WIN32_WINNT_WIN8) || defined(_WIN7_PLATFORM_UPDATE)
    case DXGI_FORMAT_R32G32B32_FLOAT:
        if ( g_WIC2 )
        {
            memcpy( &guid, &GUID_WICPixelFormat96bppRGBFloat, sizeof(GUID) );
            return true;
        }
        break;
#endif

    default:
        for( size_t i=0; i < _countof(g_WICFormats); ++i )
        {
            if ( g_WICFormats[i].format == format )
            {
                memcpy( &guid, &g_WICFormats[i].wic, sizeof(GUID) );
                return true;
            }
        }
        break;
    }

    memcpy( &guid, &GUID_NULL, sizeof(GUID) );
    return false;
}

DWORD _CheckWICColorSpace( _In_ const GUID& sourceGUID, _In_ const GUID& targetGUID )
{
    DWORD srgb = 0;

    for( size_t i=0; i < _countof(g_WICFormats); ++i )
    {
        if ( memcmp( &g_WICFormats[i].wic, &sourceGUID, sizeof(GUID) ) == 0 )
        {
            if ( g_WICFormats[i].srgb )
                srgb |= TEX_FILTER_SRGB_IN;
        }

        if ( memcmp( &g_WICFormats[i].wic, &targetGUID, sizeof(GUID) ) == 0 )
        {
            if ( g_WICFormats[i].srgb )
                srgb |= TEX_FILTER_SRGB_OUT;
        }
    }

    if ( (srgb & (TEX_FILTER_SRGB_IN|TEX_FILTER_SRGB_OUT)) == (TEX_FILTER_SRGB_IN|TEX_FILTER_SRGB_OUT) )
    {
        srgb &= ~(TEX_FILTER_SRGB_IN|TEX_FILTER_SRGB_OUT);
    }

    return srgb;
}

bool _IsWIC2()
{
    return g_WIC2;
}

IWICImagingFactory* _GetWIC()
{
    static IWICImagingFactory* s_Factory = nullptr;

    if ( s_Factory )
        return s_Factory;

#if(_WIN32_WINNT >= _WIN32_WINNT_WIN8) || defined(_WIN7_PLATFORM_UPDATE)
    HRESULT hr = CoCreateInstance(
        CLSID_WICImagingFactory2,
        nullptr,
        CLSCTX_INPROC_SERVER,
        __uuidof(IWICImagingFactory2),
        (LPVOID*)&s_Factory
        );

    if ( SUCCEEDED(hr) )
    {
        // WIC2 is available on Windows 8 and Windows 7 SP1 with KB 2670838 installed
        g_WIC2 = true;
    }
    else
    {
        hr = CoCreateInstance(
            CLSID_WICImagingFactory1,
            nullptr,
            CLSCTX_INPROC_SERVER,
            __uuidof(IWICImagingFactory),
            (LPVOID*)&s_Factory
            );

        if ( FAILED(hr) )
        {
            s_Factory = nullptr;
            return nullptr;
        }
    }
#else
    HRESULT hr = CoCreateInstance(
        CLSID_WICImagingFactory,
        nullptr,
        CLSCTX_INPROC_SERVER,
        __uuidof(IWICImagingFactory),
        (LPVOID*)&s_Factory
        );

    if ( FAILED(hr) )
    {
        s_Factory = nullptr;
        return nullptr;
    }
#endif

    return s_Factory;
}


//-------------------------------------------------------------------------------------
// Public helper function to get common WIC codec GUIDs
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
REFGUID GetWICCodec( WICCodecs codec )
{
    switch( codec )
    {
    case WIC_CODEC_BMP:
        return GUID_ContainerFormatBmp;

    case WIC_CODEC_JPEG:
        return GUID_ContainerFormatJpeg;

    case WIC_CODEC_PNG:
        return GUID_ContainerFormatPng;

    case WIC_CODEC_TIFF:
        return GUID_ContainerFormatTiff;

    case WIC_CODEC_GIF:
        return GUID_ContainerFormatGif;

    case WIC_CODEC_WMP:
        return GUID_ContainerFormatWmp;

    case WIC_CODEC_ICO:
        return GUID_ContainerFormatIco;

    default:
        return GUID_NULL;
    }
}


//=====================================================================================
// DXGI Format Utilities
//=====================================================================================

//-------------------------------------------------------------------------------------
// Returns bits-per-pixel for a given DXGI format, or 0 on failure
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
size_t BitsPerPixel( DXGI_FORMAT fmt )
{
    switch( static_cast<int>(fmt) )
    {
    case DXGI_FORMAT_R32G32B32A32_TYPELESS:
    case DXGI_FORMAT_R32G32B32A32_FLOAT:
    case DXGI_FORMAT_R32G32B32A32_UINT:
    case DXGI_FORMAT_R32G32B32A32_SINT:
        return 128;

    case DXGI_FORMAT_R32G32B32_TYPELESS:
    case DXGI_FORMAT_R32G32B32_FLOAT:
    case DXGI_FORMAT_R32G32B32_UINT:
    case DXGI_FORMAT_R32G32B32_SINT:
        return 96;

    case DXGI_FORMAT_R16G16B16A16_TYPELESS:
    case DXGI_FORMAT_R16G16B16A16_FLOAT:
    case DXGI_FORMAT_R16G16B16A16_UNORM:
    case DXGI_FORMAT_R16G16B16A16_UINT:
    case DXGI_FORMAT_R16G16B16A16_SNORM:
    case DXGI_FORMAT_R16G16B16A16_SINT:
    case DXGI_FORMAT_R32G32_TYPELESS:
    case DXGI_FORMAT_R32G32_FLOAT:
    case DXGI_FORMAT_R32G32_UINT:
    case DXGI_FORMAT_R32G32_SINT:
    case DXGI_FORMAT_R32G8X24_TYPELESS:
    case DXGI_FORMAT_D32_FLOAT_S8X24_UINT:
    case DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS:
    case DXGI_FORMAT_X32_TYPELESS_G8X24_UINT:
    case DXGI_FORMAT_Y416:
    case DXGI_FORMAT_Y210:
    case DXGI_FORMAT_Y216:
        return 64;

    case DXGI_FORMAT_R10G10B10A2_TYPELESS:
    case DXGI_FORMAT_R10G10B10A2_UNORM:
    case DXGI_FORMAT_R10G10B10A2_UINT:
    case DXGI_FORMAT_R11G11B10_FLOAT:
    case DXGI_FORMAT_R8G8B8A8_TYPELESS:
    case DXGI_FORMAT_R8G8B8A8_UNORM:
    case DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
    case DXGI_FORMAT_R8G8B8A8_UINT:
    case DXGI_FORMAT_R8G8B8A8_SNORM:
    case DXGI_FORMAT_R8G8B8A8_SINT:
    case DXGI_FORMAT_R16G16_TYPELESS:
    case DXGI_FORMAT_R16G16_FLOAT:
    case DXGI_FORMAT_R16G16_UNORM:
    case DXGI_FORMAT_R16G16_UINT:
    case DXGI_FORMAT_R16G16_SNORM:
    case DXGI_FORMAT_R16G16_SINT:
    case DXGI_FORMAT_R32_TYPELESS:
    case DXGI_FORMAT_D32_FLOAT:
    case DXGI_FORMAT_R32_FLOAT:
    case DXGI_FORMAT_R32_UINT:
    case DXGI_FORMAT_R32_SINT:
    case DXGI_FORMAT_R24G8_TYPELESS:
    case DXGI_FORMAT_D24_UNORM_S8_UINT:
    case DXGI_FORMAT_R24_UNORM_X8_TYPELESS:
    case DXGI_FORMAT_X24_TYPELESS_G8_UINT:
    case DXGI_FORMAT_R9G9B9E5_SHAREDEXP:
    case DXGI_FORMAT_R8G8_B8G8_UNORM:
    case DXGI_FORMAT_G8R8_G8B8_UNORM:
    case DXGI_FORMAT_B8G8R8A8_UNORM:
    case DXGI_FORMAT_B8G8R8X8_UNORM:
    case DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM:
    case DXGI_FORMAT_B8G8R8A8_TYPELESS:
    case DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
    case DXGI_FORMAT_B8G8R8X8_TYPELESS:
    case DXGI_FORMAT_B8G8R8X8_UNORM_SRGB:
    case DXGI_FORMAT_AYUV:
    case DXGI_FORMAT_Y410:
    case DXGI_FORMAT_YUY2:
    case 116 /* DXGI_FORMAT_R10G10B10_7E3_A2_FLOAT */:
    case 117 /* DXGI_FORMAT_R10G10B10_6E4_A2_FLOAT */:
        return 32;

    case DXGI_FORMAT_P010:
    case DXGI_FORMAT_P016:
    case 118 /* DXGI_FORMAT_D16_UNORM_S8_UINT */:
    case 119 /* DXGI_FORMAT_R16_UNORM_X8_TYPELESS */:
    case 120 /* DXGI_FORMAT_X16_TYPELESS_G8_UINT */:
        return 24;

    case DXGI_FORMAT_R8G8_TYPELESS:
    case DXGI_FORMAT_R8G8_UNORM:
    case DXGI_FORMAT_R8G8_UINT:
    case DXGI_FORMAT_R8G8_SNORM:
    case DXGI_FORMAT_R8G8_SINT:
    case DXGI_FORMAT_R16_TYPELESS:
    case DXGI_FORMAT_R16_FLOAT:
    case DXGI_FORMAT_D16_UNORM:
    case DXGI_FORMAT_R16_UNORM:
    case DXGI_FORMAT_R16_UINT:
    case DXGI_FORMAT_R16_SNORM:
    case DXGI_FORMAT_R16_SINT:
    case DXGI_FORMAT_B5G6R5_UNORM:
    case DXGI_FORMAT_B5G5R5A1_UNORM:
    case DXGI_FORMAT_A8P8:
    case DXGI_FORMAT_B4G4R4A4_UNORM:
        return 16;

    case DXGI_FORMAT_NV12:
    case DXGI_FORMAT_420_OPAQUE:
    case DXGI_FORMAT_NV11:
        return 12;

    case DXGI_FORMAT_R8_TYPELESS:
    case DXGI_FORMAT_R8_UNORM:
    case DXGI_FORMAT_R8_UINT:
    case DXGI_FORMAT_R8_SNORM:
    case DXGI_FORMAT_R8_SINT:
    case DXGI_FORMAT_A8_UNORM:
    case DXGI_FORMAT_AI44:
    case DXGI_FORMAT_IA44:
    case DXGI_FORMAT_P8:
        return 8;

    case DXGI_FORMAT_R1_UNORM:
        return 1;

    case DXGI_FORMAT_BC1_TYPELESS:
    case DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT_BC1_UNORM_SRGB:
    case DXGI_FORMAT_BC4_TYPELESS:
    case DXGI_FORMAT_BC4_UNORM:
    case DXGI_FORMAT_BC4_SNORM:
        return 4;

    case DXGI_FORMAT_BC2_TYPELESS:
    case DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT_BC2_UNORM_SRGB:
    case DXGI_FORMAT_BC3_TYPELESS:
    case DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT_BC3_UNORM_SRGB:
    case DXGI_FORMAT_BC5_TYPELESS:
    case DXGI_FORMAT_BC5_UNORM:
    case DXGI_FORMAT_BC5_SNORM:
    case DXGI_FORMAT_BC6H_TYPELESS:
    case DXGI_FORMAT_BC6H_UF16:
    case DXGI_FORMAT_BC6H_SF16:
    case DXGI_FORMAT_BC7_TYPELESS:
    case DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
        return 8;

    default:
        return 0;
    }
}


//-------------------------------------------------------------------------------------
// Returns bits-per-color-channel for a given DXGI format, or 0 on failure
// For mixed formats, it returns the largest color-depth in the format
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
size_t BitsPerColor( DXGI_FORMAT fmt )
{
    switch( static_cast<int>(fmt) )
    {
    case DXGI_FORMAT_R32G32B32A32_TYPELESS:
    case DXGI_FORMAT_R32G32B32A32_FLOAT:
    case DXGI_FORMAT_R32G32B32A32_UINT:
    case DXGI_FORMAT_R32G32B32A32_SINT:
    case DXGI_FORMAT_R32G32B32_TYPELESS:
    case DXGI_FORMAT_R32G32B32_FLOAT:
    case DXGI_FORMAT_R32G32B32_UINT:
    case DXGI_FORMAT_R32G32B32_SINT:
    case DXGI_FORMAT_R32G32_TYPELESS:
    case DXGI_FORMAT_R32G32_FLOAT:
    case DXGI_FORMAT_R32G32_UINT:
    case DXGI_FORMAT_R32G32_SINT:
    case DXGI_FORMAT_R32G8X24_TYPELESS:
    case DXGI_FORMAT_D32_FLOAT_S8X24_UINT:
    case DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS:
    case DXGI_FORMAT_X32_TYPELESS_G8X24_UINT:
    case DXGI_FORMAT_R32_TYPELESS:
    case DXGI_FORMAT_D32_FLOAT:
    case DXGI_FORMAT_R32_FLOAT:
    case DXGI_FORMAT_R32_UINT:
    case DXGI_FORMAT_R32_SINT:
        return 32;

    case DXGI_FORMAT_R24G8_TYPELESS:
    case DXGI_FORMAT_D24_UNORM_S8_UINT:
    case DXGI_FORMAT_R24_UNORM_X8_TYPELESS:
    case DXGI_FORMAT_X24_TYPELESS_G8_UINT:
        return 24;

    case DXGI_FORMAT_R16G16B16A16_TYPELESS:
    case DXGI_FORMAT_R16G16B16A16_FLOAT:
    case DXGI_FORMAT_R16G16B16A16_UNORM:
    case DXGI_FORMAT_R16G16B16A16_UINT:
    case DXGI_FORMAT_R16G16B16A16_SNORM:
    case DXGI_FORMAT_R16G16B16A16_SINT:
    case DXGI_FORMAT_R16G16_TYPELESS:
    case DXGI_FORMAT_R16G16_FLOAT:
    case DXGI_FORMAT_R16G16_UNORM:
    case DXGI_FORMAT_R16G16_UINT:
    case DXGI_FORMAT_R16G16_SNORM:
    case DXGI_FORMAT_R16G16_SINT:
    case DXGI_FORMAT_R16_TYPELESS:
    case DXGI_FORMAT_R16_FLOAT:
    case DXGI_FORMAT_D16_UNORM:
    case DXGI_FORMAT_R16_UNORM:
    case DXGI_FORMAT_R16_UINT:
    case DXGI_FORMAT_R16_SNORM:
    case DXGI_FORMAT_R16_SINT:
    case DXGI_FORMAT_BC6H_TYPELESS:
    case DXGI_FORMAT_BC6H_UF16:
    case DXGI_FORMAT_BC6H_SF16:
    case DXGI_FORMAT_Y416:
    case DXGI_FORMAT_P016:
    case DXGI_FORMAT_Y216:
        return 16;

    case DXGI_FORMAT_R9G9B9E5_SHAREDEXP:
        return 14;

    case DXGI_FORMAT_R11G11B10_FLOAT:
        return 11;

    case DXGI_FORMAT_R10G10B10A2_TYPELESS:
    case DXGI_FORMAT_R10G10B10A2_UNORM:
    case DXGI_FORMAT_R10G10B10A2_UINT:
    case DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM:
    case DXGI_FORMAT_Y410:
    case DXGI_FORMAT_P010:
    case DXGI_FORMAT_Y210:
        return 10;

    case DXGI_FORMAT_R8G8B8A8_TYPELESS:
    case DXGI_FORMAT_R8G8B8A8_UNORM:
    case DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
    case DXGI_FORMAT_R8G8B8A8_UINT:
    case DXGI_FORMAT_R8G8B8A8_SNORM:
    case DXGI_FORMAT_R8G8B8A8_SINT:
    case DXGI_FORMAT_R8G8_TYPELESS:
    case DXGI_FORMAT_R8G8_UNORM:
    case DXGI_FORMAT_R8G8_UINT:
    case DXGI_FORMAT_R8G8_SNORM:
    case DXGI_FORMAT_R8G8_SINT:
    case DXGI_FORMAT_R8_TYPELESS:
    case DXGI_FORMAT_R8_UNORM:
    case DXGI_FORMAT_R8_UINT:
    case DXGI_FORMAT_R8_SNORM:
    case DXGI_FORMAT_R8_SINT:
    case DXGI_FORMAT_A8_UNORM:
    case DXGI_FORMAT_R8G8_B8G8_UNORM:
    case DXGI_FORMAT_G8R8_G8B8_UNORM:
    case DXGI_FORMAT_BC4_TYPELESS:
    case DXGI_FORMAT_BC4_UNORM:
    case DXGI_FORMAT_BC4_SNORM:
    case DXGI_FORMAT_BC5_TYPELESS:
    case DXGI_FORMAT_BC5_UNORM:
    case DXGI_FORMAT_BC5_SNORM:
    case DXGI_FORMAT_B8G8R8A8_UNORM:
    case DXGI_FORMAT_B8G8R8X8_UNORM:
    case DXGI_FORMAT_B8G8R8A8_TYPELESS:
    case DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
    case DXGI_FORMAT_B8G8R8X8_TYPELESS:
    case DXGI_FORMAT_B8G8R8X8_UNORM_SRGB:
    case DXGI_FORMAT_AYUV:
    case DXGI_FORMAT_NV12:
    case DXGI_FORMAT_420_OPAQUE:
    case DXGI_FORMAT_YUY2:
    case DXGI_FORMAT_NV11:
        return 8;

    case DXGI_FORMAT_BC7_TYPELESS:
    case DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
        return 7;

    case DXGI_FORMAT_BC1_TYPELESS:
    case DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT_BC1_UNORM_SRGB:
    case DXGI_FORMAT_BC2_TYPELESS:
    case DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT_BC2_UNORM_SRGB:
    case DXGI_FORMAT_BC3_TYPELESS:
    case DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT_BC3_UNORM_SRGB:
    case DXGI_FORMAT_B5G6R5_UNORM:
        return 6;

    case DXGI_FORMAT_B5G5R5A1_UNORM:
        return 5;

    case DXGI_FORMAT_B4G4R4A4_UNORM:
        return 4;

    case DXGI_FORMAT_R1_UNORM:
        return 1;

    case 116 /* DXGI_FORMAT_R10G10B10_7E3_A2_FLOAT */:
    case 117 /* DXGI_FORMAT_R10G10B10_6E4_A2_FLOAT */:
        // These are Xbox One platform specific types
        return 10;

    case 118 /* DXGI_FORMAT_D16_UNORM_S8_UINT */:
    case 119 /* DXGI_FORMAT_R16_UNORM_X8_TYPELESS */:
    case 120 /* DXGI_FORMAT_X16_TYPELESS_G8_UINT */:
        // These are Xbox One platform specific types
        return 16;

    case DXGI_FORMAT_AI44:
    case DXGI_FORMAT_IA44:
    case DXGI_FORMAT_P8:
    case DXGI_FORMAT_A8P8:
        // Palettized formats return 0 for this function

    default:
        return 0;
    }
}


//-------------------------------------------------------------------------------------
// Computes the image row pitch in bytes, and the slice ptich (size in bytes of the image)
// based on DXGI format, width, and height
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
void ComputePitch( DXGI_FORMAT fmt, size_t width, size_t height,
                   size_t& rowPitch, size_t& slicePitch, DWORD flags )
{
    assert( IsValid(fmt) );

    if ( IsCompressed(fmt) )
    {
        size_t bpb = ( fmt == DXGI_FORMAT_BC1_TYPELESS
                     || fmt == DXGI_FORMAT_BC1_UNORM
                     || fmt == DXGI_FORMAT_BC1_UNORM_SRGB
                     || fmt == DXGI_FORMAT_BC4_TYPELESS
                     || fmt == DXGI_FORMAT_BC4_UNORM
                     || fmt == DXGI_FORMAT_BC4_SNORM) ? 8 : 16;
        size_t nbw = std::max<size_t>( 1, (width + 3) / 4 );
        size_t nbh = std::max<size_t>( 1, (height + 3) / 4 );
        rowPitch = nbw * bpb;

        slicePitch = rowPitch * nbh;
    }
    else if ( IsPacked(fmt) )
    {
        size_t bpe = ( fmt == DXGI_FORMAT_Y210 || fmt == DXGI_FORMAT_Y216 ) ? 8 : 4;
        rowPitch = ( ( width + 1 ) >> 1 ) * bpe;

        slicePitch = rowPitch * height;
    }
    else if ( fmt == DXGI_FORMAT_NV11 )
    {
        rowPitch = ( ( width + 3 ) >> 2 ) * 4;

        // Direct3D makes this simplifying assumption, although it is larger than the 4:1:1 data
        slicePitch = rowPitch * height * 2;
    }
    else if ( IsPlanar(fmt) )
    {
        size_t bpe = ( fmt == DXGI_FORMAT_P010 || fmt == DXGI_FORMAT_P016
                       || fmt == DXGI_FORMAT(118 /* DXGI_FORMAT_D16_UNORM_S8_UINT */)
                       || fmt == DXGI_FORMAT(119 /* DXGI_FORMAT_R16_UNORM_X8_TYPELESS */)
                       || fmt == DXGI_FORMAT(120 /* DXGI_FORMAT_X16_TYPELESS_G8_UINT */) ) ? 4 : 2;
        rowPitch = ( ( width + 1 ) >> 1 ) * bpe;

        slicePitch = rowPitch * ( height + ( ( height + 1 ) >> 1 ) );
    }
    else
    {
        size_t bpp;

        if ( flags & CP_FLAGS_24BPP )
            bpp = 24;
        else if ( flags & CP_FLAGS_16BPP )
            bpp = 16;
        else if ( flags & CP_FLAGS_8BPP )
            bpp = 8;
        else
            bpp = BitsPerPixel( fmt );

        if ( flags & CP_FLAGS_LEGACY_DWORD )
        {
            // Special computation for some incorrectly created DDS files based on
            // legacy DirectDraw assumptions about pitch alignment
            rowPitch = ( ( width * bpp + 31 ) / 32 ) * sizeof(uint32_t);
            slicePitch = rowPitch * height;
        }
        else if ( flags & CP_FLAGS_PARAGRAPH )
        {
            rowPitch = ( ( width * bpp + 127 ) / 128 ) * 16;
            slicePitch = rowPitch * height;
        }
        else
        {
            rowPitch = ( width * bpp + 7 ) / 8;
            slicePitch = rowPitch * height;
        }
    }
}


//-------------------------------------------------------------------------------------
// Converts to an SRGB equivalent type if available
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
DXGI_FORMAT MakeSRGB( DXGI_FORMAT fmt )
{
    switch( fmt )
    {
    case DXGI_FORMAT_R8G8B8A8_UNORM:
        return DXGI_FORMAT_R8G8B8A8_UNORM_SRGB;

    case DXGI_FORMAT_BC1_UNORM:
        return DXGI_FORMAT_BC1_UNORM_SRGB;

    case DXGI_FORMAT_BC2_UNORM:
        return DXGI_FORMAT_BC2_UNORM_SRGB;

    case DXGI_FORMAT_BC3_UNORM:
        return DXGI_FORMAT_BC3_UNORM_SRGB;

    case DXGI_FORMAT_B8G8R8A8_UNORM:
        return DXGI_FORMAT_B8G8R8A8_UNORM_SRGB;

    case DXGI_FORMAT_B8G8R8X8_UNORM:
        return DXGI_FORMAT_B8G8R8X8_UNORM_SRGB;

    case DXGI_FORMAT_BC7_UNORM:
        return DXGI_FORMAT_BC7_UNORM_SRGB;

    default:
        return fmt;
    }
}


//-------------------------------------------------------------------------------------
// Converts to a format to an equivalent TYPELESS format if available
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
DXGI_FORMAT MakeTypeless( DXGI_FORMAT fmt )
{
    switch( fmt )
    {
    case DXGI_FORMAT_R32G32B32A32_FLOAT:
    case DXGI_FORMAT_R32G32B32A32_UINT:
    case DXGI_FORMAT_R32G32B32A32_SINT:
        return DXGI_FORMAT_R32G32B32A32_TYPELESS;

    case DXGI_FORMAT_R32G32B32_FLOAT:
    case DXGI_FORMAT_R32G32B32_UINT:
    case DXGI_FORMAT_R32G32B32_SINT:
        return DXGI_FORMAT_R32G32B32_TYPELESS;

    case DXGI_FORMAT_R16G16B16A16_FLOAT:
    case DXGI_FORMAT_R16G16B16A16_UNORM:
    case DXGI_FORMAT_R16G16B16A16_UINT:
    case DXGI_FORMAT_R16G16B16A16_SNORM:
    case DXGI_FORMAT_R16G16B16A16_SINT:
        return DXGI_FORMAT_R16G16B16A16_TYPELESS;

    case DXGI_FORMAT_R32G32_FLOAT:
    case DXGI_FORMAT_R32G32_UINT:
    case DXGI_FORMAT_R32G32_SINT:
        return DXGI_FORMAT_R32G32_TYPELESS;

    case DXGI_FORMAT_R10G10B10A2_UNORM:
    case DXGI_FORMAT_R10G10B10A2_UINT:
        return DXGI_FORMAT_R10G10B10A2_TYPELESS;

    case DXGI_FORMAT_R8G8B8A8_UNORM:
    case DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
    case DXGI_FORMAT_R8G8B8A8_UINT:
    case DXGI_FORMAT_R8G8B8A8_SNORM:
    case DXGI_FORMAT_R8G8B8A8_SINT:
        return DXGI_FORMAT_R8G8B8A8_TYPELESS;

    case DXGI_FORMAT_R16G16_FLOAT:
    case DXGI_FORMAT_R16G16_UNORM:
    case DXGI_FORMAT_R16G16_UINT:
    case DXGI_FORMAT_R16G16_SNORM:
    case DXGI_FORMAT_R16G16_SINT:
        return DXGI_FORMAT_R16G16_TYPELESS;

    case DXGI_FORMAT_D32_FLOAT:
    case DXGI_FORMAT_R32_FLOAT:
    case DXGI_FORMAT_R32_UINT:
    case DXGI_FORMAT_R32_SINT:
        return DXGI_FORMAT_R32_TYPELESS;

    case DXGI_FORMAT_R8G8_UNORM:
    case DXGI_FORMAT_R8G8_UINT:
    case DXGI_FORMAT_R8G8_SNORM:
    case DXGI_FORMAT_R8G8_SINT:
        return DXGI_FORMAT_R8G8_TYPELESS;

    case DXGI_FORMAT_R16_FLOAT:
    case DXGI_FORMAT_D16_UNORM:
    case DXGI_FORMAT_R16_UNORM:
    case DXGI_FORMAT_R16_UINT:
    case DXGI_FORMAT_R16_SNORM:
    case DXGI_FORMAT_R16_SINT:
        return DXGI_FORMAT_R16_TYPELESS;

    case DXGI_FORMAT_R8_UNORM:
    case DXGI_FORMAT_R8_UINT:
    case DXGI_FORMAT_R8_SNORM:
    case DXGI_FORMAT_R8_SINT:
    case DXGI_FORMAT_A8_UNORM:
        return DXGI_FORMAT_R8_TYPELESS;

    case DXGI_FORMAT_BC1_UNORM:
    case DXGI_FORMAT_BC1_UNORM_SRGB:
        return DXGI_FORMAT_BC1_TYPELESS;

    case DXGI_FORMAT_BC2_UNORM:
    case DXGI_FORMAT_BC2_UNORM_SRGB:
        return DXGI_FORMAT_BC2_TYPELESS;

    case DXGI_FORMAT_BC3_UNORM:
    case DXGI_FORMAT_BC3_UNORM_SRGB:
        return DXGI_FORMAT_BC3_TYPELESS;

    case DXGI_FORMAT_BC4_UNORM:
    case DXGI_FORMAT_BC4_SNORM:
        return DXGI_FORMAT_BC4_TYPELESS;

    case DXGI_FORMAT_BC5_UNORM:
    case DXGI_FORMAT_BC5_SNORM:
        return DXGI_FORMAT_BC5_TYPELESS;

    case DXGI_FORMAT_B8G8R8A8_UNORM:
    case DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
        return DXGI_FORMAT_B8G8R8A8_TYPELESS;

    case DXGI_FORMAT_B8G8R8X8_UNORM:
    case DXGI_FORMAT_B8G8R8X8_UNORM_SRGB:
        return DXGI_FORMAT_B8G8R8X8_TYPELESS;

    case DXGI_FORMAT_BC6H_UF16:
    case DXGI_FORMAT_BC6H_SF16:
        return DXGI_FORMAT_BC6H_TYPELESS;

    case DXGI_FORMAT_BC7_UNORM:
    case DXGI_FORMAT_BC7_UNORM_SRGB:
        return DXGI_FORMAT_BC7_TYPELESS;

    default:
        return fmt;
    }
}


//-------------------------------------------------------------------------------------
// Converts to a TYPELESS format to an equivalent UNORM format if available
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
DXGI_FORMAT MakeTypelessUNORM( DXGI_FORMAT fmt )
{
    switch( fmt )
    {
    case DXGI_FORMAT_R16G16B16A16_TYPELESS:
        return DXGI_FORMAT_R16G16B16A16_UNORM;

    case DXGI_FORMAT_R10G10B10A2_TYPELESS:
        return DXGI_FORMAT_R10G10B10A2_UNORM;

    case DXGI_FORMAT_R8G8B8A8_TYPELESS:
        return DXGI_FORMAT_R8G8B8A8_UNORM;

    case DXGI_FORMAT_R16G16_TYPELESS:
        return DXGI_FORMAT_R16G16_UNORM;

    case DXGI_FORMAT_R8G8_TYPELESS:
        return DXGI_FORMAT_R8G8_UNORM;

    case DXGI_FORMAT_R16_TYPELESS:
        return DXGI_FORMAT_R16_UNORM;

    case DXGI_FORMAT_R8_TYPELESS:
        return DXGI_FORMAT_R8_UNORM;

    case DXGI_FORMAT_BC1_TYPELESS:
        return DXGI_FORMAT_BC1_UNORM;

    case DXGI_FORMAT_BC2_TYPELESS:
        return DXGI_FORMAT_BC2_UNORM;

    case DXGI_FORMAT_BC3_TYPELESS:
        return DXGI_FORMAT_BC3_UNORM;

    case DXGI_FORMAT_BC4_TYPELESS:
        return DXGI_FORMAT_BC4_UNORM;

    case DXGI_FORMAT_BC5_TYPELESS:
        return DXGI_FORMAT_BC5_UNORM;

    case DXGI_FORMAT_B8G8R8A8_TYPELESS:
        return DXGI_FORMAT_B8G8R8A8_UNORM;

    case DXGI_FORMAT_B8G8R8X8_TYPELESS:
        return DXGI_FORMAT_B8G8R8X8_UNORM;

    case DXGI_FORMAT_BC7_TYPELESS:
        return DXGI_FORMAT_BC7_UNORM;

    default:
        return fmt;
    }
}


//-------------------------------------------------------------------------------------
// Converts to a TYPELESS format to an equivalent FLOAT format if available
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
DXGI_FORMAT MakeTypelessFLOAT( DXGI_FORMAT fmt )
{
    switch( fmt )
    {
    case DXGI_FORMAT_R32G32B32A32_TYPELESS:
        return DXGI_FORMAT_R32G32B32A32_FLOAT;

    case DXGI_FORMAT_R32G32B32_TYPELESS:
        return DXGI_FORMAT_R32G32B32_FLOAT;

    case DXGI_FORMAT_R16G16B16A16_TYPELESS:
        return DXGI_FORMAT_R16G16B16A16_FLOAT;

    case DXGI_FORMAT_R32G32_TYPELESS:
        return DXGI_FORMAT_R32G32_FLOAT;

    case DXGI_FORMAT_R16G16_TYPELESS:
        return DXGI_FORMAT_R16G16_FLOAT;

    case DXGI_FORMAT_R32_TYPELESS:
        return DXGI_FORMAT_R32_FLOAT;

    case DXGI_FORMAT_R16_TYPELESS:
        return DXGI_FORMAT_R16_FLOAT;

    default:
        return fmt;
    }
}


//=====================================================================================
// TexMetadata
//=====================================================================================

_Use_decl_annotations_
size_t TexMetadata::ComputeIndex( size_t mip, size_t item, size_t slice ) const
{
    if ( mip >= mipLevels )
        return size_t(-1);

    switch( dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
    case TEX_DIMENSION_TEXTURE2D:
        if ( slice > 0 )
            return size_t(-1);

        if ( item >= arraySize )
            return size_t(-1);

        return (item*( mipLevels ) + mip);

    case TEX_DIMENSION_TEXTURE3D:
        if ( item > 0 )
        {
            // No support for arrays of volumes
            return size_t(-1);
        }
        else
        {
            size_t index = 0;
            size_t d = depth;

            for( size_t level = 0; level < mip; ++level )
            {
                index += d;
                if ( d > 1 )
                    d >>= 1;
            }

            if ( slice >= d )
                return size_t(-1);

            index += slice;

            return index;
        }
        break;

    default:
        return size_t(-1);
    }
}


//=====================================================================================
// Blob - Bitmap image container
//=====================================================================================

Blob& Blob::operator= (Blob&& moveFrom)
{
    if ( this != &moveFrom )
    {
        Release();

        _buffer = moveFrom._buffer;
        _size = moveFrom._size;

        moveFrom._buffer = nullptr;
        moveFrom._size = 0;
    }
    return *this;
}

void Blob::Release()
{
    if ( _buffer )
    {
        _aligned_free( _buffer );
        _buffer = nullptr;
    }

    _size = 0;
}

_Use_decl_annotations_
HRESULT Blob::Initialize( size_t size )
{
    if ( !size )
        return E_INVALIDARG;

    Release();

    _buffer = _aligned_malloc( size, 16 );
    if ( !_buffer )
    {
        Release();
        return E_OUTOFMEMORY;
    }

    _size = size;

    return S_OK;
}

}; // namespace
