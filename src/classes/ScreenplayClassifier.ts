/**
 * @class ScreenplayClassifier
 * @description مصنف السيناريو - يحتوي على جميع الدوال والـ patterns لتصنيف أسطر السيناريو
 */
import { LineContext, ClassificationScore, ClassificationResult } from '../types/types';

export class ScreenplayClassifier {
  static readonly AR_AB_LETTER = "\u0600-\u06FF";
  static readonly EASTERN_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  static readonly WESTERN_DIGITS = "0123456789";
  static readonly ACTION_VERB_LIST =
    "يدخل|يخرج|ينظر|يرفع|تبتسم|ترقد|تقف|يبسم|يضع|يقول|تنظر|تربت|تقوم|يشق|تشق|تضرب|يسحب|يلتفت|يقف|يجلس|تجلس|يجري|تجري|يمشي|تمشي|يركض|تركض|يصرخ|اصرخ|يبكي|تبكي|يضحك|تضحك|يغني|تغني|يرقص|ترقص|يأكل|تأكل|يشرب|تشرب|ينام|تنام|يستيقظ|تستيقظ|يكتب|تكتب|يقرأ|تقرأ|يسمع|تسمع|يشم|تشم|يلمس|تلمس|يأخذ|تأخذ|يعطي|تعطي|يفتح|تفتح|يغلق|تغلق|يبدأ|تبدأ|ينتهي|تنتهي|يذهب|تذهب|يعود|تعود|يأتي|تأتي|يموت|تموت|يحيا|تحيا|يقاتل|تقاتل|ينصر|تنتصر|يخسر|تخسر|يكتب|تكتب|يرسم|ترسم|يصمم|تخطط|تخطط|يقرر|تقرر|يفكر|تفكر|يتذكر|تذكر|يحاول|تحاول|يستطيع|تستطيع|يريد|تريد|يحتاج|تحتاج|يبحث|تبحث|يجد|تجد|يفقد|تفقد|يحمي|تحمي|يحمي|تحمي|يراقب|تراقب|يخفي|تخفي|يكشف|تكشف|يكتشف|تكتشف|يعرف|تعرف|يتعلم|تعلن|يعلم|تعلن|يوجه|وجه|يسافر|تسافر|يعود|تعود|يرحل|ترحل|يبقى|تبقى|ينتقل|تنتقل|يتغير|تتغير|ينمو|تنمو|يتطور|تتطور|يواجه|تواجه|يحل|تحل|يفشل|تفشل|ينجح|تنجح|يحقق|تحقن|يبدأ|تبدأ|ينهي|تنهي|يوقف|توقف|يستمر|تستمر|ينقطع|تنقطع|يرتبط|ترتبط|ينفصل|تنفصل|يتزوج|تتزوج|يطلق|يطلق|يولد|تولد|يكبر|تكبر|يشيخ|تشيخ|يمرض|تمرض|يشفي|تشفي|يصاب|تصيب|يتعافى|تعافي|يموت|يقتل|تقتل|يُقتل|تُقتل|يختفي|تختفي|يظهر|تظهر|يختبئ|تخبوء|يطلب|تطلب|يأمر|تأمر|يمنع|تمنع|يسمح|تسمح|يوافق|توافق|يرفض|ترفض|يعتذر|يشكر|تشكر|يحيي|تحيي|يودع|تودع|يجيب|تجيب|يسأل|تسأل|يصيح|تصيح|يهمس|تهمس|يصمت|تصمت|يتكلم|تتكلم|ينادي|تنادي|يحكي|تحكي|يروي|تروي|يقص|تقص|يضحك|تضحك|يبكي|تبكي|يتنهد|تتنهد|يئن|تئن";
  
  static readonly EXTRA_ACTION_VERBS =
    "نرى|نسمع|نلاحظ|نقترب|نبتعد|ننتقل|ترفع|ينهض|تنهض|تقتحم|يقتحم|يتبادل|يبتسم|يبدؤون|تفتح|يفتح|تدخل|يُظهر|يظهر|تظهر";
  
  static readonly ACTION_VERB_SET = new Set(
    (ScreenplayClassifier.ACTION_VERB_LIST + "|" + ScreenplayClassifier.EXTRA_ACTION_VERBS)
      .split("|")
      .map((v) => v.trim())
      .filter(Boolean)
  );

  static isActionVerbStart(line: string): boolean {
    const firstToken = line.trim().split(/\s+/)[0] ?? "";
    const normalized = firstToken
      .replace(/[\u200E\u200F\u061C]/g, "")
      .replace(/[^\u0600-\u06FF]/g, "")
      .trim();
    if (!normalized) return false;
    if (ScreenplayClassifier.ACTION_VERB_SET.has(normalized)) return true;

    // دعم الواو/الفاء/اللام الملتصقة مثل: (وتقف/فيبتسم/ليجلس)
    const leadingParticles = ["و", "ف", "ل"];
    for (const p of leadingParticles) {
      if (normalized.startsWith(p) && normalized.length > 1) {
        const candidate = normalized.slice(1);
        if (ScreenplayClassifier.ACTION_VERB_SET.has(candidate)) return true;
      }
    }

    return false;
  }

  static readonly BASMALA_RE = /^\s*بسم\s+الله\s+الرحمن\s+الرحيم\s*$/i;
  static readonly SCENE_PREFIX_RE =
    /^\s*(?:مشهد|م\.|scene)\s*([0-9٠-٩]+)\s*(?:[-–—:،]\s*)?(.*)$/i;
  static readonly INOUT_PART = "(?:داخلي|خارجي|د\\.|خ\\.)";
  static readonly TIME_PART =
    "(?:ليل|نهار|ل\\.|ن\\.|صباح|مساء|فجر|ظهر|عصر|مغرب|عشاء|الغروب|الفجر)";
  
  // Flexible regex to match complex combinations like "Day - Night / Ext"
  static readonly HEADER_PART_ANY = `(?:${ScreenplayClassifier.INOUT_PART}|${ScreenplayClassifier.TIME_PART})`;
  static readonly TL_REGEX = new RegExp(
    `(?:${ScreenplayClassifier.HEADER_PART_ANY}\\s*[-/&]\\s*)+${ScreenplayClassifier.HEADER_PART_ANY}|${ScreenplayClassifier.HEADER_PART_ANY}\\s*[-/&]\\s*${ScreenplayClassifier.HEADER_PART_ANY}`,
    "i"
  );
  
  static readonly PHOTOMONTAGE_RE = /^\s*[\(\)]*\s*(?:فوتو\s*مونتاج|Photomontage)\s*[\(\)]*\s*$/i;
  static readonly PHOTOMONTAGE_PART_RE = /^\s*[\(\)]*\s*(?:فوتو\s*مونتاج|Photomontage)\s*[\(\)]*/i;

  static readonly KNOWN_PLACES_RE = /^(مسجد|بيت|منزل|شارع|حديقة|مدرسة|جامعة|مكتب|محل|مستشفى|مطعم|فندق|سيارة|غرفة|قاعة|ممر|سطح|ساحة|مقبرة|مخبز|مكتبة|نهر|بحر|جبل|غابة|سوق|مصنع|بنك|محكمة|سجن|موقف|محطة|مطار|ميناء|كوبرى|نفق|مبنى|قصر|قصر عدلي|فندق|نادي|ملعب|ملهى|بار|كازينو|متحف|مسرح|سينما|معرض|مزرعة|مصنع|مختبر|مستودع|محل|مطعم|مقهى|موقف|مكتب|شركة|كهف|الكهف|غرفة الكهف|كهف المرايا|كوافير|صالون|حلاق)/i;

  static readonly CHARACTER_RE = new RegExp(
    "^\\s*(?:صوت\\s+)?[" +
    ScreenplayClassifier.AR_AB_LETTER +
    "][" +
    ScreenplayClassifier.AR_AB_LETTER +
    "\\s]{0,30}:?\\s*$"
  );
  static readonly TRANSITION_RE =
    /^\s*(?:قطع|قطع\s+إلى|إلى|مزج|ذوبان|خارج\s+المشهد|CUT TO:|FADE IN:|FADE OUT:)\s*$/i;
  static readonly PARENTHETICAL_SHAPE_RE = /^\s*\(.*?\)\s*$/;

  static readonly BULLET_CHARACTER_RE =
    /^[\s\u200E\u200F\u061C\uFEFF]*[•·∙⋅●○◦■□▪▫◆◇–—−‒―‣⁃*+]\s*([^:：]+?)\s*[:：]\s*(.*)\s*$/;

  Patterns: {
    sceneHeader1: RegExp;
    sceneHeader2: {
      time: RegExp;
      inOut: RegExp;
    };
    sceneHeader3: RegExp;
  };

  constructor() {
    const c = (regex: RegExp) => regex;
    this.Patterns = {
      sceneHeader1: c(/^\s*(?:مشهد|م\.|scene)\s*[0-9٠-٩]+\s*$/i),
      sceneHeader2: {
        time: new RegExp(ScreenplayClassifier.TIME_PART, "i"),
        inOut: new RegExp(ScreenplayClassifier.INOUT_PART, "i"),
      },
      sceneHeader3: c(ScreenplayClassifier.KNOWN_PLACES_RE),
    };
  }

