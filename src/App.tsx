/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, Tag as TagIcon, X, Calendar, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Note = {
  id: number;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
};

// --- Constants & Seeds ---
const STORAGE_KEY = 'mymemo.notes';

const SEED_NOTES: Note[] = [
  {
    id: 1,
    title: '시안 작업 가이드',
    body: '웹 디자인을 위한 스타일 가이드를 작성합니다. 색상 팔레트와 폰트 조합을 포함해야 합니다.',
    tags: ['디자인', '가이드'],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: '읽어야 할 책 리스트',
    body: '1. 클린 코드\n2. 리팩터링\n3. 디자인 패턴\n연말까지 정독을 목표로 합니다.',
    tags: ['독서', '자기개발'],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: '프로젝트 아이디어',
    body: '사용자의 생산성을 높여주는 미니멀한 메모 앱 기획. 태그 기능과 검색 기능이 핵심.',
    tags: ['업무', '개발'],
    updatedAt: new Date().toISOString(),
  },
];

export default function App() {
  // --- State ---
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({ title: '', body: '', tags: '' });

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse notes from localStorage', e);
        setNotes(SEED_NOTES);
      }
    } else {
      setNotes(SEED_NOTES);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isLoaded]);

  // --- Derived State ---
  const allTagsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notes.forEach((note) => {
      note.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        const matchesTag = !selectedTag || note.tags.includes(selectedTag);
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          note.title.toLowerCase().includes(searchLower) ||
          note.body.toLowerCase().includes(searchLower) ||
          note.tags.some((t) => t.toLowerCase().includes(searchLower));
        return matchesTag && matchesSearch;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, selectedTag, searchQuery]);

  // --- Handlers ---
  const handleOpenModal = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        body: note.body,
        tags: note.tags.join(', '),
      });
    } else {
      setEditingNote(null);
      setFormData({ title: '', body: '', tags: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '');

    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                title: formData.title,
                body: formData.body,
                tags: tagArray,
                updatedAt: new Date().toISOString(),
              }
            : n
        )
      );
    } else {
      const newNote: Note = {
        id: Date.now(),
        title: formData.title,
        body: formData.body,
        tags: tagArray,
        updatedAt: new Date().toISOString(),
      };
      setNotes((prev) => [newNote, ...prev]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('정말 이 메모를 삭제하시겠습니까?')) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  if (!isLoaded) return null;

  return (
    <div id="app-root" className="flex h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-100">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Edit3 size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">MyMemo</h1>
        </div>

        <div className="flex flex-1 max-w-md px-8">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-full border-none bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-600 transition-all focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="제목, 내용, 태그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">새 메모</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
          <nav className="space-y-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-all ${
                selectedTag === null 
                  ? 'bg-blue-50 font-semibold text-blue-600' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>전체 메모</span>
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${selectedTag === null ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                {notes.length}
              </span>
            </button>
          </nav>

          <div className="mt-8">
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">태그 목록</h3>
            <div className="space-y-1">
              {Object.entries(allTagsWithCounts).map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-all ${
                    selectedTag === tag 
                      ? 'bg-blue-50 font-semibold text-blue-600' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">#{tag}</span>
                  <span className="text-xs text-slate-400">{count}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="flex-1 overflow-y-auto p-8">
          {filteredNotes.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleOpenModal(note)}
                    className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 card-shadow transition-shadow hover:shadow-md"
                  >
                    <div className="absolute top-3 right-3 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => handleDelete(note.id, e)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <h3 className="mb-2 truncate pr-6 font-bold text-slate-800">
                      {note.title || '제목 없음'}
                    </h3>
                    
                    <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-slate-500 whitespace-pre-wrap">
                      {note.body}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 text-[10px] text-slate-400">
                      수정일: {new Date(note.updatedAt).toLocaleDateString().replace(/\. /g, '.')}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">검색 결과가 없습니다</h3>
              <p className="mt-2 text-slate-500">다른 키워드를 입력하거나 태그를 변경해 보세요.</p>
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
            >
              <form onSubmit={handleSave}>
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingNote ? '메모 수정' : '새 메모 작성'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 p-6">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">제목</label>
                    <input
                      required
                      type="text"
                      placeholder="메모의 제목을 입력하세요"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">본문</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="생각을 기록해 보세요..."
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400">태그</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <TagIcon size={14} className="text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="쉼표(,)로 구분 (예: 디자인, 개발)"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-600 transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:scale-95"
                  >
                    {editingNote ? '저장하기' : '작성 완료'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
