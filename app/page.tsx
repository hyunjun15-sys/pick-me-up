'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Plus, Sparkles, ThumbsUp, Check, Undo2, ArrowLeft, Trash2, FolderPlus, Lock, Unlock, Search, AlertCircle, Volume2, VolumeX } from 'lucide-react';

const ADMIN_PASSWORD = '5007';

// 캐릭터 이모지 리스트
const CHARACTER_LIST = ['🐶', '🐱', '🦊', '🐻', '🐼', '🦁', '🐯', '🐰', '🐸', '🦄', '🤖', '👾', '🚀', '🐙'];

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

  // SFX 효과음 설정 (Web Audio API)
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
      // AudioContext 미지원 및 브라우저 오디오 제한 예외 처리
    }
  };

  // 1. 초기 주제 목록 로드 & 주제 Realtime 구독
  useEffect(() => {
    setIsMounted(true);
    fetchTopics();

    const topicChannel = supabase
      .channel('realtime_topics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'topics' },
        () => fetchTopics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(topicChannel);
    };
  }, []);

  // 2. 선택된 주제의 아이디어 로드 & 아이디어 Realtime 구독
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

  // 관리자 로그아웃 시 결과 탭에 있었다면 투표하기 탭으로 강제 이동
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
  const maxVotes = Math.max(...ideas.map((i) => i.votes_count), 1);

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

            {/* 관리자로 로그인했을 때만 '투표 결과' 탭 노출 */}
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

          {/* 투표 결과 보기 (캐릭터 크기 커지는 캐릭터 아레나 뷰) */}
          {activeTab === 'leaderboard' && isAdminLoggedIn && (
            <div className="w-full bg-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">벌크업 캐릭터 아레나</h3>
                    <p className="text-[11px] text-slate-400">득표수가 늘어날수록 캐릭터가 커지고 앞으로 다가옵니다.</p>
                  </div>
                </div>

                {/* 사운드 토글 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title={isMuted ? '음소거 해제' : '음소거'}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>

              {/* 캐릭터들이 배치되는 스티디움 스테이지 */}
              <div className="min-h-[380px] bg-slate-950/60 rounded-2xl border border-slate-800/80 p-8 flex items-end justify-center gap-6 sm:gap-10 flex-wrap relative overflow-hidden">
                {/* 배경 장식 패턴 */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

                <AnimatePresence>
                  {ideas.map((idea, index) => {
                    const voteRatio = totalVotes > 0 ? idea.votes_count / totalVotes : 0;
                    const isLeader = idea.votes_count === maxVotes && idea.votes_count > 0;

                    // 스케일 계산: 기본 1.0배 ~ 최대 2.5배
                    const scale = 1 + voteRatio * 1.5;

                    // 캐릭터 고유 아이콘 할당
                    const character = CHARACTER_LIST[index % CHARACTER_LIST.length];

                    return (
                      <motion.div
                        key={idea.id}
                        layout
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="relative flex flex-col items-center group cursor-pointer my-4"
                        style={{ zIndex: Math.round(scale * 20) }} // 득표 높은 캐릭터가 상단 레이어로 이동
                      >
                        {/* 1위 선두 왕관 모션 이펙트 */}
                        {isLeader && (
                          <motion.div
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: [0, -8, 0], opacity: 1 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            className="absolute -top-9 flex flex-col items-center"
                          >
                            <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">👑</span>
                          </motion.div>
                        )}

                        {/* 득표수 뱃지 */}
                        <motion.div
                          className={`mb-2 px-3 py-1 rounded-full text-xs font-black shadow-lg backdrop-blur-md border whitespace-nowrap flex items-center gap-1 ${
                            isLeader
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-800/90 text-slate-200 border-slate-700'
                          }`}
                          animate={isLeader ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                          transition={{ repeat: isLeader ? Infinity : 0, duration: 1.8 }}
                        >
                          <span>{idea.votes_count}표</span>
                          <span className="opacity-60 text-[10px]">({Math.round(voteRatio * 100)}%)</span>
                        </motion.div>

                        {/* 캐릭터 이모지 (크기 변경 및 바운스 모션) */}
                        <motion.div
                          className="text-5xl sm:text-6xl select-none filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                          animate={{
                            scale: scale,
                            rotate: isLeader ? [0, -6, 6, -6, 0] : 0,
                            y: isLeader ? [0, -4, 0] : 0,
                          }}
                          whileHover={{ scale: scale * 1.15 }}
                          whileTap={{ scale: scale * 0.9 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 18,
                            rotate: { repeat: isLeader ? Infinity : 0, duration: 2 },
                            y: { repeat: isLeader ? Infinity : 0, duration: 1.5 }
                          }}
                        >
                          {character}
                        </motion.div>

                        {/* 아이디어 제목 표기 */}
                        <div className="mt-3 text-center">
                          <p className="text-xs font-bold text-slate-200 max-w-[100px] truncate group-hover:text-white transition">
                            {idea.title}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate max-w-[90px]">
                            {idea.author}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
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