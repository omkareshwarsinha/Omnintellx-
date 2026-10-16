/**
 * Omnintellx — Projects & Workspace Screen
 */

import React, { useState } from 'react';
import { Project, ProjectFile } from '../types';
import {
  FolderPlus,
  Search,
  Pin,
  Star,
  Trash2,
  Copy,
  Download,
  Upload,
  FileCode,
  ChevronRight,
  Plus,
  Clock,
  HardDrive,
  Sparkles,
  Layers,
  Gamepad2,
  CheckSquare
} from 'lucide-react';

interface ProjectsScreenProps {
  projects: Project[];
  activeProjectId: string | null;
  onOpenProject: (id: string) => void;
  onCreateProject: () => void;
  onCreateFromTemplate?: (templateId: string) => void;
  onImportProject: () => void;
  onExportProject: (id: string) => void;
  onExportSingleHtml?: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onTogglePinProject: (id: string) => void;
  onToggleStarProject: (id: string) => void;
  onOpenFile: (projectId: string, fileId: string) => void;
  onNewFile: (projectId: string) => void;
  onDeleteFile: (projectId: string, fileId: string) => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  projects,
  activeProjectId,
  onOpenProject,
  onCreateProject,
  onCreateFromTemplate,
  onImportProject,
  onExportProject,
  onExportSingleHtml,
  onDuplicateProject,
  onDeleteProject,
  onTogglePinProject,
  onToggleStarProject,
  onOpenFile,
  onNewFile,
  onDeleteFile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(activeProjectId || (projects[0]?.id ?? null));

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0] || null;

  const totalFiles = projects.reduce((acc, p) => acc + p.files.length, 0);

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">Project Workspace</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your codebase, schemas, component files and dependencies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onImportProject}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button
            onClick={onCreateProject}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <FolderPlus className="w-3.5 h-3.5" /> New Project
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-500">Projects</span>
          <div className="text-xl font-bold text-white font-display mt-0.5">{projects.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-500">Total Files</span>
          <div className="text-xl font-bold text-white font-display mt-0.5">{totalFiles}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-500">Pinned</span>
          <div className="text-xl font-bold text-indigo-400 font-display mt-0.5">
            {projects.filter(p => p.pinned).length}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className="text-[10px] font-mono uppercase text-slate-500">Storage Location</span>
          <div className="text-sm font-semibold text-slate-200 mt-1 truncate">On-Device Local</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects by name, description, or files..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Two Column Layout: Projects List + Selected Project Files */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Projects List */}
        <div className="space-y-2.5 md:col-span-1">
          <h3 className="text-xs font-mono font-semibold uppercase text-slate-400 mb-2">
            All Projects ({filteredProjects.length})
          </h3>

          {filteredProjects.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-white/[0.02] border border-white/5 rounded-xl">
              No projects found. Create a new one!
            </div>
          ) : (
            filteredProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedProject?.id === p.id
                    ? 'bg-indigo-950/30 border-indigo-500/40 text-white shadow-lg ring-1 ring-indigo-500/20'
                    : 'bg-white/[0.02] border-white/5 text-slate-300 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {p.pinned && <Pin className="w-3 h-3 text-indigo-400 shrink-0 fill-current" />}
                    <h4 className="font-semibold text-sm truncate">{p.name}</h4>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStarProject(p.id);
                    }}
                    className={`p-1 rounded hover:text-amber-400 ${p.favorite ? 'text-amber-400 fill-current' : 'text-slate-500'}`}
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 line-clamp-1">
                  {p.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-500 font-mono">
                  <span>{p.files.length} files</span>
                  <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Project Detail & Files */}
        <div className="md:col-span-2 space-y-4">
          {selectedProject ? (
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedProject.name}</h3>
                    {selectedProject.pinned && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        PINNED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedProject.description}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onExportSingleHtml && (
                    <button
                      onClick={() => onExportSingleHtml(selectedProject.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all"
                      title="Export as self-contained Single HTML"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Single HTML
                    </button>
                  )}
                  <button
                    onClick={() => onTogglePinProject(selectedProject.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Toggle Pin"
                  >
                    <Pin className={`w-4 h-4 ${selectedProject.pinned ? 'text-indigo-400 fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => onDuplicateProject(selectedProject.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Duplicate Project"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onExportProject(selectedProject.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Export as JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteProject(selectedProject.id)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Files in Project */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono font-semibold uppercase text-slate-400">
                    Files ({selectedProject.files.length})
                  </h4>
                  <button
                    onClick={() => onNewFile(selectedProject.id)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-medium flex items-center gap-1 border border-indigo-500/30"
                  >
                    <Plus className="w-3 h-3" /> New File
                  </button>
                </div>

                <div className="space-y-1.5">
                  {selectedProject.files.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 bg-black/20 rounded-xl border border-white/5">
                      No files in this project. Tap <strong>New File</strong> to create one.
                    </div>
                  ) : (
                    selectedProject.files.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => onOpenFile(selectedProject.id, file.id)}
                        className="p-2.5 px-3 rounded-xl bg-black/30 hover:bg-black/50 border border-white/5 hover:border-indigo-500/20 cursor-pointer flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-xs font-mono text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                            {file.name}
                          </span>
                          {file.lastEditedByAgent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/5 text-slate-400 border border-white/5">
                              {file.lastEditedByAgent}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="text-[10px] font-mono">{file.content.length} B</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFile(selectedProject.id, file.id);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 bg-white/[0.02] border border-white/5 rounded-2xl">
              Select or create a project to inspect files.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
