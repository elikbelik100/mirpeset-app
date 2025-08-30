// שירות להפקת תאריך עברי באמצעות @hebcal/core
import { HDate } from '@hebcal/core';

export interface HebrewDateParts {
  day: number;
  monthName: string;
  monthIndex: number; // 1 = Nisan ...
  year: number;
  formatted: string;
  short: string;
  dayHebrew: string; // e.g. א, ט"ו, כ"ז
}

// hebcal order: 1=Nisan ... 6=Elul, 7=Tishrei ... 11=Shvat, 12=Adar I/Adar, 13=Adar II
const BASE_MONTHS: Record<number,string> = {
  1:'ניסן', 2:'אייר', 3:'סיון', 4:'תמוז', 5:'אב', 6:'אלול',
  7:'תשרי', 8:'חשון', 9:'כסלו', 10:'טבת', 11:'שבט'
};

export class HebrewDateService {
  static getHebrewDateParts(date: Date): HebrewDateParts {
  const hd = new HDate(date);
  const day = hd.getDate();
  const monthIndex = hd.getMonth();
  const year = hd.getFullYear();
  const leap = hd.isLeapYear();
  let monthName: string;
  if (monthIndex <= 11) monthName = BASE_MONTHS[monthIndex] || '';
  else if (monthIndex === 12) monthName = leap ? 'אדר א\'' : 'אדר';
  else monthName = 'אדר ב\''; // 13
  const dayHebrew = this.dayNumberToHebrew(day);
  const formatted = `${dayHebrew} ${monthName} ${this.formatHebrewYear(year)}`;
  const short = `${dayHebrew} ${monthName}`;
  return { day, monthName, monthIndex, year, formatted, short, dayHebrew };
  }

  static formatHebrewNumber(num: number): string {
    // פישוט: החזרת מספר רגיל. ניתן לשפר לגימ"טריה בהמשך.
    return num.toString();
  }

  static formatHebrewYear(year: number): string {
    // פישוט: החזרת שנה מלאה (תשפ"ו). לשיפור אפשר להשתמש בפונקציה ייעודית בעתיד.
    // כאן נחזיר פשוט את המספר (ללא גימ"טריה) עד שנוסיף המרה.
    return year.toString();
  }

  static dayNumberToHebrew(day: number): string {
    const map: Record<number,string> = {
      1:'א',2:'ב',3:'ג',4:'ד',5:'ה',6:'ו',7:'ז',8:'ח',9:'ט',10:'י',
      11:'י"א',12:'י"ב',13:'י"ג',14:'י"ד',15:'ט"ו',16:'ט"ז',17:'י"ז',18:'י"ח',19:'י"ט',
      20:'כ',21:'כ"א',22:'כ"ב',23:'כ"ג',24:'כ"ד',25:'כ"ה',26:'כ"ו',27:'כ"ז',28:'כ"ח',29:'כ"ט',30:'ל'
    };
    return map[day] || day.toString();
  }
}

export default HebrewDateService;
