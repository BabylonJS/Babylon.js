//-------------------------------------------------------------------------------------
// DirectXTexResize.cpp
//  
// DirectX Texture Library - Image resizing operations
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

#include "filters.h"

using Microsoft::WRL::ComPtr;

namespace DirectX
{

//-------------------------------------------------------------------------------------
// WIC related helper functions
//-------------------------------------------------------------------------------------

extern HRESULT _ResizeSeparateColorAndAlpha( _In_ IWICImagingFactory* pWIC, _In_ IWICBitmap* original,
                                             _In_ size_t newWidth, _In_ size_t newHeight, _In_ DWORD filter, _Inout_ const Image* img );

//--- Do image resize using WIC ---
static HRESULT _PerformResizeUsingWIC( _In_ const Image& srcImage, _In_ DWORD filter,
                                       _In_ const WICPixelFormatGUID& pfGUID, _In_ const Image& destImage )
{
    if ( !srcImage.pixels || !destImage.pixels )
        return E_POINTER;

    assert( srcImage.format == destImage.format );

    IWICImagingFactory* pWIC = _GetWIC();
    if ( !pWIC )
        return E_NOINTERFACE;

    ComPtr<IWICComponentInfo> componentInfo;
    HRESULT hr = pWIC->CreateComponentInfo( pfGUID, componentInfo.GetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    ComPtr<IWICPixelFormatInfo2> pixelFormatInfo;
    hr = componentInfo.As( &pixelFormatInfo );
    if ( FAILED(hr) )
        return hr;

    BOOL supportsTransparency = FALSE;
    hr = pixelFormatInfo->SupportsTransparency( &supportsTransparency );
    if ( FAILED(hr) )
        return hr;

    ComPtr<IWICBitmap> source;
    hr = pWIC->CreateBitmapFromMemory( static_cast<UINT>( srcImage.width ), static_cast<UINT>( srcImage.height ), pfGUID,
                                       static_cast<UINT>( srcImage.rowPitch ), static_cast<UINT>( srcImage.slicePitch ),
                                       srcImage.pixels, source.GetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    if ( (filter & TEX_FILTER_SEPARATE_ALPHA) && supportsTransparency )
    {
        hr = _ResizeSeparateColorAndAlpha( pWIC, source.Get(), destImage.width, destImage.height, filter, &destImage );
        if ( FAILED(hr) )
            return hr;
    }
    else
    {
        ComPtr<IWICBitmapScaler> scaler;
        hr = pWIC->CreateBitmapScaler( scaler.GetAddressOf() );
        if ( FAILED(hr) )
            return hr;

        hr = scaler->Initialize( source.Get(), static_cast<UINT>( destImage.width ), static_cast<UINT>( destImage.height ), _GetWICInterp( filter ) );
        if ( FAILED(hr) )
            return hr;

        WICPixelFormatGUID pfScaler;
        hr = scaler->GetPixelFormat( &pfScaler );
        if ( FAILED(hr) )
            return hr;

        if ( memcmp( &pfScaler, &pfGUID, sizeof(WICPixelFormatGUID) ) == 0 )
        {
            hr = scaler->CopyPixels( 0, static_cast<UINT>( destImage.rowPitch ), static_cast<UINT>( destImage.slicePitch ), destImage.pixels );
            if ( FAILED(hr) )
                return hr;
        }
        else
        {
            // The WIC bitmap scaler is free to return a different pixel format than the source image, so here we
            // convert it back
            ComPtr<IWICFormatConverter> FC;
            hr = pWIC->CreateFormatConverter( FC.GetAddressOf() );
            if ( FAILED(hr) )
                return hr;

            hr = FC->Initialize( scaler.Get(), pfGUID, _GetWICDither( filter ), 0, 0, WICBitmapPaletteTypeCustom );
            if ( FAILED(hr) )
                return hr;

            hr = FC->CopyPixels( 0, static_cast<UINT>( destImage.rowPitch ), static_cast<UINT>( destImage.slicePitch ), destImage.pixels );  
            if ( FAILED(hr) )
                return hr;
        }
    }

    return S_OK;
}


//--- Do conversion, resize using WIC, conversion cycle ---
static HRESULT _PerformResizeViaF32( _In_ const Image& srcImage, _In_ DWORD filter, _In_ const Image& destImage )
{
    if ( !srcImage.pixels || !destImage.pixels )
        return E_POINTER;

    assert( srcImage.format != DXGI_FORMAT_R32G32B32A32_FLOAT );
    assert( srcImage.format == destImage.format );

    ScratchImage temp;
    HRESULT hr = _ConvertToR32G32B32A32( srcImage, temp );
    if ( FAILED(hr) )
        return hr;

    const Image *tsrc = temp.GetImage( 0, 0, 0 );
    if ( !tsrc )
        return E_POINTER;

    ScratchImage rtemp;
    hr = rtemp.Initialize2D( DXGI_FORMAT_R32G32B32A32_FLOAT, destImage.width, destImage.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;

    const Image *tdest = rtemp.GetImage( 0, 0, 0 );
    if ( !tdest )
        return E_POINTER;

    hr = _PerformResizeUsingWIC( *tsrc, filter, GUID_WICPixelFormat128bppRGBAFloat, *tdest );
    if ( FAILED(hr) )
        return hr;

    temp.Release();

    hr = _ConvertFromR32G32B32A32( *tdest, destImage );
    if ( FAILED(hr) )
        return hr;

    return S_OK;
}


//--- determine when to use WIC vs. non-WIC paths ---
static bool _UseWICFiltering( _In_ DXGI_FORMAT format, _In_ DWORD filter )
{
    if ( filter & TEX_FILTER_FORCE_NON_WIC )
    {
        // Explicit flag indicates use of non-WIC code paths
        return false;
    }

    if ( filter & TEX_FILTER_FORCE_WIC )
    {
        // Explicit flag to use WIC code paths, skips all the case checks below
        return true;
    }

    if ( IsSRGB(format) || (filter & TEX_FILTER_SRGB) )
    {
        // Use non-WIC code paths for sRGB correct filtering
        return false;
    }

    static_assert( TEX_FILTER_POINT == 0x100000, "TEX_FILTER_ flag values don't match TEX_FILTER_MASK" );

    switch ( filter & TEX_FILTER_MASK )
    {
    case TEX_FILTER_LINEAR:
        if ( filter & TEX_FILTER_WRAP )
        {
            // WIC only supports 'clamp' semantics (MIRROR is equivalent to clamp for linear)
            return false;
        }

        if ( BitsPerColor(format) > 8 )
        {
            // Avoid the WIC bitmap scaler when doing Linear filtering of XR/HDR formats
            return false;
        }
        break;

    case TEX_FILTER_CUBIC:
        if ( filter & ( TEX_FILTER_WRAP | TEX_FILTER_MIRROR ) )
        {
            // WIC only supports 'clamp' semantics
            return false;
        }

        if ( BitsPerColor(format) > 8 )
        {
            // Avoid the WIC bitmap scaler when doing Cubic filtering of XR/HDR formats
            return false;
        }
        break;

    case TEX_FILTER_TRIANGLE:
        // WIC does not implement this filter
        return false;
    }

    return true;
}


//-------------------------------------------------------------------------------------
// Resize custom filters
//-------------------------------------------------------------------------------------

//--- Point Filter ---
static HRESULT _ResizePointFilter( _In_ const Image& srcImage, _In_ const Image& destImage )
{
    assert( srcImage.pixels && destImage.pixels );
    assert( srcImage.format == destImage.format );

    // Allocate temporary space (2 scanlines)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc(
                                         ( sizeof(XMVECTOR) * (srcImage.width + destImage.width ) ), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    XMVECTOR* target = scanline.get();

    XMVECTOR* row = target + destImage.width;

#ifdef _DEBUG
    memset( row, 0xCD, sizeof(XMVECTOR)*srcImage.width );
#endif

    const uint8_t* pSrc = srcImage.pixels;
    uint8_t* pDest = destImage.pixels;

    size_t rowPitch = srcImage.rowPitch;

    size_t xinc = ( srcImage.width << 16 ) / destImage.width;
    size_t yinc = ( srcImage.height << 16 ) / destImage.height;

    size_t lasty = size_t(-1);

    size_t sy = 0;
    for( size_t y = 0; y < destImage.height; ++y )
    {
        if ( (lasty ^ sy) >> 16 )
        {
            if ( !_LoadScanline( row, srcImage.width, pSrc + ( rowPitch * (sy >> 16) ), rowPitch, srcImage.format ) )
                return E_FAIL;
            lasty = sy;
        }

        size_t sx = 0;
        for( size_t x = 0; x < destImage.width; ++x )
        {
            target[ x ] = row[ sx >> 16 ];
            sx += xinc;
        }

        if ( !_StoreScanline( pDest, destImage.rowPitch, destImage.format, target, destImage.width ) )
            return E_FAIL;
        pDest += destImage.rowPitch;

        sy += yinc;
    }

    return S_OK;
}


//--- Box Filter ---
static HRESULT _ResizeBoxFilter( _In_ const Image& srcImage, _In_ DWORD filter, _In_ const Image& destImage )
{
    assert( srcImage.pixels && destImage.pixels );
    assert( srcImage.format == destImage.format );

    if ( ( (destImage.width << 1) != srcImage.width ) || ( (destImage.height << 1) != srcImage.height ) )
        return E_FAIL;

    // Allocate temporary space (3 scanlines)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc(
                                         ( sizeof(XMVECTOR) * ( srcImage.width*2 + destImage.width ) ), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    XMVECTOR* target = scanline.get();

    XMVECTOR* urow0 = target + destImage.width;
    XMVECTOR* urow1 = urow0 + srcImage.width;

#ifdef _DEBUG
    memset( urow0, 0xCD, sizeof(XMVECTOR)*srcImage.width );
    memset( urow1, 0xDD, sizeof(XMVECTOR)*srcImage.width );
#endif

    const XMVECTOR* urow2 = urow0 + 1;
    const XMVECTOR* urow3 = urow1 + 1;

    const uint8_t* pSrc = srcImage.pixels;
    uint8_t* pDest = destImage.pixels;

    size_t rowPitch = srcImage.rowPitch;

    for( size_t y = 0; y < destImage.height; ++y )
    {
        if ( !_LoadScanlineLinear( urow0, srcImage.width, pSrc, rowPitch, srcImage.format, filter ) )
            return E_FAIL;
        pSrc += rowPitch;

        if ( urow0 != urow1 )
        {
            if ( !_LoadScanlineLinear( urow1, srcImage.width, pSrc, rowPitch, srcImage.format, filter ) )
                return E_FAIL;
            pSrc += rowPitch;
        }

        for( size_t x = 0; x < destImage.width; ++x )
        {
            size_t x2 = x << 1;

            AVERAGE4( target[ x ], urow0[ x2 ], urow1[ x2 ], urow2[ x2 ], urow3[ x2 ] );
        }

        if ( !_StoreScanlineLinear( pDest, destImage.rowPitch, destImage.format, target, destImage.width, filter ) )
            return E_FAIL;
        pDest += destImage.rowPitch;
    }

    return S_OK;
}


//--- Linear Filter ---
static HRESULT _ResizeLinearFilter( _In_ const Image& srcImage, _In_ DWORD filter, _In_ const Image& destImage )
{
    assert( srcImage.pixels && destImage.pixels );
    assert( srcImage.format == destImage.format );

    // Allocate temporary space (3 scanlines, plus X and Y filters)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc(
                                         ( sizeof(XMVECTOR) * ( srcImage.width*2 + destImage.width ) ), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    std::unique_ptr<LinearFilter[]> lf( new (std::nothrow) LinearFilter[ destImage.width + destImage.height ] );
    if ( !lf )
        return E_OUTOFMEMORY;

    LinearFilter* lfX = lf.get();
    LinearFilter* lfY = lf.get() + destImage.width;

    _CreateLinearFilter( srcImage.width, destImage.width, (filter & TEX_FILTER_WRAP_U) != 0, lfX );
    _CreateLinearFilter( srcImage.height, destImage.height, (filter & TEX_FILTER_WRAP_V) != 0, lfY );

    XMVECTOR* target = scanline.get();

    XMVECTOR* row0 = target + destImage.width;
    XMVECTOR* row1 = row0 + srcImage.width;

#ifdef _DEBUG
    memset( row0, 0xCD, sizeof(XMVECTOR)*srcImage.width );
    memset( row1, 0xDD, sizeof(XMVECTOR)*srcImage.width );
#endif

    const uint8_t* pSrc = srcImage.pixels;
    uint8_t* pDest = destImage.pixels;

    size_t rowPitch = srcImage.rowPitch;

    size_t u0 = size_t(-1);
    size_t u1 = size_t(-1);

    for( size_t y = 0; y < destImage.height; ++y )
    {
        auto& toY = lfY[ y ];

        if ( toY.u0 != u0 )
        {
            if ( toY.u0 != u1 )
            {
                u0 = toY.u0;

                if ( !_LoadScanlineLinear( row0, srcImage.width, pSrc + (rowPitch * u0), rowPitch, srcImage.format, filter ) )
                    return E_FAIL;
            }
            else
            {
                u0 = u1;
                u1 = size_t(-1);

                std::swap( row0, row1 );
            }
        }

        if ( toY.u1 != u1 )
        {
            u1 = toY.u1;

            if ( !_LoadScanlineLinear( row1, srcImage.width, pSrc + (rowPitch * u1), rowPitch, srcImage.format, filter ) )
                return E_FAIL;
        }

        for( size_t x = 0; x < destImage.width; ++x )
        {
            auto& toX = lfX[ x ];

            BILINEAR_INTERPOLATE( target[x], toX, toY, row0, row1 );
        }

        if ( !_StoreScanlineLinear( pDest, destImage.rowPitch, destImage.format, target, destImage.width, filter ) )
            return E_FAIL;
        pDest += destImage.rowPitch;
    }

    return S_OK;
}


//--- Cubic Filter ---
static HRESULT _ResizeCubicFilter( _In_ const Image& srcImage, _In_ DWORD filter, _In_ const Image& destImage )
{
    assert( srcImage.pixels && destImage.pixels );
    assert( srcImage.format == destImage.format );

    // Allocate temporary space (5 scanlines, plus X and Y filters)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc(
                                         ( sizeof(XMVECTOR) * ( srcImage.width*4 + destImage.width ) ), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    std::unique_ptr<CubicFilter[]> cf( new (std::nothrow) CubicFilter[ destImage.width + destImage.height ] );
    if ( !cf )
        return E_OUTOFMEMORY;

    CubicFilter* cfX = cf.get();
    CubicFilter* cfY = cf.get() + destImage.width;

    _CreateCubicFilter( srcImage.width, destImage.width, (filter & TEX_FILTER_WRAP_U) != 0, (filter & TEX_FILTER_MIRROR_U) != 0, cfX );
    _CreateCubicFilter( srcImage.height, destImage.height, (filter & TEX_FILTER_WRAP_V) != 0, (filter & TEX_FILTER_MIRROR_V) != 0, cfY );

    XMVECTOR* target = scanline.get();

    XMVECTOR* row0 = target + destImage.width;
    XMVECTOR* row1 = row0 + srcImage.width;
    XMVECTOR* row2 = row0 + srcImage.width*2;
    XMVECTOR* row3 = row0 + srcImage.width*3;

#ifdef _DEBUG
    memset( row0, 0xCD, sizeof(XMVECTOR)*srcImage.width );
    memset( row1, 0xDD, sizeof(XMVECTOR)*srcImage.width );
    memset( row2, 0xED, sizeof(XMVECTOR)*srcImage.width );
    memset( row3, 0xFD, sizeof(XMVECTOR)*srcImage.width );
#endif

    const uint8_t* pSrc = srcImage.pixels;
    uint8_t* pDest = destImage.pixels;

    size_t rowPitch = srcImage.rowPitch;

    size_t u0 = size_t(-1);
    size_t u1 = size_t(-1);
    size_t u2 = size_t(-1);
    size_t u3 = size_t(-1);

    for( size_t y = 0; y < destImage.height; ++y )
    {
        auto& toY = cfY[ y ];

        // Scanline 1
        if ( toY.u0 != u0 )
        {
            if ( toY.u0 != u1 && toY.u0 != u2 && toY.u0 != u3 )
            {
                u0 = toY.u0;

                if ( !_LoadScanlineLinear( row0, srcImage.width, pSrc + (rowPitch * u0), rowPitch, srcImage.format, filter ) )
                    return E_FAIL;
            }
            else if ( toY.u0 == u1 )
            {
                u0 = u1;
                u1 = size_t(-1);

                std::swap( row0, row1 );
            }
            else if ( toY.u0 == u2 )
            {
                u0 = u2;
                u2 = size_t(-1);

                std::swap( row0, row2 );
            }
            else if ( toY.u0 == u3 )
            {
                u0 = u3;
                u3 = size_t(-1);

                std::swap( row0, row3 );
            }
        }

        // Scanline 2
        if ( toY.u1 != u1 )
        {
            if ( toY.u1 != u2 && toY.u1 != u3 )
            {
                u1 = toY.u1;

                if ( !_LoadScanlineLinear( row1, srcImage.width, pSrc + (rowPitch * u1), rowPitch, srcImage.format, filter ) )
                    return E_FAIL;
            }
            else if ( toY.u1 == u2 )
            {
                u1 = u2;
                u2 = size_t(-1);

                std::swap( row1, row2 );
            }
            else if ( toY.u1 == u3 )
            {
                u1 = u3;
                u3 = size_t(-1);

                std::swap( row1, row3 );
            }
        }

        // Scanline 3
        if ( toY.u2 != u2 )
        {
            if ( toY.u2 != u3 )
            {
                u2 = toY.u2;

                if ( !_LoadScanlineLinear( row2, srcImage.width, pSrc + (rowPitch * u2), rowPitch, srcImage.format, filter ) )
                    return E_FAIL;
            }
            else
            {
                u2 = u3;
                u3 = size_t(-1);

                std::swap( row2, row3 );
            }
        }

        // Scanline 4
        if ( toY.u3 != u3 )
        {
            u3 = toY.u3;

            if ( !_LoadScanlineLinear( row3, srcImage.width, pSrc + (rowPitch * u3), rowPitch, srcImage.format, filter ) )
                return E_FAIL;
        }

        for( size_t x = 0; x < destImage.width; ++x )
        {
            auto& toX = cfX[ x ];

            XMVECTOR C0, C1, C2, C3;

            CUBIC_INTERPOLATE( C0, toX.x, row0[ toX.u0 ], row0[ toX.u1 ], row0[ toX.u2 ], row0[ toX.u3 ] );
            CUBIC_INTERPOLATE( C1, toX.x, row1[ toX.u0 ], row1[ toX.u1 ], row1[ toX.u2 ], row1[ toX.u3 ] );
            CUBIC_INTERPOLATE( C2, toX.x, row2[ toX.u0 ], row2[ toX.u1 ], row2[ toX.u2 ], row2[ toX.u3 ] );
            CUBIC_INTERPOLATE( C3, toX.x, row3[ toX.u0 ], row3[ toX.u1 ], row3[ toX.u2 ], row3[ toX.u3 ] );

            CUBIC_INTERPOLATE( target[x], toY.x, C0, C1, C2, C3 );
        }

        if ( !_StoreScanlineLinear( pDest, destImage.rowPitch, destImage.format, target, destImage.width, filter ) )
            return E_FAIL;
        pDest += destImage.rowPitch;
    }

    return S_OK;
}


//--- Triangle Filter ---
static HRESULT _ResizeTriangleFilter( _In_ const Image& srcImage, _In_ DWORD filter, _In_ const Image& destImage )
{
    assert( srcImage.pixels && destImage.pixels );
    assert( srcImage.format == destImage.format );

    using namespace TriangleFilter;

    // Allocate initial temporary space (1 scanline, accumulation rows, plus X and Y filters)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( sizeof(XMVECTOR) * srcImage.width, 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    std::unique_ptr<TriangleRow[]> rowActive( new (std::nothrow) TriangleRow[ destImage.height ] );
    if ( !rowActive )
        return E_OUTOFMEMORY;

    TriangleRow * rowFree = nullptr;

    std::unique_ptr<Filter> tfX;
    HRESULT hr = _Create( srcImage.width, destImage.width, (filter & TEX_FILTER_WRAP_U) != 0, tfX );
    if ( FAILED(hr) )
        return hr;

    std::unique_ptr<Filter> tfY;
    hr = _Create( srcImage.height, destImage.height, (filter & TEX_FILTER_WRAP_V) != 0, tfY );
    if ( FAILED(hr) )
        return hr;

    XMVECTOR* row = scanline.get();

#ifdef _DEBUG
    memset( row, 0xCD, sizeof(XMVECTOR)*srcImage.width );
#endif

    auto xFromEnd = reinterpret_cast<const FilterFrom*>( reinterpret_cast<const uint8_t*>( tfX.get() ) + tfX->sizeInBytes );
    auto yFromEnd = reinterpret_cast<const FilterFrom*>( reinterpret_cast<const uint8_t*>( tfY.get() ) + tfY->sizeInBytes );

    // Count times rows get written
    for( FilterFrom* yFrom = tfY->from; yFrom < yFromEnd; )
    {
        for ( size_t j = 0; j < yFrom->count; ++j )
        {
            size_t v = yFrom->to[ j ].u;
            assert( v < destImage.height );
            ++rowActive.get()[ v ].remaining;
        }

        yFrom = reinterpret_cast<FilterFrom*>( reinterpret_cast<uint8_t*>( yFrom ) + yFrom->sizeInBytes );
    }

    // Filter image
    const uint8_t* pSrc = srcImage.pixels;
    size_t rowPitch = srcImage.rowPitch;
    const uint8_t* pEndSrc = pSrc + rowPitch * srcImage.height;

    uint8_t* pDest = destImage.pixels;

    for( FilterFrom* yFrom = tfY->from; yFrom < yFromEnd; )
    {
        // Create accumulation rows as needed
        for ( size_t j = 0; j < yFrom->count; ++j )
        {
            size_t v = yFrom->to[ j ].u;
            assert( v < destImage.height );
            TriangleRow* rowAcc = &rowActive.get()[ v ];

            if ( !rowAcc->scanline )
            {
                if ( rowFree )
                {
                    // Steal and reuse scanline from 'free row' list
                    assert( rowFree->scanline != 0 );
                    rowAcc->scanline.reset( rowFree->scanline.release() );
                    rowFree = rowFree->next;
                }
                else
                {
                    rowAcc->scanline.reset( reinterpret_cast<XMVECTOR*>( _aligned_malloc( sizeof(XMVECTOR) * destImage.width, 16 ) ) );
                    if ( !rowAcc->scanline )
                        return E_OUTOFMEMORY;
                }

                memset( rowAcc->scanline.get(), 0, sizeof(XMVECTOR) * destImage.width );
            }
        }

        // Load source scanline
        if ( (pSrc + rowPitch) > pEndSrc )
            return E_FAIL;

        if ( !_LoadScanlineLinear( row, srcImage.width, pSrc, rowPitch, srcImage.format, filter ) )
            return E_FAIL;

        pSrc += rowPitch;

        // Process row
        size_t x = 0;
        for( FilterFrom* xFrom = tfX->from; xFrom < xFromEnd; ++x )
        {
            for ( size_t j = 0; j < yFrom->count; ++j )
            {
                size_t v = yFrom->to[ j ].u;
                assert( v < destImage.height );
                float yweight = yFrom->to[ j ].weight;

                XMVECTOR* accPtr = rowActive[ v ].scanline.get();
                if ( !accPtr )
                    return E_POINTER;

                for ( size_t k = 0; k < xFrom->count; ++k )
                {
                    size_t u = xFrom->to[ k ].u;
                    assert( u < destImage.width );

                    XMVECTOR weight = XMVectorReplicate( yweight * xFrom->to[ k ].weight );

                    assert( x < srcImage.width );
                    accPtr[ u ] = XMVectorMultiplyAdd( row[ x ], weight, accPtr[ u ] );
                }
            }

            xFrom = reinterpret_cast<FilterFrom*>( reinterpret_cast<uint8_t*>( xFrom ) + xFrom->sizeInBytes );
        }

        // Write completed accumulation rows
        for ( size_t j = 0; j < yFrom->count; ++j )
        {
            size_t v = yFrom->to[ j ].u;
            assert( v < destImage.height );
            TriangleRow* rowAcc = &rowActive.get()[ v ];

            assert( rowAcc->remaining > 0 );
            --rowAcc->remaining;

            if ( !rowAcc->remaining )
            {
                XMVECTOR* pAccSrc = rowAcc->scanline.get();
                if ( !pAccSrc )
                    return E_POINTER;

                switch( destImage.format )
                {
                case DXGI_FORMAT_R10G10B10A2_UNORM:
                case DXGI_FORMAT_R10G10B10A2_UINT:
                    {
                        // Need to slightly bias results for floating-point error accumulation which can
                        // be visible with harshly quantized values
                        static const XMVECTORF32 Bias = { 0.f, 0.f, 0.f, 0.1f };
                       
                        XMVECTOR* ptr = pAccSrc;
                        for( size_t i=0; i < destImage.width; ++i, ++ptr )
                        {
                            *ptr = XMVectorAdd( *ptr, Bias );
                        }
                    }
                    break;
                }

                // This performs any required clamping
                if ( !_StoreScanlineLinear( pDest + (destImage.rowPitch * v), destImage.rowPitch, destImage.format, pAccSrc, destImage.width, filter ) )
                    return E_FAIL;

                // Put row on freelist to reuse it's allocated scanline
                rowAcc->next = rowFree;
                rowFree = rowAcc;
            }
        }

        yFrom = reinterpret_cast<FilterFrom*>( reinterpret_cast<uint8_t*>( yFrom ) + yFrom->sizeInBytes );
    }

    return S_OK;
}


//--- Custom filter resize ---
static HRESULT _PerformResizeUsingCustomFilters( _In_ const Image& srcImage, _In_ DWORD filter, _In_ const Image& destImage )
{
    if ( !srcImage.pixels || !destImage.pixels )
        return E_POINTER;

    static_assert( TEX_FILTER_POINT == 0x100000, "TEX_FILTER_ flag values don't match TEX_FILTER_MASK" );

    DWORD filter_select = ( filter & TEX_FILTER_MASK );
    if ( !filter_select )
    {
        // Default filter choice
        filter_select = ( ( (destImage.width << 1) == srcImage.width ) && ( (destImage.height << 1) == srcImage.height ) )
                        ? TEX_FILTER_BOX : TEX_FILTER_LINEAR;
    }

    switch( filter_select )
    {
    case TEX_FILTER_POINT:
        return _ResizePointFilter( srcImage, destImage );
        
    case TEX_FILTER_BOX:
        return _ResizeBoxFilter( srcImage, filter, destImage );

    case TEX_FILTER_LINEAR:
        return _ResizeLinearFilter( srcImage, filter, destImage );

    case TEX_FILTER_CUBIC:
        return _ResizeCubicFilter( srcImage, filter, destImage );

    case TEX_FILTER_TRIANGLE:
        return _ResizeTriangleFilter( srcImage, filter, destImage );

    default:
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }
}


//=====================================================================================
// Entry-points
//=====================================================================================

//-------------------------------------------------------------------------------------
// Resize image
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT Resize( const Image& srcImage, size_t width, size_t height, DWORD filter, ScratchImage& image )
{
    if ( width == 0 || height == 0 )
        return E_INVALIDARG;

#ifdef _M_X64
    if ( (srcImage.width > 0xFFFFFFFF) || (srcImage.height > 0xFFFFFFFF) )
        return E_INVALIDARG;

    if ( (width > 0xFFFFFFFF) || (height > 0xFFFFFFFF) )
        return E_INVALIDARG;
#endif

    if ( !srcImage.pixels )
        return E_POINTER;

    if ( IsCompressed( srcImage.format ) )
    {
        // We don't support resizing compressed images
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    HRESULT hr = image.Initialize2D( srcImage.format, width, height, 1, 1 );
    if ( FAILED(hr) )
        return hr;
   
    const Image *rimage = image.GetImage( 0, 0, 0 );
    if ( !rimage )
        return E_POINTER;

    if ( _UseWICFiltering( srcImage.format, filter ) )
    {
        WICPixelFormatGUID pfGUID;
        if ( _DXGIToWIC( srcImage.format, pfGUID, true ) )
        {
            // Case 1: Source format is supported by Windows Imaging Component
            hr = _PerformResizeUsingWIC( srcImage, filter, pfGUID, *rimage );
        }
        else
        {
            // Case 2: Source format is not supported by WIC, so we have to convert, resize, and convert back
            hr = _PerformResizeViaF32( srcImage, filter, *rimage );
        }
    }
    else
    {
        hr = _PerformResizeUsingCustomFilters( srcImage, filter, *rimage );
    }

    if ( FAILED(hr) )
    {
        image.Release();
        return hr;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Resize image (complex)
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT Resize( const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                size_t width, size_t height, DWORD filter, ScratchImage& result )
{
    if ( !srcImages || !nimages || width == 0 || height == 0 )
        return E_INVALIDARG;

#ifdef _M_X64
    if ( (width > 0xFFFFFFFF) || (height > 0xFFFFFFFF) )
        return E_INVALIDARG;
#endif

    TexMetadata mdata2 = metadata;
    mdata2.width = width;
    mdata2.height = height;
    mdata2.mipLevels = 1;
    HRESULT hr = result.Initialize( mdata2 );
    if ( FAILED(hr) )
        return hr;

    bool usewic = _UseWICFiltering( metadata.format, filter );

    WICPixelFormatGUID pfGUID = {0};
    bool wicpf = ( usewic ) ? _DXGIToWIC( metadata.format, pfGUID, true ) : false;

    switch ( metadata.dimension )
    {
    case TEX_DIMENSION_TEXTURE1D:
    case TEX_DIMENSION_TEXTURE2D:
        assert( metadata.depth == 1 );

        for( size_t item = 0; item < metadata.arraySize; ++item )
        {
            size_t srcIndex = metadata.ComputeIndex( 0, item, 0 );
            if ( srcIndex >= nimages )
            {
                result.Release();
                return E_FAIL;
            }

            const Image* srcimg = &srcImages[ srcIndex ];
            const Image* destimg = result.GetImage( 0, item, 0 );
            if ( !srcimg || !destimg )
            {
                result.Release();
                return E_POINTER;
            }

            if ( srcimg->format != metadata.format )
            {
                result.Release();
                return E_FAIL;
            }

#ifdef _M_X64
            if ( (srcimg->width > 0xFFFFFFFF) || (srcimg->height > 0xFFFFFFFF) )
            {
                result.Release();
                return E_FAIL;
            }
#endif

            if ( usewic )
            {
                if ( wicpf )
                {
                    // Case 1: Source format is supported by Windows Imaging Component
                    hr = _PerformResizeUsingWIC( *srcimg, filter, pfGUID, *destimg );
                }
                else
                {
                    // Case 2: Source format is not supported by WIC, so we have to convert, resize, and convert back
                    hr = _PerformResizeViaF32( *srcimg, filter, *destimg );
                }
            }
            else
            {
                // Case 3: not using WIC resizing
                hr = _PerformResizeUsingCustomFilters( *srcimg, filter, *destimg );
            }

            if ( FAILED(hr) )
            {
                result.Release();
                return hr;
            }
        }
        break;

    case TEX_DIMENSION_TEXTURE3D:
        assert( metadata.arraySize == 1 );

        for( size_t slice = 0; slice < metadata.depth; ++slice )
        {
            size_t srcIndex = metadata.ComputeIndex( 0, 0, slice );
            if ( srcIndex >= nimages )
            {
                result.Release();
                return E_FAIL;
            }

            const Image* srcimg = &srcImages[ srcIndex ];
            const Image* destimg = result.GetImage( 0, 0, slice );
            if ( !srcimg || !destimg )
            {
                result.Release();
                return E_POINTER;
            }

            if ( srcimg->format != metadata.format )
            {
                result.Release();
                return E_FAIL;
            }

#ifdef _M_X64
            if ( (srcimg->width > 0xFFFFFFFF) || (srcimg->height > 0xFFFFFFFF) )
            {
                result.Release();
                return E_FAIL;
            }
#endif

            if ( usewic )
            {
                if ( wicpf )
                {
                    // Case 1: Source format is supported by Windows Imaging Component
                    hr = _PerformResizeUsingWIC( *srcimg, filter, pfGUID, *destimg );
                }
                else
                {
                    // Case 2: Source format is not supported by WIC, so we have to convert, resize, and convert back
                    hr = _PerformResizeViaF32( *srcimg, filter, *destimg );
                }
            }
            else
            {
                // Case 3: not using WIC resizing
                hr = _PerformResizeUsingCustomFilters( *srcimg, filter, *destimg );
            }

            if ( FAILED(hr) )
            {
                result.Release();
                return hr;
            }
        }
        break;

    default:
        result.Release();
        return E_FAIL;
    }

    return S_OK;
}

}; // namespace
