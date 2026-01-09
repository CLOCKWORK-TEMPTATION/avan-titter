/**
 * ScreenplayEditorEnhanced - The Ultimate Screenplay Editor
 * 
 * This editor combines the best features from:
 * 1. screenplay-editor.tsx - SceneHeaderAgent, postProcessFormatting, advanced paste handling, ReDoS Protection, fetchWithRetry
 * 2. CleanIntegratedScreenplayEditor.tsx - System Classes, AdvancedAgentsPopup, Sidebar, Status Bar
 * 
 * Key Features:
 * ✅ SceneHeaderAgent for complex Arabic scene headers
 * ✅ postProcessFormatting for intelligent text correction
 * ✅ Advanced paste handling with context tracking
 * ✅ ReDoS Protection in regex patterns
 * ✅ ExportDialog integration
 * ✅ Enhanced Keyboard Shortcuts (Ctrl+1-6)
 * ✅ fetchWithRetry with exponential backoff
 * ✅ All 7 System Classes (StateManager, AutoSaveManager, AdvancedSearchEngine, etc.)
 * ✅ AdvancedAgentsPopup integration
 * ✅ Full Sidebar with statistics
 * ✅ Status Bar with live info
 * ✅ AI Writing Assistant
 * ✅ Character Rename functionality
 * ✅ Dark/Light mode
 */

"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Sun,
  Moon,
  FileText,
  Bold,
  Italic,
  Underline,
  MoveVertical,
  Type,
  Search,
  Replace,
  Save,
  FolderOpen,
  Printer,
  Settings,
  Download,
  FilePlus,
  Undo,
  Redo,
  Scissors,
  Film,
  Camera,
  Feather,
  UserSquare,
  Parentheses,
  MessageCircle,
  FastForward,
  ChevronDown,
  BookHeart,
  Hash,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Activity,
  Globe,
  Database,
  Zap,
  Share2,
  Check,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  GitBranch,
  Clock,
  Bookmark,
  Tag,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  MoreVertical,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Mail,
  Phone,
  Link,
  Star,
  Heart,
  ThumbsUp,
  MessageSquare,
  Send,
  Maximize2,
  Minimize2,
  RefreshCw,
  HelpCircle,
  BarChart3,
  Users,
  PenTool,
  Brain,
} from "lucide-react";
import AdvancedAgentsPopup from "./AdvancedAgentsPopup";
import ExportDialog from "./ExportDialog";
import { applyRegexReplacementToTextNodes } from "../modules/domTextReplacement";
import { AIWritingAssistant } from "../classes/AIWritingAssistant";
import { ScreenplayClassifier } from "../classes/ScreenplayClassifier";
import { SceneHeaderAgent } from "../helpers/SceneHeaderAgent";
import { StateManager } from "../classes/systems/StateManager";
import { AutoSaveManager } from "../classes/systems/AutoSaveManager";
import { AdvancedSearchEngine } from "../classes/systems/AdvancedSearchEngine";
import { CollaborationSystem } from "../classes/systems/CollaborationSystem";
import { ProjectManager } from "../classes/systems/ProjectManager";
import { VisualPlanningSystem } from "../classes/systems/VisualPlanningSystem";
import { getFormatStyles as getFormatStylesHelper } from "../helpers/getFormatStyles";
import { formatText as formatTextHelper } from "../helpers/formatText";
import { applyFormatToCurrentLine as applyFormatToCurrentLineHelper } from "../helpers/applyFormatToCurrentLine";
import { postProcessFormatting as postProcessFormattingHelper } from "../helpers/postProcessFormatting";
import { handlePaste as handlePasteHelper } from "../helpers/handlePaste";
import { createHandleKeyDown } from "../handlers/handleKeyDown";
import { createHandleSearch } from "../handlers/handleSearch";
import { createHandleReplace } from "../handlers/handleReplace";
import { createHandleCharacterRename } from "../handlers/handleCharacterRename";
import { createHandleAIReview } from "../handlers/handleAIReview";
import type {
  Script,
  Scene,
  Character,
  DialogueLine,
  SceneActionLine,
} from "../types/types";

