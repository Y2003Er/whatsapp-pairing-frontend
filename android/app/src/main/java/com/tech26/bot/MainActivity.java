package com.tech26.bot;

import com.getcapacitor.BridgeActivity;

import com.tech26.bot.plugins.ApkInstallerPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        registerPlugin(ApkInstallerPlugin.class);
    }
}
