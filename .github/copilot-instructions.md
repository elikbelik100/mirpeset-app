<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# המרפסת - אפליקציה לניהול שיעורים

זוהי אפליקציה React TypeScript לניהול ופרסום שיעורים עם הפונקציות הבאות:

## תכונות עיקריות:
- ניהול שיעורים (CRUD)
- עיצוב מודעות עם תבניות
- מערכת תזכורות מקומיות
- ארכיון שיעורים מוקלטים (Google Drive)
- ממשק משתמש רספונסיבי בעברית

## הנחיות לפיתוח:
- שימוש ב-TypeScript עם React
- עיצוב רספונסיבי עם CSS modules או styled-components
- תמיכה בעברית RTL
- שימוש ב-localStorage לשמירת נתונים מקומית
- אינטגרציה עם Google Drive API לארכיון
- שימוש ב-Web Notifications API לתזכורות מקומיות

## מבנה הפרויקט:
- `/src/components` - רכיבי UI
- `/src/pages` - דפי האפליקציה
- `/src/services` - שירותים חיצוניים (Google Drive, notifications)
- `/src/types` - הגדרות TypeScript
- `/src/utils` - פונקציות עזר
- `/src/assets` - קבצי מדיה
