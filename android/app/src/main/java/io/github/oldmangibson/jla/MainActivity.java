package io.github.oldmangibson.jla;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * A thin shell around the web app on GitHub Pages. The app updates whenever the
 * site is redeployed; this shell only adds what a plain web view lacks:
 * Japanese text-to-speech, saving backup files, file picking, and opening
 * outside links in the browser.
 */
public class MainActivity extends Activity {
    private static final int REQUEST_PICK_FILE = 1;
    private static final int REQUEST_SAVE_FILE = 2;

    private WebView webView;
    private ValueCallback<Uri[]> pendingPick;
    private String pendingSave;
    private TextToSpeech tts;
    private volatile boolean ttsReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportMultipleWindows(false);
        settings.setUserAgentString(settings.getUserAgentString() + " JLAShell/" + BuildConfig.VERSION_CODE);

        webView.addJavascriptInterface(new Bridge(), "AndroidShell");
        webView.setWebViewClient(new ShellClient());
        webView.setWebChromeClient(new ShellChrome());

        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(Locale.JAPANESE);
                tts.setSpeechRate(0.9f);
                ttsReady = true;
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(BuildConfig.APP_URL);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.shutdown();
        }
        webView.destroy();
        super.onDestroy();
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_PICK_FILE) {
            if (pendingPick != null) {
                pendingPick.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                pendingPick = null;
            }
        } else if (requestCode == REQUEST_SAVE_FILE) {
            String content = pendingSave;
            pendingSave = null;
            if (resultCode != RESULT_OK || data == null || data.getData() == null || content == null) {
                return;
            }
            try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                if (out == null) {
                    throw new IllegalStateException("No output stream");
                }
                out.write(content.getBytes(StandardCharsets.UTF_8));
                Toast.makeText(this, "Backup saved", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Couldn't save the backup", Toast.LENGTH_LONG).show();
            }
        }
    }

    private boolean isAppUrl(Uri uri) {
        Uri app = Uri.parse(BuildConfig.APP_URL);
        String path = uri.getPath() == null ? "/" : uri.getPath();
        String appPath = app.getPath() == null ? "/" : app.getPath();
        return app.getHost() != null
                && app.getHost().equalsIgnoreCase(uri.getHost())
                && (path.startsWith(appPath) || (path + "/").equals(appPath));
    }

    private static String offlinePage() {
        return "<!doctype html><html><head><meta name=viewport content='width=device-width,initial-scale=1'>"
                + "<style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;"
                + "justify-content:center;height:90vh;margin:0 24px;text-align:center;color:#555}"
                + "button{font-size:1rem;padding:12px 20px;border-radius:12px;border:0;background:#2f4a8a;color:#fff}"
                + "</style></head><body><p style='font-size:2rem;margin:0'>にほんご</p>"
                + "<p>The app needs an internet connection the first time it opens. After that it works offline.</p>"
                + "<button onclick=\"location.href='" + BuildConfig.APP_URL + "'\">Try again</button></body></html>";
    }

    private class ShellClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isAppUrl(uri)) {
                return false;
            }
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (Exception ignored) {
                // No app can open it; stay put.
            }
            return true;
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                view.loadDataWithBaseURL(null, offlinePage(), "text/html", "utf-8", null);
            }
        }
    }

    private class ShellChrome extends WebChromeClient {
        @Override
        @SuppressWarnings("deprecation")
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (pendingPick != null) {
                pendingPick.onReceiveValue(null);
            }
            pendingPick = callback;
            String[] accept = params.getAcceptTypes();
            boolean images = accept != null && accept.length > 0 && accept[0].startsWith("image/");
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            // Backups often show up as generic files, so only narrow the picker for photos.
            intent.setType(images ? "image/*" : "*/*");
            try {
                startActivityForResult(Intent.createChooser(intent, null), REQUEST_PICK_FILE);
                return true;
            } catch (Exception e) {
                pendingPick = null;
                return false;
            }
        }
    }

    /** Called from the page as window.AndroidShell. These run on a background thread. */
    private class Bridge {
        @JavascriptInterface
        public int version() {
            return BuildConfig.VERSION_CODE;
        }

        @JavascriptInterface
        public boolean hasJapaneseVoice() {
            if (!ttsReady) {
                return false;
            }
            return tts.isLanguageAvailable(Locale.JAPANESE) >= TextToSpeech.LANG_AVAILABLE;
        }

        @JavascriptInterface
        public void speak(String text) {
            if (ttsReady && text != null) {
                tts.speak(text, TextToSpeech.QUEUE_ADD, null, "jla-" + System.nanoTime());
            }
        }

        @JavascriptInterface
        public void stop() {
            if (ttsReady) {
                tts.stop();
            }
        }

        /** The daily reminder time as "HH:MM", or "" when it's off. */
        @JavascriptInterface
        public String reminderTime() {
            return Reminders.get(MainActivity.this);
        }

        @JavascriptInterface
        public void setReminder(int hour, int minute) {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= 33
                        && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[] {"android.permission.POST_NOTIFICATIONS"}, 3);
                }
                Reminders.set(MainActivity.this, hour, minute);
            });
        }

        @JavascriptInterface
        public void cancelReminder() {
            Reminders.cancel(MainActivity.this);
        }

        @JavascriptInterface
        @SuppressWarnings("deprecation")
        public void saveFile(String filename, String content) {
            runOnUiThread(() -> {
                pendingSave = content;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, filename);
                try {
                    startActivityForResult(intent, REQUEST_SAVE_FILE);
                } catch (Exception e) {
                    pendingSave = null;
                    Toast.makeText(MainActivity.this, "No app available to save files", Toast.LENGTH_LONG).show();
                }
            });
        }
    }
}
