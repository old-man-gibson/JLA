package io.github.oldmangibson.jla;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Fires once a day at the reminder time. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Reminders.post(context);
    }
}
