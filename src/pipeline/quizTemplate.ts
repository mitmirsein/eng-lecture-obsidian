/**
 * Interactive Quiz Player Template — v1.0
 * Generates a self-contained premium HTML file with modern CSS and Vanilla JS interaction.
 * Theme: Glassmorphism / Amber Gold Dark Mode (Lex Persona theme)
 */

export function generateQuizHTML(passageId: string, title: string, etymologyGroups: any[]): string {
  const jsonData = JSON.stringify(etymologyGroups);
  
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${title} — 어원 기반 대화형 퀴즈</title>
  <style>
    /* Reset & Fonts */
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    :root {
      --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%);
      --accent-color: #f59e0b; /* Amber Gold */
      --accent-glow: rgba(245, 158, 11, 0.4);
      --card-bg: rgba(30, 41, 59, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --success-color: #10b981;
      --error-color: #ef4444;
      --glass-filter: blur(16px) saturate(180%);
    }

    body {
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem;
      overflow-x: hidden;
    }

    /* Layout & Header */
    .container {
      width: 100%;
      max-width: 800px;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    header {
      text-align: center;
      margin-bottom: 1rem;
      animation: fadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }

    header h1 {
      font-size: 2.2rem;
      font-weight: 800;
      background: linear-gradient(to right, #f59e0b, #facc15, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
      letter-spacing: -0.025em;
    }

    header p {
      color: var(--text-muted);
      font-size: 1.1rem;
      font-weight: 500;
    }

    .badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: var(--accent-color);
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 1rem;
      box-shadow: 0 0 15px var(--accent-glow);
    }

    /* Study Cards (Etymology Explanations) */
    .study-section {
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .glass-card {
      background: var(--card-bg);
      backdrop-filter: var(--glass-filter);
      -webkit-backdrop-filter: var(--glass-filter);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
      margin-bottom: 2rem;
    }

    .glass-card:hover {
      border-color: rgba(245, 158, 11, 0.25);
      box-shadow: 0 25px 50px rgba(245, 158, 11, 0.05);
    }

    .root-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
      padding-bottom: 1.2rem;
      margin-bottom: 1.5rem;
    }

    .root-word-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .root-meaning-badge {
      padding: 0.4rem 1rem;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--accent-color);
    }

    .story-box {
      background: rgba(15, 23, 42, 0.4);
      border-left: 4px solid var(--accent-color);
      padding: 1.25rem;
      border-radius: 0 16px 16px 0;
      margin-bottom: 2rem;
      line-height: 1.7;
      font-size: 1.05rem;
      color: #e2e8f0;
    }

    .derived-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .derived-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 1.5rem;
      transition: background-color 0.2s ease, transform 0.2s ease;
    }

    .derived-item:hover {
      background: rgba(255, 255, 255, 0.04);
      transform: translateY(-2px);
    }

    .derived-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--accent-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .derived-structure {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.05);
      padding: 0.2rem 0.6rem;
      border-radius: 8px;
    }

    .derived-meaning {
      font-size: 1.05rem;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 0.75rem;
    }

    .derived-english-def {
      font-size: 0.9rem;
      color: var(--text-muted);
      font-style: italic;
      margin-bottom: 0.75rem;
      display: block;
    }

    .example-list {
      list-style: none;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 0.75rem;
    }

    .example-item {
      font-size: 0.95rem;
      line-height: 1.6;
      position: relative;
      padding-left: 1rem;
      color: #cbd5e1;
    }

    .example-item::before {
      content: "•";
      position: absolute;
      left: 0;
      color: var(--accent-color);
    }

    .example-trans {
      display: block;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    /* Interactive Quiz CSS */
    .quiz-section {
      display: none;
      animation: zoomIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .quiz-progress {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 9999px;
      margin-top: 0.5rem;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #f59e0b, #eab308);
      border-radius: 9999px;
      width: 0%;
      transition: width 0.4s ease;
      box-shadow: 0 0 10px var(--accent-glow);
    }

    .quiz-card {
      background: var(--card-bg);
      backdrop-filter: var(--glass-filter);
      -webkit-backdrop-filter: var(--glass-filter);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      position: relative;
    }

    .quiz-question {
      font-size: 1.35rem;
      font-weight: 700;
      line-height: 1.6;
      margin-bottom: 2rem;
      color: var(--text-main);
    }

    .options-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .option-btn {
      width: 100%;
      padding: 1.2rem 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      color: var(--text-main);
      font-size: 1.05rem;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .option-btn:hover:not(:disabled) {
      background: rgba(245, 158, 11, 0.08);
      border-color: rgba(245, 158, 11, 0.4);
      transform: translateX(4px);
    }

    .option-btn:disabled {
      cursor: not-allowed;
    }

    .option-btn.correct {
      background: rgba(16, 185, 129, 0.15) !important;
      border-color: var(--success-color) !important;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
    }

    .option-btn.wrong {
      background: rgba(239, 68, 68, 0.15) !important;
      border-color: var(--error-color) !important;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    .option-indicator {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .option-btn.correct .option-indicator {
      border-color: var(--success-color);
      background: var(--success-color);
      color: white;
    }

    .option-btn.wrong .option-indicator {
      border-color: var(--error-color);
      background: var(--error-color);
      color: white;
    }

    /* Self Recall Quiz Type (For non-multiple-choice) */
    .recall-box {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .answer-textarea {
      width: 100%;
      height: 120px;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 1.2rem;
      color: var(--text-main);
      font-size: 1.1rem;
      line-height: 1.6;
      resize: none;
      outline: none;
      transition: border-color 0.3s ease;
    }

    .answer-textarea:focus {
      border-color: var(--accent-color);
      box-shadow: 0 0 15px var(--accent-glow);
    }

    .reveal-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 1.1rem 2rem;
      border-radius: 16px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      outline: none;
      border: none;
    }

    .btn-primary {
      background: var(--accent-color);
      color: #0f172a;
      box-shadow: 0 8px 20px var(--accent-glow);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 25px var(--accent-glow);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-main);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    .self-assessment-box {
      display: none;
      background: rgba(15, 23, 42, 0.4);
      border-radius: 20px;
      padding: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: 1.5rem;
      animation: fadeIn 0.4s ease both;
    }

    .model-answer-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--accent-color);
      margin-bottom: 0.5rem;
    }

    .model-answer-content {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 1.25rem;
    }

    .self-grading-buttons {
      display: flex;
      gap: 1rem;
    }

    .btn-correct {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      flex: 1;
    }

    .btn-correct:hover {
      background: var(--success-color);
      color: white;
    }

    .btn-wrong {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      flex: 1;
    }

    .btn-wrong:hover {
      background: var(--error-color);
      color: white;
    }

    /* Explanation Box */
    .explanation-box {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: rgba(15, 23, 42, 0.3);
      border-left: 3px solid var(--accent-color);
      border-radius: 0 12px 12px 0;
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text-muted);
      display: none;
      animation: fadeIn 0.4s ease;
    }

    .explanation-box p strong {
      color: var(--text-main);
    }

    /* Score Dashboard */
    .dashboard-section {
      display: none;
      text-align: center;
      animation: zoomIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .score-circle {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      border: 6px solid var(--card-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 2rem auto;
      background: rgba(15, 23, 42, 0.5);
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.4);
      position: relative;
    }

    .score-circle::after {
      content: "";
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 6px solid var(--accent-color);
      clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%); /* Will animate dynamically via JS */
      transform: rotate(-90deg);
      transition: clip-path 1s ease-out;
      box-shadow: 0 0 15px var(--accent-glow);
    }

    .score-value {
      font-size: 3.5rem;
      font-weight: 900;
      color: var(--accent-color);
      line-height: 1;
    }

    .score-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .feedback-message {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 2rem;
      color: var(--text-main);
    }

    /* Start / Navigation Action Area */
    .action-bar {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes shake {
      10%, 90% { transform: translate3d(-1px, 0, 0); }
      20%, 80% { transform: translate3d(2px, 0, 0); }
      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
      40%, 60% { transform: translate3d(4px, 0, 0); }
    }

    /* Responsive */
    @media (max-width: 640px) {
      header h1 { font-size: 1.8rem; }
      .glass-card { padding: 1.5rem; }
      .root-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
      .btn { width: 100%; }
      .reveal-actions { flex-direction: column; }
      .self-grading-buttons { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <span class="badge">Lex 어원 랩</span>
      <h1 id="main-title">\${title}</h1>
      <p>라틴어/그리스어 어원 기반 입체적 단어 연상 학습</p>
    </header>

    <!-- Study Section (Initial) -->
    <div id="study-panel" class="study-section">
      <div class="glass-card">
        <div style="margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem;">
          <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;">📖 STEP 1. 어원 가족 해부하기</h2>
          <p style="font-size: 0.95rem; color: var(--text-muted);">어원의 스토리를 먼저 읽고 단어의 구조를 직관적으로 파악해 보세요.</p>
        </div>

        <div id="roots-container">
          <!-- Rendered via JS -->
        </div>

        <div class="action-bar">
          <button id="start-quiz-btn" class="btn btn-primary" style="width: 100%; max-width: 300px;">
            ✍️ 퀴즈 도전하기
          </button>
        </div>
      </div>
    </div>

    <!-- Quiz Section -->
    <div id="quiz-panel" class="quiz-section">
      <div class="quiz-progress">
        <span id="quiz-counter">Question 1 of 5</span>
        <div style="flex: 1; margin-left: 1.5rem;">
          <div class="progress-bar-container">
            <div id="progress-fill" class="progress-bar-fill"></div>
          </div>
        </div>
      </div>

      <div class="quiz-card">
        <div id="quiz-question" class="quiz-question"></div>
        
        <!-- Multiple Choice Options -->
        <div id="options-container" class="options-grid"></div>

        <!-- Recall Self Grading Option -->
        <div id="recall-container" class="recall-box" style="display: none;">
          <textarea id="student-answer" class="answer-textarea" placeholder="생각한 정답을 적어보세요... (정답 확인 후 자가채점)"></textarea>
          <div class="reveal-actions">
            <button id="check-answer-btn" class="btn btn-primary">🔑 정답 및 해설 확인</button>
          </div>
          
          <div id="self-assessment" class="self-assessment-box">
            <div class="model-answer-title">모범 답안</div>
            <div id="model-answer-text" class="model-answer-content"></div>
            <div class="self-grading-buttons">
              <button id="self-grade-correct" class="btn btn-correct">👍 맞았습니다</button>
              <button id="self-grade-wrong" class="btn btn-wrong">👎 틀렸습니다</button>
            </div>
          </div>
        </div>

        <div id="explanation-box" class="explanation-box"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1.5rem; margin-top: 2rem;">
          <button id="quit-quiz-btn" class="btn btn-secondary" style="font-size: 0.95rem; padding: 0.75rem 1.25rem;">
            ← 학습으로 돌아가기
          </button>
          <button id="next-quiz-btn" class="btn btn-primary" style="font-size: 0.95rem; padding: 0.75rem 1.25rem;" disabled>
            다음 문제 →
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard Section -->
    <div id="dashboard-panel" class="dashboard-section">
      <div class="glass-card" style="padding: 3rem;">
        <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem;">🎉 퀴즈를 모두 마쳤습니다!</h2>
        <p style="color: var(--text-muted); font-size: 1.1rem;">어원 학습의 기본 체계를 완전히 마스터했습니다.</p>
        
        <div class="score-circle">
          <div id="score-text" class="score-value">80</div>
          <div class="score-label">My Score</div>
        </div>

        <div id="feedback-msg" class="feedback-message">정말 훌륭합니다!</div>

        <div class="action-bar" style="flex-direction: column; align-items: center; gap: 1rem;">
          <button id="restart-quiz-btn" class="btn btn-primary" style="width: 100%; max-width: 280px;">
            🔄 퀴즈 다시 풀기
          </button>
          <button id="back-study-btn" class="btn btn-secondary" style="width: 100%; max-width: 280px;">
            📖 어원 학습창으로 이동
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Data Injected from Engine
    const etymologyData = \${jsonData};

    // DOM Elements
    const studyPanel = document.getElementById('study-panel');
    const quizPanel = document.getElementById('quiz-panel');
    const dashboardPanel = document.getElementById('dashboard-panel');
    const rootsContainer = document.getElementById('roots-container');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    const backStudyBtn = document.getElementById('back-study-btn');
    
    const quizCounter = document.getElementById('quiz-counter');
    const progressFill = document.getElementById('progress-fill');
    const quizQuestion = document.getElementById('quiz-question');
    const optionsContainer = document.getElementById('options-container');
    const recallContainer = document.getElementById('recall-container');
    const studentAnswer = document.getElementById('student-answer');
    const checkAnswerBtn = document.getElementById('check-answer-btn');
    const selfAssessment = document.getElementById('self-assessment');
    const modelAnswerText = document.getElementById('model-answer-text');
    const selfGradeCorrect = document.getElementById('self-grade-correct');
    const selfGradeWrong = document.getElementById('self-grade-wrong');
    const explanationBox = document.getElementById('explanation-box');
    const nextQuizBtn = document.getElementById('next-quiz-btn');
    const quitQuizBtn = document.getElementById('quit-quiz-btn');
    
    const scoreText = document.getElementById('score-text');
    const feedbackMsg = document.getElementById('feedback-msg');

    // Quiz State
    let flatQuizzes = [];
    let currentQuizIndex = 0;
    let score = 0;

    // Render Study Content
    function renderStudyContent() {
      rootsContainer.innerHTML = '';
      etymologyData.forEach((group, groupIdx) => {
        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.padding = '2rem';
        card.style.borderRadius = '20px';
        card.style.background = 'rgba(255, 255, 255, 0.01)';
        card.style.border = '1px solid rgba(255, 255, 255, 0.04)';
        card.style.marginBottom = '1.5rem';

        let derivedHTML = '';
        group.derived_words.forEach(derived => {
          let meaningsList = derived.korean_meanings.join(', ');
          let examplesHTML = '';
          
          if (derived.examples && derived.examples.length > 0) {
            examplesHTML = \\\`<ul class="example-list">\\\`;
            derived.examples.forEach(ex => {
              examplesHTML += \\\`
                <li class="example-item">
                  \\\\\\\${ex.sentence}
                  <span class="example-trans">\\\\\\\${ex.translation}</span>
                </li>
              \\\`;
            });
            examplesHTML += \\\`</ul>\\\`;
          }

          derivedHTML += \\\`
            <div class="derived-item">
              <div class="derived-title">
                <span>\\\\\\\${derived.word}</span>
                <span class="derived-structure">\\\\\\\${derived.structure}</span>
              </div>
              <div class="derived-meaning">\\\\\\\${meaningsList} <span style="font-weight: normal; font-size: 0.9rem; color: var(--text-muted);">(\\\\\\\${derived.pos})</span></div>
              <span class="derived-english-def">\\\\\\\${derived.english_definition}</span>
              \\\\\\\${examplesHTML}
            </div>
          \\\`;
        });

        card.innerHTML = \\\`
          <div class="root-header">
            <h3 class="root-word-title">🔍 어근: \\\\\\\${group.root_word}</h3>
            <span class="root-meaning-badge">\\\\\\\${group.root_meaning}</span>
          </div>
          <div class="story-box">
            \\\\\\\${group.connection_story.replace(/\\\\n/g, '<br>')}
          </div>
          <div style="margin-bottom: 1.2rem; font-weight: 700; font-size: 1.1rem; color: var(--accent-color);">
            🧬 어원 계보 (Family Tree)
          </div>
          <div class="derived-grid">
            \\\\\\\${derivedHTML}
          </div>
        \\\`;
        rootsContainer.appendChild(card);
      });
    }

    // Prepare Quizzes
    function prepareQuizzes() {
      flatQuizzes = [];
      etymologyData.forEach(group => {
        group.quizzes.forEach(q => {
          flatQuizzes.push({
            ...q,
            root_word: group.root_word
          });
        });
      });
      // Shuffle quizzes
      flatQuizzes.sort(() => Math.random() - 0.5);
    }

    // Start Quiz
    function startQuiz() {
      prepareQuizzes();
      if (flatQuizzes.length === 0) {
        alert('이 지문에는 생성된 어원 퀴즈가 없습니다.');
        return;
      }
      currentQuizIndex = 0;
      score = 0;
      studyPanel.style.display = 'none';
      dashboardPanel.style.display = 'none';
      quizPanel.style.display = 'block';
      showQuizQuestion();
    }

    // Show Question
    function showQuizQuestion() {
      const q = flatQuizzes[currentQuizIndex];
      
      // Update Progress
      quizCounter.textContent = \\\`Question \\\\\\\${currentQuizIndex + 1} of \\\\\\\${flatQuizzes.length}\\\`;
      const progressPercent = ((currentQuizIndex) / flatQuizzes.length) * 100;
      progressFill.style.width = \\\`\\\\\\\${progressPercent}%\\\`;

      // Render Question
      quizQuestion.textContent = q.question;
      explanationBox.style.display = 'none';
      nextQuizBtn.disabled = true;

      // Check if Multiple Choice or Recall
      if (q.options && q.options.length > 0) {
        // Multiple Choice
        optionsContainer.style.display = 'flex';
        recallContainer.style.display = 'none';
        renderOptions(q);
      } else {
        // Free recall
        optionsContainer.style.display = 'none';
        recallContainer.style.display = 'flex';
        studentAnswer.value = '';
        checkAnswerBtn.disabled = false;
        selfAssessment.style.display = 'none';
      }
    }

    // Render Options
    function renderOptions(q) {
      optionsContainer.innerHTML = '';
      
      q.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        
        const indicator = document.createElement('span');
        indicator.className = 'option-indicator';
        indicator.textContent = String.fromCharCode(65 + idx); // A, B, C, D
        
        const label = document.createElement('span');
        label.textContent = optText;
        
        btn.appendChild(indicator);
        btn.appendChild(label);
        
        btn.addEventListener('click', () => selectOption(btn, optText, q.correct_answer));
        optionsContainer.appendChild(btn);
      });
    }

    // Handle Option Selection
    function selectOption(selectedBtn, selectedText, correctAnswer) {
      const allButtons = optionsContainer.querySelectorAll('.option-btn');
      
      // Disable all buttons
      allButtons.forEach(btn => btn.disabled = true);
      
      const isCorrect = selectedText.trim() === correctAnswer.trim() || 
                        selectedText.startsWith(correctAnswer) || 
                        correctAnswer.includes(selectedText);
      
      if (isCorrect) {
        selectedBtn.classList.add('correct');
        score += 100 / flatQuizzes.length;
      } else {
        selectedBtn.classList.add('wrong');
        // Highlight correct option
        allButtons.forEach(btn => {
          const btnText = btn.querySelector('span:last-child').textContent;
          if (btnText.trim() === correctAnswer.trim() || btnText.startsWith(correctAnswer) || correctAnswer.includes(btnText)) {
            btn.classList.add('correct');
          }
        });
      }

      // Show explanation
      const q = flatQuizzes[currentQuizIndex];
      showExplanation(q.explanation, correctAnswer);
      nextQuizBtn.disabled = false;
    }

    // Show Explanation
    function showExplanation(text, correctAns) {
      explanationBox.innerHTML = \\\`<p><strong>정답:</strong> \\\\\\\${correctAns}</p><p style="margin-top: 0.5rem;"><strong>해설:</strong> \\\\\\\${text}</p>\\\`;
      explanationBox.style.display = 'block';
    }

    // Handle Recall Answer Reveal
    checkAnswerBtn.addEventListener('click', () => {
      checkAnswerBtn.disabled = true;
      const q = flatQuizzes[currentQuizIndex];
      modelAnswerText.textContent = q.correct_answer;
      selfAssessment.style.display = 'block';
    });

    // Self grading clicks
    selfGradeCorrect.addEventListener('click', () => {
      score += 100 / flatQuizzes.length;
      selfAssessment.style.display = 'none';
      const q = flatQuizzes[currentQuizIndex];
      showExplanation(q.explanation, q.correct_answer);
      nextQuizBtn.disabled = false;
    });

    selfGradeWrong.addEventListener('click', () => {
      selfAssessment.style.display = 'none';
      const q = flatQuizzes[currentQuizIndex];
      showExplanation(q.explanation, q.correct_answer);
      nextQuizBtn.disabled = false;
    });

    // Next Question
    nextQuizBtn.addEventListener('click', () => {
      currentQuizIndex++;
      if (currentQuizIndex < flatQuizzes.length) {
        showQuizQuestion();
      } else {
        showDashboard();
      }
    });

    // Quit Quiz
    quitQuizBtn.addEventListener('click', () => {
      if (confirm('퀴즈 풀기를 중단하고 학습창으로 돌아가시겠습니까? 진행상황은 저장되지 않습니다.')) {
        quizPanel.style.display = 'none';
        studyPanel.style.display = 'block';
      }
    });

    // Show Dashboard
    function showDashboard() {
      quizPanel.style.display = 'none';
      dashboardPanel.style.display = 'block';
      
      const finalScore = Math.round(score);
      scoreText.textContent = finalScore;
      
      // Animate score progress ring
      document.querySelector('.score-circle').style.setProperty('--score-angle', \\\`\\\\\\\${(finalScore / 100) * 360}deg\\\`);

      // Feedback message based on score
      if (finalScore === 100) {
        feedbackMsg.textContent = "💯 완벽합니다! 어원을 완벽히 통달했습니다.";
      } else if (finalScore >= 80) {
        feedbackMsg.textContent = "✨ 우수합니다! 미세한 뉘앙스만 다듬으면 됩니다.";
      } else if (finalScore >= 50) {
        feedbackMsg.textContent = "👍 잘하고 있습니다. 헷갈리는 어원을 다시 스캔해보세요.";
      } else {
        feedbackMsg.textContent = "📖 힘내세요! 어원 해설을 다시 한 번 정독해 보세요.";
      }
      
      // Update progress bar to 100%
      progressFill.style.width = '100%';
    }

    // Wire up events
    startQuizBtn.addEventListener('click', startQuiz);
    restartQuizBtn.addEventListener('click', startQuiz);
    backStudyBtn.addEventListener('click', () => {
      dashboardPanel.style.display = 'none';
      studyPanel.style.display = 'block';
    });

    // Initialize
    window.addEventListener('DOMContentLoaded', () => {
      renderStudyContent();
    });
  </script>
</body>
</html>`;
}
