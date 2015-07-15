//-------------------------------------------------------------------------------------
// DirectXTexTGA.cpp
//  
// DirectX Texture Library - Targa Truevision (TGA) file format reader/writer
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

//
// The implementation here has the following limitations:
//      * Does not support files that contain color maps (these are rare in practice)
//      * Interleaved files are not supported (deprecated aspect of TGA format)
//      * Only supports 8-bit grayscale; 16-, 24-, and 32-bit truecolor images
//      * Always writes uncompressed files (i.e. can read RLE compression, but does not write it)
//

enum TGAImageType
{
    TGA_NO_IMAGE            = 0,
    TGA_COLOR_MAPPED        = 1,
    TGA_TRUECOLOR           = 2,
    TGA_BLACK_AND_WHITE     = 3,
    TGA_COLOR_MAPPED_RLE    = 9,
    TGA_TRUECOLOR_RLE       = 10,
    TGA_BLACK_AND_WHITE_RLE = 11,
};

enum TGADescriptorFlags
{
    TGA_FLAGS_INVERTX           = 0x10,
    TGA_FLAGS_INVERTY           = 0x20,
    TGA_FLAGS_INTERLEAVED_2WAY  = 0x40, // Deprecated
    TGA_FLAGS_INTERLEAVED_4WAY  = 0x80, // Deprecated
};

const char* g_TGA20_Signature = "TRUEVISION-XFILE.";

#pragma pack(push,1)
struct TGA_HEADER
{
    uint8_t     bIDLength;
    uint8_t     bColorMapType;
    uint8_t     bImageType;
    uint16_t    wColorMapFirst;
    uint16_t    wColorMapLength;
    uint8_t     bColorMapSize;
    uint16_t    wXOrigin;
    uint16_t    wYOrigin;
    uint16_t    wWidth;
    uint16_t    wHeight;
    uint8_t     bBitsPerPixel;
    uint8_t     bDescriptor;
};

struct TGA_FOOTER
{
    uint16_t    dwExtensionOffset;
    uint16_t    dwDeveloperOffset;
    char        Signature[18];
};

struct TGA_EXTENSION
{
    uint16_t    wSize;
    char        szAuthorName[41];
    char        szAuthorComment[324];
    uint16_t    wStampMonth;
    uint16_t    wStampDay;
    uint16_t    wStampYear;
    uint16_t    wStampHour;
    uint16_t    wStampMinute;
    uint16_t    wStampSecond;
    char        szJobName[41];
    uint16_t    wJobHour;
    uint16_t    wJobMinute;
    uint16_t    wJobSecond;
    char        szSoftwareId[41];
    uint16_t    wVersionNumber;
    uint8_t     bVersionLetter;
    uint32_t    dwKeyColor;
    uint16_t    wPixelNumerator;
    uint16_t    wPixelDenominator;
    uint16_t    wGammaNumerator;
    uint16_t    wGammaDenominator;
    uint32_t    dwColorOffset;
    uint32_t    dwStampOffset;
    uint32_t    dwScanOffset;
    uint8_t     bAttributesType;
};
#pragma pack(pop)

enum CONVERSION_FLAGS
{
    CONV_FLAGS_NONE     = 0x0,
    CONV_FLAGS_EXPAND   = 0x1,      // Conversion requires expanded pixel size
    CONV_FLAGS_INVERTX  = 0x2,      // If set, scanlines are right-to-left
    CONV_FLAGS_INVERTY  = 0x4,      // If set, scanlines are top-to-bottom
    CONV_FLAGS_RLE      = 0x8,      // Source data is RLE compressed

    CONV_FLAGS_SWIZZLE  = 0x10000,  // Swizzle BGR<->RGB data
    CONV_FLAGS_888      = 0x20000,  // 24bpp format
};