  static easternToWesternDigits(s: string): string {
    const map: { [key: string]: string } = {
      "٠": "0",
      "١": "1",
      "٢": "2",
      "٣": "3",
      "٤": "4",
      "٥": "5",
      "٦": "6",
      "٧": "7",
      "٨": "8",
      "٩": "9",
    };
    return s.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (char) => map[char] || char);
  }

  static stripTashkeel(s: string): string {
    return s.replace(/[\u064B-\u065F\u0670]/g, "");
  }

  static normalizeSeparators(s: string): string {
    return s.replace(/[-–—]/g, "-").replace(/[،,]/g, ",").replace(/\s+/g, " ");
  }

  static normalizeLine(input: string): string {
    return ScreenplayClassifier.stripTashkeel(
      ScreenplayClassifier.normalizeSeparators(input)
    )
      .replace(/[\u200f\u200e\ufeff\t]+/g, "")
      // إزالة الرموز الزائدة من البداية فقط
      .replace(/^[\s\u200E\u200F\u061C\ufeFF]*[•·∙⋅●○◦■□▪▫◆◇–—−‒―‣⁃*+\-]+/, "")
      .trim();
  }

  static textInsideParens(s: string): string {
    const match = s.match(/^\s*\((.*?)\)\s*$/);
    return match ? match[1] || "" : "";
  }

  static hasSentencePunctuation(s: string): boolean {
    return /[\.!\؟\?]/.test(s);
  }

  static wordCount(s: string): number {
    return s.trim() ? s.trim().split(/\s+/).length : 0;
  }

  static isBlank(line: string): boolean {
    return !line || line.trim() === "";
  }

  static isBasmala(line: string): boolean {
    const normalizedLine = line.trim();
    const basmalaPatterns = [
      /^بسم\s+الله\s+الرحمن\s+الرحيم$/i,
      /^[{}]*\s*بسم\s+الله\s+الرحمن\s+الرحيم\s*[{}]*$/i,
    ];
    return basmalaPatterns.some((pattern) => pattern.test(normalizedLine));
  }

  static isSceneHeaderStart(line: string): boolean {
    return ScreenplayClassifier.SCENE_PREFIX_RE.test(line);
  }

  static parseInlineCharacterDialogue(line: string):
    | { characterName: string; dialogueText: string }
    | null {
    const trimmed = line.trim();
    const inlineMatch = trimmed.match(/^([^:：]{1,60}?)\s*[:：]\s*(.+)$/);
    if (!inlineMatch) return null;

    const characterName = (inlineMatch[1] || "").trim();
    const dialogueText = (inlineMatch[2] || "").trim();
    if (!characterName || !dialogueText) return null;

    if (!ScreenplayClassifier.isCharacterLine(`${characterName}:`)) return null;
    return { characterName, dialogueText };
  }

  static cleanupSceneHeaderRemainder(input: string): string {
    return ScreenplayClassifier.normalizeSeparators(input)
      .replace(/^[\s\-–—:،,]+/, "")
      .replace(/[\s\-–—:،,]+$/, "")
      .trim();
  }

  static parseSceneHeaderFromLine(rawLine: string):
    | { sceneNum: string; timeLocation: string | null; placeInline: string | null }
    | null {
    const cleaned = ScreenplayClassifier.normalizeLine(rawLine);
    const m = cleaned.match(ScreenplayClassifier.SCENE_PREFIX_RE);
    if (!m) return null;

    const prefixMatch = cleaned.match(/^\s*(مشهد|م\.|scene)\s*/i);
    const prefix = (prefixMatch?.[1] || "مشهد").trim();
    const num = (m[1] || "").trim();
    let sceneNum = `${prefix} ${num}`.replace(/\s+/g, " ").trim();

    let rest = (m[2] || "").trim();
    
    // Check for Photomontage in the rest of the line
    const pmMatch = rest.match(ScreenplayClassifier.PHOTOMONTAGE_PART_RE);
    if (pmMatch) {
      const pmText = pmMatch[0].trim();
      // Clean up: remove all existing parens and wrap cleanly
      const inner = pmText.replace(/^[\(\)]+|[\(\)]+$/g, "").trim();
      const formattedPm = `(${inner})`;
      
      sceneNum = `${sceneNum} ${formattedPm}`;
      rest = rest.substring(pmMatch[0].length).trim();
    }

    if (!rest) {
      return { sceneNum, timeLocation: null, placeInline: null };
    }

    const tlMatch = rest.match(ScreenplayClassifier.TL_REGEX);
    if (tlMatch) {
      const timeLocation = (tlMatch[0] || "").trim();
      const remainder = ScreenplayClassifier.cleanupSceneHeaderRemainder(
        rest.replace(tlMatch[0], " ")
      );
      return {
        sceneNum,
        timeLocation: timeLocation || null,
        placeInline: remainder || null,
      };
    }

    const inOutOnlyRe = new RegExp(`^\\s*${ScreenplayClassifier.INOUT_PART}\\s*$`, "i");
    const timeOnlyRe = new RegExp(`^\\s*${ScreenplayClassifier.TIME_PART}\\s*$`, "i");
    if (inOutOnlyRe.test(rest) || timeOnlyRe.test(rest)) {
      return { sceneNum, timeLocation: rest.trim(), placeInline: null };
    }

    const placeInline = ScreenplayClassifier.cleanupSceneHeaderRemainder(rest);
    return { sceneNum, timeLocation: null, placeInline: placeInline || null };
  }

  static extractSceneHeaderParts(
    lines: string[],
    startIndex: number
  ):
    | {
        sceneNum: string;
        timeLocation: string;
        place: string;
        consumedLines: number;
        remainingAction?: string;
      }
    | null {
    let remainingAction: string | undefined;
    const parsed = ScreenplayClassifier.parseSceneHeaderFromLine(
      lines[startIndex] || ""
    );
    if (!parsed) return null;

    let timeLocation = parsed.timeLocation || "";

    const inOutOnlyRe = new RegExp(`^\\s*${ScreenplayClassifier.INOUT_PART}\\s*$`, "i");
    const timeOnlyRe = new RegExp(`^\\s*${ScreenplayClassifier.TIME_PART}\\s*$`, "i");

    const placeParts: string[] = [];
    if (parsed.placeInline) placeParts.push(parsed.placeInline);

    let currentSceneNum = parsed.sceneNum;
    let consumedLines = 1;

    for (let i = startIndex + 1; i < lines.length; i++) {
      const rawNext = lines[i] || "";
      if (ScreenplayClassifier.isBlank(rawNext)) break;

      let normalizedNext = ScreenplayClassifier.normalizeLine(rawNext);
      if (!normalizedNext) break;

      // 1. Check for Photomontage at the start of the line
      const pmMatch = normalizedNext.match(ScreenplayClassifier.PHOTOMONTAGE_PART_RE);
      if (pmMatch) {
        const pmText = pmMatch[0].trim();
        // Ensure parens
        let formattedPm = pmText;
        if (!formattedPm.startsWith("(") || !formattedPm.endsWith(")")) {
           // It might have one paren or none. Clean and wrap.
           const inner = pmText.replace(/^[\(\)]+|[\(\)]+$/g, "").trim();
           formattedPm = `(${inner})`;
        }
        
        currentSceneNum = `${currentSceneNum} ${formattedPm}`;
        
        // Remove the photomontage part from 'next' to process the rest
        let remainder = normalizedNext.substring(pmMatch[0].length);
        remainder = ScreenplayClassifier.cleanupSceneHeaderRemainder(remainder); // Removes leading dashes/spaces
        
        if (!remainder) {
          consumedLines++;
          continue;
        }
        
        // Update 'next' with the remainder to be processed by subsequent checks (TL, Place, etc.)
        // We do NOT increment consumedLines here because we are technically still on the same line index 'i',
        // but we have 'consumed' the PM part. 
        // Actually, we ARE on line 'i'. If we finish processing 'remainder' as a place, we are done with line 'i'.
        // So we should update 'next' and let it fall through.
        normalizedNext = remainder;
        
        // Note: We don't continue; we let the rest of the logic handle 'next' (the place).
      }

      // 2. Prepare text for Time/Location check (handle parentheses)
      let textToCheck = normalizedNext;
      const isParenthesized = normalizedNext.startsWith("(") && normalizedNext.endsWith(")");
      if (isParenthesized) {
        textToCheck = normalizedNext.slice(1, -1).trim();
      }

      const timeLocationIsInOutOnly = !!timeLocation && inOutOnlyRe.test(timeLocation);
      const timeLocationIsTimeOnly = !!timeLocation && timeOnlyRe.test(timeLocation);
      
      // If we don't have a complete TL yet, check if this line provides it
      if (!timeLocation || timeLocationIsInOutOnly || timeLocationIsTimeOnly) {
        const tlOnlyRe = new RegExp(
          `^\\s*${ScreenplayClassifier.TL_REGEX.source}\\s*$`,
          "i"
        );

        if (tlOnlyRe.test(textToCheck)) {
          timeLocation = textToCheck; // Use the inner text if parenthesized? Or the whole line? usually inner for T/L
          consumedLines++;
          continue;
        }

        if (!timeLocation && (inOutOnlyRe.test(textToCheck) || timeOnlyRe.test(textToCheck))) {
          timeLocation = textToCheck;
          consumedLines++;
          continue;
        }

        if (timeLocationIsInOutOnly && timeOnlyRe.test(textToCheck)) {
          timeLocation = `${timeLocation.trim()} - ${textToCheck}`;
          consumedLines++;
          continue;
        }

        if (timeLocationIsTimeOnly && inOutOnlyRe.test(textToCheck)) {
          timeLocation = `${textToCheck} - ${timeLocation.trim()}`;
          consumedLines++;
          continue;
        }
      }

      if (ScreenplayClassifier.isSceneHeaderStart(normalizedNext)) break;
      if (ScreenplayClassifier.isTransition(normalizedNext)) break;
      if (ScreenplayClassifier.isParenShaped(normalizedNext) && !isParenthesized) break;
      if (ScreenplayClassifier.parseInlineCharacterDialogue(normalizedNext)) break;

      const trimmedNext = normalizedNext.trim();
      const endsWithSentencePunct = /[\.!\؟\?]$/.test(trimmedNext);
      const hasEllipsis = /(\.\.\.|…)/.test(trimmedNext);
      if (endsWithSentencePunct || hasEllipsis) break;

      // Check for Known Place (Scene Header 3) - Prioritize over Character
      if (ScreenplayClassifier.KNOWN_PLACES_RE.test(normalizedNext)) {
        // تحقق من وجود شرطة تفصل المكان عن وصف الأكشن
        const dashSeparatorMatch = normalizedNext.match(/^([^-–—]+)\s*[-–—]\s*(.+)$/);
        if (dashSeparatorMatch) {
          const placePart = dashSeparatorMatch[1].trim();
          const actionPart = dashSeparatorMatch[2].trim();
          // تحقق أن الجزء الأول هو مكان معروف
          if (ScreenplayClassifier.KNOWN_PLACES_RE.test(placePart)) {
            placeParts.push(placePart);
            consumedLines++;
            // حفظ الجزء الثاني ليُعالج كـ action
            remainingAction = actionPart;
            break;
          }
        }
        placeParts.push(normalizedNext);
        consumedLines++;
        continue;
      }

      const isChar = ScreenplayClassifier.isCharacterLine(normalizedNext, {
        lastFormat: "action",
        isInDialogueBlock: false,
      });

      if (isChar) {
        // If it has a colon, it's definitely a character (or specific format). Break.
        if (normalizedNext.includes(":") || normalizedNext.includes("：")) {
          break;
        }
        
        // If NO colon, it's ambiguous (Arabic text).
        // If we haven't found a place yet, and we have a header/TL, treat it as a Place.
        // This covers cases like "منزل عبد العزيز" even if "منزل" wasn't in the list (though it is).
        // It also covers "Cairo" or other proper nouns used as places.
        // But we must be careful not to consume a Character name if the Place was implicit or missing.
        // Heuristic: If we already have some place parts, maybe break? 
        // Or just assume anything following T/L that isn't an obvious Action/Transition/SceneHeader IS part of the place.
        
        // Let's assume if it looks like a character (short, no colon) BUT we are in the header block, it's a place.
        placeParts.push(normalizedNext);
        consumedLines++;
        continue;
      }

      if (ScreenplayClassifier.isLikelyAction(normalizedNext)) break;

      if (ScreenplayClassifier.isActionVerbStart(normalizedNext)) break;

      placeParts.push(normalizedNext);
      consumedLines++;
    }

    const place = placeParts
      .map((p) => ScreenplayClassifier.cleanupSceneHeaderRemainder(p))
      .filter(Boolean)
      .join(" - ");

    // تنظيف رقم المشهد والوقت/المكان من الرموز الزائدة
    const cleanedTimeLocation = ScreenplayClassifier.normalizeLine(timeLocation);

    return {
      sceneNum: ScreenplayClassifier.normalizeLine(currentSceneNum),
      timeLocation: cleanedTimeLocation,
      place,
      consumedLines,
      remainingAction,
    };
  }

  static isTransition(line: string): boolean {
    return ScreenplayClassifier.TRANSITION_RE.test(line);
  }

  static isParenShaped(line: string): boolean {
    return ScreenplayClassifier.PARENTHETICAL_SHAPE_RE.test(line);
  }

  static isCharacterLine(
    line: string,
    context?: { lastFormat: string; isInDialogueBlock: boolean }
  ): boolean {
    if (
      ScreenplayClassifier.isSceneHeaderStart(line) ||
      ScreenplayClassifier.isTransition(line) ||
      ScreenplayClassifier.isParenShaped(line)
    ) {
      return false;
    }

    const wordCount = ScreenplayClassifier.wordCount(line);
    if (wordCount > 7) return false;

    const normalized = ScreenplayClassifier.normalizeLine(line);
    if (ScreenplayClassifier.isActionVerbStart(normalized)) return false;

    if (ScreenplayClassifier.matchesActionStartPattern(normalized)) return false;

    const hasColon = line.includes(":") || line.includes("：");
    const arabicCharacterPattern =
      /^[\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+[:\s]*$/;

    const trimmed = line.trim();
    if (hasColon && (trimmed.endsWith(":") || trimmed.endsWith("："))) {
      return true;
    }

    if (arabicCharacterPattern.test(line)) {
      return true;
    }

    if (!hasColon) return false;

    if (context) {
      if (context.isInDialogueBlock) {
        if (context.lastFormat === "character") {
          return (
            ScreenplayClassifier.CHARACTER_RE.test(line) ||
            arabicCharacterPattern.test(line)
          );
        }
        if (context.lastFormat === "dialogue") {
          return false;
        }
      }

      if (context.lastFormat === "action" && hasColon) {
        return (
          ScreenplayClassifier.CHARACTER_RE.test(line) ||
          arabicCharacterPattern.test(line)
        );
      }
    }

    return (
      ScreenplayClassifier.CHARACTER_RE.test(line) ||
      arabicCharacterPattern.test(line)
    );
  }

  static isLikelyAction(line: string): boolean {
    if (
      ScreenplayClassifier.isBlank(line) ||
      ScreenplayClassifier.isBasmala(line) ||
      ScreenplayClassifier.isSceneHeaderStart(line) ||
      ScreenplayClassifier.isTransition(line) ||
      ScreenplayClassifier.isCharacterLine(line) ||
      ScreenplayClassifier.isParenShaped(line)
    ) {
      return false;
    }

    const normalized = ScreenplayClassifier.normalizeLine(line);

    if (ScreenplayClassifier.matchesActionStartPattern(normalized)) return true;

    if (ScreenplayClassifier.isActionVerbStart(normalized)) {
      return true;
    }

    return false;
  }

  static matchesActionStartPattern(line: string): boolean {
    const normalized = ScreenplayClassifier.normalizeLine(line);

    const actionStartPatterns = [
      /^\s*(?:[-–—]\s*)?(?:(?:ثم\s+)|(?:و(?:هو|هي)\s+)|(?:و\s+))*ل?(?:نرى|ننظر|نسمع|نلاحظ|يبدو|يظهر|يبدأ|ينتهي|يستمر|يتوقف|يتحرك|يحدث|يكون|يوجد|توجد|تظهر)(?:\s+\S|$)/,
      /^\s*(?:و|ف)?(?:لنرى|نرى|نسمع|نلاحظ|نقترب|نبتعد|ننتقل)(?:\s+\S|$)/,
      /^\s*(?:و|ف)?[يت][\u0600-\u06FF]{2,}(?:\s+\S|$)/,
      /^\s*(?:ثم\s+)?(?:(?:و(?:هو|هي)\s+)|(?:و\s+))*[يت][\u0600-\u06FF]{2,}(?:\s+\S|$)/,
      /^\s*(?:ثم\s+|و(?:هو|هي)\s+)(?:ل)?[يت][\u0600-\u06FF]+(?:\s+\S|$)/,
      /^\s*[-–—]\s*(?:(?:ثم\s+)|(?:و(?:هو|هي)\s+)|(?:و\s+))*[يت][\u0600-\u06FF]+(?:\s+\S|$)/,
      /^\s*(?:لنرى|لينظر|ليتجها|ليتجه|ليجلسا|ليجلس|لينهض|ليبتعد)(?:\s+\S|$)/,
    ];

    return actionStartPatterns.some((pattern) => pattern.test(normalized));
  }

  static getEnterSpacingRule(prevType: string, nextType: string): boolean | null {
    if (
      prevType === "basmala" &&
      (nextType === "scene-header-1" || nextType === "scene-header-top-line")
    ) {
      return true;
    }
    if (prevType === "scene-header-3" && nextType === "action") return true;
    if (prevType === "action" && nextType === "action") return true;
    if (prevType === "action" && nextType === "character") return true;
    if (prevType === "character" && nextType === "dialogue") return false;
    if (prevType === "dialogue" && nextType === "character") return true;
    if (prevType === "dialogue" && nextType === "action") return true;
    if (prevType === "dialogue" && nextType === "transition") return true;
    if (prevType === "action" && nextType === "transition") return true;
    if (
      prevType === "transition" &&
      (nextType === "scene-header-1" || nextType === "scene-header-top-line")
    ) {
      return true;
    }
    return null;
  }

  static applyEnterSpacingRules(
    lines: { text: string; type: string }[]
  ): { text: string; type: string }[] {
    const result: { text: string; type: string }[] = [];
    let prevNonBlankType: string | null = null;
    let pendingBlanks: { text: string; type: string }[] = [];

    const isBlankLine = (line: { text: string; type: string }): boolean => {
      if (line.type !== "action") return false;
      return (line.text || "").trim() === "";
    };

    for (const line of lines) {
      if (isBlankLine(line)) {
        pendingBlanks.push(line);
        continue;
      }

      if (!prevNonBlankType) {
        result.push(...pendingBlanks);
        pendingBlanks = [];
        result.push(line);
        prevNonBlankType = line.type;
        continue;
      }

      const spacingRule = ScreenplayClassifier.getEnterSpacingRule(
        prevNonBlankType,
        line.type
      );

      if (spacingRule === true) {
        if (pendingBlanks.length > 0) {
          result.push(pendingBlanks[0]);
        } else {
          result.push({ text: "", type: "action" });
        }
      } else if (spacingRule === false) {
        // لا نضيف السطور الفارغة - نتجاهلها
      } else if (spacingRule === null) {
        result.push(...pendingBlanks);
      }

      pendingBlanks = [];
      result.push(line);
      prevNonBlankType = line.type;
    }

    result.push(...pendingBlanks);
    return result;
  }

  static isSceneHeader1(line: string): boolean {
    return /^\s*(?:مشهد|م\.|scene)\s*[0-9٠-٩]+\s*$/i.test(line);
  }

  /**
   * دالة التصنيف بالدفعات (Batch) للنظام الجديد
   * @param text النص الكامل للسيناريو
   * @param useContext استخدام نظام التصنيف السياقي الجديد (افتراضي: false للحفاظ على التوافق)
   * @returns مصفوفة من السطور المصنفة
   */
  static classifyBatch(text: string, useContext: boolean = false): { text: string; type: string }[] {
    const lines = text.split(/\r?\n/);
    const results: { text: string; type: string }[] = [];
    const previousTypes: (string | null)[] = new Array(lines.length).fill(null); // تخزين الأنواع المُصنّفة بحسب رقم السطر

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i] || "";
      const current = rawLine.trim();

      if (!current) {
        results.push({ text: "", type: "action" });
        previousTypes[i] = "action";
        continue;
      }

      // تنظيف السطر من الرموز الزائدة قبل التصنيف
      const cleanedCurrent = ScreenplayClassifier.normalizeLine(current);

      // إذا أصبح السطر فارغاً بعد التنظيف (مثل سطر يحتوي فقط على نقطة أو شرطة)، نعامله كسطر فارغ
      if (!cleanedCurrent) {
        results.push({ text: "", type: "action" });
        previousTypes[i] = "action";
        continue;
      }

      // 1. استخراج رأس المشهد (المنطق الموجود - بدون تغيير)
      const sceneHeaderParts = ScreenplayClassifier.extractSceneHeaderParts(
        lines,
        i
      );
      if (sceneHeaderParts) {
        const sceneHeaderTopText = [
          sceneHeaderParts.sceneNum,
          sceneHeaderParts.timeLocation,
        ]
          .map((part) => (part || "").trim())
          .filter((part) => part.length > 0)
          .join(" ");

        results.push({
          text: sceneHeaderTopText,
          type: "scene-header-top-line",
        });
        previousTypes[i] = "scene-header-top-line";

        for (let j = i + 1; j < i + sceneHeaderParts.consumedLines; j++) {
          const isLastConsumed = j === i + sceneHeaderParts.consumedLines - 1;
          previousTypes[j] = sceneHeaderParts.place && isLastConsumed
            ? "scene-header-3"
            : "scene-header-top-line";
        }

        if (sceneHeaderParts.place) {
          results.push({ text: sceneHeaderParts.place, type: "scene-header-3" });
        }

        // إضافة الجزء المتبقي كـ action إذا وُجد
        if (sceneHeaderParts.remainingAction) {
          results.push({ text: sceneHeaderParts.remainingAction, type: "action" });
        }

        i += Math.max(0, sceneHeaderParts.consumedLines - 1);
        continue;
      }

      // 2. استخراج الحوار المضمن (المنطق الموجود - بدون تغيير)
      const inlineCharacterDialogue = ScreenplayClassifier.parseInlineCharacterDialogue(
        rawLine
      );
      if (inlineCharacterDialogue) {
        results.push({
          text: `${inlineCharacterDialogue.characterName}:`,
          type: "character",
        });

        results.push({
          text: inlineCharacterDialogue.dialogueText,
          type: "dialogue",
        });
        previousTypes[i] = "character";

        continue;
      }

      // 3. استخراج Bullet Character (المنطق الموجود - بدون تغيير)
      const bulletMatch = rawLine.match(ScreenplayClassifier.BULLET_CHARACTER_RE);
      if (bulletMatch) {
        const characterName = (bulletMatch[1] || "").trim();
        const dialogueText = (bulletMatch[2] || "").trim();

        if (characterName) {
          results.push({ text: `${characterName}:`, type: "character" });

          if (dialogueText) {
            results.push({ text: dialogueText, type: "dialogue" });
            previousTypes[i] = "dialogue";
          } else {
            previousTypes[i] = "character";
          }
          continue;
        }
      }

      // 4. التصنيف باستخدام النظام الجديد أو القديم
      if (useContext) {
        // استخدام نظام النقاط السياقي الجديد مع تمرير previousTypes
        const result = ScreenplayClassifier.classifyWithScoring(cleanedCurrent, i, lines, previousTypes);
        results.push({ text: cleanedCurrent, type: result.type });
        previousTypes[i] = result.type;
      } else {
        // استخدام classifyHybrid القديم (للتوافق)
        const prevType = results.length > 0 ? results[results.length - 1].type : null;
        const nextLine = i < lines.length - 1 ? (lines[i + 1] || "").trim() : null;
        const type = this.classifyHybrid(cleanedCurrent, prevType, nextLine);
        results.push({ text: cleanedCurrent, type });
        previousTypes[i] = type;
      }
    }

    // تطبيق قواعد المسافات (Enter Spacing Rules) بعد التصنيف النهائي
    return ScreenplayClassifier.applyEnterSpacingRules(results);
  }

  /**
   * الدالة الهجينة (المنطق المدمج) - تجمع بين فحص المحتوى والسياق
   * @param current السطر الحالي
   * @param prevType نوع السطر السابق
   * @param nextLine السطر التالي
   * @param allLines جميع السطور (اختياري - لنظام النقاط)
   * @param index فهرس السطر الحالي (اختياري - لنظام النقاط)
   * @param useScoring استخدام نظام النقاط (افتراضي: false)
   * @returns نوع السطر المصنف
   */
  static classifyHybrid(
    current: string,
    prevType: string | null,
    nextLine: string | null,
    allLines?: string[],
    index?: number,
    useScoring: boolean = false
  ): string {
    // إذا طُلب استخدام النقاط وتوفرت البيانات الكاملة
    if (useScoring && allLines && index !== undefined) {
      const result = ScreenplayClassifier.classifyWithContext(current, index, allLines);
      return result.type;
    }

    // خلاف ذلك، استخدم المنطق القديم (للتوافق)

    // 1. فحص المحتوى الصارم (Regex)
    if (this.isSceneHeader1(current)) return 'scene-header-1';
    if (this.isSceneHeaderStart(current)) return 'scene-header-top-line';
    if (this.isTransition(current)) return 'transition';
    if (this.isBasmala(current)) return 'basmala';

    if (this.isLikelyAction(current)) return 'action';

    // 2. فحص السياق (Context)

    // Scene Header 3 (مكان فرعي)
    if (prevType && ['scene-header-1', 'scene-header-2', 'scene-header-top-line'].includes(prevType)) {
      const wordCount = current.split(' ').length;
      const hasColon = current.includes(":") || current.includes("：");
      // تحقق أقوى: لا يبدأ بفعل حركي ولا يحتوي على علامات ترقيم
      const normalized = this.normalizeLine(current);
      if (wordCount <= 6 && !hasColon && !this.isActionVerbStart(normalized) && !this.hasSentencePunctuation(normalized)) {
        return 'scene-header-3';
      }
    }

    // Character (شخصية)
    const looksLikeDialogueNext = nextLine && !this.isSceneHeaderStart(nextLine) && !this.isTransition(nextLine);
    const normalized = this.normalizeLine(current);
    if (looksLikeDialogueNext && current.length < 40 && !current.endsWith('.') && !this.isActionVerbStart(normalized)) {
      // تحقق إضافي: لا يحتوي على علامات ترقيم كثيرة
      if (!this.hasSentencePunctuation(normalized) || (normalized.includes(':') || normalized.includes('：'))) {
        return 'character';
      }
    }

    // Dialogue (حوار)
    if (prevType === 'character' || prevType === 'parenthetical') {
      if (this.isLikelyAction(current)) return 'action';
      return 'dialogue';
    }

    // Parenthetical (ملاحظة)
    if (current.startsWith('(') && ['character', 'dialogue'].includes(prevType || '')) return 'parenthetical';

    return 'action';
  }

  // ========================================================================
  // دوال التسجيل (Scoring Functions)
  // ========================================================================

  /**
   * فحص إذا كان السطر يبدأ بشرطة
   * @param rawLine السطر الأصلي
   * @returns true إذا يبدأ بشرطة
   */
  private static startsWithDash(rawLine: string): boolean {
    return /^[\s]*[-–—−‒―]/.test(rawLine);
  }

  /**
   * فحص إذا كان السطر يبدأ بشرطة مع نص بعدها
   * @param rawLine السطر الأصلي
   * @returns true إذا يبدأ بشرطة ويتبعها نص
   */
  private static startsWithDashAndText(rawLine: string): boolean {
    return /^[\s]*[-–—−‒―]\s*\S/.test(rawLine);
  }

  /**
   * فحص إذا كان السطر الحالي داخل بلوك حوار
   * بلوك الحوار يبدأ بـ character وينتهي عند scene-header أو transition أو action مؤكد
   * @param previousTypes الأنواع السابقة
   * @param currentIndex الفهرس الحالي
   * @returns معلومات عن بلوك الحوار
   */
  private static getDialogueBlockInfo(
    previousTypes: (string | null)[],
    currentIndex: number
  ): { 
    isInDialogueBlock: boolean; 
    blockStartType: string | null;
    distanceFromCharacter: number;
  } {
    const dialogueBlockTypes = ['character', 'dialogue', 'parenthetical'];
    const blockBreakers = ['scene-header-1', 'scene-header-2', 'scene-header-3', 
                           'scene-header-top-line', 'transition', 'basmala'];
    
    let distanceFromCharacter = -1;
    let lastCharacterIndex = -1;
    
    // البحث للخلف عن بداية البلوك
    for (let i = currentIndex - 1; i >= 0; i--) {
      const type = previousTypes[i];
      
      // تخطي السطور الفارغة
      if (type === 'blank' || type === null) continue;
      
      // إذا وصلنا لكاسر بلوك، نحن خارج الحوار
      if (blockBreakers.includes(type)) {
        return { 
          isInDialogueBlock: false, 
          blockStartType: null,
          distanceFromCharacter: -1
        };
      }
      
      // إذا وجدنا character، نحن في بلوك حوار
      if (type === 'character') {
        lastCharacterIndex = i;
        distanceFromCharacter = currentIndex - i;
        return { 
          isInDialogueBlock: true, 
          blockStartType: 'character',
          distanceFromCharacter
        };
      }
      
      // إذا وجدنا dialogue أو parenthetical، نستمر للخلف
      if (type === 'dialogue' || type === 'parenthetical') {
        continue;
      }
      
      // إذا وجدنا action، نحن خارج بلوك الحوار
      if (type === 'action') {
        return { 
          isInDialogueBlock: false, 
          blockStartType: null,
          distanceFromCharacter: -1
        };
      }
    }
    
    return { 
      isInDialogueBlock: false, 
      blockStartType: null,
      distanceFromCharacter: -1
    };
  }

  /**
   * بناء سياق السطر - نافذة قبل/بعد مع إحصائيات
   * @param line السطر الحالي
   * @param index فهرس السطر (zero-based)
   * @param allLines جميع السطور
   * @param previousTypes أنواع السطور السابقة (اختياري)
   * @returns سياق السطر
   */
  private static buildContext(
    line: string,
    index: number,
    allLines: string[],
    previousTypes?: (string | null)[]
  ): LineContext {
    const WINDOW_SIZE = 3;
    const normalized = this.normalizeLine(line);
    const wordCount = this.wordCount(normalized);

    // بناء نافذة السطور السابقة
    const previousLines: { line: string; type: string }[] = [];
    for (let i = Math.max(0, index - WINDOW_SIZE); i < index; i++) {
      previousLines.push({
        line: allLines[i] || '',
        type: previousTypes?.[i] || 'unknown'
      });
    }

    // بناء نافذة السطور التالية
    const nextLines: { line: string }[] = [];
    for (let i = index + 1; i < Math.min(allLines.length, index + WINDOW_SIZE + 1); i++) {
      nextLines.push({
        line: allLines[i] || ''
      });
    }

    // حساب إحصائيات السطر التالي
    const nextLine = index + 1 < allLines.length ? allLines[index + 1] : null;
    const nextWordCount = nextLine ? this.wordCount(this.normalizeLine(nextLine)) : undefined;
    const nextLineLength = nextLine?.length ?? undefined;
    const nextHasPunctuation = nextLine ? this.hasSentencePunctuation(nextLine) : undefined;

    return {
      previousLines,
      nextLines,
      stats: {
        currentLineLength: normalized.length,
        currentWordCount: wordCount,
        nextLineLength,
        nextWordCount,
        hasPunctuation: this.hasSentencePunctuation(normalized),
        nextHasPunctuation
      }
    };
  }

  /**
   * حساب نقاط التصنيف كشخصية (Character)
   * @param rawLine السطر الأصلي
   * @param normalized السطر المعالج
   * @param ctx سياق السطر
   * @returns النقاط مع مستوى الثقة والأسباب
   */
  private static scoreAsCharacter(
    rawLine: string,
    normalized: string,
    ctx: LineContext
  ): ClassificationScore {
    let score = 0;
    const reasons: string[] = [];
    const trimmed = rawLine.trim();
    const wordCount = ctx.stats.currentWordCount;

    if (this.isActionVerbStart(normalized) || this.matchesActionStartPattern(normalized)) {
      score -= 45;
      reasons.push('يبدو كسطر حركة (سالب)');
    }

    // 1. ينتهي بنقطتين (:) أو (：) - 50 نقطة
    const endsWithColon = trimmed.endsWith(':') || trimmed.endsWith('：');
    if (endsWithColon) {
      score += 50;
      reasons.push('ينتهي بنقطتين');
    } else if (trimmed.includes(':') || trimmed.includes('：')) {
      score += 25;
      reasons.push('يحتوي على نقطتين');
    }

    // 2. طول السطر <= 3 كلمات (20 نقطة) أو <= 5 كلمات (10 نقاط)
    if (wordCount <= 3) {
      score += 20;
      reasons.push(`طول ${wordCount} كلمات (≤3)`);
    } else if (wordCount <= 5) {
      score += 10;
      reasons.push(`طول ${wordCount} كلمات (≤5)`);
    }

    // 3. لا يوجد علامات ترقيم نهائية (15 نقطة)
    if (!ctx.stats.hasPunctuation) {
      score += 15;
      reasons.push('لا يحتوي على علامات ترقيم نهائية');
    }

    const hasSentenceEndingPunct = /[\.!\؟\?]$/.test(trimmed) || /(\.\.\.|…)/.test(trimmed);
    if (hasSentenceEndingPunct && !endsWithColon) {
      score -= 35;
      reasons.push('يحتوي على علامات ترقيم (سالب)');
    }

    // 4. السطر التالي يبدو كحوار (25 نقطة)
    const nextLine = ctx.nextLines[0]?.line;
    if (nextLine && !this.isSceneHeaderStart(nextLine) && !this.isTransition(nextLine)) {
      const nextWordCount = ctx.stats.nextWordCount ?? 0;
      // الحوار عادة يكون أطول من اسم الشخصية وقد يحتوي على علامات ترقيم
      if (nextWordCount > 1 && nextWordCount <= 30) {
        score += 25;
        reasons.push('السطر التالي يبدو كحوار');
      }
    }

    // 5. لا يبدأ بفعل حركي (10 نقاط)
    if (this.isActionVerbStart(normalized) || this.matchesActionStartPattern(normalized)) {
      score -= 20;
      reasons.push('يبدأ كنمط حركة (سالب)');
    }

    // 6. لا يطابق نمط الحركة (10 نقاط)
    // (تم إلغاء مكافأة "ليس حركة" لأنها تسبب رفع نقاط الشخصية بشكل خاطئ)

    // 7. أحرف عربية فقط (10 نقاط)
    const arabicOnly = /^[\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF:：]+$/.test(trimmed);
    if (arabicOnly) {
      score += 10;
      reasons.push('أحرف عربية فقط');
    }

    // 8. السطر السابق ليس شخصية (لتجنب التكرار) - 5 نقاط
    const prevLine = ctx.previousLines[ctx.previousLines.length - 1];
    if (prevLine && prevLine.type !== 'character') {
      score += 5;
      reasons.push('السطر السابق ليس شخصية');
    }

    // 9. لا يبدأ بـ "صوت" (فقط إذا كان مع parenthetical) - لا نقاط
    if (normalized.startsWith('صوت') && !endsWithColon) {
      score -= 10;
      reasons.push('يبدأ بـ "صوت" ولكن بدون نقطتين');
    }

    // حساب مستوى الثقة
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) {
      confidence = 'high';
    } else if (score >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons
    };
  }

  /**
   * حساب نقاط التصنيف كحوار (Dialogue)
   * @param rawLine السطر الأصلي
   * @param normalized السطر المعالج
   * @param ctx سياق السطر
   * @param documentMemory ذاكرة المستند (اختياري)
   * @param dialogueBlockInfo معلومات عن بلوك الحوار
   * @returns النقاط مع مستوى الثقة والأسباب
   */
  private static scoreAsDialogue(
    rawLine: string,
    normalized: string,
    ctx: LineContext,
    documentMemory?: any,
    dialogueBlockInfo?: { isInDialogueBlock: boolean; distanceFromCharacter: number }
  ): ClassificationScore {
    let score = 0;
    const reasons: string[] = [];
    const wordCount = ctx.stats.currentWordCount;

    const prevLine = ctx.previousLines[ctx.previousLines.length - 1];

    // 1. السطر السابق شخصية (40 نقطة)
    const isPrevCharacter = prevLine?.type === 'character';
    if (isPrevCharacter) {
      score += 40;
      reasons.push('السطر السابق شخصية');
    }

    // 1b. الشرطة داخل بلوك الحوار
    if (this.startsWithDash(rawLine)) {
      if (dialogueBlockInfo?.isInDialogueBlock) {
        // داخل بلوك الحوار: الشرطة غالباً استكمال حوار
        score += 35;
        reasons.push('يبدأ بشرطة داخل بلوك حوار (استكمال/نبرة)');
        
        // مكافأة إضافية إذا قريب من الشخصية
        if (dialogueBlockInfo.distanceFromCharacter <= 3) {
          score += 15;
          reasons.push('قريب من سطر الشخصية');
        }
      } else {
        // خارج بلوك الحوار: الشرطة ليست دليل حوار
        score -= 15;
        reasons.push('يبدأ بشرطة خارج بلوك الحوار (سالب)');
      }
    }

    // 1c. علامات الحوار المستمر
    if (dialogueBlockInfo?.isInDialogueBlock) {
      // Ellipsis في البداية = استكمال
      if (/^[\s]*\.\.\./.test(rawLine) || /^[\s]*…/.test(rawLine)) {
        score += 25;
        reasons.push('يبدأ بـ ... (استكمال حوار)');
      }
      
      // علامات اقتباس
      if (/^[\s]*["«"]/.test(rawLine)) {
        score += 20;
        reasons.push('يبدأ بعلامة اقتباس');
      }
    }

    const isPrevParenthetical = prevLine?.type === 'parenthetical';
    const isPrevDialogue = prevLine?.type === 'dialogue';
    const hasDialogueContext = isPrevCharacter || isPrevParenthetical || isPrevDialogue;

    if (!hasDialogueContext) {
      score -= 60;
      reasons.push('لا يوجد سياق حوار (سالب)');

      if (this.isActionVerbStart(normalized) || this.matchesActionStartPattern(normalized)) {
        score -= 20;
        reasons.push('يبدو كسطر حركة بدون سياق حوار (سالب)');
      }
    }

    // 1. السطر السابق شخصية (60 نقطة)
    if (isPrevCharacter) {
      score += 60;
      reasons.push('السطر السابق شخصية');
    }

    // 2. السطر السابق ملاحظة (50 نقطة)
    if (isPrevParenthetical) {
      score += 50;
      reasons.push('السطر السابق ملاحظة');
    }

    if (isPrevDialogue) {
      score += 35;
      reasons.push('استمرار حوار');
    }

    // 3. ينتهي بعلامة ترقيم (15 نقطة)
    if (ctx.stats.hasPunctuation) {
      score += 15;
      reasons.push('ينتهي بعلامة ترقيم');
    }

    // 4. طول مناسب للحوار (15 نقطة) - بين 2 و 50 كلمة
    if (wordCount >= 2 && wordCount <= 50) {
      score += 15;
      reasons.push(`طول مناسب ${wordCount} كلمات`);
    } else if (wordCount >= 1 && wordCount <= 60) {
      score += 8;
      reasons.push(`طول مقبول ${wordCount} كلمات`);
    }

    // 5/6. إذا كان السطر يبدأ كنمط حركة، خفّض نقاط الحوار
    if (this.isActionVerbStart(normalized) || this.matchesActionStartPattern(normalized)) {
      score -= 25;
      reasons.push('يبدأ كنمط حركة (سالب)');
    }

    // 7. ليس رأس مشهد (20 نقطة سلبية إذا كان)
    if (this.isSceneHeaderStart(normalized)) {
      score -= 20;
      reasons.push('يبدو كرأس مشهد (سالب)'); 
    }

    // 8. السطر التالي ليس شخصية أو ملاحظة (10 نقاط)
    const nextLine = ctx.nextLines[0]?.line;
    if (nextLine && !this.isCharacterLine(nextLine)) {
      score += 10;
      reasons.push('السطر التالي ليس شخصية');
    }

    // 9. لا يحتوي على نقطتين (إلا إذا كان حوار inline) - 10 نقاط
    const hasColon = normalized.includes(':') || normalized.includes('：');
    if (!hasColon) {
      score += 10;
      reasons.push('لا يحتوي على نقطتين');
    } else if (normalized.match(/^[^:：]+[:：].+[:：]/)) {
      // يحتوي على أكثر من نقطتين - غالباً ليس حواراً صافياً
      score -= 10;
      reasons.push('يحتوي على أكثر من نقطتين (سالب)');
    }

    // 10. ليس قصيراً جداً (حوار من كلمة واحدة غير شائع) - 5 نقاط سلبية
    if (wordCount === 1 && !isPrevCharacter && !isPrevParenthetical) {
      score -= 5;
      reasons.push('كلمة واحدة بدون سياق حوار (سالب)');
    }

    // حساب مستوى الثقة
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) {
      confidence = 'high';
    } else if (score >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons
    };
  }

  /**
   * حساب نقاط التصنيف كحركة (Action)
   * @param rawLine السطر الأصلي
   * @param normalized السطر المعالج
   * @param ctx سياق السطر
   * @param documentMemory ذاكرة المستند (اختياري)
   * @param dialogueBlockInfo معلومات عن بلوك الحوار
   * @returns النقاط مع مستوى الثقة والأسباب
   */
  private static scoreAsAction(
    rawLine: string,
    normalized: string,
    ctx: LineContext,
    documentMemory?: any,
    dialogueBlockInfo?: { isInDialogueBlock: boolean; distanceFromCharacter: number }
  ): ClassificationScore {
    let score = 0;
    const reasons: string[] = [];
    const wordCount = ctx.stats.currentWordCount;

    // 1. يبدأ بفعل حركي (50 نقطة)
    if (this.isActionVerbStart(normalized)) {
      score += 50;
      reasons.push('يبدأ بفعل حركي');
    }

    // 2. يطابق نمط الحركة (40 نقطة)
    if (this.matchesActionStartPattern(normalized)) {
      score += 40;
      reasons.push('يطابق نمط الحركة');
    }

    // 3. بعد رأس مشهد (30 نقطة)
    const prevLine = ctx.previousLines[ctx.previousLines.length - 1];
    if (prevLine && (prevLine.type === 'scene-header-1' ||
                     prevLine.type === 'scene-header-2' ||
                     prevLine.type === 'scene-header-3' ||
                     prevLine.type === 'scene-header-top-line')) {
      score += 30;
      reasons.push('يأتي بعد رأس مشهد');
    }

    // 4. السطر التالي أيضاً حركة (10 نقاط)
    const nextLine = ctx.nextLines[0]?.line;
    if (nextLine && this.isLikelyAction(nextLine)) {
      score += 10;
      reasons.push('السطر التالي يبدو كحركة');
    }

    // 5. يبدأ بشرطة - مشروطة بالسياق
    if (this.startsWithDash(rawLine)) {
      if (dialogueBlockInfo?.isInDialogueBlock) {
        // داخل بلوك الحوار: الشرطة ليست دليل action
        score -= 20;
        reasons.push('يبدأ بشرطة داخل بلوك حوار (سالب للأكشن)');
      } else {
        // خارج بلوك الحوار: الشرطة دليل action
        score += 25;
        reasons.push('يبدأ بشرطة خارج بلوك الحوار');
      }
    }

    // 5b. فعل حركي بعد شرطة أقوى
    if (this.startsWithDash(rawLine) && !dialogueBlockInfo?.isInDialogueBlock) {
      // إزالة الشرطة وفحص الفعل
      const withoutDash = rawLine.replace(/^[\s]*[-–—−‒―]\s*/, '');
      if (this.isActionVerbStart(withoutDash)) {
        score += 30;
        reasons.push('شرطة متبوعة بفعل حركي');
      }
    }

    // 6. طول نصي مناسب (أكثر من 5 كلمات عادة للحركة) - 10 نقاط
    if (wordCount > 5) {
      score += 10;
      reasons.push(`طول نصي مناسب (${wordCount} كلمات)`);
    }

    // 7. السطر السابق حركة (10 نقاط)
    if (prevLine && prevLine.type === 'action') {
      score += 10;
      reasons.push('السطر السابق حركة');
    }

    // 8. ليس شخصية أو حوار (20 نقطة سلبية إذا كان)
    if (this.isCharacterLine(normalized)) {
      score -= 20;
      reasons.push('يبدو كشخصية (سالب)');
    }

    // 9. لا ينتهي بنقطتين (5 نقاط)
    if (!normalized.endsWith(':') && !normalized.endsWith('：')) {
      score += 5;
      reasons.push('لا ينتهي بنقطتين');
    }

    // 10. يحتوي على كلمات وصفية (مثل "بطيء"، "سريع") - 5 نقاط
    const descriptiveWords = ['بطيء', 'سريع', 'فجأة', 'ببطء', 'بسرعة', 'هدوء', 'صمت'];
    const hasDescriptive = descriptiveWords.some(word => normalized.includes(word));
    if (hasDescriptive) {
      score += 5;
      reasons.push('يحتوي على كلمات وصفية');
    }

    // حساب مستوى الثقة
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) {
      confidence = 'high';
    } else if (score >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons
    };
  }

  /**
   * حساب نقاط التصنيف كملاحظة (Parenthetical)
   * @param rawLine السطر الأصلي
   * @param normalized السطر المعالج
   * @param ctx سياق السطر
   * @param dialogueBlockInfo معلومات عن بلوك الحوار
   * @returns النقاط مع مستوى الثقة والأسباب
   */
  private static scoreAsParenthetical(
    rawLine: string,
    normalized: string,
    ctx: LineContext,
    dialogueBlockInfo?: { isInDialogueBlock: boolean; distanceFromCharacter: number }
  ): ClassificationScore {
    let score = 0;
    const reasons: string[] = [];
    const trimmed = rawLine.trim();
    const wordCount = ctx.stats.currentWordCount;

    const isParenShaped = /^\s*\(.*\)\s*$/.test(trimmed);
    if (!isParenShaped) {
      // بدون أقواس لا يجب أن ينافس كـ Parenthetical إلا في حالات نادرة جداً
      score -= 70;
      reasons.push('ليس بين أقواس (سالب)');
    }

    // 1. يبدأ بقوس وينتهي بقوس (60 نقطة)
    if (/^\s*\(.*\)\s*$/.test(trimmed)) {
      score += 60;
      reasons.push('يبدأ وينتهي بأقواس');
    }

    // 2. السطر السابق شخصية (40 نقطة)
    const prevLine = ctx.previousLines[ctx.previousLines.length - 1];
    const isPrevCharacter = prevLine?.type === 'character';
    if (isPrevCharacter) {
      score += 40;
      reasons.push('السطر السابق شخصية');
    }

    // 3. السطر السابق حوار (30 نقطة)
    const isPrevDialogue = prevLine?.type === 'dialogue';
    if (isPrevDialogue) {
      score += 30;
      reasons.push('السطر السابق حوار');
    }

    // 4. قصير (عادة 1-5 كلمات) - 15 نقطة
    if (wordCount >= 1 && wordCount <= 5) {
      score += 15;
      reasons.push(`طول قصير (${wordCount} كلمات)`);
    } else if (wordCount <= 10) {
      score += 8;
      reasons.push(`طول متوسط (${wordCount} كلمات)`);
    }

    // 5. لا يبدأ بفعل حركي (10 نقاط)
    if (!this.isActionVerbStart(normalized)) {
      score += 10;
      reasons.push('لا يبدأ بفعل حركي');
    }

    // 5b. شرطة مع كلمة parenthetical
    if (this.startsWithDash(rawLine) && dialogueBlockInfo?.isInDialogueBlock) {
      const withoutDash = rawLine.replace(/^[\s]*[-–—−‒―]\s*/, '').trim();
      
      const parentheticalWords = [
        'همساً', 'بصوت', 'مبتسماً', 'باحتقار', 'بحزن', 'بغضب', 
        'بفرح', 'بنظرة', 'ساخراً', 'متعجباً', 'بحدة', 'بهدوء'
      ];
      
      const startsWithParentheticalWord = parentheticalWords.some(
        word => withoutDash.startsWith(word)
      );
      
      if (startsWithParentheticalWord && withoutDash.length < 30) {
        score += 40;
        reasons.push('شرطة مع كلمة ملاحظة داخل بلوك حوار');
      }
    }

    // 6. يحتوي على كلمات ملاحظات شائعة (10 نقاط)
    const parentheticalWords = [
      'همساً', 'بصوت', 'صوت', 'مبتسماً', 'باحتقار', 'بحزن',
      'بغضب', 'بفرح', 'بطريقة', 'بنظرة', 'بتحديق', 'بسرعة',
      'ببطء', 'فجأة', 'فوراً', 'وهو', 'وهي', 'مبتسما', 'مبتسم'
    ];
    const hasParentheticalWord = parentheticalWords.some(word => normalized.includes(word));
    if (hasParentheticalWord) {
      score += 10;
      reasons.push('يحتوي على كلمة ملاحظة شائعة');
    }

    // 7. لا يحتوي على علامات ترقيم نهائية (5 نقاط)
    if (!ctx.stats.hasPunctuation) {
      score += 5;
      reasons.push('لا يحتوي على علامات ترقيم نهائية');
    }

    // حساب مستوى الثقة
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) {
      confidence = 'high';
    } else if (score >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons
    };
  }

  /**
   * حساب نقاط التصنيف كرأس مشهد (Scene Header)
   * @param line السطر الحالي
   * @param ctx سياق السطر
   * @returns النقاط مع مستوى الثقة والأسباب
   */
  private static scoreAsSceneHeader(
    line: string,
    ctx: LineContext
  ): ClassificationScore {
    let score = 0;
    const reasons: string[] = [];
    const normalized = this.normalizeLine(line);

    // 1. يطابق نمط رأس المشهد (70 نقطة)
    if (this.isSceneHeaderStart(normalized)) {
      score += 70;
      reasons.push('يطابق نمط رأس المشهد');
    }

    // 2. يبدأ بـ "مشهد" أو "م." أو "scene" (50 نقطة)
    const scenePrefix = /^(?:مشهد|m\.|scene)\s*[0-9٠-٩]+/i;
    if (scenePrefix.test(normalized)) {
      score += 50;
      reasons.push('يبدأ بكلمة مشهد');
    }

    // 3. يحتوي على مكان (من الأماكن المعروفة) - 30 نقطة
    const knownPlaces = [
      'مسجد', 'بيت', 'منزل', 'شارع', 'حديقة', 'مدرسة', 'جامعة',
      'مكتب', 'محل', 'مستشفى', 'مطعم', 'فندق', 'سيارة', 'غرفة',
      'قاعة', 'ممر', 'سطح', 'ساحة', 'مقبرة', 'مخبز', 'مكتبة',
      'نهر', 'بحر', 'جبل', 'غابة', 'سوق', 'مصنع', 'بنك', 'محكمة',
      'سجن', 'موقف', 'محطة', 'مطار', 'ميناء', 'كوبرى', 'نفق',
      'مبنى', 'قصر', 'نادي', 'ملعب', 'ملهى', 'بار', 'كازينو',
      'متحف', 'مسرح', 'سينما', 'معرض', 'مزرعة', 'مختبر', 'مستودع',
      'كهف', 'قصر عدلي'
    ];
    const hasKnownPlace = knownPlaces.some(place => normalized.includes(place));
    if (hasKnownPlace) {
      score += 30;
      reasons.push('يحتوي على مكان معروف');
    }

    // 4. يحتوي على وقت (ليل/نهار/صباح/مساء...) - 25 نقطة
    const timeWords = ['ليل', 'نهار', 'صباح', 'مساء', 'فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء', 'الغروب'];
    const hasTimeWord = timeWords.some(word => normalized.includes(word));
    if (hasTimeWord) {
      score += 25;
      reasons.push('يحتوي على كلمة وقت');
    }

    // 5. يحتوي على داخلي/خارجي - 20 نقطة
    if (/داخلي|خارجي|د\.|خ\./i.test(normalized)) {
      score += 20;
      reasons.push('يحتوي على داخلي/خارجي');
    }

    // 6. السطر السابق انتقال أو فارغ (15 نقطة)
    const prevLine = ctx.previousLines[ctx.previousLines.length - 1];
    if (!prevLine || prevLine.type === 'transition' || prevLine.line.trim() === '') {
      score += 15;
      reasons.push('السطر السابق انتقال أو فارغ');
    }

    // 7. السطر التالي يبدو كوصف مكان (10 نقاط)
    const nextLine = ctx.nextLines[0]?.line;
    if (nextLine && hasKnownPlace && nextLine.trim().length > 0) {
      if (!this.isCharacterLine(nextLine) && !this.isTransition(nextLine)) {
        score += 10;
        reasons.push('السطر التالي يبدو كوصف مكان');
      }
    }

    // حساب مستوى الثقة
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 70) {
      confidence = 'high';
    } else if (score >= 40) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      confidence,
      reasons
    };
  }

  /**
   * حساب درجة الشك للسطر - كلما زادت الدرجة، زادت الحاجة للمراجعة
   * @param scores جميع نقاط التصنيف
   * @returns درجة الشك من 0 إلى 100
   */
  private static calculateDoubtScore(scores: { [type: string]: ClassificationScore }): number {
    // ترتيب النقاط من الأعلى للأقل
    const sortedScores = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
    const highest = sortedScores[0];
    const secondHighest = sortedScores[1];
    
    // إذا كان الفرق بين الأول والثاني صغيراً، هناك شك
    const scoreDiff = highest ? (secondHighest ? highest[1].score - secondHighest[1].score : highest[1].score) : 0;
    
    // حساب درجة الشك
    let doubtScore = 0;
    
    // 1. الفرق بين النقاط أقل من 20 نقطة = شك عالي
    if (scoreDiff < 20) {
      doubtScore += 40;
    } else if (scoreDiff < 30) {
      doubtScore += 20;
    }
    
    // 2. إذا كانت جميع النقاط منخفضة (أقل من 40)
    if (highest && highest[1].score < 40) {
      doubtScore += 30;
    }
    
    // 3. إذا كان هناك أكثر من نوع بنفس النقاط العليا
    const maxScore = highest ? highest[1].score : 0;
    const ties = sortedScores.filter(s => s[1].score === maxScore).length;
    if (ties > 1) {
      doubtScore += 30;
    }
    
    // 4. إذا كانت الثقة منخفضة للنوع الأعلى
    if (highest && highest[1].confidence === 'low') {
      doubtScore += 20;
    }
    
    return Math.min(100, doubtScore);
  }

  /**
   * التصنيف بالسياق الذكي - باستخدام نظام النقاط مع درجة الشك
   * دالة عامة يمكن استدعاؤها من خارج الفئة
   * @param line السطر الحالي
   * @param index موقع السطر في النص
   * @param allLines جميع السطور
   * @param previousTypes أنواع السطور السابقة (اختياري)
   * @returns نتيجة التصنيف مع النقاط والسياق ودرجة الشك
   */
  public static classifyWithContext(
    line: string,
    index: number,
    allLines: string[],
    previousTypes?: (string | null)[]
  ): ClassificationResult {
    // 1. الفحص السريع (الأنماط الثابتة عالية الثقة)
    const quickCheck = this.quickClassify(line);
    if (quickCheck) {
      return quickCheck;
    }

    // 2. بناء السياق
    const ctx = this.buildContext(line, index, allLines, previousTypes);
    const normalized = this.normalizeLine(line);

    // 2b. حساب معلومات بلوك الحوار
    const dialogueBlockInfo = previousTypes 
      ? this.getDialogueBlockInfo(previousTypes, index)
      : { isInDialogueBlock: false, blockStartType: null, distanceFromCharacter: -1 };

    // 3. حساب النقاط لكل نوع مع تمرير معلومات البلوك
    const scores = {
      character: this.scoreAsCharacter(line, normalized, ctx),
      dialogue: this.scoreAsDialogue(line, normalized, ctx, undefined, dialogueBlockInfo),
      action: this.scoreAsAction(line, normalized, ctx, undefined, dialogueBlockInfo),
      parenthetical: this.scoreAsParenthetical(line, normalized, ctx, dialogueBlockInfo),
    };

    // 4. اختيار الأعلى
    const entries = Object.entries(scores) as [string, ClassificationScore][];
    const winner = entries.sort((a, b) => b[1].score - a[1].score)[0];

    return {
      type: winner[0],
      confidence: winner[1].confidence,
      scores: scores as { [type: string]: ClassificationScore },
      context: ctx
    };
  }

  /**
   * فحص سريع للأنماط الثابتة (scene headers, transitions, etc.)
   * @param line السطر المراد فحصه
   * @returns نتيجة التصنيف أو null لو لم يتم التعرف على نمط ثابت
   */
  private static quickClassify(line: string): ClassificationResult | null {
    const trimmed = line.trim();

    // BASMALA -> basmala (high)
    if (this.isBasmala(trimmed)) {
      return {
        type: 'basmala',
        confidence: 'high',
        scores: {
          basmala: { score: 100, confidence: 'high', reasons: ['يطابق نمط البسملة'] }
        },
        context: this.buildEmptyContext()
      };
    }

    // Scene Header Start -> scene-header-top-line (high)
    if (this.isSceneHeaderStart(trimmed)) {
      return {
        type: 'scene-header-top-line',
        confidence: 'high',
        scores: {
          'scene-header-top-line': { score: 100, confidence: 'high', reasons: ['يطابق نمط رأس المشهد'] }
        },
        context: this.buildEmptyContext()
      };
    }

    // Scene Header 1 -> scene-header-1 (high)
    if (this.isSceneHeader1(trimmed)) {
      return {
        type: 'scene-header-1',
        confidence: 'high',
        scores: {
          'scene-header-1': { score: 100, confidence: 'high', reasons: ['يطابق نمط رأس المشهد الأول'] }
        },
        context: this.buildEmptyContext()
      };
    }

    // Transition -> transition (high)
    if (this.isTransition(trimmed)) {
      return {
        type: 'transition',
        confidence: 'high',
        scores: {
          transition: { score: 100, confidence: 'high', reasons: ['يطابق نمط الانتقال'] }
        },
        context: this.buildEmptyContext()
      };
    }

    // Parenthetical shape -> parenthetical (high)
    if (this.isParenShaped(trimmed)) {
      return {
        type: 'parenthetical',
        confidence: 'high',
        scores: {
          parenthetical: { score: 100, confidence: 'high', reasons: ['بين قوسين'] }
        },
        context: this.buildEmptyContext()
      };
    }

    // لم يتم التعرف على نمط ثابت
    return null;
  }

  /**
   * بناء سياق فارغ للفحص السريع
   */
  private static buildEmptyContext(): LineContext {
    return {
      previousLines: [],
      nextLines: [],
      stats: {
        currentLineLength: 0,
        currentWordCount: 0,
        hasPunctuation: false
      }
    };
  }

  /**
   * التصنيف باستخدام نظام النقاط
   * دالة رئيسية تجمع بين جميع دوال التسجيل
   * @param line السطر الحالي
   * @param index فهرس السطر
   * @param allLines جميع السطور
   * @param previousTypes أنواع السطور السابقة (اختياري)
   * @returns نتيجة التصنيف الكاملة
   */
  static classifyWithScoring(
    line: string,
    index: number,
    allLines: string[],
    previousTypes?: (string | null)[]
  ): ClassificationResult {
    const quickCheck = this.quickClassify(line);
    if (quickCheck) {
      return quickCheck;
    }

    const ctx = this.buildContext(line, index, allLines, previousTypes);
    const normalized = this.normalizeLine(line);

    // حساب معلومات بلوك الحوار
    const dialogueBlockInfo = previousTypes 
      ? this.getDialogueBlockInfo(previousTypes, index)
      : { isInDialogueBlock: false, blockStartType: null, distanceFromCharacter: -1 };

    // حساب النقاط لكل نوع مع تمرير معلومات البلوك
    const characterScore = this.scoreAsCharacter(line, normalized, ctx);
    const dialogueScore = this.scoreAsDialogue(line, normalized, ctx, undefined, dialogueBlockInfo);
    const actionScore = this.scoreAsAction(line, normalized, ctx, undefined, dialogueBlockInfo);
    const parentheticalScore = this.scoreAsParenthetical(line, normalized, ctx, dialogueBlockInfo);

    // تحسين إضافي: إذا كان السطر يبدأ بفعل حركي، اجعل نقطة الأكشن أعلى
    if (this.isActionVerbStart(normalized)) {
      actionScore.score += 30;
      actionScore.confidence = 'high';
      actionScore.reasons.push('يبدأ بفعل حركي قوي');
    }

    // تحسين حاسم: لا تسمح لبلوك الحوار بابتلاع أسطر الأكشن
    // مثال: (Character) ثم سطر يبدأ بـ (نرى/نسمع/ترفع/ينهض...) يجب أن يبقى Action.
    const prevType = previousTypes && index > 0 ? previousTypes[index - 1] : null;
    const looksLikeActionStart = this.isActionVerbStart(normalized) || this.matchesActionStartPattern(normalized);
    if (prevType === 'character' && looksLikeActionStart) {
      dialogueScore.score -= 55;
      dialogueScore.reasons.push('سطر حركة رغم أن السابق شخصية (سالب)');
      actionScore.score += 25;
      actionScore.reasons.push('سطر حركة بعد شخصية (ترجيح للأكشن)');
    }

    // تحسين إضافي: إذا كان السطر طويلاً ويحتوي على علامات ترقيم، رجح الأكشن
    if (line.length > 50 && this.hasSentencePunctuation(normalized)) {
      actionScore.score += 20;
      actionScore.reasons.push('سطر طويل مع علامات ترقيم (غالباً أكشن)');
    }

    // ملاحظة: تمت إزالة المكافأة المطلقة للشرطة - أصبحت مشروطة بالسياق في scoreAsAction

    // جمع النقاط في كائن واحد
    const scores: { [type: string]: ClassificationScore } = {
      character: characterScore,
      dialogue: dialogueScore,
      action: actionScore,
      parenthetical: parentheticalScore
    };

    // إيجاد النوع الأعلى نقاطاً
    let bestType = 'action';
    let bestScore = 0;

    for (const [type, score] of Object.entries(scores)) {
      if (score.score > bestScore) {
        bestScore = score.score;
        bestType = type;
      }
    }

    // حساب درجة الشك
    const doubtScore = this.calculateDoubtScore(scores);

    return {
      type: bestType,
      confidence: scores[bestType].confidence,
      scores,
      context: ctx,
      doubtScore, // إضافة درجة الشك
    };
  }
}
