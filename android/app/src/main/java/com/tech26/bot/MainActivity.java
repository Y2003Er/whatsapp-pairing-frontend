package com.tech26.bot;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.tech26.bot.plugins.ApkInstallerPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkInstallerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
