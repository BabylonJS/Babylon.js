package com.android.appviewer;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.util.Log;
import android.view.View;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;

public class AndroidViewAppActivity extends Activity implements AndroidViewAppSurfaceView.Renderer {
    private static final String TAG = "AndroidViewAppActivity";
    AndroidViewAppSurfaceView mView;
    private ScaleGestureDetector mScaleDetector;
    private Uri mUri = Uri.EMPTY;
    public boolean mScaling = false;
    // JNI interface
    static {
        System.loadLibrary("BabylonNativeJNI");
    }

    public static native void initEngine(AssetManager assetManager, String path);
    public static native void finishEngine();
    public static native void surfaceCreated(Surface surface);
    public static native void surfaceChanged(int width, int height);
    public static native void openFile(String path);
    public static native void openStream(ByteBuffer bytes);
    public static native void setTouchInfo(float dx, float dy, boolean down);
    public static native void setPinchInfo(float zoom);
    public static native void step();

    // Activity life
    @Override protected void onCreate(Bundle icicle)
    {
        Log.v(TAG, "onCreate");

        super.onCreate(icicle);
        mView = new AndroidViewAppSurfaceView(getApplication(), this);
        setContentView(mView);

        try {
            initEngine(getApplication().getResources().getAssets(), getDataDir(getApplicationContext()));
        } catch (Exception e) {
            e.printStackTrace();
        }
        class PinchListener extends ScaleGestureDetector.SimpleOnScaleGestureListener
        {

            @Override
            public boolean onScale(ScaleGestureDetector detector)
            {
                Log.v("TAG", "Pinch "+detector.getScaleFactor());
                setPinchInfo(detector.getScaleFactor());
                return true;
            }
            @Override
            public boolean onScaleBegin(ScaleGestureDetector detector)
            {
                mScaling = true;
                return true;
            }

            @Override
            public void onScaleEnd(ScaleGestureDetector detector)
            {
                mScaling = false;
            }
        }
        mScaleDetector = new ScaleGestureDetector(this, new PinchListener());

        handleIntent();
    }

    private void handleIntent()
    {
        Uri uri = getIntent().getData();
        if (uri == null) {
            Log.i(TAG, "Could not open document.");
            return;
        }

        mUri = uri;
    }

    private static String getDataDir(Context context) throws Exception {
        return context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0)
                .applicationInfo.dataDir;
    }

    private ByteBuffer readBytes(InputStream inputStream) throws IOException
    {
        int length = inputStream.available();
        ByteBuffer byteBuffer = ByteBuffer.allocateDirect(length);

        int bufferSize = 65536;
        byte[] buffer = new byte[bufferSize];

        int len = 0;
        while ((len = inputStream.read(buffer)) != -1) {
            byteBuffer.put(buffer, 0, len);
        }

        return byteBuffer;
    }

    @Override protected void onNewIntent (Intent intent)
    {
        Log.v(TAG, "onNewIntent");
        mUri = intent.getData();
    }

    @Override protected void onPause()
    {
        Log.v(TAG, "onPause");
        mView.setVisibility(View.GONE);
        super.onPause();
        mView.onPause();
    }

    @Override protected void onResume()
    {
        Log.v(TAG, "onResume");
        super.onResume();
        mView.onResume();
    }

    @Override protected void onDestroy()
    {
        Log.v(TAG, "onDestroy");
        finishEngine();
        super.onDestroy();
    }

    // Renderer override
    @Override public void onSurfaceCreated(SurfaceHolder surfaceHolder)
    {
        Log.v(TAG, "onSurfaceCreated");
        surfaceCreated(surfaceHolder.getSurface());
    }

    @Override public void onSurfaceChanged(int width, int height)
    {
        Log.v(TAG, "onSurfaceChanged");
        surfaceChanged(width, height);
    }

    @Override public void onDrawFrame()
    {
        if (!Uri.EMPTY.equals(mUri) && mUri != null)
        {
            try {
                Log.i(TAG, "Handling intent to view URI : "+mUri.getPath());
                InputStream inputStream = getContentResolver().openInputStream(mUri);
                ByteBuffer byteBuffer = readBytes(inputStream);
                byteBuffer.position(0);
                openStream(byteBuffer);
            } catch (FileNotFoundException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            }
            mUri = Uri.EMPTY;
        }
        step();
    }

    // Touch handling
    @Override public boolean onTouchEvent(MotionEvent event){
        mScaleDetector.onTouchEvent(event);

        if (!mScaling) {
            float mX = event.getX();
            float mY = event.getY();
            switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    setTouchInfo(mX, mY, true);
                    break;
                case MotionEvent.ACTION_MOVE:
                    setTouchInfo(mX, mY, true);
                    break;
                case MotionEvent.ACTION_UP:
                    setTouchInfo(mX, mY, false);
                    break;
            }
        }
        return true;
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus)
    {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && mView.getVisibility() == View.GONE)
        {
            mView.setVisibility(View.VISIBLE);
        }
    }
}
