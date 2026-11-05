package io.github.oldmangibson.jla;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.Calendar;
import java.util.Locale;

/** A daily study reminder: an inexact repeating alarm that posts a notification. */
final class Reminders {
    private static final String PREFS = "jla";
    private static final String KEY = "reminder";
    private static final String CHANNEL = "daily";

    private Reminders() {
    }

    /** The reminder time as "HH:MM", or "" when off. */
    static String get(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "");
    }

    static void set(Context context, int hour, int minute) {
        String value = String.format(Locale.US, "%02d:%02d", hour, minute);
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, value).apply();
        schedule(context);
    }

    static void cancel(Context context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(KEY).apply();
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        if (alarms != null) {
            alarms.cancel(alarmIntent(context));
        }
    }

    /** Sets the alarm for the saved time; called after changes and after the phone restarts. */
    static void schedule(Context context) {
        String value = get(context);
        if (value.isEmpty()) {
            return;
        }
        String[] parts = value.split(":");
        Calendar next = Calendar.getInstance();
        next.set(Calendar.HOUR_OF_DAY, Integer.parseInt(parts[0]));
        next.set(Calendar.MINUTE, Integer.parseInt(parts[1]));
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);
        if (next.getTimeInMillis() <= System.currentTimeMillis()) {
            next.add(Calendar.DAY_OF_YEAR, 1);
        }
        AlarmManager alarms = context.getSystemService(AlarmManager.class);
        if (alarms != null) {
            alarms.setInexactRepeating(AlarmManager.RTC_WAKEUP, next.getTimeInMillis(), AlarmManager.INTERVAL_DAY, alarmIntent(context));
        }
    }

    private static PendingIntent alarmIntent(Context context) {
        Intent intent = new Intent(context, ReminderReceiver.class);
        return PendingIntent.getBroadcast(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @SuppressWarnings("deprecation")
    static void post(Context context) {
        NotificationManager notifications = context.getSystemService(NotificationManager.class);
        if (notifications == null) {
            return;
        }
        if (Build.VERSION.SDK_INT >= 26) {
            notifications.createNotificationChannel(
                    new NotificationChannel(CHANNEL, "Daily reminder", NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent open = new Intent(context, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent tap = PendingIntent.getActivity(context, 1, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(context, CHANNEL)
                : new Notification.Builder(context);
        builder.setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle("にほんご")
                .setContentText("今日も少しずつ: a little Japanese today.")
                .setContentIntent(tap)
                .setAutoCancel(true);
        notifications.notify(1, builder.build());
    }
}
