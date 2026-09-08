package com.skillswap.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.skillswap.app.ui.SkillSwapApp
import com.skillswap.app.ui.theme.SkillSwapTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            SkillSwapTheme {
                SkillSwapApp()
            }
        }
    }
}
