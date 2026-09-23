'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Plus, Sparkles, ThumbsUp, Check, Undo2, ArrowLeft, Trash2, FolderPlus, Lock, Unlock, Search, AlertCircle, Volume2, VolumeX } from 'lucide-react';

const ADMIN_PASSWORD = '5007';

interface Topic {
  id: string;
  title: string;
  description: string;
  created_at?: string;
}

interface Idea {
  id: string;
  topic_id: string;
  title: string;
  description: string;
  author: string;
  votes_count: number;
}

// 3D 스타일 고퀄리티 귀여운 캐릭터 SVG 리스트
const CuteFullBodyCharacters = [
  // 1. 귀여운 노란 병아리
  ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 120" className={className}>
      <ellipse cx="50" cy="112" rx="30" ry="6" fill="#000000" opacity="0.15" />
      {/* 발 */}
      <path d="M 38 95 L 32 108 M 38 95 L 38 109 M 38 95 L 44 108" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
      <path d="M 62 95 L 56 108 M 62 95 L 62 109 M 62 95 L 68 108" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
      {/* 날개 */}
      <ellipse cx="22" cy="65" rx="8" ry="14" fill="#facc15" transform="rotate(20 22 65)" />
      <ellipse cx="78" cy="65" rx="8" ry="14" fill="#facc15" transform="rotate(-20 78 65)" />
      {/* 몸통 */}
      <ellipse cx="50" cy="65" rx="32" ry="34" fill="url(#chickGrad)" />
      {/* 벼슬/머리털 */}
      <path d="M 46 32 C 44 20 50 18 50 25 C 50 16 58 20 54 32 Z" fill="#ef4444" />
      {/* 눈 & 볼터치 */}
      <circle cx="38" cy="55" r="4.5" fill="#1e293b" />
      <circle cx="62" cy="55" r="4.5" fill="#1e293b" />
      <circle cx="39.5" cy="53.5" r="1.5" fill="#ffffff" />
      <circle cx="63.5" cy="53.5" r="1.5" fill="#ffffff" />
      <ellipse cx="32" cy="62" rx="5" ry="3" fill="#f43f5e" opacity="0.4" />
      <ellipse cx="68" cy="62" rx="5" ry="3" fill="#f43f5e" opacity="0.4" />
      {/* 부리 */}
      <path d="M 45 59 Q 50 56 55 59 Q 50 67 45 59 Z" fill="#fb923c" />
      <defs>
        <radialGradient id="chickGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#eab308" />
        </radialGradient>
      </defs>
    </svg>
  ),
  // 2. 오동통 분홍 햄스터
  ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 120" className={className}>
      <ellipse cx="50" cy="112" rx="30" ry="6" fill="#000000" opacity="0.15" />
      {/* 귀 */}
      <circle cx="28" cy="32" r="10" fill="#f472b6" />
      <circle cx="28" cy="32" r="6" fill="#fbcfe8" />
      <circle cx="72" cy="32" r="10" fill="#f472b6" />
      <circle cx="72" cy="32" r="6" fill="#fbcfe8" />
      {/* 몸통 */}
      <ellipse cx="50" cy="70" rx="34" ry="32" fill="url(#hamGrad)" />
      <ellipse cx="50" cy="74" rx="22" ry="20" fill="#ffffff" />
      {/* 손 & 발 */}
      <circle cx="34" cy="78" r="5" fill="#fbcfe8" />
      <circle cx="66" cy="78" r="5" fill="#fbcfe8" />
      <ellipse cx="36" cy="102" rx="7" ry="4" fill="#f472b6" />
      <ellipse cx="64" cy="102" rx="7" ry="4" fill="#f472b6" />
      {/* 눈 & 코 */}
      <circle cx="38" cy="54" r="4.5" fill="#1e293b" />
      <circle cx="62" cy="54" r="4.5" fill="#1e293b" />
      <circle cx="39.5" cy="52.5" r="1.5" fill="#ffffff" />
      <circle cx="63.5" cy="52.5" r="1.5" fill="#ffffff" />
      <ellipse cx="50" cy="58" rx="3" ry="2" fill="#be185d" />
      <ellipse cx="31" cy="60" rx="6" ry="4" fill="#f43f5e" opacity="0.45" />
      <ellipse cx="69" cy="60" rx="6" ry="4" fill="#f43f5e" opacity="0.45" />
      {/* 해바라기 씨앗 */}
      <path d="M 50 72 Q 54 66 50 62 Q 46 66 50 72 Z" fill="#475569" stroke="#1e293b" strokeWidth="1" />
      <defs>
        <radialGradient id="hamGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#f472b6" />
        </radialGradient>
      </defs>
    </svg>
  ),
  // 3. 포근한 하늘색 토끼
  ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 120" className={className}>
      <ellipse cx="50" cy="112" rx="28" ry="6" fill="#000000" opacity="0.15" />
      {/* 토끼 귀 */}
      <rect x="30" y="8" width="12" height="42" rx="6" fill="url(#bunnyGrad)" />
      <rect x="33" y="14" width="6" height="30" rx="3" fill="#e0f2fe" />
      <rect x="58" y="8" width="12" height="42" rx="6" fill="url(#bunnyGrad)" />
      <rect x="61" y="14" width="6" height="30" rx="3" fill="#e0f2fe" />
      {/* 몸통 */}
      <ellipse cx="50" cy="72" rx="30" ry="32" fill="url(#bunnyGrad)" />
      <ellipse cx="50" cy="76" rx="18" ry="18" fill="#ffffff" />
      {/* 발 */}
      <ellipse cx="34" cy="102" rx="8" ry="5" fill="#38bdf8" />
      <ellipse cx="66" cy="102" rx="8" ry="5" fill="#38bdf8" />
      {/* 얼굴 */}
      <circle cx="38" cy="56" r="4.5" fill="#1e293b" />
      <circle cx="62" cy="56" r="4.5" fill="#1e293b" />
      <circle cx="39.5" cy="54.5" r="1.5" fill="#ffffff" />
      <circle cx="63.5" cy="54.5" r="1.5" fill="#ffffff" />
      <polygon points="50,61 47,58 53,58" fill="#0284c7" />
      <ellipse cx="30" cy="62" rx="5" ry="3" fill="#fb7185" opacity="0.5" />
      <ellipse cx="70" cy="62" rx="5" ry="3" fill="#fb7185" opacity="0.5" />
      <defs>
        <radialGradient id="bunnyGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#38bdf8" />
        </radialGradient>
      </defs>
    </svg>
  ),
  // 4. 귀여운 아기 곰
  ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 120" className={className}>
      <ellipse cx="50" cy="112" rx="30" ry="6" fill="#000000" opacity="0.15" />
      {/* 귀 */}
      <circle cx="26" cy="34" r="11" fill="#b45309" />
      <circle cx="26" cy="34" r="6" fill="#fde68a" />
      <circle cx="74" cy="34" r="11" fill="#b45309" />
      <circle cx="74" cy="34" r="6" fill="#fde68a" />
      {/* 몸통 */}
      <ellipse cx="50" cy="70" rx="33" ry="32" fill="url(#bearGrad)" />
      <ellipse cx="50" cy="74" rx="20" ry="18" fill="#fde68a" />
      {/* 발 */}
      <ellipse cx="34" cy="101" rx="8" ry="5" fill="#78350f" />
      <ellipse cx="66" cy="101" rx="8" ry="5" fill="#78350f" />
      {/* 주둥이 & 눈 */}
      <ellipse cx="50" cy="60" rx="11" ry="8" fill="#fde68a" />
      <ellipse cx="50" cy="56" rx="4" ry="3" fill="#1e293b" />
      <circle cx="36" cy="50" r="4" fill="#1e293b" />
      <circle cx="64" cy="50" r="4" fill="#1e293b" />
      <circle cx="37" cy="49" r="1.2" fill="#ffffff" />
      <circle cx="65" cy="49" r="1.2" fill="#ffffff" />
      <ellipse cx="30" cy="57" rx="5" ry="3" fill="#f43f5e" opacity="0.4" />
      <ellipse cx="70" cy="57" rx="5" ry="3" fill="#f43f5e" opacity="0.4" />
      <defs>
        <radialGradient id="bearGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
      </defs>
    </svg>
  )
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTab, setActiveTab] = useState<'vote' | 'leaderboard'>('vote');

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');

  const [votedIdeaId, setVotedIdeaId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const playPopSound = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // 오디오 예외 처리
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchTopics();

    const topicChannel = supabase
      .channel('realtime_topics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, () => fetchTopics())
      .subscribe();

    return () => {
      supabase.removeChannel(topicChannel);
    };
  }, []);

  useEffect(() => {
    if (!selectedTopic || !isMounted) return;

    const savedVote = localStorage.getItem(`pickmeup_voted_${selectedTopic.id}`);
    setVotedIdeaId(savedVote);

    fetchIdeas(selectedTopic.id);

    const ideaChannel = supabase
      .channel(`realtime_ideas_${selectedTopic.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ideas', filter: `topic_id=eq.${selectedTopic.id}` },
        () => fetchIdeas(selectedTopic.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ideaChannel);
    };
  }, [selectedTopic, isMounted]);

  useEffect(() => {
    if (!isAdminLoggedIn && activeTab === 'leaderboard') {
      setActiveTab('vote');
    }
  }, [isAdminLoggedIn, activeTab]);

  const fetchTopics = async () => {
    const { data } = await supabase.from('topics').select('*').order('created_at', { ascending: false });
    if (data) setTopics(data);
  };

  const fetchIdeas = async (topicId: string) => {
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('topic_id', topicId)
      .order('votes_count', { ascending: false });
    if (data) setIdeas(data);
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      setIsAdminAuthModalOpen(false);
      setAdminPasswordInput('');
      setAdminError('');
    } else {
      setAdminError('비밀번호가 올바르지 않습니다.');
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) {
      setAlertMessage('투표 주제 제목을 입력해주세요.');
      return;
    }

    const { error } = await supabase
      .from('topics')
      .insert([{ title: newTopicTitle.trim(), description: newTopicDesc.trim() }]);

    if (error) {
      setAlertMessage(`오류가 발생했습니다: ${error.message}`);
      return;
    }

    fetchTopics();
    setNewTopicTitle('');
    setNewTopicDesc('');
    setIsTopicModalOpen(false);
  };

  const handleDeleteTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetId) return;

    await supabase.from('ideas').delete().eq('topic_id', deleteTargetId);
    await supabase.from('topics').delete().eq('id', deleteTargetId);
    setTopics((prev) => prev.filter((t) => t.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  const handleVote = async (id: string, currentVotes: number) => {
    if (!selectedTopic) return;
    if (votedIdeaId) {
      setAlertMessage('이미 투표하셨습니다. 다른 항목에 투표하시려면 기존 투표를 취소해 주세요.');
      return;
    }

    playPopSound();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });

    await supabase.from('ideas').update({ votes_count: currentVotes + 1 }).eq('id', id);
    setVotedIdeaId(id);
    localStorage.setItem(`pickmeup_voted_${selectedTopic.id}`, id);
  };

  const handleCancelVote = async (id: string, currentVotes: number) => {
    if (!selectedTopic || currentVotes <= 0) return;

    await supabase.from('ideas').update({ votes_count: Math.max(0, currentVotes - 1) }).eq('id', id);
    setVotedIdeaId(null);
    localStorage.removeItem(`pickmeup_voted_${selectedTopic.id}`);
  };

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !newTitle.trim() || !newDesc.trim() || !newAuthor.trim()) {
      setAlertMessage('모든 항목을 입력해 주세요.');
      return;
    }

    await supabase.from('ideas').insert([
      { topic_id: selectedTopic.id, title: newTitle.trim(), description: newDesc.trim(), author: newAuthor.trim(), votes_count: 0 }
    ]);

    setNewTitle('');
    setNewDesc('');
    setNewAuthor('');
    setIsIdeaModalOpen(false);
  };

  if (!isMounted) return null;

  const query = searchQuery.toLowerCase().trim();
  const filteredTopics = topics.filter(
    (t) => t.title.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query)
  );

  const filteredIdeas = ideas.filter(
    (i) =>
      i.title.toLowerCase().includes(query) ||
      i.description?.toLowerCase().includes(query) ||
      i.author?.toLowerCase().includes(query)
  );

  const totalVotes = ideas.reduce((sum, item) => sum + item.votes_count, 0);

  // 1등 아이디어 및 서브 항목 분리
  const leaderIdea = ideas.length > 0 ? ideas[0] : null;
  const otherIdeas = ideas.slice(1);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 p-6 max-w-5xl mx-auto notranslate">
      {/* 헤더 */}
      <header className="mb-8 pt-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            {selectedTopic && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTopic(null);
                  setSearchQuery('');
                  setActiveTab('vote');
                }}
                className="p-1.5 hover:bg-slate-200/60 rounded-xl text-slate-500 transition mb-0.5"
                title="목록으로 돌아가기"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
                <Sparkles size={22} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">픽미업</h1>

              {isAdminLoggedIn ? (
                <button
                  type="button"
                  onClick={() => setIsAdminLoggedIn(false)}
                  className="ml-2 p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  title="관리자 로그아웃"
                >
                  <Unlock size={14} /> 관리자
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAdminPasswordInput('');
                    setAdminError('');
                    setIsAdminAuthModalOpen(true);
                  }}
                  className="ml-1 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
                  title="관리자 로그인"
                >
                  <Lock size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="relative flex-1 max-w-xs mx-2">
            <input
              type="search"
              placeholder={selectedTopic ? '아이디어 검색...' : '투표 주제 검색...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition shadow-sm"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          {!selectedTopic && isAdminLoggedIn && (
            <button
              type="button"
              onClick={() => setIsTopicModalOpen(true)}
              className="bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition shrink-0"
            >
              <FolderPlus size={14} /> 새로운 투표 만들기
            </button>
          )}
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      {!selectedTopic ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => {
                setSelectedTopic(topic);
                setSearchQuery('');
              }}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-500/80 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {topic.title}
                  </h3>
                  {isAdminLoggedIn && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetId(topic.id);
                      }}
                      className="text-slate-300 hover:text-rose-500 p-1 transition"
                      title="주제 삭제"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                  {topic.description || '진행중인 공모 및 투표입니다.'}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  입장하기 &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedTopic.title}</h2>
            {selectedTopic.description && (
              <p className="text-slate-500 text-xs mb-4">{selectedTopic.description}</p>
            )}

            <button
              type="button"
              onClick={() => setIsIdeaModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition"
            >
              <Plus size={15} /> 아이디어 제안하기
            </button>
          </div>

          <div className="flex gap-6 mb-6 border-b border-slate-200/80 pb-1 px-1">
            <button
              type="button"
              onClick={() => setActiveTab('vote')}
              className={`text-sm font-bold pb-2.5 border-b-2 transition ${
                activeTab === 'vote'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              투표하기
            </button>

            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={() => setActiveTab('leaderboard')}
                className={`text-sm font-bold pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'leaderboard'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Trophy size={15} className="text-amber-500" /> 투표 결과
              </button>
            )}
          </div>

          {activeTab === 'vote' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIdeas.map((idea) => {
                const isMyVote = votedIdeaId === idea.id;
                const hasVotedOther = votedIdeaId !== null && !isMyVote;

                return (
                  <div
                    key={idea.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                      isMyVote
                        ? 'bg-blue-50/50 border-blue-400 shadow-sm ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200/80 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="text-base font-bold text-slate-900 line-clamp-1">{idea.title}</h3>
                        {isMyVote && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                            <Check size={10} /> 선택함
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-xs mb-3 leading-relaxed line-clamp-2">{idea.description}</p>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        By {idea.author}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                      <span className="text-sm font-extrabold text-blue-600">{idea.votes_count} 표</span>

                      {isMyVote ? (
                        <button
                          type="button"
                          onClick={() => handleCancelVote(idea.id, idea.votes_count)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition text-xs"
                        >
                          <Undo2 size={13} /> 취소
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVote(idea.id, idea.votes_count)}
                          disabled={hasVotedOther}
                          className={`px-3 py-1.5 rounded-lg font-semibold border flex items-center gap-1 transition text-xs ${
                            hasVotedOther
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                          }`}
                        >
                          <ThumbsUp size={13} /> 투표
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 투표 결과 보기 (넓은 강강술래 원형 애니메이션 뷰) */}
          {activeTab === 'leaderboard' && isAdminLoggedIn && (
            <div className="w-full rounded-3xl shadow-2xl relative overflow-hidden border border-emerald-200/80 bg-gradient-to-b from-sky-300 via-sky-100 to-emerald-100 p-6">
              {/* 장식용 구름 및 햇살 배경 */}
              <div className="absolute top-4 left-8 text-white/80 text-4xl select-none animate-pulse">☁️</div>
              <div className="absolute top-8 right-16 text-white/70 text-5xl select-none">☁️</div>
              <div className="absolute top-3 right-1/3 text-amber-300 text-3xl select-none animate-spin" style={{ animationDuration: '20s' }}>☀️</div>

              {/* 푸른 언덕 곡선 바닥 */}
              <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-emerald-500 via-emerald-400 to-emerald-300 rounded-t-[50%] scale-x-125 border-t-4 border-emerald-300/50 shadow-inner" />

              {/* 우측 상단 음소거 버튼 */}
              <div className="absolute top-4 right-4 z-30">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 shadow-sm transition backdrop-blur-sm"
                  title={isMuted ? '음소거 해제' : '음소거'}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>

              {/* 메인 강강술래 애니메이션 무대 (넓은 여유 공간) */}
              <div className="relative z-20 h-[500px] w-full flex items-center justify-center overflow-hidden">
                <AnimatePresence>
                  {ideas.length > 0 && (
                    <>
                      {/* 1등 캐릭터 (중앙 정가운데 위치, 적절한 사이즈) */}
                      {leaderIdea && (() => {
                        const LeaderSVG = CuteFullBodyCharacters[0];
                        const leaderRatio = totalVotes > 0 ? leaderIdea.votes_count / totalVotes : 0;

                        return (
                          <div className="absolute z-20 flex flex-col items-center justify-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            {/* 1위 뱃지 */}
                            <motion.div
                              animate={{ y: [0, -4, 0] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="mb-1.5 px-3 py-0.5 bg-amber-400/95 text-slate-900 border-2 border-amber-200 rounded-full text-[11px] font-black shadow-lg flex items-center gap-1 whitespace-nowrap backdrop-blur-sm"
                            >
                              <span>👑 1위</span>
                              <span className="text-amber-950">{leaderIdea.votes_count}표</span>
                              <span className="text-[9px] opacity-80">({Math.round(leaderRatio * 100)}%)</span>
                            </motion.div>

                            {/* 1등 캐릭터 본체 */}
                            <motion.div
                              animate={{
                                y: [0, -8, 0],
                                rotate: [-2, 2, -2],
                              }}
                              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                              className="w-24 h-24 flex items-center justify-center filter drop-shadow-xl"
                            >
                              <LeaderSVG className="w-full h-full" />
                            </motion.div>

                            {/* 이름 및 작가 */}
                            <div className="mt-1 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-lg shadow-md border border-emerald-100 text-center max-w-[120px]">
                              <p className="text-[11px] font-black text-slate-800 truncate">{leaderIdea.title}</p>
                              <p className="text-[9px] text-slate-500 truncate">{leaderIdea.author}</p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2등 이하 캐릭터들 (넓은 강강술래 회전 오비탈) */}
                      {otherIdeas.map((idea, idx) => {
                        const totalOthers = otherIdeas.length;
                        const rank = idx + 2;
                        const voteRatio = totalVotes > 0 ? idea.votes_count / totalVotes : 0;
                        const SVGComponent = CuteFullBodyCharacters[(idx + 1) % CuteFullBodyCharacters.length];

                        // 균등한 원형 각도 배치
                        const baseAngle = (idx / Math.max(totalOthers, 1)) * 360;

                        return (
                          <motion.div
                            key={idea.id}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            animate={{ rotate: [baseAngle, baseAngle + 360] }}
                            transition={{
                              repeat: Infinity,
                              duration: 18,
                              ease: 'linear',
                            }}
                            style={{
                              width: '520px', // 넓은 가로 반경으로 1등 캐릭터와 여유 공간 확보
                              height: '260px', // 넓은 세로 반경
                            }}
                          >
                            {/* 캐릭터 역회전 (정면 유지) */}
                            <motion.div
                              className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto"
                              animate={{ rotate: [-baseAngle, -baseAngle - 360] }}
                              transition={{
                                repeat: Infinity,
                                duration: 18,
                                ease: 'linear',
                              }}
                            >
                              {/* 득표 정보 뱃지 */}
                              <div className="mb-1 px-2 py-0.5 bg-white/90 text-slate-800 border border-emerald-200 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1 whitespace-nowrap">
                                <span className="text-slate-500 font-extrabold">{rank}위</span>
                                <span className="text-blue-600 font-black">{idea.votes_count}표</span>
                                <span className="text-[8px] text-slate-400">({Math.round(voteRatio * 100)}%)</span>
                              </div>

                              {/* 캐릭터 모션 */}
                              <motion.div
                                animate={{ y: [0, -6, 0] }}
                                transition={{ repeat: Infinity, duration: 1.2 + idx * 0.2, ease: 'easeInOut' }}
                                className="w-18 h-18 filter drop-shadow-md"
                              >
                                <SVGComponent className="w-full h-full" />
                              </motion.div>

                              {/* 아이디어 이름 */}
                              <div className="bg-white/85 backdrop-blur-sm px-2 py-0.5 rounded-lg shadow-sm border border-emerald-100/80 text-center max-w-[90px]">
                                <p className="text-[10px] font-bold text-slate-800 truncate">{idea.title}</p>
                              </div>
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* 언덕 위 꽃 장식 */}
              <div className="absolute bottom-3 left-10 text-xl z-20 select-none animate-bounce" style={{ animationDuration: '3s' }}>🌷</div>
              <div className="absolute bottom-5 left-1/4 text-2xl z-20 select-none">🌼</div>
              <div className="absolute bottom-3 right-1/4 text-2xl z-20 select-none">🌻</div>
              <div className="absolute bottom-4 right-8 text-xl z-20 select-none animate-bounce" style={{ animationDuration: '2.5s' }}>🌸</div>
            </div>
          )}
        </div>
      )}

      {/* 모달: 커스텀 알림 */}
      {alertMessage && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-600 font-bold mb-2 text-sm">
              <AlertCircle size={18} /> 알림
            </div>
            <p className="text-xs text-slate-700 leading-relaxed mb-4">{alertMessage}</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAlertMessage(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-medium text-xs transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 관리자 로그인 */}
      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl">
            <h2 className="text-base font-bold mb-3 text-slate-900 flex items-center gap-1.5">
              <Lock size={18} className="text-blue-600" /> 관리자 로그인
            </h2>
            <form onSubmit={handleAdminAuth} className="space-y-3 text-xs">
              <div>
                <input
                  type="password"
                  placeholder="비밀번호 입력"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:border-blue-500"
                />
                {adminError && <p className="text-rose-500 text-[11px] mt-1 font-medium">{adminError}</p>}
              </div>
              <div className="flex justify-end gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition"
                >
                  로그인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 모달: 새로운 투표 만들기 */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl">
            <h2 className="text-base font-bold mb-3 text-slate-900 flex items-center gap-1.5">
              <FolderPlus size={18} className="text-blue-600" /> 새로운 투표 만들기
            </h2>
            <form onSubmit={handleAddTopic} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="주제 제목"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="주제 설명 (선택사항)"
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:border-blue-500 h-20 resize-none"
              />
              <div className="flex justify-end gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-medium shadow-sm transition"
                >
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 모달: 주제 삭제 확인 */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl">
            <h2 className="text-base font-bold mb-2 text-slate-900 flex items-center gap-1.5">
              <Trash2 size={18} className="text-rose-600" /> 투표 삭제
            </h2>
            <p className="text-xs text-slate-500 mb-4">해당 항목과 포함된 모든 제안이 삭제됩니다. 계속하시겠습니까?</p>
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition text-xs"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteTopic}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium shadow-sm transition text-xs"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 아이디어 제안 */}
      {isIdeaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl">
            <h2 className="text-base font-bold mb-3 text-slate-900">새 아이디어 제안</h2>
            <form onSubmit={handleSubmitIdea} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="제목"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="상세 설명"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:border-blue-500 h-20 resize-none"
              />
              <input
                type="text"
                placeholder="작성자 이름"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 text-slate-800 border border-slate-200 focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsIdeaModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}