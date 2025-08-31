import React, { useState } from 'react';
import { Upload, FileText, Calendar, Clock, AlertCircle, CheckCircle, Download } from 'lucide-react';
import AuthService from '../services/authService';
import { LessonService } from '../services/lessonService';
import { PDFService } from '../services/pdfService';
import { DocxService } from '../services/docxService';
import type { Lesson } from '../types';
import './ImportPage.css';

interface ParsedLesson {
  title: string;
  date: string;
  time: string;
  category: string;
  description?: string;
  error?: string;
}

interface ParsedZman { label: string; date: string; time: string; type: string; error?: string; }

const ImportPage: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedLessons, setParsedLessons] = useState<ParsedLesson[]>([]);
  const [parsedZmanim, setParsedZmanim] = useState<ParsedZman[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [docxDebug, setDocxDebug] = useState<{ tables: number; sample?: string } | null>(null);
  const [docxCandidates, setDocxCandidates] = useState<any[]>([]);

  const authService = AuthService.getInstance();
  const currentUser = authService.getCurrentUser();

  // פונקציה להורדת JSON של כל השיעורים
  const handleDownloadJSON = async () => {
    try {
      await LessonService.downloadLessonsJSON();
    } catch (error) {
      console.error('Error downloading JSON:', error);
      setErrorMessage('שגיאה בהורדת קובץ JSON');
      setImportStatus('error');
    }
  };

  // בדיקת הרשאות מנהל
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="import-page">
        <div className="access-denied">
          <AlertCircle size={48} />
          <h2>גישה נדחתה</h2>
          <p>רק מנהלים יכולים לייבא שיעורים מקובץ PDF</p>
        </div>
      </div>
    );
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const lower = selectedFile.name.toLowerCase();
    const isPdf = lower.endsWith('.pdf');
    const isDocx = lower.endsWith('.docx');
    if (!isPdf && !isDocx) {
      setErrorMessage('אנא בחר קובץ PDF או DOCX');
      setImportStatus('error');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('קובץ גדול מדי. מקסימום 10MB');
      setImportStatus('error');
      return;
    }
    setFile(selectedFile);
    setErrorMessage('');
    setImportStatus('idle');
  };

  const parseTextToLessons = (text: string): ParsedLesson[] => {
    const lessons: ParsedLesson[] = [];
    const lines = text.split('\n').filter(line => line.trim()).filter(l => !/^#/.test(l.trim()) && !/^\[.+\]$/.test(l.trim()) && !/^=+/.test(l.trim()));

    let currentGeneralTitle = ''; // כותרת כללית נוכחית
    
    // פטרן מורחב לזיהוי שורות עם תאריכים ושעות
    const lessonPatterns = [
      // פטרנים עם תאריכים 4-ספרתיים
      /(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–—]\s*(\d{1,2}:\d{2})\s*[-–—]\s*(.+?)$/,
      /(\d{1,2}\.\d{1,2}\.\d{4})\s*[-–—]\s*(\d{1,2}:\d{2})\s*[-–—]\s*(.+?)$/,
      /(\d{1,2}\s\d{1,2}\s\d{4})\s*[-–—]\s*(\d{1,2}:\d{2})\s*[-–—]\s*(.+?)$/,
      // פטרנים עם תאריכים דו-ספרתיים
      /(\d{1,2}\/\d{1,2}\/\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\s*[-–—]\s*(.+?)$/,
      /(\d{1,2}\.\d{1,2}\.\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\s*[-–—]\s*(.+?)$/,
      /(\d{1,2}\s\d{1,2}\s\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})\s*[-–—]\s*(.+?)$/,
      // פטרן ללא שעה - כותרת כללית
      /(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–—]\s*(.+?)$/
    ];

    for (const line of lines) {
      let matched = false;
      console.log('Processing line:', line);
      
      for (let i = 0; i < lessonPatterns.length; i++) {
        const pattern = lessonPatterns[i];
        console.log('Testing pattern', i, 'on line:', line);
        const match = line.match(pattern);
        if (match) {
          console.log('Pattern matched:', i, 'Full match:', match);
          let dateStr, time, title;
          
          if (i === 6) { // פטרן ללא שעה - זו כותרת כללית
            [, dateStr, title] = match;
            currentGeneralTitle = title.trim();
            matched = true;
            break; // לא יוצרים שיעור, רק שומרים כותרת
          } else {
            [, dateStr, time, title] = match;
          }
          
          console.log('Extracted from regex:', { dateStr, time, title, fullMatch: match[0] });
          
          console.log('Raw title from regex:', title);
          
          // זיהוי נושא השיעור מהחלק האחרון (אחרי שם הרב)
          let lessonSubject = 'כולל יום שישי'; // ברירת מחדל
          let rabbiName = '';
          
          // בדיקה לסוגי מקפים שונים: -, –, —
          const dashRegex = /\s*[-–—]\s*/;
          console.log('Checking for dashes in title:', title);
          console.log('Dash regex test result:', dashRegex.test(title));
          
          if (title && dashRegex.test(title)) {
            const titleParts = title.split(dashRegex);
            console.log('Title parts after split:', titleParts);
            if (titleParts.length >= 2) {
              rabbiName = titleParts[0].trim();
              lessonSubject = titleParts.slice(1).join(' - ').trim();
              console.log('Extracted rabbi:', rabbiName);
              console.log('Extracted subject:', lessonSubject);
            }
          } else if (title) {
            // אם אין מקף, כל הכותרת היא הנושא
            lessonSubject = title.trim();
            console.log('No dash found, using full title as subject:', lessonSubject);
          }
          
          // טיפול בפורמטים שונים של תאריך
          let date = dateStr;
          if (dateStr.includes('.')) {
            date = dateStr.replace(/\./g, '/');
          }
          if (dateStr.includes(' ')) {
            date = dateStr.replace(/\s/g, '/');
          }
          
          // וידוא פורמט DD/MM/YYYY
          const dateParts = date.split('/');
          if (dateParts.length === 3) {
            let [day, month, year] = dateParts;
            
            // המרת שנה עם שתי ספרות לארבע ספרות
            if (year.length === 2) {
              const currentYear = new Date().getFullYear();
              const currentCentury = Math.floor(currentYear / 100) * 100;
              const yearNum = parseInt(year);
              
              // אם השנה קטנה מ-50, נניח שזה המאה הנוכחית או הבאה
              // אם גדולה מ-50, נניח שזה המאה הנוכחית או הקודמת
              if (yearNum <= 50) {
                year = (currentCentury + yearNum).toString();
              } else {
                year = (currentCentury - 100 + yearNum).toString();
              }
            }
            
            date = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
          }
          
          // וידוא פורמט HH:MM
          if (time && !time.includes(':')) {
            time = '20:00';
          } else if (time) {
            const timeParts = time.split(':');
            if (timeParts.length === 2) {
              time = `${timeParts[0].padStart(2, '0')}:${timeParts[1]}`;
            }
          }
          
          // התאמת תאריך לשיעורים בשעות לילה מאוחרות (00:00-04:00)
          let finalDate = date;
          if (time) {
            const [hours] = time.split(':').map(Number);
            if (hours >= 0 && hours < 4) {
              // שיעור בין חצות ל-4 בבוקר - נעביר ליום הקודם
              const currentDateParts = date.split('/');
              const dateObj = new Date(parseInt(currentDateParts[2]), parseInt(currentDateParts[1]) - 1, parseInt(currentDateParts[0]));
              dateObj.setDate(dateObj.getDate() - 1);
              const day = dateObj.getDate().toString().padStart(2, '0');
              const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const year = dateObj.getFullYear().toString();
              finalDate = `${day}/${month}/${year}`;
            }
          }
          
          // בדיקה אם זה יום חמישי
          const updatedDateParts = finalDate.split('/');
          const lessonDate = new Date(parseInt(updatedDateParts[2]), parseInt(updatedDateParts[1]) - 1, parseInt(updatedDateParts[0]));
          const isThursday = lessonDate.getDay() === 4;
          let finalGeneralTitle = currentGeneralTitle;
          if (isThursday && currentGeneralTitle) {
            finalGeneralTitle = 'כולל יום שישי';
          }
          
          // קביעת קטגוריה אוטומטית בהתבסס על הנושא
          const category = PDFService.suggestLessonCategories(lessonSubject);
          
          console.log('Parsing lesson:', {
            originalTitle: title,
            rabbiName,
            lessonSubject,
            category,
            finalDate
          });

          lessons.push({
            title: lessonSubject,
            date: finalDate, // נשאיר כ-string כי זה מה ש-ParsedLesson מצפה לו
            time: time || '20:00',
            category,
            description: rabbiName ? `רב: ${rabbiName}` : (finalGeneralTitle ? `כותרת: ${finalGeneralTitle}` : undefined)
          });
          
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        // נסיון לזהות תאריכים עבריים או פורמטים אחרים
        const hebrewDatePattern = /([\u0590-\u05FF\s\d"']+)\s*[-–—]\s*(\d{2}:\d{2})\s*[-–—]\s*([^-–—]+?)(?:\s*[-–—]\s*(.+?))?$/;
        const hebrewMatch = line.match(hebrewDatePattern);
        if (hebrewMatch) {
          const [, , time, title, location] = hebrewMatch;
          
          lessons.push({
            title: title.trim(),
            date: 'תאריך עברי - דורש המרה',
            time,
            category: PDFService.suggestLessonCategories(title),
            description: location ? `מקום: ${location.trim()}` : undefined,
            error: 'תאריך עברי דורש המרה ידנית'
          });
        }
      }
    }

    return lessons;
  };

  const parseTextToZmanim = (text: string): ParsedZman[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean).filter(l => !/^#/.test(l) && !/^\[.+\]$/.test(l) && !/^=+/.test(l));
    const zmanPatterns: { regex: RegExp; type: string }[] = [
      { regex: /(\d{1,2}\/\d{1,2}\/\d{4}).{0,40}?הדלקת נרות.*?(\d{1,2}:\d{2})/, type: 'candle_lighting' },
      { regex: /(\d{1,2}\/\d{1,2}\/\d{4}).{0,40}?שקיעה.*?(\d{1,2}:\d{2})/, type: 'sunset' },
      { regex: /(\d{1,2}\/\d{1,2}\/\d{4}).{0,40}?עלות השחר.*?(\d{1,2}:\d{2})/, type: 'alot_hashachar' },
      { regex: /(\d{1,2}\/\d{1,2}\/\d{4}).{0,40}?נץ.*?(\d{1,2}:\d{2})/, type: 'netz' },
      { regex: /(\d{1,2}\/\d{1,2}\/\d{4}).{0,40}?צאת.*?(\d{1,2}:\d{2})/, type: 'tzeit' }
    ];
    const out: ParsedZman[] = [];
    for (const line of lines) {
      for (const pat of zmanPatterns) {
        const m = line.match(pat.regex);
        if (m) {
          // תקן פורמט תאריך
          const dateParts = m[1].split('/');
          const formattedDate = dateParts.length === 3 ? 
            `${dateParts[0].padStart(2, '0')}/${dateParts[1].padStart(2, '0')}/${dateParts[2]}` : m[1];
          out.push({ date: formattedDate, time: m[2], label: line, type: pat.type });
          break;
        }
      }
    }
    return out;
  };

  const handleProcessFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      let rawText = '';
      if (file.name.toLowerCase().endsWith('.pdf')) {
        rawText = await PDFService.extractTextFromPDF(file);
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        // Simplified DOCX: treat as plain text template, no calendar table parsing
        const debug = await DocxService.extractHtmlDebug(file);
        // convert HTML to plain text lines (reuse internal plain conversion fallback)
        rawText = (debug.html || '')
          .replace(/<style[\s\S]*?<\/style>/gi,'')
          .replace(/<script[\s\S]*?<\/script>/gi,'')
          .replace(/<br\s*\/?>(?=.)/gi,'\n')
          .replace(/<\/p>/gi,'\n')
          .replace(/<[^>]+>/g,'')
          .split('\n')
          .map(l=>l.trim())
          .filter(Boolean)
          .join('\n');
        
        // DEBUG: Show converted text to user
        console.log('DOCX converted text:', rawText);
        setDocxDebug({ tables: 0, sample: `Converted text preview:\n${rawText.slice(0, 500)}...` });
        setDocxCandidates([]);
      } else {
        throw new Error('סוג קובץ לא נתמך');
      }
      const lessons = parseTextToLessons(rawText);
      const zmanim = parseTextToZmanim(rawText);
      
      // DEBUG: Show what was found
      console.log('Parsed lessons:', lessons);
      console.log('Parsed zmanim:', zmanim);
      
      if (lessons.length === 0 && zmanim.length === 0 && docxCandidates.length === 0) {
        throw new Error('לא נמצאו שיעורים או זמנים בקובץ.');
      }
      setParsedLessons(lessons);
      setParsedZmanim(zmanim);
      setImportStatus('success');
    } catch (error) {
      console.error('שגיאה בעיבוד הקובץ:', error);
      setErrorMessage(error instanceof Error ? error.message : 'שגיאה לא ידועה בעיבוד הקובץ');
      setImportStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // ייבוא השיעורים שנמצאו לשירות
  const handleImportLessons = async () => {
    try {
      let successCount = 0;
      let errorCount = 0;

      // קבלת השיעורים הקיימים
      const existingLessons = await LessonService.getAllLessons();

      parsedLessons.forEach(async (parsedLesson) => {
        try {
          if (parsedLesson.error) {
            errorCount++;
            return;
          }

          const [dayStr, monthStr, yearStr] = parsedLesson.date.split('/');
          const [hoursStr, minutesStr] = parsedLesson.time.split(':');

          const lessonDate = new Date(
            parseInt(yearStr, 10),
            parseInt(monthStr, 10) - 1,
            parseInt(dayStr, 10),
            parseInt(hoursStr, 10),
            parseInt(minutesStr, 10)
          );

          const lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'> = {
            title: parsedLesson.title,
            description: parsedLesson.description || '',
            category: parsedLesson.category,
            date: lessonDate,
            time: parsedLesson.time,
            duration: 90,
            teacher: '', // לא בשימוש
            location: '', // לא בשימוש
            status: 'scheduled',
            currentParticipants: 0, // לא בשימוש
            maxParticipants: undefined, // לא בשימוש
            tags: [],
            notifications: {
              enabled: true,
              reminderTimes: [30, 10],
            },
          };

          // בדיקת התנגשויות
          const conflictingLesson = existingLessons.find(lesson => {
            const sameDate = lesson.date.toDateString() === lessonDate.toDateString();
            const sameTime = lesson.time === parsedLesson.time;
            return sameDate && sameTime;
          });

          if (conflictingLesson) {
            const choice = confirm(
              `נמצאה התנגשות! כבר קיים שיעור "${conflictingLesson.title}" בתאריך ${lessonDate.toLocaleDateString('he-IL')} בשעה ${parsedLesson.time}.\n\n` +
              `האם ברצונך להחליף אותו בשיעור החדש "${parsedLesson.title}"?\n\n` +
              `לחץ אישור כדי להחליף, או ביטול כדי לדלג על השיעור החדש.`
            );
            
            if (choice) {
              // מחק את השיעור הקיים והוסף את החדש
              await LessonService.deleteLesson(conflictingLesson.id);
              await LessonService.createLesson(lessonData);
              successCount++;
            } else {
              // דלג על השיעור החדש
              errorCount++;
            }
          } else {
            // אין התנגשות, הוסף את השיעור
            await LessonService.createLesson(lessonData);
            successCount++;
          }
        } catch (err) {
          console.error('שגיאה בייבוא שיעור:', parsedLesson, err);
          errorCount++;
        }
      });

      if (successCount > 0) {
        setImportStatus('success');
        setErrorMessage(
          `יובאו בהצלחה ${successCount} שיעורים${errorCount > 0 ? ` (${errorCount} שיעורים נכשלו)` : ''}`
        );
      } else {
        setImportStatus('error');
        setErrorMessage('לא הצלחנו לייבא אף שיעור');
      }
    } catch (e) {
      setImportStatus('error');
      setErrorMessage('שגיאה בייבוא השיעורים');
    }
  };

  const handleImportZmanim = () => {
    try {
      const { ZmanService } = require('../services/zmanService');
      let inserted = 0; let skipped = 0;
      const toInsert: any[] = [];
      parsedZmanim.forEach(z => {
        const [d,m,y] = z.date.split('/');
        const date = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
        toInsert.push({ date, time: z.time, label: z.label, type: z.type });
      });
      const res = ZmanService.bulkInsert(toInsert);
      inserted = res.inserted; skipped = res.skipped;
      setErrorMessage(`יובאו ${inserted} זמנים (${skipped} דילוגים)`);
    } catch (e) {
      setErrorMessage('שגיאה בייבוא זמנים');
    }
  };

  const downloadTemplate = () => {
    const templateContent = `לוח שיעורים שנתי - דוגמה\n\nהוראות:\n- כל שיעור בשורה נפרדת\n- פורמט: תאריך (DD/MM/YYYY או DD/MM/YY) - שעה (HH:MM) - שם הרב - נושא השיעור\n- שיעורים בין חצות ל-4 בבוקר יופיעו ביום הקודם\n\nדוגמאות:\n05/01/25 - 19:00 - הרב ברוך רוזנבלום - הכנה ליום הכיפורים\n12/01/25 - 20:30 - הרב משה כהן - הלכות שבת\n19/01/25 - 00:30 - הרב יוסף לוי - לימוד לילי\n26/01/25 - 21:00 - הרב אהרן גולדברג - קבלה ורוחניות\n`;
    const blob = new Blob([templateContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'תבנית-שיעורים.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadExtendedTemplate = () => {
    const extended = `תבנית לוח שנתי – שיעורים + זמני יום\n==================================================\nהוראות:\n1. תאריך: DD/MM/YYYY\n2. שיעור: DD/MM/YYYY - HH:MM - כותרת - מקום (מקום אופציונלי)\n3. זמן יום: DD/MM/YYYY - הדלקת נרות - HH:MM (או שקיעה / עלות השחר / נץ / צאת)\n4. לא לערבב בשורה אחת שיעור וזמן יום.\n5. שורות שמתחילות ב# או [ או === יתעלמו.\n\n[מדור: שיעורים]\n05/01/2026 - 19:00 - שיעור גמרא בבא קמא - בית מדרש ראשי\n05/01/2026 - 20:30 - הלכה למעשה דיני שבת - אולם הרצאות\n06/01/2026 - 21:15 - פרשת השבוע פרשת שמות - בית מדרש\n10/01/2026 - 19:30 - חסידות תניא פרק א - חדר מחקר\n10/01/2026 - 19:30 - שיעור גמרא חזרה (התנגשות לדוגמה)\n\n[מדור: זמני יום]\n05/01/2026 - הדלקת נרות - 16:27\n05/01/2026 - שקיעה - 16:45\n05/01/2026 - צאת - 17:25\n06/01/2026 - עלות השחר - 05:21\n06/01/2026 - נץ - 06:47\n06/01/2026 - שקיעה - 16:46\n06/01/2026 - צאת - 17:26\n\n[מדור מעורב]\n12/01/2026 - שיעור גמרא מסכת תענית - בית מדרש\n12/01/2026 - הדלקת נרות - 16:32\n12/01/2026 - שקיעה - 16:49\n\n# הוסף שורות נוספות כאן...\n==================================================\n`;
    const blob = new Blob([extended], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'תבנית-שיעורים-מורחבת.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="import-page">
      <div className="page-header">
        <h1>ייבוא שיעורים מקובץ PDF</h1>
        <p>העלה קובץ PDF עם כל השיעורים השנתיים והאפליקציה תשבץ אותם אוטומטית</p>
      </div>

      <div className="import-container">
        <div className="upload-section">
          <div className="template-download">
            <button onClick={downloadTemplate} className="template-btn">
              <Download size={20} />
              הורד תבנית בסיסית
            </button>
            <button onClick={downloadExtendedTemplate} className="template-btn" style={{background:'#7c3aed'}}>
              <Download size={20} />
              הורד תבנית מורחבת
            </button>
            <span>לבחירת הפורמט הנכון</span>
          </div>

          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileInput}
              className="file-input"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="upload-label">
              <Upload size={48} />
              <h3>גרור קובץ PDF / DOCX לכאן או לחץ לבחירה</h3>
              <p>תומך בקבצי PDF / DOCX עד 10MB</p>
              {file && (
                <div className="selected-file">
                  <FileText size={20} />
                  <span>{file.name}</span>
                </div>
              )}
            </label>
          </div>

          {file && !isProcessing && parsedLessons.length === 0 && (
            <button onClick={handleProcessFile} className="process-btn">
              <Calendar size={20} />
              עבד קובץ ופרס שיעורים
            </button>
          )}

          {isProcessing && (
            <div className="processing">
              <div className="spinner"></div>
              <p>מעבד קובץ PDF...</p>
            </div>
          )}
        </div>

        {parsedLessons.length > 0 && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>תצוגה מקדימה - {parsedLessons.length} שיעורים נמצאו</h3>
              <button onClick={handleImportLessons} className="import-btn">
                <CheckCircle size={20} />
                ייבא את כל השיעורים
              </button>
            </div>

            <div className="lessons-preview">
              {parsedLessons.slice(0, 10).map((lesson, index) => (
                <div key={index} className="lesson-preview">
                  <div className="lesson-date">
                    <Calendar size={16} />
                    {lesson.date}
                  </div>
                  <div className="lesson-time">
                    <Clock size={16} />
                    {lesson.time}
                  </div>
                  <div className="lesson-info">
                    <h4>{lesson.title}</h4>
                    <span className="lesson-category">{lesson.category}</span>
                    {lesson.description && (
                      <p className="lesson-description">{lesson.description}</p>
                    )}
                  </div>
                </div>
              ))}
              {parsedLessons.length > 10 && (
                <div className="more-lessons">
                  ועוד {parsedLessons.length - 10} שיעורים...
                </div>
              )}
            </div>
          </div>
        )}

        {parsedZmanim.length > 0 && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>זמנים נמצאו - {parsedZmanim.length}</h3>
              <button onClick={handleImportZmanim} className="import-btn">
                <CheckCircle size={20} /> ייבא זמנים
              </button>
            </div>
            <div className="lessons-preview">
              {parsedZmanim.slice(0,10).map((z,i)=>(
                <div key={i} className="lesson-preview">
                  <div className="lesson-date"><Calendar size={16}/>{z.date}</div>
                  <div className="lesson-time"><Clock size={16}/>{z.time}</div>
                  <div className="lesson-info">
                    <h4>{z.type}</h4>
                    <span className="lesson-category">{z.label}</span>
                  </div>
                </div>
              ))}
              {parsedZmanim.length>10 && <div className="more-lessons">ועוד {parsedZmanim.length-10} זמנים...</div>}
            </div>
          </div>
        )}

        {docxDebug && (
          <div className="preview-section">
            <div className="preview-header">
              <h3>DOCX Debug: {docxDebug.tables} tables detected</h3>
            </div>
            <pre style={{maxHeight:'200px',overflow:'auto',direction:'ltr',fontSize:'0.7rem',background:'#f1f5f9',padding:'0.5rem'}}>{docxDebug.sample}</pre>
            {docxCandidates.length>0 && (
              <div style={{marginTop:'0.5rem'}}>
                <strong>{docxCandidates.length} raw time candidates</strong>
                <ul style={{maxHeight:'150px',overflow:'auto',fontSize:'0.65rem'}}>
                  {docxCandidates.slice(0,40).map((c,i)=>(
                    <li key={i}>{c.month||'?'} {c.day||'?'} {c.time||'?'} {c.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {importStatus === 'error' && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {importStatus === 'success' && parsedLessons.length > 0 && (
          <div className="success-message">
            <CheckCircle size={20} />
            <span>השיעורים יובאו בהצלחה! ניתן לראות אותם בלוח השנה</span>
            <button onClick={handleDownloadJSON} className="download-json-btn">
              <Download size={16} />
              הורד JSON לגיטהאב
            </button>
          </div>
        )}

        {/* כפתור להורדת JSON בכל זמן */}
        <div className="export-section">
          <h3>ייצוא נתונים</h3>
          <p>הורד את כל השיעורים כקובץ JSON לשמירה ב-GitHub</p>
          <button onClick={handleDownloadJSON} className="export-btn">
            <Download size={16} />
            הורד JSON של כל השיעורים
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
