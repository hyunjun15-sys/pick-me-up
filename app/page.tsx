요청하신 회전 각도 및 이동 방향에 맞춘 **방향성(각도별 앞모습, 옆모습, 뒷모습) 다중 뷰 캐릭터 SVG 시스템**을 적용한 전체 `page.tsx` 소스코드입니다.

원형 3D 트랙을 시계 방향으로 돌 때 위치(각도)에 따라 캐릭터가 자연스럽게 앞사람의 뒤통수를 바라보며 전진하도록 설계되었습니다:

* **1위 기준 오른쪽 (시계 방향 이동 중):** 뒷모습 (뒷통수와 뒷몸통)
* **1위 기준 앞쪽 (하단):** 오른쪽 옆모습 & 측면 몸통
* **1위 기준 왼쪽:** 앞모습 (얼굴 및 전면)
* **1위 기준 뒤쪽 (상단):** 왼쪽 옆모습 & 측면 몸통

---

### `page.tsx` 전체 코드 (복사하여 바로 적용)

```tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
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

// 회전 위치(각도) 및 바라보는 방향에 따른 4방향 SVG 캐릭터 (앞, 옆, 뒤)
const DirectionalCharacterSVG = ({ typeIndex, viewAngle }: { typeIndex: number; viewAngle: number }) => {
  // viewAngle (0 ~ 360deg): 
  // 45~135deg (하단/1위 앞): 오른쪽 측면
  // 135~225deg (왼쪽): 앞모습
  // 225~315deg (상단/1위 뒤): 왼쪽 측면
  // 315~45deg (오른쪽): 뒷모습

  const normalizedAngle = ((viewAngle % 360) + 360) % 360;

  let viewDirection: 'front' | 'back' | 'right_side' | 'left_side' = 'front';
  if (normalizedAngle >= 45 && normalizedAngle < 135) {
    viewDirection = 'right_side'; // 오른쪽 옆모습
  } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
    viewDirection = 'front'; // 정면/앞모습
  } else if (normalizedAngle >= 225 && normalizedAngle < 315) {
    viewDirection = 'left_side'; // 왼쪽 옆모습
  } else {
    viewDirection = 'back'; // 뒷모습/뒤통수
  }

  const charTypes = ['chick', 'pink_bear', 'rabbit', 'brown_bear'];
  const currentChar = charTypes[typeIndex % charTypes.length];

  // 병아리 4방향 렌더링
  if (currentChar === 'chick') {
    if (viewDirection === 'back') {
      return (
        <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-md">
          <ellipse cx="50" cy="62" rx="34" ry="36" fill="#CA8A04" />
          <ellipse cx="50" cy="60" rx="32" ry="34" fill="#FACC15" />
          {/* 벼슬 뒤통수 */}
          <path d="M48 24 C46 14 52 12 52 20 C52 10 58 14 54 28 Z" fill="#991B1B" />
          {/* 뒤 날개 fold */}
          <ellipse cx="22" cy="64" rx="5" ry="12" fill="#EAB308" transform="rotate(-10 22 64)" />
          <ellipse cx="78" cy="64" rx="5" ry="12" fill="#EAB308" transform="rotate(10 78 64)" />
        </svg>
      );
    }
    if (viewDirection === 'right_side') {
      return (
        <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-md">
          <ellipse cx="48" cy="62" rx="32" ry="36" fill="#FACC15" />
          <path d="M44 26 C42 14 48 12 48 20 Z" fill="#EF4444" />
          <circle cx="68" cy="52" r="4.5" fill="#0F172A" />
          <circle cx="69.5" cy="50.5" r="1.5" fill="#FFFFFF" />
          <polygon points="70,57 82,60 70,64" fill="#F97316" />
          <ellipse cx="42" cy="66" rx="6" ry="14" fill="#EAB308" transform="rotate(15 42 66)" />
        </svg>
      );
    }
    if (viewDirection === 'left_side') {
      return (
        <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-md">
          <ellipse cx="52" cy="62" rx="32" ry="36" fill="#FACC15" />
          <path d="M56 26 C58 14 52 12 52 20 Z" fill="#EF4444" />
          <circle cx="32" cy="52" r="4.5" fill="#0F172A" />
          <circle cx="30.5" cy="50.5" r="1.5" fill="#FFFFFF" />
          <polygon points="30,57 18,60 30,64" fill="#F97316" />
          <ellipse cx="58" cy="66" rx="6" ry="14" fill="#EAB308" transform="rotate(-15 58 66)" />
        </svg>
      );
    }
    // Front (정면)
    return (
      <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-md">
        <ellipse cx="50" cy="62" rx="34" ry="36" fill="#FACC15" />
        <path d="M46 28 C44 14 50 12 50 20 C50 10 58 14 54 28 Z" fill="#EF4444" />
        <circle cx="38" cy="52" r="4.5" fill="#0F172A" />
        <circle cx="62" cy="52" r="4.5" fill="#0F172A" />
        <circle cx="39.5" cy="50.5" r="1.5" fill="#FFFFFF" />
        <circle cx="63.5" cy="50.5" r="1.5" fill="#FFFFFF" />
        <path d="M44 57 Q50 53 56 57 Q50 66 44 57 Z" fill="#F97316" />
      </svg>
    );
  }

  // 곰 / 토끼 4방향 렌더링
  if (viewDirection === 'back') {
    return (
      <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-md">
        <circle cx="28" cy="30" r="10" fill="#DB2777" />
        <circle cx="72" cy="30" r="10" fill="#DB2777" />
        <ellipse cx="50" cy="65" rx="34" ry="34" fill="#F472B6" />
      </svg>
    );
  }
  if (viewDirection === 'right_side') {
    return (
      <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-md">
        <circle cx="64" cy="30" r="10" fill="#F472B6" />
        <ellipse cx="48" cy="65" rx="30" ry="34" fill="#F472B6" />
        <circle cx="66" cy="52" r="4" fill="#0F172A" />
        <ellipse cx="72" cy="58" rx="4" ry="3" fill="#9D174D" />
      </svg>
    );
  }
  if (viewDirection === 'left_side') {
    return (
      <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-md">
        <circle cx="36" cy="30" r="10" fill="#F472B6" />
        <ellipse cx="52" cy="65" rx="30" ry="34" fill="#F472B6" />
        <circle cx="34" cy="52" r="4" fill="#0F172A" />
        <ellipse cx="28" cy="58" rx="4" ry="3" fill="#9D174D" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-md">
      <circle cx="28" cy="30" r="11" fill="#F472B6" />
      <circle cx="72" cy="30" r="11" fill="#F472B6" />
      <ellipse cx="50" cy="65" rx="34" ry="34" fill="#F472B6" />
      <circle cx="38" cy="52" r="4" fill="#0F172A" />
      <circle cx="62" cy="52" r="4" fill="#0F172A" />
      <ellipse cx="50" cy="58" rx="3.5" ry="2.5" fill="#9D174D" />
    </svg>
  );
};

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
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
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

  const leaderIdea = ideas.length > 0 ? ideas[0] : null;
  const runnerUpIdeas = ideas.slice(1);

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

          {/* 위치 각도에 따라 앞모습/옆모습/뒷모습이 자동으로 바뀌는 3D 스테이지 */}
          {activeTab === 'leaderboard' && isAdminLoggedIn && (
            <div className="w-full rounded-3xl shadow-2xl relative overflow-hidden border border-emerald-300 bg-gradient-to-b from-[#87CEEB] to-[#B0E0E6] p-6 min-h-[620px] flex flex-col justify-end items-center">
              <div className="absolute top-6 left-12 w-20 h-10 bg-white/90 rounded-full blur-[1px] shadow-[0_8px_15px_rgba(255,255,255,0.8)]" />
              <div className="absolute top-12 left-44 w-24 h-12 bg-white/90 rounded-full blur-[1px] shadow-[0_8px_15px_rgba(255,255,255,0.8)]" />
              <div className="absolute top-10 right-16 w-24 h-12 bg-white/90 rounded-full blur-[1px] shadow-[0_8px_15px_rgba(255,255,255,0.8)]" />

              <div className="absolute top-6 right-56 w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center shadow-[0_0_25px_#f59e0b]">
                <span className="text-2xl">😊</span>
              </div>

              <div className="absolute top-4 right-4 z-50">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 shadow-md transition backdrop-blur-sm"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>

              {/* 3D 언덕 원형 트랙 지면 */}
              <div className="relative w-[850px] h-[440px] mb-[-120px] flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-[#52B734] rounded-[100%] border-[16px] border-[#43A028] shadow-[inset_0_-30px_60px_rgba(0,0,0,0.3)]"
                  style={{ transform: 'rotateX(62deg)' }}
                />
                <div
                  className="absolute w-[680px] h-[340px] bg-[#66D046] rounded-[100%] border-4 border-[#51B833] shadow-[inset_0_10px_20px_rgba(255,255,255,0.4)] flex items-center justify-center"
                  style={{ transform: 'rotateX(62deg)' }}
                >
                  <div className="absolute top-1/4 left-1/3 text-sm">🌸</div>
                  <div className="absolute bottom-1/3 left-1/4 text-sm">🌼</div>
                  <div className="absolute bottom-1/4 right-1/3 text-sm">🌻</div>
                  <div className="absolute top-1/3 right-1/4 text-sm">🌷</div>
                </div>
              </div>

              {/* 3D 캐릭터 방향성 트랙 무대 */}
              <div className="absolute inset-0 w-full h-full max-w-4xl mx-auto pointer-events-none">
                
                {/* 1위 (중앙 고정 정면) */}
                {leaderIdea && (
                  <div className="absolute top-[36%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-40">
                    <div className="bg-[#FFC72C] text-slate-900 font-black px-4 py-1.5 rounded-xl text-xs shadow-[0_4px_12px_rgba(0,0,0,0.18)] mb-1 border-2 border-[#FFE885] flex items-center gap-1 whitespace-nowrap">
                      <span>👑 1위</span>
                      <span>{leaderIdea.votes_count}표</span>
                      <span className="opacity-75">({totalVotes > 0 ? Math.round((leaderIdea.votes_count / totalVotes) * 100) : 0}%)</span>
                    </div>

                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <DirectionalCharacterSVG typeIndex={0} viewAngle={180} />
                      <div className="absolute -bottom-1 w-20 h-4 bg-black/25 rounded-full blur-sm -z-10" />
                    </div>

                    <div className="w-12 h-12 bg-gradient-to-b from-slate-100 to-slate-300 border-2 border-slate-400 rounded-lg shadow-[0_6px_0_#94A3B8] flex items-center justify-center font-black text-2xl text-slate-800 -mt-1">
                      1
                    </div>
                    <p className="mt-1 text-[11px] font-black text-slate-900 bg-white/90 px-2 py-0.5 rounded shadow-sm max-w-[100px] truncate">{leaderIdea.title}</p>
                  </div>
                )}

                {/* 2위 ~ N위: 원형 궤도 상 위치 각도에 따라 앞/뒤/옆 시점 자동 전환 */}
                {runnerUpIdeas.map((idea, index) => {
                  const rank = index + 2;
                  const totalCount = runnerUpIdeas.length;

                  // 시계 방향 트랙 각도
                  const angleRad = (index / totalCount) * (2 * Math.PI);
                  const angleDeg = (angleRad * 180) / Math.PI;

                  const radiusX = 280;
                  const radiusY = 110;

                  const offsetX = Math.cos(angleRad) * radiusX;
                  const offsetY = Math.sin(angleRad) * radiusY;

                  const isFront = offsetY > 0;
                  const zIndex = isFront ? 50 + Math.round(offsetY) : 30 + Math.round(offsetY);
                  const scale = 0.85 + (offsetY / radiusY) * 0.2;

                  return (
                    <div
                      key={idea.id}
                      className="absolute flex flex-col items-center transition-all duration-500"
                      style={{
                        top: `calc(48% + ${offsetY}px)`,
                        left: `calc(50% + ${offsetX}px)`,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                        zIndex: zIndex,
                      }}
                    >
                      <div className="bg-white/95 text-slate-700 font-bold px-2.5 py-0.5 rounded-lg text-[10px] shadow border border-emerald-100 mb-1 whitespace-nowrap">
                        {rank}위 {idea.votes_count}표 ({totalVotes > 0 ? Math.round((idea.votes_count / totalVotes) * 100) : 0}%)
                      </div>

                      {/* 트랙 상 위치 각도(angleDeg)에 맞춘 4방향 3D 캐릭터 */}
                      <div className="relative w-22 h-22 flex items-center justify-center">
                        <DirectionalCharacterSVG typeIndex={index + 1} viewAngle={angleDeg} />
                        <div className="absolute -bottom-1 w-16 h-3.5 bg-black/20 rounded-full blur-sm -z-10" />
                      </div>

                      <span className="font-black text-amber-900 text-2xl drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]">
                        {rank}
                      </span>
                      <p className="text-[10px] font-bold text-slate-800 bg-white/80 px-1.5 rounded truncate max-w-[80px]">
                        {idea.title}
                      </p>
                    </div>
                  );
                })}

              </div>
            </div>
          )}
        </div>
      )}

      {/* 모달: 알림 */}
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

```