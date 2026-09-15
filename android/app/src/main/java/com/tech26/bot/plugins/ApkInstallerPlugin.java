package com.tech26.bot.plugins;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    @com.getcapacitor.PluginMethod
    public void download(PluginCall call) {
        String urlString = call.getString("url");

        if (urlString == null || urlString.trim().isEmpty()) {
            call.reject("Download URL is required");
            return;
        }

        new Thread(() -> {
            HttpURLConnection connection = null;

            try {
                URL url = new URL(urlString);
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty(
                        "Accept",
                        "application/vnd.android.package-archive"
                );

                int responseCode = connection.getResponseCode();

                if (responseCode < 200 || responseCode >= 300) {
                    call.reject("APK download failed: HTTP " + responseCode);
                    return;
                }

                File apkFile = new File(
                        getContext().getCacheDir(),
                        "26-tech-bot-update.apk"
                );

                try (InputStream input = connection.getInputStream();
                     FileOutputStream output = new FileOutputStream(apkFile)) {

                    byte[] buffer = new byte[8192];
                    int bytesRead;

                    while ((bytesRead = input.read(buffer)) != -1) {
                        output.write(buffer, 0, bytesRead);
                    }

                    output.flush();
                }

                if (!apkFile.exists() || apkFile.length() == 0) {
                    call.reject("Downloaded APK is empty");
                    return;
                }

                JSObject result = new JSObject();
                result.put("filePath", apkFile.getAbsolutePath());
                call.resolve(result);

            } catch (Exception e) {
                call.reject(
                        "Unable to download APK: " +
                        (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()),
                        e
                );
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }).start();
    }

    @com.getcapacitor.PluginMethod
    public void install(PluginCall call) {
        String filePath = call.getString("filePath");

        if (filePath == null || filePath.trim().isEmpty()) {
            call.reject("APK file path is required");
            return;
        }

        try {
            File apkFile = new File(filePath);

            if (!apkFile.exists()) {
                call.reject("APK file not found: " + filePath);
                return;
            }

            if (apkFile.length() == 0) {
                call.reject("APK file is empty");
                return;
            }

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                PackageManager packageManager = getContext().getPackageManager();

                if (!packageManager.canRequestPackageInstalls()) {
                    Intent settingsIntent = new Intent(
                            Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:" + getContext().getPackageName())
                    );

                    settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(settingsIntent);

                    call.reject(
                            "Install permission is disabled. Enable 'Allow from this source' for 26 Tech Bot, then try UPDATE NOW again."
                    );
                    return;
                }
            }

            String authority =
                    getContext().getPackageName() + ".fileprovider";

            Uri apkUri = FileProvider.getUriForFile(
                    getContext(),
                    authority,
                    apkFile
            );

            Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
            intent.setData(apkUri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("started", true);
            call.resolve(result);

        } catch (Exception e) {
            call.reject(
                    "Unable to start APK installer: " +
                    (e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()),
                    e
            );
        }
    }
}
