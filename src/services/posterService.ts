import type { PosterTemplate, GeneratedPoster, Lesson } from '../types';

export class PosterService {
  private static templates: PosterTemplate[] = [
    {
      id: '1',
      name: 'קלאסי',
      preview: '/template-classic.svg',
      category: 'classic',
      template: `
        <div class="poster classic" style="width: 400px; height: 600px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; position: relative; overflow: hidden;">
          <div class="decorative-corner" style="position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: rgba(255,255,255,0.1); transform: rotate(45deg) translate(50%, -50%);"></div>
          <h1 style="font-size: 28px; margin-bottom: 20px; text-align: center; font-weight: bold;">{{title}}</h1>
          <div class="content" style="text-align: center; margin-top: 40px;">
            <p style="font-size: 18px; margin-bottom: 15px;">עם {{teacher}}</p>
            <p style="font-size: 16px; margin-bottom: 10px;">📅 {{date}}</p>
            <p style="font-size: 16px; margin-bottom: 10px;">🕐 {{time}}</p>
            <p style="font-size: 16px; margin-bottom: 20px;">📍 {{location}}</p>
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 30px;">
              <p style="font-size: 14px; line-height: 1.4;">{{description}}</p>
            </div>
          </div>
        </div>
      `,
      variables: [
        { name: 'title', type: 'text', defaultValue: 'שם השיעור', label: 'כותרת השיעור', placeholder: 'הכנס כותרת' },
        { name: 'teacher', type: 'text', defaultValue: 'שם המורה', label: 'שם המורה/ה', placeholder: 'שם המורה' },
        { name: 'date', type: 'date', defaultValue: '', label: 'תאריך', placeholder: 'בחר תאריך' },
        { name: 'time', type: 'text', defaultValue: '20:00', label: 'שעה', placeholder: 'שעת השיעור' },
        { name: 'location', type: 'text', defaultValue: 'המרפסת', label: 'מיקום', placeholder: 'מיקום השיעור' },
        { name: 'description', type: 'text', defaultValue: 'תיאור השיעור', label: 'תיאור', placeholder: 'תיאור קצר' },
      ]
    },
    {
      id: '2',
      name: 'מודרני',
      preview: '/template-modern.svg',
      category: 'modern',
      template: `
        <div class="poster modern" style="width: 400px; height: 600px; background: #1a1a1a; color: white; position: relative; overflow: hidden; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
          <div class="accent" style="position: absolute; top: 0; left: 0; width: 100%; height: 8px; background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);"></div>
          <div class="content" style="padding: 60px 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 32px; font-weight: 300; margin-bottom: 10px; letter-spacing: 2px;">{{title}}</h1>
              <div style="width: 60px; height: 2px; background: #4ecdc4; margin: 0 auto;"></div>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.1);">
              <p style="font-size: 20px; margin-bottom: 25px; color: #4ecdc4;">{{teacher}}</p>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 18px;">📅</span>
                  <span style="font-size: 16px;">{{date}}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 18px;">⏰</span>
                  <span style="font-size: 16px;">{{time}}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 18px;">📍</span>
                  <span style="font-size: 16px;">{{location}}</span>
                </div>
              </div>
              <p style="margin-top: 25px; font-size: 14px; line-height: 1.5; color: #cccccc;">{{description}}</p>
            </div>
          </div>
        </div>
      `,
      variables: [
        { name: 'title', type: 'text', defaultValue: 'שם השיעור', label: 'כותרת השיעור', placeholder: 'הכנס כותרת' },
        { name: 'teacher', type: 'text', defaultValue: 'שם המורה', label: 'שם המורה/ה', placeholder: 'שם המורה' },
        { name: 'date', type: 'date', defaultValue: '', label: 'תאריך', placeholder: 'בחר תאריך' },
        { name: 'time', type: 'text', defaultValue: '20:00', label: 'שעה', placeholder: 'שעת השיעור' },
        { name: 'location', type: 'text', defaultValue: 'המרפסת', label: 'מיקום', placeholder: 'מיקום השיעור' },
        { name: 'description', type: 'text', defaultValue: 'תיאור השיעור', label: 'תיאור', placeholder: 'תיאור קצר' },
      ]
    },
    {
      id: '3',
      name: 'מינימליסטי',
      preview: '/templates/minimal-preview.jpg',
      category: 'minimal',
      template: `
        <div class="poster minimal" style="width: 400px; height: 600px; background: #fafafa; color: #333; padding: 60px 40px; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; position: relative;">
          <div style="text-align: center; margin-bottom: 60px;">
            <h1 style="font-size: 36px; font-weight: 100; margin-bottom: 20px; color: #2c3e50; letter-spacing: 1px;">{{title}}</h1>
            <div style="width: 100px; height: 1px; background: #3498db; margin: 0 auto;"></div>
          </div>
          <div style="text-align: center; line-height: 2;">
            <p style="font-size: 22px; margin-bottom: 30px; color: #3498db; font-weight: 300;">{{teacher}}</p>
            <p style="font-size: 18px; margin-bottom: 15px;">{{date}}</p>
            <p style="font-size: 18px; margin-bottom: 15px;">{{time}}</p>
            <p style="font-size: 18px; margin-bottom: 40px;">{{location}}</p>
            <div style="border-top: 1px solid #ecf0f1; padding-top: 30px;">
              <p style="font-size: 16px; line-height: 1.6; color: #7f8c8d;">{{description}}</p>
            </div>
          </div>
        </div>
      `,
      variables: [
        { name: 'title', type: 'text', defaultValue: 'שם השיעור', label: 'כותרת השיעור', placeholder: 'הכנס כותרת' },
        { name: 'teacher', type: 'text', defaultValue: 'שם המורה', label: 'שם המורה/ה', placeholder: 'שם המורה' },
        { name: 'date', type: 'date', defaultValue: '', label: 'תאריך', placeholder: 'בחר תאריך' },
        { name: 'time', type: 'text', defaultValue: '20:00', label: 'שעה', placeholder: 'שעת השיעור' },
        { name: 'location', type: 'text', defaultValue: 'המרפסת', label: 'מיקום', placeholder: 'מיקום השיעור' },
        { name: 'description', type: 'text', defaultValue: 'תיאור השיעור', label: 'תיאור', placeholder: 'תיאור קצר' },
      ]
    }
  ];

