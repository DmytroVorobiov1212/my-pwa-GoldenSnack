package cz.goldensnack.productionterminal;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.os.SystemClock;
import android.text.InputType;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://my-pwa-golden-snack.vercel.app/";
    private static final String GS_MARK_PATH = "/gs-mark.svg";
    private static final String ADMIN_PREFS = "terminal_admin";
    private static final String ADMIN_PIN_HASH = "admin_pin_hash";
    private static final int ADMIN_TAPS_REQUIRED = 7;
    private static final long ADMIN_TAP_WINDOW_MS = 5000L;
    private static final int ADMIN_ZONE_DP = 96;

    private WebView webView;
    private TextView errorView;
    private int adminTapCount = 0;
    private long firstAdminTapAt = 0L;
    private boolean adminExitInProgress = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        createUi();
        configureWebView();
        configureImmersiveRecovery();
        enterImmersiveMode();
        webView.loadUrl(APP_URL);
    }

    private void createUi() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(9, 11, 14));

        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));

        errorView = new TextView(this);
        errorView.setTextColor(Color.WHITE);
        errorView.setBackgroundColor(Color.rgb(9, 11, 14));
        errorView.setTextSize(18);
        errorView.setGravity(android.view.Gravity.CENTER);
        errorView.setPadding(32, 32, 32, 32);
        errorView.setVisibility(View.GONE);
        root.addView(errorView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));

        setContentView(root);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setBackgroundColor(Color.rgb(9, 11, 14));
        webView.setWebChromeClient(new WebChromeClient());
        webView.setOnTouchListener((view, event) -> {
            handleAdminGesture(event);
            return false;
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !isAllowedUrl(url);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isAllowedUrl(request.getUrl().toString());
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                WebResourceResponse local = getLocalGsMark(url);
                return local != null ? local : super.shouldInterceptRequest(view, url);
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse local = getLocalGsMark(request.getUrl().toString());
                return local != null ? local : super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (isAllowedUrl(url)) {
                    errorView.setVisibility(View.GONE);
                    webView.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showNetworkError();
                }
            }
        });
    }

    private WebResourceResponse getLocalGsMark(String url) {
        if (url == null || !url.startsWith("https://my-pwa-golden-snack.vercel.app") || !url.contains(GS_MARK_PATH)) {
            return null;
        }

        try {
            InputStream stream = getAssets().open("gs-mark.svg");
            return new WebResourceResponse("image/svg+xml", "UTF-8", stream);
        } catch (IOException ignored) {
            return null;
        }
    }

    private boolean isAllowedUrl(String url) {
        return url != null && (
                url.equals("https://my-pwa-golden-snack.vercel.app") ||
                url.startsWith("https://my-pwa-golden-snack.vercel.app/")
        );
    }

    private void showNetworkError() {
        webView.setVisibility(View.GONE);
        errorView.setText("Terminál není připojen k síti.\n\nZkontrolujte Wi-Fi a klepnutím obnovte.");
        errorView.setVisibility(View.VISIBLE);
        errorView.setOnClickListener(v -> {
            errorView.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.reload();
        });
    }

    private void handleAdminGesture(MotionEvent event) {
        if (event.getAction() != MotionEvent.ACTION_UP) {
            return;
        }

        float zonePx = ADMIN_ZONE_DP * getResources().getDisplayMetrics().density;
        if (event.getX() > zonePx || event.getY() > zonePx) {
            adminTapCount = 0;
            firstAdminTapAt = 0L;
            return;
        }

        long now = SystemClock.elapsedRealtime();
        if (firstAdminTapAt == 0L || now - firstAdminTapAt > ADMIN_TAP_WINDOW_MS) {
            firstAdminTapAt = now;
            adminTapCount = 1;
        } else {
            adminTapCount += 1;
        }

        if (adminTapCount >= ADMIN_TAPS_REQUIRED) {
            adminTapCount = 0;
            firstAdminTapAt = 0L;
            showAdminAccessDialog();
        }
    }

    private void showAdminAccessDialog() {
        if (!hasAdminPin()) {
            showSetAdminPinDialog();
            return;
        }

        final EditText pinInput = createPinInput("Admin PIN");
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Správa terminálu")
                .setMessage(isDeviceOwner() ? "Zadejte PIN pro ukončení kiosk režimu." : "Zadejte PIN pro kontrolu administrátorského přístupu.")
                .setView(pinInput)
                .setNegativeButton("Zrušit", null)
                .setPositiveButton(isDeviceOwner() ? "Ukončit kiosk" : "Ověřit", null)
                .create();

        dialog.setOnShowListener(ignored -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String pin = pinInput.getText().toString();
            if (!verifyPin(pin)) {
                pinInput.setError("Nesprávný PIN");
                return;
            }

            if (isDeviceOwner()) {
                exitKioskMode();
                dialog.dismiss();
            } else {
                Toast.makeText(this, "Admin PIN je správný.", Toast.LENGTH_SHORT).show();
                dialog.dismiss();
            }
        }));
        dialog.show();
    }

    private void showSetAdminPinDialog() {
        LinearLayout fields = new LinearLayout(this);
        fields.setOrientation(LinearLayout.VERTICAL);
        int padding = dp(20);
        fields.setPadding(padding, 0, padding, 0);

        EditText pin = createPinInput("Nový 6místný PIN");
        EditText confirm = createPinInput("Zopakujte PIN");
        fields.addView(pin);
        fields.addView(confirm);

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle("Nastavit admin PIN")
                .setMessage("PIN slouží jako nouzový výstup z kiosk režimu. Uložte si ho mimo tablet.")
                .setView(fields)
                .setNegativeButton("Zrušit", null)
                .setPositiveButton("Uložit PIN", null)
                .create();

        dialog.setOnShowListener(ignored -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String first = pin.getText().toString();
            String second = confirm.getText().toString();

            if (!first.matches("\\d{6}")) {
                pin.setError("PIN musí mít přesně 6 číslic");
                return;
            }
            if (!first.equals(second)) {
                confirm.setError("PINy se neshodují");
                return;
            }

            saveAdminPin(first);
            dialog.dismiss();
            Toast.makeText(this, "Admin PIN byl uložen.", Toast.LENGTH_LONG).show();

            if (isDeviceOwner()) {
                webView.postDelayed(this::enableKioskIfDeviceOwner, 250L);
            }
        }));
        dialog.show();
    }

    private EditText createPinInput(String hint) {
        EditText input = new EditText(this);
        input.setHint(hint);
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_VARIATION_PASSWORD);
        return input;
    }

    private boolean hasAdminPin() {
        return getSharedPreferences(ADMIN_PREFS, MODE_PRIVATE).contains(ADMIN_PIN_HASH);
    }

    private void saveAdminPin(String pin) {
        getSharedPreferences(ADMIN_PREFS, MODE_PRIVATE)
                .edit()
                .putString(ADMIN_PIN_HASH, hashPin(pin))
                .apply();
    }

    private boolean verifyPin(String pin) {
        SharedPreferences prefs = getSharedPreferences(ADMIN_PREFS, MODE_PRIVATE);
        String expected = prefs.getString(ADMIN_PIN_HASH, "");
        return expected.equals(hashPin(pin));
    }

    private String hashPin(String pin) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest((getPackageName() + ":" + pin).getBytes("UTF-8"));
            StringBuilder hex = new StringBuilder();
            for (byte value : bytes) {
                hex.append(String.format("%02x", value & 0xff));
            }
            return hex.toString();
        } catch (Exception error) {
            throw new IllegalStateException("Unable to hash admin PIN", error);
        }
    }

    private boolean isDeviceOwner() {
        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        return dpm != null && dpm.isDeviceOwnerApp(getPackageName());
    }

    private void enableKioskIfDeviceOwner() {
        if (adminExitInProgress || !hasAdminPin()) {
            return;
        }

        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName admin = new ComponentName(this, TerminalDeviceAdminReceiver.class);

        if (dpm != null && dpm.isDeviceOwnerApp(getPackageName())) {
            dpm.setLockTaskPackages(admin, new String[]{getPackageName()});
            if (dpm.isLockTaskPermitted(getPackageName())) {
                try {
                    startLockTask();
                } catch (IllegalStateException ignored) {
                    // Already locked or activity state changed; keep running normally.
                }
            }
        }
    }

    private void exitKioskMode() {
        adminExitInProgress = true;
        try {
            stopLockTask();
        } catch (Exception ignored) {
            // If lock task is already stopped, continue with the admin exit.
        }

        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        Toast.makeText(this, "Kiosk režim ukončen. Otevřením aplikace se znovu aktivuje.", Toast.LENGTH_LONG).show();
        finishAndRemoveTask();
    }

    private void configureImmersiveRecovery() {
        getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(visibility -> {
            if (!adminExitInProgress && (visibility & View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) == 0) {
                getWindow().getDecorView().postDelayed(this::enterImmersiveMode, 250L);
            }
        });
    }

    private void enterImmersiveMode() {
        if (adminExitInProgress) {
            return;
        }
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    protected void onResume() {
        super.onResume();
        enterImmersiveMode();
        enableKioskIfDeviceOwner();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enterImmersiveMode();
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
