"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

type Phase = "welcome" | "playing" | "paused" | "complete";
type Card = { id: number; fruit: string; revealed: boolean; matched: boolean };
type Score = { name: string; moves: number; seconds: number; finishedAt: string };

const fruits = ["🍎", "🍌", "🍇", "🍉", "🍓", "🍊", "🥝", "🍍"];
const scoresKey = "cardgame26_2_scores";
const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }
function makeDeck(): Card[] { return shuffle([...fruits, ...fruits]).map((fruit, id) => ({ id, fruit, revealed: false, matched: false })); }
function formatTime(totalSeconds: number) { const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0"); const seconds = (totalSeconds % 60).toString().padStart(2, "0"); return `${minutes}:${seconds}`; }
function readScores() { try { const saved = window.localStorage.getItem(scoresKey); return saved ? (JSON.parse(saved) as Score[]) : []; } catch { return []; } }

export default function Home() {
  const [phase, setPhase] = useState<Phase>("welcome");
  const [name, setName] = useState("");
  const [deck, setDeck] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [scores, setScores] = useState<Score[]>(() => typeof window === "undefined" ? [] : readScores());
  const [darkMode, setDarkMode] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("cardgame26_2_theme") === "dark");
  const [isChecking, setIsChecking] = useState(false);
  const savedResult = useRef(false);

  useEffect(() => { document.documentElement.dataset.theme = darkMode ? "dark" : "light"; window.localStorage.setItem("cardgame26_2_theme", darkMode ? "dark" : "light"); }, [darkMode]);
  useEffect(() => { if (phase !== "playing" || !startedAt) return; const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250); return () => window.clearInterval(timer); }, [phase, startedAt]);

  const rankedScores = useMemo(() => [...scores].sort((a, b) => a.seconds - b.seconds || a.moves - b.moves).slice(0, 3), [scores]);
  const startGame = useCallback(() => { const trimmedName = name.trim(); if (!trimmedName) return; setName(trimmedName); setDeck(makeDeck()); setSelected([]); setMoves(0); setElapsed(0); savedResult.current = false; setStartedAt(Date.now()); setPhase("playing"); }, [name]);
  const goHome = () => { setPhase("welcome"); setDeck([]); setSelected([]); setStartedAt(null); setElapsed(0); setMoves(0); };
  const restartGame = () => { setDeck(makeDeck()); setSelected([]); setMoves(0); setElapsed(0); savedResult.current = false; setStartedAt(Date.now()); setPhase("playing"); };

  const saveResult = useCallback(async () => {
    if (savedResult.current) return;
    savedResult.current = true;
    const result: Score = { name, moves, seconds: elapsed, finishedAt: new Date().toISOString() };
    const nextScores = [...scores, result]; setScores(nextScores); window.localStorage.setItem(scoresKey, JSON.stringify(nextScores));
    if (scriptUrl) { try { await fetch(scriptUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ timestamp: result.finishedAt, name: result.name, score: result.moves, finishtime: formatTime(result.seconds) }) }); } catch { /* Keep the local result when Apps Script is unavailable. */ } }
  }, [elapsed, moves, name, scores]);

  // Completion is derived from the final card state, so this effect transitions the game phase once.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (phase === "playing" && deck.length > 0 && deck.every((card) => card.matched)) { setPhase("complete"); void saveResult(); } }, [deck, phase, saveResult]);

  const chooseCard = (id: number) => {
    if (phase !== "playing" || isChecking || selected.includes(id)) return;
    const card = deck.find((item) => item.id === id); if (!card || card.matched || card.revealed) return;
    const nextSelected = [...selected, id];
    setDeck((current) => current.map((item) => item.id === id ? { ...item, revealed: true } : item)); setSelected(nextSelected); if (nextSelected.length !== 2) return;
    setMoves((current) => current + 1); setIsChecking(true);
    const [firstId, secondId] = nextSelected; const first = deck.find((item) => item.id === firstId); const second = deck.find((item) => item.id === secondId); const matched = first?.fruit === second?.fruit;
    window.setTimeout(() => { setDeck((current) => current.map((item) => nextSelected.includes(item.id) ? { ...item, revealed: matched ? true : false, matched: matched || item.matched } : item)); setSelected([]); setIsChecking(false); }, matched ? 350 : 850);
  };

  return (
    <main className={styles.page}>
      <div className={styles.glow} />
      <header className={styles.header}><button className={styles.brand} onClick={goHome} aria-label="처음으로"><span className={styles.brandMark}>✦</span><span>PAIR</span></button><button className={styles.themeButton} onClick={() => setDarkMode((current) => !current)} aria-label="테마 변경">{darkMode ? "☀️" : "🌙"}</button></header>
      {phase === "welcome" ? <section className={styles.welcome}><div className={styles.eyebrow}>MEMORY CARD GAME</div><h1>같은 과일을<br /><span>찾아보세요.</span></h1><p className={styles.lead}>집중력과 기억력을 테스트하는<br />16장의 작은 게임입니다.</p><div className={styles.nameForm}><label htmlFor="player-name">플레이어 이름</label><input id="player-name" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && startGame()} placeholder="이름을 입력해주세요" maxLength={16} /><button className={styles.primaryButton} onClick={startGame} disabled={!name.trim()}>게임 시작 <span>→</span></button></div><div className={styles.hint}><span>♧</span> 8쌍의 과일을 모두 찾아보세요</div></section> : <section className={styles.gameShell}><div className={styles.gameIntro}><div><div className={styles.eyebrow}>PLAYER · {name.toUpperCase()}</div><h1>카드를 맞춰보세요.</h1></div><div className={styles.stats}><div><span>TIME</span><strong>{formatTime(elapsed)}</strong></div><div><span>MOVES</span><strong>{moves.toString().padStart(2, "0")}</strong></div></div></div><div className={styles.board} aria-label="4 x 4 카드 게임판">{deck.map((card) => <button key={card.id} className={`${styles.card} ${card.revealed || card.matched ? styles.open : ""} ${card.matched ? styles.matched : ""}`} onClick={() => chooseCard(card.id)} aria-label={card.revealed || card.matched ? card.fruit : "뒤집힌 카드"}><span className={styles.cardBack}>✦</span><span className={styles.fruit}>{card.fruit}</span></button>)}</div><div className={styles.gameActions}><button className={styles.textButton} onClick={() => setPhase((current) => current === "paused" ? "playing" : "paused")}>{phase === "paused" ? "계속하기" : "잠시 멈추기"}</button><button className={styles.textButton} onClick={restartGame}>다시 시작</button><button className={styles.textButton} onClick={goHome}>처음으로</button></div></section>}
      {phase === "paused" && <div className={styles.overlay}><div className={styles.modal}><div className={styles.modalIcon}>Ⅱ</div><h2>잠시 쉬어가세요.</h2><p>게임은 현재 멈춰 있습니다.</p><button className={styles.primaryButton} onClick={() => setPhase("playing")}>계속하기 <span>→</span></button></div></div>}
      {phase === "complete" && <div className={styles.overlay}><div className={styles.modal}><div className={styles.modalIcon}>✓</div><div className={styles.eyebrow}>CONGRATULATIONS</div><h2>모든 짝을 찾았어요!</h2><p><strong>{name}</strong>님의 기록은 <strong>{formatTime(elapsed)}</strong>, {moves}번 만에 성공했습니다.</p><button className={styles.primaryButton} onClick={restartGame}>한 번 더 하기 <span>→</span></button><button className={styles.textButton} onClick={goHome}>처음으로</button></div></div>}
      <section className={styles.ranking}><div><div className={styles.eyebrow}>TOP 3 RECORDS</div><h2>오늘의 기록</h2></div>{rankedScores.length === 0 ? <p className={styles.empty}>첫 번째 기록을 남겨보세요.</p> : <ol>{rankedScores.map((score, index) => <li key={`${score.finishedAt}-${index}`}><span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span><span className={styles.scoreName}>{score.name}</span><span className={styles.scoreValue}>{formatTime(score.seconds)} <small>{score.moves} moves</small></span></li>)}</ol>}</section>
      <footer>Copyright INU 카드 맞추기 게임 by Kyonam Choo</footer>
    </main>
  );
}
