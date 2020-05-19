package BabylonNative;

import android.app.Activity;
import android.content.Context;
import android.view.MotionEvent;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;

public class BabylonView extends SurfaceView implements SurfaceHolder.Callback2, View.OnTouchListener {
    private static final String TAG = "BabylonView";
    private boolean mViewReady = false;
    private ViewDelegate mViewDelegate;
    private Activity mCurrentActivity;

    public BabylonView(Context context, ViewDelegate viewDelegate) {
        this(context, viewDelegate, (Activity)viewDelegate);
    }

    public BabylonView(Context context, ViewDelegate viewDelegate, Activity currentActivity) {
        super(context);

        this.mCurrentActivity = currentActivity;
        SurfaceHolder holder = getHolder();
        holder.addCallback(this);
        setOnTouchListener(this);
        this.mViewDelegate = viewDelegate;

        BabylonNative.Wrapper.initEngine();
    }

    public void setCurrentActivity(Activity currentActivity)
    {
        if (currentActivity != this.mCurrentActivity) {
            this.mCurrentActivity = currentActivity;
            BabylonNative.Wrapper.setCurrentActivity(this.mCurrentActivity);
        }
    }

    public void loadScript(String path) {
        BabylonNative.Wrapper.loadScript(path);
    }

    public void eval(String source, String sourceURL) {
        BabylonNative.Wrapper.eval(source, sourceURL);
    }

    public void onPause() {
        setVisibility(View.GONE);
        BabylonNative.Wrapper.activityOnPause();
    }

    public void onResume() {
        BabylonNative.Wrapper.activityOnResume();
    }

    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        BabylonNative.Wrapper.activityOnRequestPermissionsResult(requestCode, permissions, results);
    }

    /**
     * This method is part of the SurfaceHolder.Callback interface, and is
     * not normally called or subclassed by clients of BabylonView.
     */
    public void surfaceCreated(SurfaceHolder holder) {
        BabylonNative.Wrapper.surfaceCreated(getHolder().getSurface(), this.getContext());
        BabylonNative.Wrapper.setCurrentActivity(this.mCurrentActivity);
        if (!this.mViewReady) {
            this.mViewDelegate.onViewReady();
            this.mViewReady = true;
        }
    }

    /**
     * This method is part of the SurfaceHolder.Callback interface, and is
     * not normally called or subclassed by clients of BabylonView.
     */
    public void surfaceDestroyed(SurfaceHolder holder) {
    }

    /**
     * This method is part of the SurfaceHolder.Callback interface, and is
     * not normally called or subclassed by clients of BabylonView.
     */
    public void surfaceChanged(SurfaceHolder holder, int format, int w, int h) {
        BabylonNative.Wrapper.surfaceChanged(w, h, getHolder().getSurface());
    }

    public interface ViewDelegate {
        void onViewReady();
    }

    @Override
    public boolean onTouch(View v, MotionEvent event) {
        float mX = event.getX();
        float mY = event.getY();
        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:
            case MotionEvent.ACTION_MOVE:
                BabylonNative.Wrapper.setTouchInfo(mX, mY, true);
                break;
            case MotionEvent.ACTION_UP:
                BabylonNative.Wrapper.setTouchInfo(mX, mY, false);
                break;
        }
        return true;
    }

    @Override
    protected void finalize() throws Throwable {
        BabylonNative.Wrapper.finishEngine();
    }

    /**
     * This method is part of the SurfaceHolder.Callback2 interface, and is
     * not normally called or subclassed by clients of BabylonView.
     */
    @Deprecated
    @Override
    public void surfaceRedrawNeeded(SurfaceHolder holder) {
        // Redraw happens in the bgfx thread. No need to handle it here.
    }
}
