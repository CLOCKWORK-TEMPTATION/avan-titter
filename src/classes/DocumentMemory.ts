/**
 * @class DocumentMemory
 * @description ذاكرة المستند - تخزن المعلومات المتعلمة أثناء التصنيف
 * 
 * هذا الكلاس يحل مشكلة تصنيف أسماء الشخصيات التي تبدأ بـ "ي" أو "ت" كـ action خطأً
 * مثل: ياسين، يوسف، تامر، تيسير
 * 
 * يعمل الكلاس على تعلّم أسماء الشخصيات من المستند نفسه أثناء التصنيف
 * ثم يستخدمها لتحسين دقة التصنيف
 */
export class DocumentMemory {
  /** قاموس الشخصيات المؤكدة (اسم الشخصية -> عدد مرات الظهور) */
  private knownCharacters: Map<string, number> = new Map();
  
  /** قاموس الأماكن المؤكدة */
  private knownPlaces: Map<string, number> = new Map();

  /**
   * تنظيف اسم الشخصية للمقارنة
   * @param name اسم الشخصية الخام
   * @returns الاسم المُنظف
   */
  private normalizeCharacterName(name: string): string {
    return name
      .replace(/[:：\s]+$/, '')  // إزالة النقطتين والمسافات من النهاية
      .replace(/^[\s]+/, '')     // إزالة المسافات من البداية
      .trim();
  }

  /**
   * إضافة شخصية للقاموس
   * @param name اسم الشخصية
   * @param confidence مستوى الثقة (high = من سطر ينتهي بـ :)
   */
  addCharacter(name: string, confidence: 'high' | 'medium'): void {
    const normalized = this.normalizeCharacterName(name);
    if (!normalized || normalized.length < 2) return;
    
    const currentCount = this.knownCharacters.get(normalized) || 0;
    const increment = confidence === 'high' ? 2 : 1;
    this.knownCharacters.set(normalized, currentCount + increment);
  }

  /**
   * فحص إذا كان الاسم شخصية معروفة
   * @param name الاسم للفحص
   * @returns مستوى الثقة أو null
   */
  isKnownCharacter(name: string): { confidence: 'high' | 'medium' | 'low' } | null {
    const normalized = this.normalizeCharacterName(name);
    const count = this.knownCharacters.get(normalized);
    
    if (!count) return null;
    if (count >= 3) return { confidence: 'high' };
    if (count >= 1) return { confidence: 'medium' };
    return { confidence: 'low' };
  }

  /**
   * إضافة مكان للقاموس
   * @param place اسم المكان
   */
  addPlace(place: string): void {
    const normalized = place.trim();
    if (!normalized || normalized.length < 2) return;
    
    const currentCount = this.knownPlaces.get(normalized) || 0;
    this.knownPlaces.set(normalized, currentCount + 1);
  }

  /**
   * فحص إذا كان النص مكان معروف
   * @param text النص للفحص
   * @returns true إذا كان مكان معروف
   */
  isKnownPlace(text: string): boolean {
    return this.knownPlaces.has(text.trim());
  }

  /**
   * الحصول على جميع الشخصيات المعروفة
   * @returns قائمة بأسماء الشخصيات
   */
  getAllCharacters(): string[] {
    return Array.from(this.knownCharacters.keys());
  }

  /**
   * مسح الذاكرة
   */
  clear(): void {
    this.knownCharacters.clear();
    this.knownPlaces.clear();
  }
}