  static getTemplates(): PosterTemplate[] {
    return this.templates;
  }

  static getTemplateById(id: string): PosterTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  static generatePoster(templateId: string, data: Record<string, string>): string {
    const template = this.getTemplateById(templateId);
    if (!template) throw new Error('Template not found');

    let html = template.template;
    
    // Replace variables in template
    template.variables.forEach(variable => {
      const value = data[variable.name] || variable.defaultValue;
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      html = html.replace(regex, value);
    });

    return html;
  }

  static generatePosterFromLesson(templateId: string, lesson: Lesson): string {
    const data = {
      title: lesson.title,
      teacher: lesson.teacher,
      date: lesson.date.toLocaleDateString('he-IL'),
      time: lesson.time,
      location: lesson.location,
      description: lesson.description,
    };

    return this.generatePoster(templateId, data);
  }

  static async exportPosterAsImage(_html: string): Promise<string> {
    // In a real implementation, this would use html2canvas or similar
    // For demo purposes, we'll return a data URL
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create a simple canvas representation
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#667eea';
          ctx.fillRect(0, 0, 400, 600);
          ctx.fillStyle = 'white';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('מודעה לשיעור', 200, 300);
        }
        
        resolve(canvas.toDataURL('image/png'));
      }, 1000);
    });
  }

  static saveGeneratedPoster(poster: Omit<GeneratedPoster, 'id' | 'createdAt'>): GeneratedPoster {
    const savedPosters = this.getSavedPosters();
    const newPoster: GeneratedPoster = {
      ...poster,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    
    savedPosters.push(newPoster);
    localStorage.setItem('mirpeset-posters', JSON.stringify(savedPosters));
    return newPoster;
  }

  static getSavedPosters(): GeneratedPoster[] {
    const data = localStorage.getItem('mirpeset-posters');
    if (!data) return [];
    
    const posters = JSON.parse(data);
    return posters.map((poster: any) => ({
      ...poster,
      createdAt: new Date(poster.createdAt),
    }));
  }

  static getGeneratedPosters(): GeneratedPoster[] {
    return this.getSavedPosters();
  }

  static deletePoster(posterId: string): void {
    const savedPosters = this.getSavedPosters();
    const filteredPosters = savedPosters.filter(p => p.id !== posterId);
    localStorage.setItem('mirpeset-posters', JSON.stringify(filteredPosters));
  }

  static async createPoster(
    lessonId: string,
    templateId: string, 
    data: Record<string, string>
  ): Promise<GeneratedPoster> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const htmlContent = this.generatePoster(templateId, data);
    
    // In a real app, this would convert HTML to image
    const imageUrl = `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="200" y="100" text-anchor="middle" font-size="24" fill="#333">
          ${data.title || 'כותרת'}
        </text>
        <text x="200" y="150" text-anchor="middle" font-size="16" fill="#666">
          ${data.teacher || 'מרצה'}
        </text>
        <text x="200" y="200" text-anchor="middle" font-size="14" fill="#999">
          ${data.date || 'תאריך'} • ${data.time || 'שעה'}
        </text>
      </svg>
    `)}`;

    const newPoster: GeneratedPoster = {
      id: Date.now().toString(),
      lessonId,
      templateId,
      imageUrl,
      htmlContent,
      createdAt: new Date()
    };

    // Save to localStorage
    const savedPosters = this.getSavedPosters();
    savedPosters.push(newPoster);
    localStorage.setItem('mirpeset-posters', JSON.stringify(savedPosters));
    
    return newPoster;
  }
}
