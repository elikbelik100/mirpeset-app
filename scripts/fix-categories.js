import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// קריאת קובץ השיעורים
const lessonsPath = path.join(__dirname, '..', 'public', 'data', 'lessons.json');
const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));

// פונקציה לזיהוי קטיגוריה על בסיס הכותרת
function categorizeByTitle(title) {
  const lowerTitle = title.toLowerCase();
  
  // קטיגוריות מיוחדות לפי מילות מפתח
  if (lowerTitle.includes('ראש השנה')) return 'אירועים מיוחדים';
  if (lowerTitle.includes('יום הכיפורים') || lowerTitle.includes('כיפורים')) return 'אירועים מיוחדים';
  if (lowerTitle.includes('הושענא רבה')) return 'אירועים מיוחדים';
  if (lowerTitle.includes('חנוכה')) return 'אירועים מיוחדים';
  if (lowerTitle.includes('פורים')) return 'אירועים מיוחדים';
  if (lowerTitle.includes('פסח')) return 'אירועים מיוחדים';
  if (lowerTitle.includes('ט"ו בשבט') || lowerTitle.includes('טו בשבט')) return 'אירועים מיוחדים';
  if (lowerTitle.includes('עשרה בטבת')) return 'אירועים מיוחדים';
  
  // קטיגוריות נושאיות
  if (lowerTitle.includes('התרבות') || lowerTitle.includes('חינוך')) return 'חינוך וחברה';
  if (lowerTitle.includes('חובת האדם') || lowerTitle.includes('מוסר')) return 'מוסר והשקפה';
  if (lowerTitle.includes('עבודת התפילה') || lowerTitle.includes('תפילה')) return 'עבודת ה׳';
  if (lowerTitle.includes('רחל אימנו') || lowerTitle.includes('אבות') || lowerTitle.includes('אמהות')) return 'תנ״ך ואגדה';
  
  // ברירת מחדל - אם זה לא קטיגוריה מיוחדת, זה כנראה כולל יום שישי
  return 'כולל יום שישי';
}

// עדכון הקטיגוריות
let updatedCount = 0;
const updatedLessons = lessons.map(lesson => {
  const newCategory = categorizeByTitle(lesson.title);
  if (lesson.category !== newCategory) {
    updatedCount++;
    console.log(`משנה קטיגוריה של "${lesson.title}": ${lesson.category} -> ${newCategory}`);
    return {
      ...lesson,
      category: newCategory,
      updatedAt: new Date().toISOString()
    };
  }
  return lesson;
});

// שמירת הקובץ המעודכן
fs.writeFileSync(lessonsPath, JSON.stringify(updatedLessons, null, 2));

console.log(`\nסיים! עודכנו ${updatedCount} שיעורים מתוך ${lessons.length} שיעורים בסה״ק.`);

// הצגת סיכום הקטיגוריות
const categoryCounts = updatedLessons.reduce((acc, lesson) => {
  acc[lesson.category] = (acc[lesson.category] || 0) + 1;
  return acc;
}, {});

console.log('\nסיכום הקטיגוריות:');
Object.entries(categoryCounts).forEach(([category, count]) => {
  console.log(`${category}: ${count} שיעורים`);
});
