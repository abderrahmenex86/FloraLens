# Watering reminders

Each garden plant now carries a watering schedule, shows when it is due, and can
schedule a local notification for the morning it needs water.

## Data

`GardenPlant` gained two optional fields:

| Field | Meaning |
|---|---|
| `lastWateredAt` | Last time the user marked it watered |
| `wateringDays` | Interval in days (default 7) |

Older garden entries are migrated on read: `lastWateredAt` falls back to the
date the plant was added and `wateringDays` to 7. New saves set both.

## Logic

`lib/watering.ts`:

- `dueAt(plant)` — the local midnight of `lastWateredAt + wateringDays`, so
  intervals are calendar days rather than exact 24-hour blocks. `startOfDay`
  does the normalisation and keeps DST from shifting the date.
- `wateringStatus(plant)` — `{ due, inDays, overdueDays }`.
- `wateringLabel(plant)` — "Water today", "Water in N days", or
  "Water now · Nd overdue".
- `duePlants(plants)` — filtered and sorted by due date.

## UI

- **Garden**: each row shows the status under the added date, red when due. The
  droplet button marks the plant watered (resets the timer, haptic, reschedules
  reminders). It fills with the primary colour while the plant is due. Tapping
  the status opens a sheet with 3, 7, 14 and 30-day intervals; the choice is
  stored per plant and reschedules that plant's reminder.
- **Garden calendar**: a month grid above the garden list. Days with at least
  one plant are filled with a dot; overdue plants are grouped under today.
  Tapping a day lists the plants due that day with a quick-water button. The
  month can be paged with the arrows. Tapping a plant opens its scan or
  library entry.
- **Home**: a "Needs water" section appears above Recent scans only when
  something is due, with the same quick-water button. The section header links
  to the garden.
- **Settings**: a "Watering reminders" switch. Turning it on requests the
  notification permission; denying leaves the switch off and shows an
  explanation. The choice is stored in MMKV.

## Notifications

`syncWateringNotifications(plants)` cancels the previous schedule and creates one
notification per plant (max 40) at 09:00 local on its due date. Overdue plants
get the next morning. It runs at app start, when the app returns to the
foreground, after watering, and when the toggle changes. Android gets a
`watering` notification channel.

Permissions added by the `expo-notifications` plugin: `POST_NOTIFICATIONS`,
`RECEIVE_BOOT_COMPLETED` and `WAKE_LOCK`. The release manifest keeps the camera
and network permissions unchanged.

## Verified

Pixel 8a, debug and release builds:

- Garden row shows "Water in 7 days" after saving a plant, and "Water today"
  (red, filled button) when forced due.
- Home shows the "Needs water" card with a working quick-water action.
- Tapping water resets the status to "Water in 7 days" and reschedules.
- Changing the interval to 3 days updates the row to "Water in 3 days" and moves
  the `dumpsys alarm` RTC_WAKEUP entry to the new due date at 09:00.
- Enabling reminders shows the system permission dialog; after allowing,
  `dumpsys alarm` shows the RTC_WAKEUP alarm for the due date at 09:00.

## Not done yet

- No reminder time picker; 09:00 is fixed.
- Reminders are local only; no push.
