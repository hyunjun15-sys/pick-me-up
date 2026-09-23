'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Plus, Sparkles, ThumbsUp, Check, Undo2, ArrowLeft, Trash2, FolderPlus, Lock, Unlock, Search, AlertCircle, Flag, Zap } from 'lucide-react';

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

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeTab, setActiveTab] = useState<'vote' | 'leaderboard'>('vote');

  // 관리자 모드 및 전체 결과보기용 상태
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminSelectedTopicId, setAdminSelectedTopicId] = useState<string>('');
  const [adminOverviewIdeas, setAdminOverviewIdeas] = useState<Idea[]>([]);
  const [isMainOverviewActive, setIsMainOverviewActive] = useState(false);

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

  // 2. 선택된 주제의 아이디어 로드 & 아이디어 Realtime 구독 (투표 페이지용)
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

  // 3. 메인 화면 관리자 대시보드용 아이디어 로드
  useEffect(() => {
    if (!adminSelectedTopicId || !isAdminLoggedIn) return;

    fetchAdminOverviewIdeas(adminSelectedTopicId);

    const adminIdeaChannel = supabase
      .channel(`realtime_admin_ideas_${adminSelectedTopicId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ideas', filter: `topic_id=eq.${adminSelectedTopicId}` },
        () => fetchAdminOverviewIdeas(adminSelectedTopicId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(adminIdeaChannel);
    };
  }, [adminSelectedTopicId, isAdminLoggedIn]);

  // 관리자 로그인 시 첫 번째 주제를 자동 선택
  useEffect(() => {
    if (isAdminLoggedIn && topics.length > 0 && !adminSelectedTopicId) {
      setAdminSelectedTopicId(topics[0].id);
    }
  }, [isAdminLoggedIn, topics, adminSelectedTopicId]);

  const fetchTopics = async () => {
    const { data } = await supabase.from('topics').select('*').order('created_at', { ascending: false });
    if (data) {
      setTopics(data);
      if (data.length > 0 && !adminSelectedTopicId) {
        setAdminSelectedTopicId(data[0].id);
      }
    }
  };

  const fetchIdeas = async (topicId: string) => {
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('topic_id', topicId)
      .order('votes_count', { ascending: false });
    if (data) setIdeas(data);
  };

  const fetchAdminOverviewIdeas = async (topicId: string) => {
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('topic_id', topicId)
      .order('votes_count', { ascending: false });
    if (data) setAdminOverviewIdeas(data);
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

  // 레이스 트랙 컴포넌트
  const RaceTrackView = ({ ideaList }: { ideaList: Idea[] }) => {
    const totalVotes = ideaList.reduce((sum, item) => sum + item.votes_count, 0);
    const maxVotes = Math.max(...ideaList.map((i) => i.votes_count), 1);

    return (
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        {/* 트랙 헤더 */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏎️</span>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight text-yellow-400">라이브 레이싱 트랙</h3>
              <p className="text-xs text-slate-400">실시간 득표율에 따라 전진합니다!</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400">총 투표 수</span>
            <div className="text-xl font-black text-blue-400">{totalVotes} 표</div>
          </div>
        </div>

        {ideaList.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">등록된 아이디어가 없습니다.</div>
        ) : (
          <div className="space-y-6 relative py-2">
            {/* 결승선 (Finish Line) */}
            <div className="absolute right-12 top-0 bottom-0 w-8 flex flex-col justify-between opacity-30 pointer-events-none z-0">
              <div className="h-full w-2 bg-gradient-to-b from-red-500 via-white to-red-500 border-r border-dashed border-white"></div>
            </div>

            {ideaList.map((idea, index) => {
              const progress = maxVotes > 0 ? (idea.votes_count / maxVotes) * 100 : 0;
              const isFirst = index === 0 && idea.votes_count > 0;

              return (
                <div key={idea.id} className="relative z-10">
                  {/* 정보 라인 */}
                  <div className="flex justify-between items-center text-xs mb-1.5 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-black w-5 text-center ${index === 0 ? 'text-amber-400 text-sm' : 'text-slate-500'}`}>
                        {index + 1}위
                      </span>
                      <span className="font-bold text-slate-200">{idea.title}</span>
                      <span className="text-[10px] text-slate-500">By {idea.author}</span>
                    </div>
                    <div className="font-black text-amber-400 text-sm flex items-center gap-1">
                      {idea.votes_count} <span className="text-[10px] text-slate-400 font-normal">표</span>
                    </div>
                  </div>

                  {/* 트랙 아스팔트 */}
                  <div className="relative h-12 bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center px-3 shadow-inner">
                    {/* 도로 차선 이펙트 */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] border-b border-dashed border-slate-800 w-full" />

                    {/* 자동차/게이지 모션 영역 */}
                    <motion.div
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-4"
                      initial={{ left: '0%' }}
                      animate={{ left: `calc(${Math.min(progress, 88)}% - 10px)` }}
                      transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                    >
                      {/* 차 뒤 부스터 연기/불꽃 이펙트 */}
                      {idea.votes_count > 0 && (
                        <div className="flex items-center -mr-1">
                          {isFirst && <Zap size={14} className="text-yellow-400 animate-pulse fill-yellow-400" />}
                          <div className="w-6 h-2 bg-gradient-to-r from-transparent via-amber-500 to-rose-500 rounded-full blur-[2px] opacity-80" />
                        </div>
                      )}

                      {/* 자동차 캐릭터 */}
                      <div className="relative group">
                        {isFirst && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs animate-bounce">
                            👑
                          </span>
                        )}
                        <div className={`p-1.5 rounded-xl border shadow-lg text-lg flex items-center justify-center ${
                          isFirst 
                            ? 'bg-amber-400/20 border-amber-400/60 shadow-amber-500/20' 
                            : 'bg-slate-800 border-slate-700'
                        }`}>
                          🏎️
                        </div>

                        {/* Hover 시 설명 툴팁 */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-slate-200 text-[10px] p-2 rounded-lg whitespace-nowrap z-30 shadow-xl border border-slate-700">
                          {idea.description}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
        <div>
          {/* 관리자 모드일 때 메인 페이지에 '전체 투표 결과 컨트롤러' 노출 */}
          {isAdminLoggedIn && (
            <div className="mb-8 bg-white p-5 rounded-3xl border border-blue-200 shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="text-amber-500" size={20} />
                  <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    관리자 대시보드 : 모든 투표 결과 조망
                  </h2>
                </div>
                {/* 투표 주제 선택 셀렉트 박스 */}
                <select
                  value={adminSelectedTopicId}
                  onChange={(e) => setAdminSelectedTopicId(e.target.value)}
                  className="bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold px-3 py-2 outline-none focus:border-blue-500 text-slate-800 max-w-xs"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 선택된 주제의 레이스 트랙 관전 */}
              <RaceTrackView ideaList={adminOverviewIdeas} />
            </div>
          )}

          {/* 일반 투표 주제 카드 리스트 */}
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
        </div>
      ) : (
        /* 개별 투표 상세 페이지 */
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

            {/* 관리자로 로그인했을 때만 '실시간 결과' 탭 노출 */}
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
                <Trophy size={15} className="text-amber-500" /> 실시간 트랙 보기
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

          {/* 투표 상세 페이지 내부의 레이스 트랙 */}
          {activeTab === 'leaderboard' && isAdminLoggedIn && (
            <RaceTrackView ideaList={ideas} />
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