namespace DirectX
{

//-------------------------------------------------------------------------------------
// Decodes TGA header
//-------------------------------------------------------------------------------------
static HRESULT _DecodeTGAHeader( _In_reads_bytes_(size) LPCVOID pSource, size_t size, _Out_ TexMetadata& metadata, size_t& offset,
                                 _Inout_opt_ DWORD* convFlags )
{
    if ( !pSource )
        return E_INVALIDARG;

    memset( &metadata, 0, sizeof(TexMetadata) );

    if ( size < sizeof(TGA_HEADER) )
    {
        return HRESULT_FROM_WIN32( ERROR_INVALID_DATA );
    }

    auto pHeader = reinterpret_cast<const TGA_HEADER*>( pSource );

    if ( pHeader->bColorMapType != 0
         || pHeader->wColorMapLength != 0 )
    {
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    if ( pHeader->bDescriptor & (TGA_FLAGS_INTERLEAVED_2WAY|TGA_FLAGS_INTERLEAVED_4WAY) )
    {
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    if ( !pHeader->wWidth || !pHeader->wHeight )
    {
        return HRESULT_FROM_WIN32( ERROR_INVALID_DATA );
    }
         
    switch ( pHeader->bImageType )
    {
    case TGA_TRUECOLOR:
    case TGA_TRUECOLOR_RLE:
        switch( pHeader->bBitsPerPixel )
        {
        case 16:
            metadata.format = DXGI_FORMAT_B5G5R5A1_UNORM;
            break;

        case 24:
            metadata.format = DXGI_FORMAT_R8G8B8A8_UNORM;
            if ( convFlags )
                *convFlags |= CONV_FLAGS_EXPAND;
            // We could use DXGI_FORMAT_B8G8R8X8_UNORM, but we prefer DXGI 1.0 formats
            break;

        case 32:
            metadata.format = DXGI_FORMAT_R8G8B8A8_UNORM;
            // We could use DXGI_FORMAT_B8G8R8A8_UNORM, but we prefer DXGI 1.0 formats
            break;
        }

        if ( convFlags && (pHeader->bImageType == TGA_TRUECOLOR_RLE) )
        {
            *convFlags |= CONV_FLAGS_RLE;
        }
        break;

    case TGA_BLACK_AND_WHITE:
    case TGA_BLACK_AND_WHITE_RLE:
        switch( pHeader->bBitsPerPixel )
        {
        case 8:
            metadata.format = DXGI_FORMAT_R8_UNORM;
            break;

        default:
            return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
        }

        if ( convFlags && (pHeader->bImageType == TGA_BLACK_AND_WHITE_RLE) )
        {
            *convFlags |= CONV_FLAGS_RLE;
        }
        break;

    case TGA_NO_IMAGE:
    case TGA_COLOR_MAPPED:
    case TGA_COLOR_MAPPED_RLE:
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    default:
        return HRESULT_FROM_WIN32( ERROR_INVALID_DATA );
    }

    metadata.width = pHeader->wWidth;
    metadata.height = pHeader->wHeight;
    metadata.depth = metadata.arraySize = metadata.mipLevels = 1;
    metadata.dimension = TEX_DIMENSION_TEXTURE2D;

    if ( convFlags )
    {
        if ( pHeader->bDescriptor & TGA_FLAGS_INVERTX )
            *convFlags |= CONV_FLAGS_INVERTX;

        if ( pHeader->bDescriptor & TGA_FLAGS_INVERTY )
            *convFlags |= CONV_FLAGS_INVERTY;
    }

    offset = sizeof( TGA_HEADER );

    if ( pHeader->bIDLength != 0 )
    {
        offset += pHeader->bIDLength;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Set alpha for images with all 0 alpha channel
//-------------------------------------------------------------------------------------
static HRESULT _SetAlphaChannelToOpaque( _In_ const Image* image )
{
    assert( image );

    auto pPixels = reinterpret_cast<uint8_t*>( image->pixels );
    if ( !pPixels )
        return E_POINTER;

    for( size_t y = 0; y < image->height; ++y )
    {
        _CopyScanline( pPixels, image->rowPitch, pPixels, image->rowPitch, image->format, TEXP_SCANLINE_SETALPHA );
        pPixels += image->rowPitch;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Uncompress pixel data from a TGA into the target image
//-------------------------------------------------------------------------------------
static HRESULT _UncompressPixels( _In_reads_bytes_(size) LPCVOID pSource, size_t size, _In_ const Image* image, _In_ DWORD convFlags )
{
    assert( pSource && size > 0 );

    if ( !image || !image->pixels )
        return E_POINTER;

    // Compute TGA image data pitch
    size_t rowPitch;
    if ( convFlags & CONV_FLAGS_EXPAND )
    {
        rowPitch = image->width * 3;
    }
    else
    {
        size_t slicePitch;
        ComputePitch( image->format, image->width, image->height, rowPitch, slicePitch, CP_FLAGS_NONE );
    }

    auto sPtr = reinterpret_cast<const uint8_t*>( pSource );
    const uint8_t* endPtr = sPtr + size;

    switch( image->format )
    {
    //--------------------------------------------------------------------------- 8-bit
    case DXGI_FORMAT_R8_UNORM:
        for( size_t y=0; y < image->height; ++y )
        {
            size_t offset = ( (convFlags & CONV_FLAGS_INVERTX ) ? (image->width - 1) : 0 );
            assert( offset < rowPitch);

            uint8_t* dPtr = reinterpret_cast<uint8_t*>( image->pixels )
                         + ( image->rowPitch * ( (convFlags & CONV_FLAGS_INVERTY) ? y : (image->height - y - 1) ) )
                         + offset;

            for( size_t x=0; x < image->width; )
            {
                if ( sPtr >= endPtr )
                    return E_FAIL;

                if ( *sPtr & 0x80 )
                {
                    // Repeat
                    size_t j = (*sPtr & 0x7F) + 1;
                    if ( ++sPtr >= endPtr )
                        return E_FAIL;

                    for( ; j > 0; --j, ++x )
                    {
                        if ( x >= image->width )
                            return E_FAIL;

                        *dPtr = *sPtr;

                        if ( convFlags & CONV_FLAGS_INVERTX )
                            --dPtr;
                        else
                            ++dPtr;
                    }

                    ++sPtr;
                }
                else
                {
                    // Literal
                    size_t j = (*sPtr & 0x7F) + 1;
                    ++sPtr;

                    if ( sPtr+j > endPtr )
                        return E_FAIL;

                    for( ; j > 0; --j, ++x )
                    {
                        if ( x >= image->width )
                            return E_FAIL;

                        *dPtr = *(sPtr++);

                        if ( convFlags & CONV_FLAGS_INVERTX )
                            --dPtr;
                        else
                            ++dPtr;
                    }
                }
            }
        }
        break;

    //-------------------------------------------------------------------------- 16-bit
    case DXGI_FORMAT_B5G5R5A1_UNORM:
        {
            bool nonzeroa = false;
            for( size_t y=0; y < image->height; ++y )
            {
                size_t offset = ( (convFlags & CONV_FLAGS_INVERTX ) ? (image->width - 1) : 0 );
                assert( offset*2 < rowPitch);

                uint16_t* dPtr = reinterpret_cast<uint16_t*>( reinterpret_cast<uint8_t*>( image->pixels )
                             + ( image->rowPitch * ( (convFlags & CONV_FLAGS_INVERTY) ? y : (image->height - y - 1) ) ) )
                             + offset;

                for( size_t x=0; x < image->width; )
                {
                    if ( sPtr >= endPtr )
                        return E_FAIL;

                    if ( *sPtr & 0x80 )
                    {
                        // Repeat
                        size_t j = (*sPtr & 0x7F) + 1;
                        ++sPtr;

                        if ( sPtr+1 >= endPtr )
                            return E_FAIL;

                        uint16_t t =  *sPtr | (*(sPtr+1) << 8);
                        if ( t & 0x8000 )
                            nonzeroa = true;
                        sPtr += 2;

                        for( ; j > 0; --j, ++x )
                        {
                            if ( x >= image->width )
                                return E_FAIL;

                            *dPtr = t;

                            if ( convFlags & CONV_FLAGS_INVERTX )
                                --dPtr;
                            else
                                ++dPtr;
                        }
                    }
                    else
                    {
                        // Literal
                        size_t j = (*sPtr & 0x7F) + 1;
                        ++sPtr;

                        if ( sPtr+(j*2) > endPtr )
                            return E_FAIL;

                        for( ; j > 0; --j, ++x )
                        {
                            if ( x >= image->width )
                                return E_FAIL;

                            uint16_t t =  *sPtr | (*(sPtr+1) << 8);
                            if ( t & 0x8000 )
                                nonzeroa = true;
                            sPtr += 2;
                            *dPtr = t;

                            if ( convFlags & CONV_FLAGS_INVERTX )
                                --dPtr;
                            else
                                ++dPtr;
                        }
                    }
                }
            }

            // If there are no non-zero alpha channel entries, we'll assume alpha is not used and force it to opaque
            if ( !nonzeroa )
            {
                HRESULT hr = _SetAlphaChannelToOpaque( image );
                if ( FAILED(hr) )
                    return hr;
            }
        }
        break;

    //----------------------------------------------------------------------- 24/32-bit
    case DXGI_FORMAT_R8G8B8A8_UNORM:
        {
            bool nonzeroa = false;
            for( size_t y=0; y < image->height; ++y )
            {
                size_t offset = ( (convFlags & CONV_FLAGS_INVERTX ) ? (image->width - 1) : 0 );

                uint32_t* dPtr = reinterpret_cast<uint32_t*>( reinterpret_cast<uint8_t*>( image->pixels )
                              + ( image->rowPitch * ( (convFlags & CONV_FLAGS_INVERTY) ? y : (image->height - y - 1) ) ) )
                              + offset;

                for( size_t x=0; x < image->width; )
                {
                    if ( sPtr >= endPtr )
                        return E_FAIL;

                    if ( *sPtr & 0x80 )
                    {
                        // Repeat
                        size_t j = (*sPtr & 0x7F) + 1;
                        ++sPtr;

                        DWORD t;
                        if ( convFlags & CONV_FLAGS_EXPAND )
                        {
                            assert( offset*3 < rowPitch);

                            if ( sPtr+2 >= endPtr )
                                return E_FAIL;

                            // BGR -> RGBA
                            t = ( *sPtr << 16 ) | ( *(sPtr+1) << 8 ) | ( *(sPtr+2) ) | 0xFF000000;
                            sPtr += 3;

                            nonzeroa = true;
                        }
                        else
                        {
                            assert( offset*4 < rowPitch);

                            if ( sPtr+3 >= endPtr )
                                return E_FAIL;

                            // BGRA -> RGBA
                            t = ( *sPtr << 16 ) | ( *(sPtr+1) << 8 ) | ( *(sPtr+2) ) | ( *(sPtr+3) << 24 );

                            if ( *(sPtr+3) > 0 )
                                nonzeroa = true;

                            sPtr += 4;
                        }

                        for( ; j > 0; --j, ++x )
                        {
                            if ( x >= image->width )
                                return E_FAIL;

                            *dPtr = t;

                            if ( convFlags & CONV_FLAGS_INVERTX )
                                --dPtr;
                            else
                                ++dPtr;
                        }
                    }
                    else
                    {
                        // Literal
                        size_t j = (*sPtr & 0x7F) + 1;
                        ++sPtr;

                        if ( convFlags & CONV_FLAGS_EXPAND )
                        {
                            if ( sPtr+(j*3) > endPtr )
                                return E_FAIL;
                        }
                        else
                        {
                            if ( sPtr+(j*4) > endPtr )
                                return E_FAIL;
                        }

                        for( ; j > 0; --j, ++x )
                        {
                            if ( x >= image->width )
                                return E_FAIL;

                            if ( convFlags & CONV_FLAGS_EXPAND )
                            {
                                assert( offset*3 < rowPitch);

                                if ( sPtr+2 >= endPtr )
                                    return E_FAIL;

                                // BGR -> RGBA
                                *dPtr = ( *sPtr << 16 ) | ( *(sPtr+1) << 8 ) | ( *(sPtr+2) ) | 0xFF000000;
                                sPtr += 3;

                                nonzeroa = true;
                            }
                            else
                            {
                                assert( offset*4 < rowPitch);

                                if ( sPtr+3 >= endPtr )
                                    return E_FAIL;

                                // BGRA -> RGBA
                                *dPtr = ( *sPtr << 16 ) | ( *(sPtr+1) << 8 ) | ( *(sPtr+2) ) | ( *(sPtr+3) << 24 );

                                if ( *(sPtr+3) > 0 )
                                    nonzeroa = true;

                                sPtr += 4;
                            }

                            if ( convFlags & CONV_FLAGS_INVERTX )
                                --dPtr;
                            else
                                ++dPtr;
                        }
                    }
                }
            }

            // If there are no non-zero alpha channel entries, we'll assume alpha is not used and force it to opaque
            if ( !nonzeroa )
            {
                HRESULT hr = _SetAlphaChannelToOpaque( image );
                if ( FAILED(hr) )
                    return hr;
            }
        }
        break;

    //---------------------------------------------------------------------------------
    default:
        return E_FAIL;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Copies pixel data from a TGA into the target image
//-------------------------------------------------------------------------------------
static HRESULT _CopyPixels( _In_reads_bytes_(size) LPCVOID pSource, size_t size, _In_ const Image* image, _In_ DWORD convFlags )
{
    assert( pSource && size > 0 );

    if ( !image || !image->pixels )
        return E_POINTER;

    // Compute TGA image data pitch
    size_t rowPitch;
    if ( convFlags & CONV_FLAGS_EXPAND )
    {
        rowPitch = image->width * 3;
    }
    else
    {
        size_t slicePitch;
        ComputePitch( image->format, image->width, image->height, rowPitch, slicePitch, CP_FLAGS_NONE );
    }

    const uint8_t* sPtr = reinterpret_cast<const uint8_t*>( pSource );
    const uint8_t* endPtr = sPtr + size;

    switch( image->format )
    {
    //--------------------------------------------------------------------------- 8-bit
    case DXGI_FORMAT_R8_UNORM:
        for( size_t y=0; y < image->height; ++y )
        {
            size_t offset = ( (convFlags & CONV_FLAGS_INVERTX ) ? (image->width - 1) : 0 );
            assert( offset < rowPitch);

            uint8_t* dPtr = reinterpret_cast<uint8_t*>( image->pixels )
                         + ( image->rowPitch * ( (convFlags & CONV_FLAGS_INVERTY) ? y : (image->height - y - 1) ) )
                         + offset;

            for( size_t x=0; x < image->width; ++x )
            {
                if ( sPtr >= endPtr )
                    return E_FAIL;

                *dPtr = *(sPtr++);

                if ( convFlags & CONV_FLAGS_INVERTX )
                    --dPtr;
                else
                    ++dPtr;
            }
        }
        break;

    //-------------------------------------------------------------------------- 16-bit
    case DXGI_FORMAT_B5G5R5A1_UNORM:
        {
            bool nonzeroa = false;
            for( size_t y=0; y < image->height; ++y )
            {
                size_t offset = ( (convFlags & CONV_FLAGS_INVERTX ) ? (image->width - 1) : 0 );
                assert( offset*2 < rowPitch);

                uint16_t* dPtr = reinterpret_cast<uint16_t*>( reinterpret_cast<uint8_t*>( image->pixels )
                             + ( image->rowPitch * ( (convFlags & CONV_FLAGS_INVERTY) ? y : (image->height - y - 1) ) ) )
                             + offset;

                for( size_t x=0; x < image->width; ++x )
                {
                    if ( sPtr+1 >= endPtr )
                        return E_FAIL;

                    uint16_t t =  *sPtr | (*(sPtr+1) << 8);
                    sPtr += 2;
                    *dPtr = t;

                    if ( t & 0x8000 )
                        nonzeroa = true;

                    if ( convFlags & CONV_FLAGS_INVERTX )
                        --dPtr;
                    else
                        ++dPtr;
                }
            }

            // If there are no non-zero alpha channel entries, we'll assume alpha is not used and force it to opaque
            if ( !nonzeroa )
            {
                HRESULT hr = _SetAlphaChannelToOpaque( image );
                if ( FAILED(hr) )
                    return hr;
            }
        }
        break;

    //----------------------------------------------------------------------- 24/32-bit
    case DXGI_FORMAT_R8G8B8A8_UNORM:
        {
            bool nonzeroa = false;
            for( size_t y=0; y < image->height; ++y )
            {
                size_t offset = ( (convFlags & CONV_FLAGS_INVERTX ) ? (image->width - 1) : 0 );

                uint32_t* dPtr = reinterpret_cast<uint32_t*>( reinterpret_cast<uint8_t*>( image->pixels )
                              + ( image->rowPitch * ( (convFlags & CONV_FLAGS_INVERTY) ? y : (image->height - y - 1) ) ) )
                              + offset;

                for( size_t x=0; x < image->width; ++x )
                {
                    if ( convFlags & CONV_FLAGS_EXPAND )
                    {
                        assert( offset*3 < rowPitch);

                        if ( sPtr+2 >= endPtr )
                            return E_FAIL;

                        // BGR -> RGBA
                        *dPtr = ( *sPtr << 16 ) | ( *(sPtr+1) << 8 ) | ( *(sPtr+2) ) | 0xFF000000;
                        sPtr += 3;

                        nonzeroa = true;
                    }
                    else
                    {
                        assert( offset*4 < rowPitch);

                        if ( sPtr+3 >= endPtr )
                            return E_FAIL;

                        // BGRA -> RGBA
                        *dPtr = ( *sPtr << 16 ) | ( *(sPtr+1) << 8 ) | ( *(sPtr+2) ) | ( *(sPtr+3) << 24 );

                        if ( *(sPtr+3) > 0 )
                            nonzeroa = true;

                        sPtr += 4;
                    }

                    if ( convFlags & CONV_FLAGS_INVERTX )
                        --dPtr;
                    else
                        ++dPtr;
                }
            }

            // If there are no non-zero alpha channel entries, we'll assume alpha is not used and force it to opaque
            if ( !nonzeroa )
            {
                HRESULT hr = _SetAlphaChannelToOpaque( image );
                if ( FAILED(hr) )
                    return hr;
            }
        }
        break;

    //---------------------------------------------------------------------------------
    default:
        return E_FAIL;
    }

    return S_OK;   
}


//-------------------------------------------------------------------------------------
// Encodes TGA file header
//-------------------------------------------------------------------------------------
static HRESULT _EncodeTGAHeader( _In_ const Image& image, _Out_ TGA_HEADER& header, _Inout_ DWORD& convFlags )
{
    memset( &header, 0, sizeof(TGA_HEADER) );

    if ( (image.width > 0xFFFF)
         || (image.height > 0xFFFF) )
    {
         return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    header.wWidth = static_cast<uint16_t>( image.width );
    header.wHeight = static_cast<uint16_t>( image.height );

    switch( image.format )
    {
    case DXGI_FORMAT_R8G8B8A8_UNORM:
    case DXGI_FORMAT_R8G8B8A8_UNORM_SRGB:
        header.bImageType = TGA_TRUECOLOR;
        header.bBitsPerPixel = 32;
        header.bDescriptor = TGA_FLAGS_INVERTY | 8;
        convFlags |= CONV_FLAGS_SWIZZLE;
        break;

    case DXGI_FORMAT_B8G8R8A8_UNORM:
    case DXGI_FORMAT_B8G8R8A8_UNORM_SRGB:
        header.bImageType = TGA_TRUECOLOR;
        header.bBitsPerPixel = 32;
        header.bDescriptor = TGA_FLAGS_INVERTY | 8;
        break;

    case DXGI_FORMAT_B8G8R8X8_UNORM:
    case DXGI_FORMAT_B8G8R8X8_UNORM_SRGB:
        header.bImageType = TGA_TRUECOLOR;
        header.bBitsPerPixel = 24;
        header.bDescriptor = TGA_FLAGS_INVERTY;
        convFlags |= CONV_FLAGS_888;
        break;

    case DXGI_FORMAT_R8_UNORM:
    case DXGI_FORMAT_A8_UNORM:
        header.bImageType = TGA_BLACK_AND_WHITE;
        header.bBitsPerPixel = 8;
        header.bDescriptor = TGA_FLAGS_INVERTY;
        break;

    case DXGI_FORMAT_B5G5R5A1_UNORM:
        header.bImageType = TGA_TRUECOLOR;
        header.bBitsPerPixel = 16;
        header.bDescriptor = TGA_FLAGS_INVERTY | 1;
        break;

    default:
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Copies BGRX data to form BGR 24bpp data
//-------------------------------------------------------------------------------------
#pragma warning(suppress: 6001 6101) // In the case where outSize is insufficient we do not write to pDestination
static void _Copy24bppScanline( _Out_writes_bytes_(outSize) LPVOID pDestination, _In_ size_t outSize, 
                                _In_reads_bytes_(inSize) LPCVOID pSource, _In_ size_t inSize )
{
    assert( pDestination && outSize > 0 );
    assert( pSource && inSize > 0 );

    assert( pDestination != pSource );

    const uint32_t * __restrict sPtr = reinterpret_cast<const uint32_t*>(pSource);
    uint8_t * __restrict dPtr = reinterpret_cast<uint8_t*>(pDestination);

    if ( inSize >= 4 && outSize >= 3 )
    {
        const uint8_t* endPtr = dPtr + outSize;

        for( size_t count = 0; count < ( inSize - 3 ); count += 4 )
        {
            uint32_t t = *(sPtr++);

            if ( dPtr+3 > endPtr )
                return;

            *(dPtr++) = uint8_t(t & 0xFF);              // Blue
            *(dPtr++) = uint8_t((t & 0xFF00) >> 8);     // Green
            *(dPtr++) = uint8_t((t & 0xFF0000) >> 16);  // Red
        }
    }
}


//=====================================================================================
// Entry-points
//=====================================================================================

//-------------------------------------------------------------------------------------
// Obtain metadata from TGA file in memory/on disk
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT GetMetadataFromTGAMemory( LPCVOID pSource, size_t size, TexMetadata& metadata )
{
    if ( !pSource || size == 0 )
        return E_INVALIDARG;

    size_t offset;
    return _DecodeTGAHeader( pSource, size, metadata, offset, 0 );
}

_Use_decl_annotations_
HRESULT GetMetadataFromTGAFile( LPCWSTR szFile, TexMetadata& metadata )
{
    if ( !szFile )
        return E_INVALIDARG;

#if (_WIN32_WINNT >= _WIN32_WINNT_WIN8)
    ScopedHandle hFile( safe_handle( CreateFile2( szFile, GENERIC_READ, FILE_SHARE_READ, OPEN_EXISTING, 0 ) ) );
#else
    ScopedHandle hFile( safe_handle( CreateFileW( szFile, GENERIC_READ, FILE_SHARE_READ, 0, OPEN_EXISTING,
                                                  FILE_FLAG_SEQUENTIAL_SCAN, 0 ) ) );
#endif
    if ( !hFile )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    // Get the file size
    LARGE_INTEGER fileSize = {0};

#if (_WIN32_WINNT >= _WIN32_WINNT_VISTA)
    FILE_STANDARD_INFO fileInfo;
    if ( !GetFileInformationByHandleEx( hFile.get(), FileStandardInfo, &fileInfo, sizeof(fileInfo) ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }
    fileSize = fileInfo.EndOfFile;
#else
    if ( !GetFileSizeEx( hFile.get(), &fileSize ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }
#endif

    // File is too big for 32-bit allocation, so reject read (4 GB should be plenty large enough for a valid TGA file)
    if ( fileSize.HighPart > 0 )
    {
        return HRESULT_FROM_WIN32( ERROR_FILE_TOO_LARGE );
    }

    // Need at least enough data to fill the standard header to be a valid TGA
    if ( fileSize.LowPart < ( sizeof(TGA_HEADER) ) )
    {
        return E_FAIL;
    }

    // Read the standard header (we don't need the file footer to parse the file)
    uint8_t header[sizeof(TGA_HEADER)];
    DWORD bytesRead = 0;
    if ( !ReadFile( hFile.get(), header, sizeof(TGA_HEADER), &bytesRead, 0 ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    size_t offset;
    return _DecodeTGAHeader( header, bytesRead, metadata, offset, 0 );
}


//-------------------------------------------------------------------------------------
// Load a TGA file in memory
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT LoadFromTGAMemory( LPCVOID pSource, size_t size, TexMetadata* metadata, ScratchImage& image )
{
    if ( !pSource || size == 0 )
        return E_INVALIDARG;

    image.Release();

    size_t offset;
    DWORD convFlags = 0;
    TexMetadata mdata;
    HRESULT hr = _DecodeTGAHeader( pSource, size, mdata, offset, &convFlags );
    if ( FAILED(hr) )
        return hr;

    if ( offset > size )
        return E_FAIL;

    auto pPixels = reinterpret_cast<LPCVOID>( reinterpret_cast<const uint8_t*>(pSource) + offset );

    size_t remaining = size - offset;
    if ( remaining == 0 )
        return E_FAIL;

    hr = image.Initialize2D( mdata.format, mdata.width, mdata.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;

    if ( convFlags & CONV_FLAGS_RLE )
    {
        hr = _UncompressPixels( pPixels, remaining, image.GetImage(0,0,0), convFlags );
    }
    else
    {
        hr = _CopyPixels( pPixels, remaining, image.GetImage(0,0,0), convFlags );
    }

    if ( FAILED(hr) )
    {
        image.Release();
        return hr;
    }

    if ( metadata )
        memcpy( metadata, &mdata, sizeof(TexMetadata) );

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Load a TGA file from disk
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT LoadFromTGAFile( LPCWSTR szFile, TexMetadata* metadata, ScratchImage& image )
{
    if ( !szFile )
        return E_INVALIDARG;

    image.Release();

#if (_WIN32_WINNT >= _WIN32_WINNT_WIN8)
    ScopedHandle hFile( safe_handle( CreateFile2( szFile, GENERIC_READ, FILE_SHARE_READ, OPEN_EXISTING, 0 ) ) );
#else
    ScopedHandle hFile( safe_handle( CreateFileW( szFile, GENERIC_READ, FILE_SHARE_READ, 0, OPEN_EXISTING,
                                                  FILE_FLAG_SEQUENTIAL_SCAN, 0 ) ) );
#endif
    if ( !hFile )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    // Get the file size
    LARGE_INTEGER fileSize = {0};

#if (_WIN32_WINNT >= _WIN32_WINNT_VISTA)
    FILE_STANDARD_INFO fileInfo;
    if ( !GetFileInformationByHandleEx( hFile.get(), FileStandardInfo, &fileInfo, sizeof(fileInfo) ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }
    fileSize = fileInfo.EndOfFile;
#else
    if ( !GetFileSizeEx( hFile.get(), &fileSize ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }
#endif

    // File is too big for 32-bit allocation, so reject read (4 GB should be plenty large enough for a valid TGA file)
    if ( fileSize.HighPart > 0 )
    {
        return HRESULT_FROM_WIN32( ERROR_FILE_TOO_LARGE );
    }

    // Need at least enough data to fill the header to be a valid TGA
    if ( fileSize.LowPart < sizeof(TGA_HEADER) )
    {
        return E_FAIL;
    }

    // Read the header
    uint8_t header[sizeof(TGA_HEADER)];
    DWORD bytesRead = 0;
    if ( !ReadFile( hFile.get(), header, sizeof(TGA_HEADER), &bytesRead, 0 ) )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    size_t offset;
    DWORD convFlags = 0;
    TexMetadata mdata;
    HRESULT hr = _DecodeTGAHeader( header, bytesRead, mdata, offset, &convFlags );
    if ( FAILED(hr) )
        return hr;

    // Read the pixels
    DWORD remaining = static_cast<DWORD>( fileSize.LowPart - offset );
    if ( remaining == 0 )
        return E_FAIL;

    if ( offset > sizeof(TGA_HEADER) )
    {
        // Skip past the id string
        LARGE_INTEGER filePos = { static_cast<DWORD>(offset), 0 };
        if ( !SetFilePointerEx( hFile.get(), filePos, 0, FILE_BEGIN ) )
        {
            return HRESULT_FROM_WIN32( GetLastError() );
        }
    }

    hr = image.Initialize2D( mdata.format, mdata.width, mdata.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;

    assert( image.GetPixels() );

    if ( !(convFlags & (CONV_FLAGS_RLE | CONV_FLAGS_EXPAND | CONV_FLAGS_INVERTX)) && (convFlags & CONV_FLAGS_INVERTY) )
    {
        // This case we can read directly into the image buffer in place
        if ( !ReadFile( hFile.get(), image.GetPixels(), static_cast<DWORD>( image.GetPixelsSize() ), &bytesRead, 0 ) )
        {
            image.Release();
            return HRESULT_FROM_WIN32( GetLastError() );
        }

        if ( bytesRead != image.GetPixelsSize() )
        {
            image.Release();
            return E_FAIL;
        }

        switch( mdata.format  )
        {
        case DXGI_FORMAT_R8G8B8A8_UNORM:
            {
                // TGA stores 32-bit data in BGRA form, need to swizzle to RGBA
                assert( image.GetImageCount() == 1 );
                const Image* img = image.GetImage(0,0,0);
                if ( !img )
                    return E_POINTER;

                uint8_t *pPixels = img->pixels;
                if ( !pPixels )
                    return E_POINTER;

                size_t rowPitch = img->rowPitch;

                // Scan for non-zero alpha channel
                bool nonzeroa = false;

                for( size_t h = 0; h < img->height; ++h )
                {
                    const uint32_t* sPtr = reinterpret_cast<const uint32_t*>( pPixels );

                    for( size_t x=0; x < img->width; ++x )
                    {
                        if ( (*sPtr) & 0xff000000 )
                        {
                            nonzeroa = true;
                            break;
                        }

                        ++sPtr;
                    }

                    if ( nonzeroa )
                        break;

                    pPixels += rowPitch;
                }

                DWORD tflags = ( !nonzeroa ) ? TEXP_SCANLINE_SETALPHA : TEXP_SCANLINE_NONE;

                // Swizzle scanlines
                pPixels = img->pixels;

                for( size_t h = 0; h < img->height; ++h )
                {
                    _SwizzleScanline( pPixels, rowPitch, pPixels, rowPitch, mdata.format, tflags );
                    pPixels += rowPitch;
                }
            }
            break;

        // If we start using DXGI_FORMAT_B8G8R8X8_UNORM or DXGI_FORMAT_B8G8R8A8_UNORM we need to check for a fully 0 alpha channel
     
        case DXGI_FORMAT_B5G5R5A1_UNORM:
            {
                assert( image.GetImageCount() == 1 );
                const Image* img = image.GetImage(0,0,0);
                if ( !img )
                    return E_POINTER;

                // Scan for non-zero alpha channel
                bool nonzeroa = false;

                const uint8_t *pPixels = img->pixels;
                if ( !pPixels )
                    return E_POINTER;

                size_t rowPitch = img->rowPitch;

                for( size_t h = 0; h < img->height; ++h )
                {
                    const uint16_t* sPtr = reinterpret_cast<const uint16_t*>( pPixels );

                    for( size_t x=0; x < img->width; ++x )
                    {
                        if ( *sPtr & 0x8000 )
                        {
                            nonzeroa = true;
                            break;
                        }

                        ++sPtr;
                    }

                    if ( nonzeroa )
                        break;

                    pPixels += rowPitch;
                }

                // If there are no non-zero alpha channel entries, we'll assume alpha is not used and force it to opaque
                if ( !nonzeroa )
                {
                    hr = _SetAlphaChannelToOpaque( img );
                    if ( FAILED(hr) )
                        return hr;
                }
            }
            break;
        }
    }
    else // RLE || EXPAND || INVERTX || !INVERTY
    {
        std::unique_ptr<uint8_t[]> temp( new (std::nothrow) uint8_t[ remaining ] );
        if ( !temp )
        {
            image.Release();
            return E_OUTOFMEMORY;
        }

        if ( !ReadFile( hFile.get(), temp.get(), remaining, &bytesRead, 0 ) )
        {
            image.Release();
            return HRESULT_FROM_WIN32( GetLastError() );
        }

        if ( bytesRead != remaining )
        {
            image.Release();
            return E_FAIL;
        }

        if ( convFlags & CONV_FLAGS_RLE )
        {
            hr = _UncompressPixels( temp.get(), remaining, image.GetImage(0,0,0), convFlags );
        }
        else
        {
            hr = _CopyPixels( temp.get(), remaining, image.GetImage(0,0,0), convFlags );
        }

        if ( FAILED(hr) )
        {
            image.Release();
            return hr;
        }
    }

    if ( metadata )
        memcpy( metadata, &mdata, sizeof(TexMetadata) );

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Save a TGA file to memory
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT SaveToTGAMemory( const Image& image, Blob& blob )
{
    if ( !image.pixels )
        return E_POINTER;

    TGA_HEADER tga_header;
    DWORD convFlags = 0;
    HRESULT hr = _EncodeTGAHeader( image, tga_header, convFlags );
    if ( FAILED(hr) )
        return hr;

    blob.Release();

    // Determine memory required for image data
    size_t rowPitch, slicePitch;
    if ( convFlags & CONV_FLAGS_888 )
    {
        rowPitch = image.width * 3;
        slicePitch = image.height * rowPitch;
    }
    else
    {
        ComputePitch( image.format, image.width, image.height, rowPitch, slicePitch, CP_FLAGS_NONE );
    }

    hr = blob.Initialize( sizeof(TGA_HEADER) + slicePitch );
    if ( FAILED(hr) )
        return hr;

    // Copy header
    auto dPtr = reinterpret_cast<uint8_t*>( blob.GetBufferPointer() );
    assert( dPtr != 0 );
    memcpy_s( dPtr, blob.GetBufferSize(), &tga_header, sizeof(TGA_HEADER) );
    dPtr += sizeof(TGA_HEADER);

    auto pPixels = reinterpret_cast<const uint8_t*>( image.pixels );
    assert( pPixels );

    for( size_t y = 0; y < image.height; ++y )
    {
        // Copy pixels
        if ( convFlags & CONV_FLAGS_888 )
        {
            _Copy24bppScanline( dPtr, rowPitch, pPixels, image.rowPitch );
        }
        else if ( convFlags & CONV_FLAGS_SWIZZLE )
        {
            _SwizzleScanline( dPtr, rowPitch, pPixels, image.rowPitch, image.format, TEXP_SCANLINE_NONE );
        }
        else
        {
            _CopyScanline( dPtr, rowPitch, pPixels, image.rowPitch, image.format, TEXP_SCANLINE_NONE );
        }

        dPtr += rowPitch;
        pPixels += image.rowPitch;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Save a TGA file to disk
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT SaveToTGAFile( const Image& image, LPCWSTR szFile )
{
    if ( !szFile )
        return E_INVALIDARG;

    if ( !image.pixels )
        return E_POINTER;

    TGA_HEADER tga_header;
    DWORD convFlags = 0;
    HRESULT hr = _EncodeTGAHeader( image, tga_header, convFlags );
    if ( FAILED(hr) )
        return hr;

    // Create file and write header
#if (_WIN32_WINNT >= _WIN32_WINNT_WIN8)
    ScopedHandle hFile( safe_handle( CreateFile2( szFile, GENERIC_WRITE, 0, CREATE_ALWAYS, 0 ) ) );
#else
    ScopedHandle hFile( safe_handle( CreateFileW( szFile, GENERIC_WRITE, 0, 0, CREATE_ALWAYS, 0, 0 ) ) );
#endif
    if ( !hFile )
    {
        return HRESULT_FROM_WIN32( GetLastError() );
    }

    // Determine size for TGA pixel data
    size_t rowPitch, slicePitch;
    if ( convFlags & CONV_FLAGS_888 )
    {
        rowPitch = image.width * 3;
        slicePitch = image.height * rowPitch;
    }
    else
    {
        ComputePitch( image.format, image.width, image.height, rowPitch, slicePitch, CP_FLAGS_NONE );
    }

    if ( slicePitch < 65535 )
    {
        // For small images, it is better to create an in-memory file and write it out
        Blob blob;

        hr = SaveToTGAMemory( image, blob );
        if ( FAILED(hr) )
            return hr;

        // Write blob
        const DWORD bytesToWrite = static_cast<DWORD>( blob.GetBufferSize() );
        DWORD bytesWritten;
        if ( !WriteFile( hFile.get(), blob.GetBufferPointer(), bytesToWrite,
                         &bytesWritten, 0 ) )
        {
            return HRESULT_FROM_WIN32( GetLastError() );
        }

        if ( bytesWritten != bytesToWrite )
        {
            return E_FAIL;
        }
    }
    else
    {
        // Otherwise, write the image one scanline at a time...
        std::unique_ptr<uint8_t[]> temp( new (std::nothrow) uint8_t[ rowPitch ] );
        if ( !temp )
            return E_OUTOFMEMORY;

        // Write header
        DWORD bytesWritten;
        if ( !WriteFile( hFile.get(), &tga_header, sizeof(TGA_HEADER), &bytesWritten, 0 ) )
        {
            return HRESULT_FROM_WIN32( GetLastError() );
        }

        if ( bytesWritten != sizeof(TGA_HEADER) )
            return E_FAIL;

        // Write pixels
        auto pPixels = reinterpret_cast<const uint8_t*>( image.pixels );

        for( size_t y = 0; y < image.height; ++y )
        {
            // Copy pixels
            if ( convFlags & CONV_FLAGS_888 )
            {
                _Copy24bppScanline( temp.get(), rowPitch, pPixels, image.rowPitch );
            }
            else if ( convFlags & CONV_FLAGS_SWIZZLE )
            {
                _SwizzleScanline( temp.get(), rowPitch, pPixels, image.rowPitch, image.format, TEXP_SCANLINE_NONE );
            }
            else
            {
                _CopyScanline( temp.get(), rowPitch, pPixels, image.rowPitch, image.format, TEXP_SCANLINE_NONE );
            }

            pPixels += image.rowPitch;

            if ( !WriteFile( hFile.get(), temp.get(), static_cast<DWORD>( rowPitch ), &bytesWritten, 0 ) )
            {
                return HRESULT_FROM_WIN32( GetLastError() );
            }

            if ( bytesWritten != rowPitch )
                return E_FAIL;
        }
    }

    return S_OK;
}

}; // namespace
