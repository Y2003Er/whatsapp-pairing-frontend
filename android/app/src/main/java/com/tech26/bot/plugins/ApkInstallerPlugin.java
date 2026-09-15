package com.tech26.bot.plugins;

import android.content.Intent;
import android.net.Uri;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

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
                call.reject("APK file not found");
                return;
            }

            String authority = getContext().getPackageName() + ".fileprovider";

            Uri apkUri = FileProvider.getUriForFile(
                    getContext(),
                    authority,
                    apkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(
                    apkUri,
                    "application/vnd.android.package-archive"
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("started", true);
            call.resolve(result);

        } catch (Exception e) {
            call.reject("Unable to start APK installer", e);
        }
    }
}
