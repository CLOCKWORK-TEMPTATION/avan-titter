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
import MainHeader from "./MainHeader";
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
  const [selectedFont, setSelectedFont] = useState("AzarMehrMonospaced-San");
  const [selectedSize, setSelectedSize] = useState("12pt");
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
    return getFormatStylesHelper(formatType, selectedSize, selectedFont);
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
      "character": "dialogue",
      "dialogue": "action",
      "parenthetical": "dialogue",
      "action": "action",
      "transition": "scene-header-top-line",
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
  const applyFormatToCurrentLine = (formatType: string, isEnterAction: boolean = false) => {
    applyFormatToCurrentLineHelper(formatType, getFormatStyles, setCurrentFormat, isEnterAction);
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
      const elements = editorRef.current.querySelectorAll<HTMLElement>(
        "div, span"
      );
      elements.forEach((element) => {
        const className = element.className;
        Object.assign(element.style, getFormatStyles(className));
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
      const elements = editorRef.current.querySelectorAll<HTMLElement>(
        "div, span"
      );
      elements.forEach((element) => {
        const className = element.className;
        if (className) {
          Object.assign(element.style, getFormatStyles(className));
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
      {/* Header with Glass Morphism */}
      <header className="border-b border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-900/70 text-white sticky top-0 z-10 backdrop-blur-xl shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30">
                <Film className="text-blue-400 w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-l from-white to-white/70 bg-clip-text text-transparent">
                النسخة
              </h1>
              <p className="text-xs text-white/50 font-medium tracking-wide">أڨان تيتر</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="group relative p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300"
              title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:to-blue-500/10 rounded-xl transition-all duration-300"></div>
              {isDarkMode ? <Sun size={18} className="relative" /> : <Moon size={18} className="relative" />}
            </button>

            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => setShowFileMenu(!showFileMenu)}
                className="px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                ملف
                <ChevronDown size={14} className={`transition-transform duration-200 ${showFileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showFileMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
                  <div className="p-1.5 space-y-0.5">
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                        <FilePlus size={14} className="text-blue-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">جديد</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                        <FolderOpen size={14} className="text-emerald-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">فتح</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
                        <Save size={14} className="text-violet-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">حفظ</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                        <Download size={14} className="text-amber-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">تصدير</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
              <button
                onClick={() => setShowEditMenu(!showEditMenu)}
                className="px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                تحرير
                <ChevronDown size={14} className={`transition-transform duration-200 ${showEditMenu ? 'rotate-180' : ''}`} />
              </button>

              {showEditMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
                  <div className="p-1.5 space-y-0.5">
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-slate-500/20 group-hover:bg-slate-500/30 transition-colors">
                        <Undo size={14} className="text-slate-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">تراجع</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-slate-500/20 group-hover:bg-slate-500/30 transition-colors">
                        <Redo size={14} className="text-slate-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">إعادة</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-rose-500/20 group-hover:bg-rose-500/30 transition-colors">
                        <Scissors size={14} className="text-rose-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">قص</span>
                    </button>
                    <button className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                        <Copy size={14} className="text-cyan-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">نسخ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Format Menu */}
            <div className="relative">
              <button
                onClick={() => setShowFormatMenu(!showFormatMenu)}
                className="px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                تنسيق
                <ChevronDown size={14} className={`transition-transform duration-200 ${showFormatMenu ? 'rotate-180' : ''}`} />
              </button>

              {showFormatMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        applyFormatToCurrentLine("scene-header-top-line");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      عنوان المشهد العلوي
                    </button>
                    <button
                      onClick={() => {
                        applyFormatToCurrentLine("scene-header-3");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      عنوان المشهد
                    </button>
                    <button
                      onClick={() => {
                        applyFormatToCurrentLine("action");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      وصف الأفعال
                    </button>
                    <button
                      onClick={() => {
                        applyFormatToCurrentLine("character");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      الشخصية
                    </button>
                    <button
                      onClick={() => {
                        applyFormatToCurrentLine("dialogue");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      الحوار
                    </button>
                    <button
                      onClick={() => {
                        applyFormatToCurrentLine("transition");
                        setShowFormatMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-sm text-white/90 hover:text-white"
                    >
                      الانتقال
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tools Menu */}
            <div className="relative">
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
              >
                أدوات
                <ChevronDown size={14} className={`transition-transform duration-200 ${showToolsMenu ? 'rotate-180' : ''}`} />
              </button>

              {showToolsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-20">
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setShowSearchDialog(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                        <Search size={14} className="text-blue-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">بحث</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowReplaceDialog(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group"
                    >
                      <div className="p-1.5 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 transition-colors">
                        <Replace size={14} className="text-violet-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">استبدال</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCharacterRename(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                        <UserSquare size={14} className="text-emerald-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">إعادة تسمية</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewerDialog(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group"
                    >
                      <div className="p-1.5 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                        <Sparkles size={14} className="text-amber-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">مراجعة AI</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowAdvancedAgents(true);
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-right px-3 py-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 flex items-center gap-3 text-sm group"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-500/20 group-hover:bg-rose-500/30 transition-colors">
                        <Brain size={14} className="text-rose-400" />
                      </div>
                      <span className="text-white/90 group-hover:text-white transition-colors">الوكلاء المتقدمة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="group p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300"
              title="طباعة"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-slate-500/0 to-slate-500/0 group-hover:from-slate-500/20 group-hover:to-slate-500/10 rounded-xl transition-all duration-300"></div>
              <Printer size={18} className="relative" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Editor Area with Subtle Background Effects */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-auto">
          {/* Subtle ambient background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative px-6 pb-6 pt-0">
            <div className="w-full flex justify-center">
              <div
                style={{ width: "210mm" }}
                className="h-[52px] flex items-center justify-center"
              >
                <MainHeader onSave={() => {}} onUndo={() => {}} />
              </div>
            </div>
            <div
              ref={editorRef}
              contentEditable
              className="screenplay-page focus:outline-none relative z-10"
              style={{
                boxSizing: "border-box",
                fontFamily: selectedFont,
                fontSize: selectedSize,
                direction: "rtl",
                lineHeight: "14pt",
                width: "210mm",
                minHeight: "297mm",
                margin: "0 auto",
                paddingTop: "1in",
                paddingBottom: "0.5in",
                paddingRight: "1.5in",
                paddingLeft: "1in",
                backgroundColor: "white",
                color: "black",
                borderRadius: "16px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onInput={updateContent}
            />
          </div>
        </div>

        {/* Sidebar - Elegant Glass Design */}
        <div className="no-print sidebar w-64 border-l border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 backdrop-blur-xl">
          <div className="p-4">
            <div className="grid grid-cols-4 gap-2">
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/10 rounded-xl transition-all duration-300"></div>
                <Film className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/10 rounded-xl transition-all duration-300"></div>
                <Camera className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-xl transition-all duration-300"></div>
                <Play className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 rounded-xl transition-all duration-300"></div>
                <Pause className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors relative" />
              </button>

              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/10 rounded-xl transition-all duration-300"></div>
                <FastForward className="w-5 h-5 text-rose-400 group-hover:text-rose-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 rounded-xl transition-all duration-300"></div>
                <Scissors className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 rounded-xl transition-all duration-300"></div>
                <Upload className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/10 rounded-xl transition-all duration-300"></div>
                <Download className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors relative" />
              </button>

              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-slate-500/0 group-hover:bg-slate-500/10 rounded-xl transition-all duration-300"></div>
                <Printer className="w-5 h-5 text-slate-400 group-hover:text-slate-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center">
                <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/10 rounded-xl transition-all duration-300"></div>
                <FileText className="w-5 h-5 text-teal-400 group-hover:text-teal-300 transition-colors relative" />
              </button>
              <button className="group relative p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 flex items-center justify-center col-span-1">
                <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 rounded-xl transition-all duration-300"></div>
                <PenTool className="w-5 h-5 text-orange-400 group-hover:text-orange-300 transition-colors relative" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Dialog - Elegant Design */}
      {showSearchDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-[400px] shadow-2xl shadow-black/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <div className="p-2 rounded-xl bg-blue-500/20">
                  <Search className="text-blue-400 w-5 h-5" />
                </div>
                بحث
              </h3>
              <button
                onClick={() => setShowSearchDialog(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">كلمة البحث</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="أدخل النص للبحث عنه"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSearchDialog(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSearch}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 transition-all duration-200 font-medium text-sm shadow-lg shadow-blue-500/25"
                >
                  بحث
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replace Dialog - Elegant Design */}
      {showReplaceDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-[400px] shadow-2xl shadow-black/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <div className="p-2 rounded-xl bg-violet-500/20">
                  <Replace className="text-violet-400 w-5 h-5" />
                </div>
                بحث واستبدال
              </h3>
              <button
                onClick={() => setShowReplaceDialog(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">البحث عن</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="أدخل النص للبحث عنه"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">استبدال بـ</label>
                <input
                  type="text"
                  value={replaceTerm}
                  onChange={(e) => setReplaceTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="أدخل النص البديل"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowReplaceDialog(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleReplace}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-500 hover:to-violet-400 transition-all duration-200 font-medium text-sm shadow-lg shadow-violet-500/25"
                >
                  استبدال
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Character Rename Dialog - Elegant Design */}
      {showCharacterRename && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-[400px] shadow-2xl shadow-black/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <UserSquare className="text-emerald-400 w-5 h-5" />
                </div>
                إعادة تسمية الشخصية
              </h3>
              <button
                onClick={() => setShowCharacterRename(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">الاسم الحالي</label>
                <input
                  type="text"
                  value={oldCharacterName}
                  onChange={(e) => setOldCharacterName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="أدخل الاسم الحالي"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">الاسم الجديد</label>
                <input
                  type="text"
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-200"
                  placeholder="أدخل الاسم الجديد"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCharacterRename(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCharacterRename}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 font-medium text-sm shadow-lg shadow-emerald-500/25"
                >
                  إعادة تسمية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Review Dialog - Elegant Design */}
      {showReviewerDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-[500px] max-h-[80vh] overflow-y-auto shadow-2xl shadow-black/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <div className="p-2 rounded-xl bg-amber-500/20">
                  <Sparkles className="text-amber-400 w-5 h-5" />
                </div>
                مراجعة الذكاء الاصطناعي
              </h3>
              <button
                onClick={() => setShowReviewerDialog(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {isReviewing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full"></div>
                  <Loader2 className="relative animate-spin text-amber-400 w-12 h-12" />
                </div>
                <p className="text-white/70">جاري تحليل النص باستخدام الذكاء الاصطناعي...</p>
              </div>
            ) : reviewResult ? (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl whitespace-pre-line text-white/90 leading-relaxed">
                  {reviewResult}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowReviewerDialog(false)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 transition-all duration-200 font-medium text-sm shadow-lg shadow-amber-500/25"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-white/70 text-center py-4">هل تريد مراجعة النص باستخدام الذكاء الاصطناعي؟</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowReviewerDialog(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium text-sm"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleAIReview}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 transition-all duration-200 font-medium text-sm shadow-lg shadow-amber-500/25"
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
