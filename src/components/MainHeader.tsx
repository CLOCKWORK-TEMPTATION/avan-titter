"use client";

import * as React from "react";
import {
  Download,
  History,
  Info,
  Lightbulb,
  MessageSquare,
  Redo2,
  Save,
  Stethoscope,
  Undo2,
} from "lucide-react";

type MainHeaderProps = {
  onSave?: () => void;
  onDownload?: () => void;
  onHistory?: () => void;
  onMessages?: () => void;
  onInfo?: () => void;
  onLightbulb?: () => void;
  onStethoscope?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
};

const MainHeader = ({
  onSave,
  onDownload,
  onHistory,
  onMessages,
  onInfo,
  onLightbulb,
  onStethoscope,
}: MainHeaderProps) => {
  const iconClass = "w-5 h-5 transition-colors duration-200";

  return (
    <div className="flex items-center justify-center gap-4 select-none">
      {/* Info Button - Sky Blue */}
      <button
        onClick={onInfo}
        className="group relative p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-sky-500/0 group-hover:bg-sky-500/10 rounded-xl transition-all duration-300"></div>
        <Info className={`${iconClass} text-sky-400 group-hover:text-sky-300 relative`} />
      </button>

      {/* Undo/Redo Group */}
      <div className="flex items-center gap-1">
        <button className="group relative p-2 rounded-xl hover:bg-white/10 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed">
          <div className="absolute inset-0 bg-slate-500/0 group-hover:bg-slate-500/10 rounded-xl transition-all duration-300"></div>
          <Undo2 className={`${iconClass} text-slate-400 group-hover:text-slate-300 relative`} />
        </button>
        <button className="group relative p-2 rounded-xl hover:bg-white/10 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed">
          <div className="absolute inset-0 bg-slate-500/0 group-hover:bg-slate-500/10 rounded-xl transition-all duration-300"></div>
          <Redo2 className={`${iconClass} text-slate-400 group-hover:text-slate-300 relative`} />
        </button>
      </div>

      {/* Action Buttons Group */}
      <div className="flex items-center gap-1">
        {/* Save - Violet */}
        <button
          onClick={onSave}
          className="group relative p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/10 rounded-xl transition-all duration-300"></div>
          <Save className={`${iconClass} text-violet-400 group-hover:text-violet-300 relative`} />
        </button>

        {/* Download - Pink */}
        <button
          onClick={onDownload}
          className="group relative p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/10 rounded-xl transition-all duration-300"></div>
          <Download className={`${iconClass} text-pink-400 group-hover:text-pink-300 relative`} />
        </button>

        {/* History - Amber */}
        <button
          onClick={onHistory}
          className="group relative p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 rounded-xl transition-all duration-300"></div>
          <History className={`${iconClass} text-amber-400 group-hover:text-amber-300 relative`} />
        </button>

        {/* Messages - Emerald */}
        <button
          onClick={onMessages}
          className="group relative p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 rounded-xl transition-all duration-300"></div>
          <MessageSquare className={`${iconClass} text-emerald-400 group-hover:text-emerald-300 relative`} />
        </button>

        {/* Lightbulb - Yellow */}
        <button
          onClick={onLightbulb}
          className="group relative p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/10 rounded-xl transition-all duration-300"></div>
          <Lightbulb className={`${iconClass} text-yellow-400 group-hover:text-yellow-300 relative`} />
        </button>

        {/* Stethoscope - Rose */}
        <button
          onClick={onStethoscope}
          className="group relative p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/10 rounded-xl transition-all duration-300"></div>
          <Stethoscope className={`${iconClass} text-rose-400 group-hover:text-rose-300 relative`} />
        </button>
      </div>
    </div>
  );
};

export default MainHeader;