// ==================== PRODUCTION-READY SYSTEM CLASSES ====================
// تم نقل جميع System Classes إلى ../classes/systems/

// ==================== ENHANCED SCREENPLAY CLASSIFIER WITH REDOS PROTECTION ====================
// ScreenplayClassifier - تم نقله إلى ../classes/ScreenplayClassifier.ts

// ==================== SCENE HEADER AGENT ====================
// SceneHeaderAgent - تم نقله إلى ../helpers/SceneHeaderAgent.ts

// ==================== FETCH WITH RETRY ====================

const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries: number = 3,
  delay: number = 1000
): Promise<Response> => {
  try {
    const response = await fetch(url, options);

    if (response.ok) {
      return response;
    }

    if (response.status >= 400 && response.status < 500) {
      throw new Error(`Client error: ${response.status}`);
    }

    throw new Error(`Server error: ${response.status}`);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
};

// ==================== MAIN COMPONENT ====================

export default function ScreenplayEditorEnhanced() {
  const [htmlContent, setHtmlContent] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentFormat, setCurrentFormat] = useState("action");
  const [selectedFont, setSelectedFont] = useState("Cairo");
  const [selectedSize, setSelectedSize] = useState("14pt");
  const [documentStats, setDocumentStats] = useState({
    characters: 0,
    words: 0,
    pages: 1,
    scenes: 0,
  });

  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showCharacterRename, setShowCharacterRename] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [oldCharacterName, setOldCharacterName] = useState("");
  const [newCharacterName, setNewCharacterName] = useState("");

  const [showReviewerDialog, setShowReviewerDialog] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState("");

  const [showRulers, setShowRulers] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAdvancedAgents, setShowAdvancedAgents] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  const stateManager = useRef(new StateManager());
  const autoSaveManager = useRef(new AutoSaveManager());
  const searchEngine = useRef(new AdvancedSearchEngine());
  const collaborationSystem = useRef(new CollaborationSystem());
  const aiAssistant = useRef(new AIWritingAssistant());
  const projectManager = useRef(new ProjectManager());
  const visualPlanning = useRef(new VisualPlanningSystem());
  const screenplayClassifier = useRef(new ScreenplayClassifier());

  const cssObjectToString = (styles: React.CSSProperties): string => {
    return Object.entries(styles)
      .map(([key, value]) => {
        const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
        return `${cssKey}: ${value}`;
      })
      .join("; ");
  };

  // getFormatStyles - تم نقله إلى ../helpers/getFormatStyles.ts
  const getFormatStyles = (formatType: string): React.CSSProperties => {
    return getFormatStylesHelper(formatType, selectedSize);
  };

  const isCurrentElementEmpty = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const element = range.startContainer.parentElement;
      return element && element.textContent === "";
    }
    return false;
  };

  const getNextFormatOnTab = (currentFormat: string, shiftKey: boolean) => {
    const mainSequence = [
      "scene-header-top-line",
      "action",
      "character",
      "transition",
    ];

    switch (currentFormat) {
      case "character":
        if (shiftKey) {
          return isCurrentElementEmpty() ? "action" : "transition";
        } else {
          return "dialogue";
        }
      case "dialogue":
        if (shiftKey) {
          return "character";
        } else {
          return "parenthetical";
        }
      case "parenthetical":
        return "dialogue";
      default:
        const currentIndex = mainSequence.indexOf(currentFormat);
        if (currentIndex !== -1) {
          if (shiftKey) {
            return mainSequence[Math.max(0, currentIndex - 1)];
          } else {
            return mainSequence[
              Math.min(mainSequence.length - 1, currentIndex + 1)
            ];
          }
        }
        return "action";
    }
  };

  const getNextFormatOnEnter = (currentFormat: string) => {
    const transitions: { [key: string]: string } = {
      "scene-header-top-line": "scene-header-3",
      "scene-header-3": "action",
      "scene-header-1": "scene-header-3",
      "scene-header-2": "scene-header-3",
    };

    return transitions[currentFormat] || "action";
  };

  // formatText - تم نقله إلى ../helpers/formatText.ts
  const formatText = formatTextHelper;

  const calculateStats = () => {
    if (editorRef.current) {
      const textContent = editorRef.current.innerText || "";
      const characters = textContent.length;
      const words = textContent.trim()
        ? textContent.trim().split(/\s+/).length
        : 0;
      const scenes = (textContent.match(/مشهد\s*\d+/gi) || []).length;

      const scrollHeight = editorRef.current.scrollHeight;
      const pages = Math.max(1, Math.ceil(scrollHeight / (29.7 * 37.8)));

      setDocumentStats({ characters, words, pages, scenes });
    }
  };

  // applyFormatToCurrentLine - تم نقله إلى ../helpers/applyFormatToCurrentLine.ts
  const applyFormatToCurrentLine = (formatType: string) => {
    applyFormatToCurrentLineHelper(formatType, getFormatStyles, setCurrentFormat);
  };

  const updateContent = () => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const element = range.startContainer.parentElement;
        if (element) {
          setCurrentFormat(element.className || "action");
        }
      }

      calculateStats();
    }
  };

  // postProcessFormatting - تم نقله إلى ../helpers/postProcessFormatting.ts
  const postProcessFormatting = (htmlResult: string): string => {
    return postProcessFormattingHelper(htmlResult, getFormatStyles);
  };

  // handlePaste - تم نقله إلى ../helpers/handlePaste.ts
  const handlePaste = (e: React.ClipboardEvent) => {
    handlePasteHelper(e, editorRef, getFormatStyles, updateContent);
  };

  // handleKeyDown - تم نقله إلى ../handlers/handleKeyDown.ts
  const handleKeyDown = createHandleKeyDown(
    currentFormat,
    getNextFormatOnTab,
    getNextFormatOnEnter,
    applyFormatToCurrentLine,
    formatText,
    setShowSearchDialog,
    setShowReplaceDialog,
    updateContent
  );

  // handleSearch - تم نقله إلى ../handlers/handleSearch.ts
  const handleSearch = createHandleSearch(
    searchTerm,
    editorRef,
    searchEngine,
    setShowSearchDialog
  );

  // handleReplace - تم نقله إلى ../handlers/handleReplace.ts
  const handleReplace = createHandleReplace(
    searchTerm,
    replaceTerm,
    editorRef,
    searchEngine,
    updateContent,
    setShowReplaceDialog,
    setSearchTerm,
    setReplaceTerm
  );

  // handleCharacterRename - تم نقله إلى ../handlers/handleCharacterRename.ts
  const handleCharacterRename = createHandleCharacterRename(
    oldCharacterName,
    newCharacterName,
    editorRef,
    updateContent,
    setShowCharacterRename,
    setOldCharacterName,
    setNewCharacterName
  );

  // handleAIReview - تم نقله إلى ../handlers/handleAIReview.ts
  const handleAIReview = createHandleAIReview(
    editorRef,
    setIsReviewing,
    setReviewResult
  );

  useEffect(() => {
    if (editorRef.current) {
      const divs = editorRef.current.querySelectorAll("div");
      divs.forEach((div: HTMLDivElement) => {
        const className = div.className;
        Object.assign(div.style, getFormatStyles(className));
      });
      calculateStats();
    }
  }, [selectedFont, selectedSize, htmlContent]);

  useEffect(() => {
    calculateStats();
  }, [htmlContent]);

  useEffect(() => {
    if (editorRef.current && !htmlContent) {
      editorRef.current.innerHTML = `
        <div class="basmala">بسم الله الرحمن الرحيم</div>
        <div class="scene-header-top-line">
          <div>المؤلف: اسم المؤلف</div>
          <div>التاريخ: ${new Date().toLocaleDateString("ar")}</div>
        </div>
        <div class="scene-header-3">مشهد 1</div>
        <div class="action">[وصف المشهد والأفعال هنا]</div>
        <div class="character">الاسم</div>
        <div class="dialogue">[الحوار هنا]</div>
      `;

      // Apply styles to all elements after creation
      const divs = editorRef.current.querySelectorAll("div");
      divs.forEach((div: HTMLDivElement) => {
        const className = div.className;
        if (className) {
          Object.assign(div.style, getFormatStyles(className));
        }
      });

      updateContent();
    }

    autoSaveManager.current.setSaveCallback(async (content) => {
      console.log("Auto-saved content:", content);
    });
    autoSaveManager.current.startAutoSave();

    return () => {
      autoSaveManager.current.stopAutoSave();
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "dark bg-gray-900 text-white" : "bg-white text-black"}`}
      dir="rtl"
    >
      <header className="border-b border-gray-700 bg-gray-800 text-white sticky top-0 z-10">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-2">
            <Film className="text-blue-500" />
            <h1 className="text-xl font-bold">محرر السيناريو العربي</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowFileMenu(!showFileMenu)}
                className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                ملف <ChevronDown size={16} className="mr-1" />
              </button>

              {showFileMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
                  <button className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                    <FilePlus size={16} className="ml-2" /> جديد
                  </button>
                  <button className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                    <FolderOpen size={16} className="ml-2" /> فتح
                  </button>
                  <button className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                    <Save size={16} className="ml-2" /> حفظ
                  </button>
                  <button className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                    <Download size={16} className="ml-2" /> تصدير
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowEditMenu(!showEditMenu)}
                className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                تحرير <ChevronDown size={16} className="mr-1" />
              </button>

              {showEditMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
                  <button className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                    <Undo size={16} className="ml-2" /> تراجع
                  </button>
                  <button className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                    <Redo size={16} className="ml-2" /> إعادة
                  </button>
                  <button className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                    <Scissors size={16} className="ml-2" /> قص
                  </button>
                  <button className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                    <Copy size={16} className="ml-2" /> نسخ
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFormatMenu(!showFormatMenu)}
                className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                تنسيق <ChevronDown size={16} className="mr-1" />
              </button>

              {showFormatMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
                  <button
                    onClick={() =>
                      applyFormatToCurrentLine("scene-header-top-line")
                    }
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    عنوان المشهد العلوي
                  </button>
                  <button
                    onClick={() => applyFormatToCurrentLine("scene-header-3")}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    عنوان المشهد
                  </button>
                  <button
                    onClick={() => applyFormatToCurrentLine("action")}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    وصف الأفعال
                  </button>
                  <button
                    onClick={() => applyFormatToCurrentLine("character")}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    الشخصية
                  </button>
                  <button
                    onClick={() => applyFormatToCurrentLine("dialogue")}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    الحوار
                  </button>
                  <button
                    onClick={() => applyFormatToCurrentLine("transition")}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    الانتقال
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                أدوات <ChevronDown size={16} className="mr-1" />
              </button>

              {showToolsMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
                  <button
                    onClick={() => setShowSearchDialog(true)}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Search size={16} className="ml-2" /> بحث
                  </button>
                  <button
                    onClick={() => setShowReplaceDialog(true)}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Replace size={16} className="ml-2" /> استبدال
                  </button>
                  <button
                    onClick={() => setShowCharacterRename(true)}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <UserSquare size={16} className="ml-2" /> إعادة تسمية
                    الشخصية
                  </button>
                  <button
                    onClick={() => setShowReviewerDialog(true)}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Sparkles size={16} className="ml-2" /> مراجعة الذكاء
                    الاصطناعي
                  </button>
                  <button
                    onClick={() => setShowAdvancedAgents(true)}
                    className="block w-full text-right px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Brain size={16} className="ml-2" /> الوكلاء المتقدمة
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => window.print()}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="طباعة"
            >
              <Printer size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <div className="flex-1 bg-gray-900 p-6 overflow-auto">
          <div
            ref={editorRef}
            contentEditable
            className="screenplay-page min-h-[29.7cm] focus:outline-none"
            style={{
              fontFamily: `${selectedFont}, Amiri, Cairo, Noto Sans Arabic, Arial, sans-serif`,
              fontSize: selectedSize,
              direction: "rtl",
              lineHeight: "1.8",
              width: "min(21cm, calc(100vw - 2rem))",
              margin: "0 auto",
              paddingTop: "1in",
              paddingBottom: "1in",
              paddingRight: "1.5in",
              paddingLeft: "1in",
              backgroundColor: "white",
              color: "black",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onInput={updateContent}
          />
        </div>

        <div className="no-print sidebar w-64 border-l border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="space-y-6">
            <div>
              <h3 className="font-bold mb-2">الإحصائيات</h3>
              <div className="space-y-1 text-sm">
                <div>الشخصيات: {documentStats.characters}</div>
                <div>الكلمات: {documentStats.words}</div>
                <div>الصفحات: {documentStats.pages}</div>
                <div>المشاهد: {documentStats.scenes}</div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">التنسيق</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm mb-1">الخط</label>
                  <select
                    value={selectedFont}
                    onChange={(e) => setSelectedFont(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  >
                    <option value="Amiri">Amiri</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Tajawal">Tajawal</option>
                    <option value="Noto Sans Arabic">Noto Sans Arabic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">الحجم</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  >
                    <option value="12pt">صغير (12pt)</option>
                    <option value="14pt">متوسط (14pt)</option>
                    <option value="16pt">كبير (16pt)</option>
                    <option value="18pt">كبير جداً (18pt)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">العناصر السريعة</h3>
              <div className="space-y-2">
                <button
                  onClick={() => applyFormatToCurrentLine("scene-header-3")}
                  className="w-full text-right p-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded flex items-center"
                >
                  <Hash size={16} className="ml-2" /> إضافة مشهد
                </button>
                <button
                  onClick={() => applyFormatToCurrentLine("character")}
                  className="w-full text-right p-2 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 rounded flex items-center"
                >
                  <UserSquare size={16} className="ml-2" /> إضافة شخصية
                </button>
                <button
                  onClick={() => applyFormatToCurrentLine("dialogue")}
                  className="w-full text-right p-2 bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 rounded flex items-center"
                >
                  <MessageCircle size={16} className="ml-2" /> إضافة حوار
                </button>
                <button
                  onClick={() => applyFormatToCurrentLine("transition")}
                  className="w-full text-right p-2 bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded flex items-center"
                >
                  <FastForward size={16} className="ml-2" /> إضافة انتقال
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSearchDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Search className="ml-2" /> بحث
              </h3>
              <button onClick={() => setShowSearchDialog(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">كلمة البحث</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  placeholder="أدخل النص للبحث عنه"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowSearchDialog(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  بحث
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReplaceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Replace className="ml-2" /> بحث واستبدال
              </h3>
              <button onClick={() => setShowReplaceDialog(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">البحث عن</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  placeholder="أدخل النص للبحث عنه"
                />
              </div>

              <div>
                <label className="block mb-1">استبدال بـ</label>
                <input
                  type="text"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  placeholder="أدخل النص البديل"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowReplaceDialog(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleReplace}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  استبدال
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCharacterRename && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <UserSquare className="ml-2" /> إعادة تسمية الشخصية
              </h3>
              <button onClick={() => setShowCharacterRename(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1">الاسم الحالي</label>
                <input
                  type="text"
                  value={oldCharacterName}
                  onChange={(e) => setOldCharacterName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  placeholder="أدخل الاسم الحالي"
                />
              </div>

              <div>
                <label className="block mb-1">الاسم الجديد</label>
                <input
                  type="text"
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  placeholder="أدخل الاسم الجديد"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCharacterRename(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCharacterRename}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  إعادة تسمية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewerDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-1/2 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Sparkles className="ml-2" /> مراجعة الذكاء الاصطناعي
              </h3>
              <button onClick={() => setShowReviewerDialog(false)}>
                <X size={20} />
              </button>
            </div>

            {isReviewing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p>جاري تحليل النص باستخدام الذكاء الاصطناعي...</p>
              </div>
            ) : reviewResult ? (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded whitespace-pre-line">
                  {reviewResult}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowReviewerDialog(false)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p>هل تريد مراجعة النص باستخدام الذكاء الاصطناعي؟</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowReviewerDialog(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleAIReview}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    مراجعة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AdvancedAgentsPopup
        isOpen={showAdvancedAgents}
        onClose={() => setShowAdvancedAgents(false)}
        content={editorRef.current?.innerText || ""}
      />

      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          content={editorRef.current?.innerHTML || ""}
          title="سيناريو"
        />
      )}
    </div>
  );
}
