// שירות לקריאת קובצי DOCX באמצעות mammoth
// בשלב זה נטען את הספרייה דינמית כדי לא לשבור בנייה אם אין תמיכה
// הפונקציה תחזיר טקסט פשוט מהמסמך לשימוש באותו פרסר קיים או פרסר ייעודי

export interface RawDocxDebug {
  html: string;
  tables: number;
  firstTableSample?: string;
}

export interface ParsedCellLessonCandidate {
  month?: string; // month context
  day?: number;
  rawLine: string;
  time?: string;
  title?: string;
  location?: string;
}

export class DocxService {
  static async extractText(file: File): Promise<string> {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      throw new Error('קובץ אינו בפורמט DOCX');
    }

    // קריאת הקובץ כ-ArrayBuffer
    const arrayBuffer = await this.readFileAsArrayBuffer(file);

    try {
      // טעינה דינמית של mammoth (נמנע מבעיות SSR/Vite)
  // @ts-ignore - חבילת mammoth ללא טיפוסים מובנים
  const mammoth: any = await import('mammoth');
      const { value } = await mammoth.convertToHtml({ arrayBuffer });
      // ממירים HTML לטקסט פשוט בסיסי ע"י הסרת תגיות
      const plain = this.htmlToPlainText(value);
      return plain;
    } catch (e) {
      console.error('שגיאה בעיבוד DOCX', e);
      throw new Error('נכשלה קריאת קובץ DOCX');
    }
  }

  static async extractHtmlDebug(file: File): Promise<RawDocxDebug> {
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    // @ts-ignore
    const mammoth: any = await import('mammoth');
    const { value } = await mammoth.convertToHtml({ arrayBuffer });
    const tableMatches = value.match(/<table[\s\S]*?<\/table>/gi) || [];
    return {
      html: value,
      tables: tableMatches.length,
      firstTableSample: tableMatches[0]?.slice(0, 800)
    };
  }

  static parseCalendarStructure(html: string): ParsedCellLessonCandidate[] {
    const result: ParsedCellLessonCandidate[] = [];
    const monthRegex = /(ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר|תשרי|חשון|כסלו|טבת|שבט|אדר|ניסן|אייר|סיון|תמוז|אב|אלול)\s?\d{0,4}/;
    let currentMonth: string | undefined;

    // slice tables
    const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
    for (const tbl of tables) {
      if (monthRegex.test(tbl)) {
        const m = tbl.match(monthRegex);
        if (m) currentMonth = m[0];
      }
      // extract cells
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellRegex.exec(tbl))) {
        const cellHtml = cellMatch[1];
        const cleaned = cellHtml
          .replace(/<style[\s\S]*?<\/style>/gi,'')
          .replace(/<br\s*\/?>(?=.)/gi,'\n')
          .replace(/<[^>]+>/g,'')
          .split('\n')
          .map(s=>s.trim())
          .filter(Boolean);
        if (cleaned.length === 0) continue;
        let currentDay: number | undefined;
        for (const line of cleaned) {
          const dayMatch = line.match(/^(\d{1,2})(?:\D|$)/);
          if (dayMatch) {
            currentDay = parseInt(dayMatch[1],10);
          }
          // detect time + title (HH:MM ...)
            const timeMatch = line.match(/(\d{1,2}:\d{2})/);
            if (timeMatch) {
              const time = timeMatch[1].padStart(5,'0');
              // heuristic split after time
              const after = line.split(timeMatch[1])[1].trim();
              if (after) {
                result.push({
                  month: currentMonth,
                  day: currentDay,
                  rawLine: line,
                  time,
                  title: after
                });
              }
            }
        }
      }
    }
    return result;
  }

  private static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  private static htmlToPlainText(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<\/?(span|strong|em|b|i|u|p|div|h[1-6])[^>]*>/gi, '\n')
      .replace(/<br\s*\/?>(?=.)/gi, '\n')
      .replace(/<table[\s\S]*?<\/table>/gi, (table) => this.tableToText(table))
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l)
      .join('\n');
  }

  private static tableToText(_tableHtml: string): string {
    // פישוט: כרגע נחזיר ריק, אפשר בהמשך למפות לתאים
    return '\n';
  }

  // פונקציה להמרת שנה עם שתי ספרות לארבע ספרות
  static convertTwoDigitYear(year: number): number {
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    
    // אם השנה קטנה מ-50, נניח שזה המאה הנוכחית או הבאה
    // אם גדולה מ-50, נניח שזה המאה הנוכחית או הקודמת
    if (year <= 50) {
      return currentCentury + year;
    } else {
      return currentCentury - 100 + year;
    }
  }
}

export default DocxService;
