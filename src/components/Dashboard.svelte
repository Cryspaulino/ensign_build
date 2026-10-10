<script>
  import CheckIn from "./CheckIn.svelte";
  import InsightCard from "./InsightCard.svelte";
  import ExperimentCard from "./ExperimentCard.svelte";
  import { onMount } from "svelte";
  import {
    saveCheckIn as saveCheckInToFirebase,
    getCheckIns,
  } from "../lib/checkins.js";

  let activeTab = "Overview";
  let mood = 0;
  let energy = 0;
  let stress = 0;
  let selectedHabits = [];
  let category = "personal";
  let saved = false;
  let saving = false;
  let saveError = "";
  let showHistory = false;
  let history = [];

  let averageMood = "0";
  let daysCheckedIn = 0;

  let insights = null;
  let loadingInsights = false;
  let insightError = "";

  const tabs = ["Overview", "My patterns", "Actions"];

  const habits = [
    "Exercise",
    "Walk",
    "Social time",
    "Good sleep",
    "Meditation",
    "Time outdoors",
    "Volleyball",
    "Music",
    "Cook",
    "Study",
    "Work",
  ];

  //   $: filteredHistory = history.filter(
  //     (entry) => (entry.category ?? "personal") === category,
  //   );

  $: filteredHistory = user
    ? history.filter((entry) => (entry.category ?? "personal") === category)
    : [];

  $: averageMood = filteredHistory.length
    ? (
        filteredHistory.reduce((sum, entry) => sum + Number(entry.mood), 0) /
        filteredHistory.length
      ).toFixed(1)
    : "-";

  $: daysCheckedIn = new Set(
    filteredHistory.map((entry) => new Date(entry.date).toLocaleDateString()),
  ).size;

  onMount(async () => {
    try {
      history = await getCheckIns();
    } catch (error) {
      console.error("Could not load check-ins:", error);
      //   saveError = "Please log in to see or add check-ins.";
    }
  });

  function toggleHabit(habit) {
    selectedHabits = selectedHabits.includes(habit)
      ? selectedHabits.filter((item) => item !== habit)
      : [...selectedHabits, habit];
    saved = false;
  }

  async function saveCheckIn() {
    saving = true;
    saved = false;
    saveError = "";

    try {
      await saveCheckInToFirebase({
        date: new Date().toISOString(),
        mood: Number(mood),
        energy: Number(energy),
        stress: Number(stress),
        habits: [...selectedHabits],
        category,
      });

      history = await getCheckIns();
      saved = true;
    } catch (error) {
      console.error("Could not save check-in:", error);
      saveError = "Could not save. Please try again.";
    } finally {
      saving = false;
    }
  }

  async function generateInsights() {
    loadingInsights = true;
    insightError = "";
    insights = null;

    try {
      const checkins = (await getCheckIns()).filter(
        (entry) => (entry.category ?? "personal") === category,
      );

      if (checkins.length < 3) {
        insightError = `Add at least 3 ${category} check-ins to discover patterns.`;
        return;
      }

      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, checkins }),
      });

      if (!response.ok) throw new Error(await response.text());
      insights = await response.json();
    } catch (error) {
      console.error("AI insights error:", error);
      insightError =
        "Could not generate insights at this time. Please check our actions page";
    } finally {
      loadingInsights = false;
    }
  }

  function changeCategory(nextCategory) {
    category = nextCategory;
    insights = null;
    insightError = "";
  }

  import { loginWithGoogle, logout, watchAuth } from "../lib/auth.js";

  let user = null;
  let authLoading = true;
  let authError = "";

  onMount(() => {
    return watchAuth(async (currentUser) => {
      user = currentUser;

      if (currentUser) {
        try {
          history = await getCheckIns();
        } catch (error) {
          console.error(error);
          history = [];
        }
      } else {
        history = [];
      }

      authLoading = false;
    });
  });

  async function handleLogin() {
    authError = "";
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
      authError = "Could not sign in with Google. Please try again.";
    }
  }

  async function handleLogout() {
    await logout();
  }
</script>

<svelte:head>
  <title>HighHit</title>
  <meta name="description" content="Your personal well-being lab." />
</svelte:head>

<div class="app-shell">
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="High Hit home">
      <span class="brand-mark">h.</span>
      <span>High<span class="brand-light">Hit</span></span>
    </a>

    <nav aria-label="Main navigation">
      {#each tabs as tab}
        <button
          class:active={activeTab === tab}
          class="nav-item"
          onclick={() => (activeTab = tab)}
        >
          <span>
            {tab === "Overview" ? "◫" : tab === "My patterns" ? "⌁" : "✳"}
          </span>
          {tab}
        </button>
      {/each}
    </nav>

    <div class="sidebar-bottom">
      <h2>Your daily insight</h2>
      <InsightCard
        description="As you log more days, we can compare your habits with how you feel and look for possible connections."
        icon="⌁"
        color="lavender"
        tag="GETTING STARTED"
      />
    </div>
  </aside>

  <main class="main-content">
    <header class="topbar">
      <span class="breadcrumb">
        YOUR SPACE / {activeTab.toUpperCase()}
      </span>

      <div class="category-switch">
        <button
          class:active={category === "personal"}
          onclick={() => changeCategory("personal")}>Personal</button
        >
        <button
          class:active={category === "work"}
          onclick={() => changeCategory("work")}>Work</button
        >
      </div>
      {#if authLoading}
        <p>Loading...</p>
      {:else if !user}
        <main class="login-screen">
          <button class="primary-button login-button" onclick={handleLogin}>
            Continue with Google
          </button>

          {#if authError}
            <p role="alert">{authError}</p>
          {/if}
        </main>
      {:else}
        <button class="sign-out" onclick={handleLogout}>Sign out</button>
      {/if}
    </header>

    {#if activeTab === "Overview"}
      <section class="welcome">
        <div>
          <h1>Build your Future<br /><span>One hit at a time</span></h1>
          <p>Discover the little things that shape how you feel.</p>
        </div>
      </section>

      <section class="stats-grid">
        <article class="stat-card">
          <span class="stat-label">AVERAGE MOOD</span>
          <div class="stat-value">{averageMood}<small>/10</small></div>
          <span class="stat-foot">Based on your saved check-ins</span>
        </article>

        <article class="stat-card">
          <span class="stat-label">DAYS CHECKED IN</span>
          <div class="stat-value">{daysCheckedIn}<small> days</small></div>
          <span class="stat-foot">Every entry teaches you something</span>
        </article>
      </section>

      <section class="content-grid">
        <div class="form-column">
          <CheckIn
            bind:mood
            bind:energy
            bind:stress
            {habits}
            {selectedHabits}
            {user}
            onToggleHabit={toggleHabit}
            onSave={saveCheckIn}
            {saved}
            {saving}
          />

          {#if saveError}
            <p class="error-message" role="alert">{saveError}</p>
          {/if}
        </div>

        <section class="history-column">
          <div class="section-heading">
            <div>
              <p class="eyebrow">YOUR JOURNEY</p>
              <h2>Recent check-ins</h2>
            </div>
            <button
              class="text-button"
              onclick={() => (showHistory = !showHistory)}
              >{showHistory ? "Show less ↑" : "View all →"}</button
            >
          </div>

          {#if filteredHistory.length === 0}
            <div class="empty-state">
              <span class="empty-icon">☼</span>
              <strong>Your story starts here.</strong>
              <p>
                Complete your first check-in to start tracking your patterns.
              </p>
            </div>
          {:else}
            {#each [...filteredHistory].slice(0, showHistory ? filteredHistory.length : 4) as entry}
              <article class="history-row">
                <div class="history-icon">☼</div>
                <div class="history-info">
                  <strong>
                    {new Date(entry.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </strong>
                  <span
                    >{entry.habits?.filter(Boolean).join(", ") ||
                      "No habits selected"}</span
                  >
                </div>
                <!-- <div class="history-score">{entry.mood}<small>/10</small></div> -->
                <div class="history-metrics">
                  <span>Mood <strong>{entry.mood}/10</strong></span>
                  <span>Energy <strong>{entry.energy}/10</strong></span>
                  <span>Stress <strong>{entry.stress}/10</strong></span>
                </div>
                <!-- <div class="history-metrics">
                  <span>Score</span>
                  <strong>
                    {(
                      Number(entry.mood) +
                      Number(entry.energy) -
                      Number(entry.stress)
                    ).toFixed(1)}
                  </strong>
                  <small>/20</small>
                </div> -->
              </article>
            {/each}
          {/if}
        </section>
      </section>
    {:else if activeTab === "My patterns"}
      <section class="page-intro">
        <!-- <p class="eyebrow">NOTICE WHAT MATTERS</p> -->
        <h1>Your patterns<span>.</span></h1>
        <p>Learn from your own experiences and make better decisions</p>
      </section>

      <section class="panel">
        <div class="section-heading">
          <div>
            <h2>What your check-ins tell us</h2>
            <p>Exploring your {category} experiences</p>
          </div>
          <button
            class="primary-button"
            onclick={generateInsights}
            disabled={loadingInsights}
          >
            {loadingInsights ? "Finding patterns..." : "Find Patterns"}
          </button>
        </div>

        {#if filteredHistory.length < 3}
          <div class="empty-state">
            <span class="empty-icon">⌁</span>
            <strong>You're building your baseline.</strong>
            <p>
              Save at least three check-ins to begin exploring simple habit and
              mood comparisons.
            </p>
          </div>
        {/if}

        {#if insightError}
          <p class="error-message" role="alert">{insightError}</p>
        {/if}

        {#if insights}
          <div class="ai-insights">
            {#each insights.insights ?? [] as insight}
              <article class="insight-result">
                <span class="eyebrow">POSSIBLE PATTERN</span>
                <h3>{insight.pattern ?? insight}</h3>
                {#if insight.evidence}
                  <p>{insight.evidence}</p>
                {/if}
                {#if insight.confidence}
                  <span class="confidence"
                    >Confidence: {insight.confidence}</span
                  >
                {/if}
              </article>
            {/each}

            <article class="experiment-suggestion">
              <span class="eyebrow">YOUR NEXT ACTION</span>
              <p>{insights.experiment}</p>
            </article>
          </div>
        {/if}
      </section>

      <section class="panel">
        <h2>Habit and mood comparisons</h2>
        {#if filteredHistory.length < 3}
          <p>
            Save at least three check-ins to begin exploring simple habit and
            mood comparisons.
          </p>
        {:else}
          <div class="pattern-grid">
            {#each habits.filter( (habit) => filteredHistory.some( (entry) => entry.habits?.includes(habit), ), ) as habit}
              {@const matches = filteredHistory.filter((entry) =>
                entry.habits?.includes(habit),
              )}
              <article class="pattern-card">
                <span class="pattern-icon">✳</span>
                <strong>{habit}</strong>
                <p>
                  Average mood on logged days:
                  {(
                    matches.reduce(
                      (sum, entry) => sum + Number(entry.mood),
                      0,
                    ) / matches.length
                  ).toFixed(1)}/10
                </p>
                <small>{matches.length} check-ins</small>
              </article>
            {/each}
          </div>
        {/if}
      </section>
    {:else}
      <section class="page-intro">
        <p class="eyebrow">SMALL EXPERIMENTS, NEW DISCOVERIES</p>
        <h1>Your experiments<span>.</span></h1>
        <p>Try one small action and observe how you feel.</p>
      </section>

      <section class="experiment-list">
        <ExperimentCard {category} />
        <ExperimentCard
          {category}
          title="Get outside"
          description="Spend 10 minutes outdoors. Notice your mood and energy before and afterward."
          icon="☼"
        />
        <ExperimentCard
          {category}
          title="Connect with someone"
          description="Have one meaningful conversation today. Reflect on how it felt."
          icon="♡"
        />
      </section>
    {/if}

    <footer class="footer">
      <span>HIGHHIT © 2026</span>
      <span>A Tool For Building Your Future</span>
    </footer>
  </main>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  .app-shell {
    --green: #285e4d;
    --green-dark: #194c3c;
    --ink: #172b26;
    --muted: #81908a;
    --line: #e4e6dc;
    --paper: #f7f7f1;
    --card: #fffefa;
    display: grid;
    grid-template-columns: 230px minmax(0, 1fr);
    min-height: 100vh;
    background: var(--paper);
    color: var(--ink);
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }

  .sidebar {
    background: #fffefa;
    border-right: 1px solid var(--line);
    padding: 26px 18px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--ink);
    font-size: 19px;
    font-weight: 700;
    margin-bottom: 42px;
  }

  .brand-mark {
    display: grid;
    place-items: center;
    width: 35px;
    height: 35px;
    border-radius: 12px;
    background: var(--green);
    color: white;
  }

  .brand-light {
    font-weight: 400;
    color: #7e9489;
  }
  nav {
    display: grid;
    gap: 7px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 13px 14px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #73817a;
    text-align: left;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }

  .nav-item span {
    width: 18px;
    font-size: 17px;
  }
  .nav-item.active {
    background: #eaf0e6;
    color: var(--green-dark);
    font-weight: 650;
  }

  .sidebar-bottom {
    margin-top: auto;
    padding: 16px;
    border-radius: 15px;
    background: #f0f0e6;
  }

  .sidebar-bottom h2 {
    font-size: 15px;
    margin: 0 0 14px;
  }

  .main-content {
    width: 100%;
    max-width: 1600px;
    min-width: 0;
    margin: 0 auto;
    padding: 0 38px 28px;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 66px;
    border-bottom: 1px solid var(--line);
    gap: 16px;
  }

  .breadcrumb,
  .eyebrow,
  .stat-label {
    color: #668075;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.3px;
  }

  .category-switch {
    display: flex;
    gap: 6px;
    padding: 4px;
    border: 1px solid var(--line);
    background: #eeefe8;
    border-radius: 12px;
  }

  .category-switch button {
    padding: 9px 17px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: #718079;
    cursor: pointer;
    font: inherit;
    font-size: 12px;
  }

  .category-switch button.active {
    background: var(--green);
    color: white;
    box-shadow: 0 2px 6px #183c2c20;
  }

  .welcome {
    padding: 34px 0 25px;
  }
  h1 {
    margin: 0;
    font-size: clamp(27px, 3vw, 39px);
    letter-spacing: -1.6px;
    line-height: 1.17;
  }
  .welcome h1 span,
  .page-intro h1 span {
    color: #819f91;
  }
  .welcome p,
  .page-intro > p:last-child {
    color: var(--muted);
    font-size: 13px;
    margin-top: 13px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 22px;
  }

  .stat-card,
  .panel {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 15px;
    padding: 22px;
  }

  .stat-value {
    font-size: 31px;
    font-weight: 650;
    letter-spacing: -1px;
    margin: 10px 0 6px;
  }
  .stat-value small,
  .history-score small {
    font-size: 12px;
    font-weight: 450;
    color: #83938b;
  }
  .stat-foot {
    font-size: 11px;
    color: var(--muted);
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(290px, 0.95fr);
    gap: 22px;
    align-items: start;
  }

  .form-column,
  .history-column {
    min-width: 0;
  }
  .history-column {
    padding-top: 5px;
  }

  .section-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
  }

  .section-heading h2,
  .panel h2 {
    font-size: 19px;
    letter-spacing: -0.5px;
    margin: 7px 0 0;
  }
  .section-heading p:not(.eyebrow) {
    color: var(--muted);
    font-size: 12px;
  }
  .text-button {
    border: 0;
    background: none;
    color: var(--green);
    cursor: pointer;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 650;
  }

  .history-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 12px;
    margin-bottom: 9px;
    transition:
      transform 0.15s,
      box-shadow 0.15s;
  }

  .history-row:hover {
    transform: translateY(-2px);
    box-shadow: 0 7px 20px #263c2c0b;
  }
  .history-icon {
    display: grid;
    place-items: center;
    flex: 0 0 38px;
    height: 38px;
    border-radius: 11px;
    background: #edf0e4;
    color: var(--green);
    font-size: 20px;
  }
  .history-info {
    display: grid;
    gap: 5px;
    min-width: 0;
    flex: 1;
  }
  .history-info strong {
    font-size: 13px;
  }
  .history-info span {
    font-size: 11px;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
  .history-score {
    font-size: 18px;
    font-weight: 650;
    white-space: nowrap;
  }

  .empty-state {
    padding: 34px 20px;
    border: 1px dashed #d9ded3;
    border-radius: 14px;
    text-align: center;
    background: #fffefa;
  }
  .empty-icon {
    display: block;
    font-size: 26px;
    color: #7b9c89;
    margin-bottom: 10px;
  }
  .empty-state strong {
    font-size: 14px;
  }
  .empty-state p {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.6;
  }

  .page-intro {
    padding: 42px 0 25px;
  }
  .page-intro h1 {
    margin-top: 10px;
  }
  .panel {
    margin-bottom: 20px;
  }
  .panel > p {
    color: var(--muted);
    font-size: 13px;
  }
  .pattern-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 13px;
    margin-top: 20px;
  }
  .pattern-card,
  .insight-result,
  .experiment-suggestion {
    padding: 20px;
    border: 1px solid var(--line);
    border-radius: 13px;
    background: #fffefa;
  }
  .pattern-icon {
    display: block;
    color: #6b927c;
    font-size: 20px;
    margin-bottom: 12px;
  }
  .pattern-card strong {
    font-size: 15px;
  }
  .pattern-card p,
  .insight-result p,
  .experiment-suggestion p {
    color: #738079;
    font-size: 13px;
    line-height: 1.7;
  }
  .pattern-card small,
  .confidence {
    color: #7b9284;
    font-size: 11px;
  }
  .primary-button {
    padding: 12px 17px;
    border: 0;
    border-radius: 9px;
    background: var(--green);
    color: white;
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    font-weight: 650;
  }
  .primary-button:hover {
    background: var(--green-dark);
  }
  .primary-button:disabled {
    opacity: 0.65;
    cursor: wait;
  }
  .ai-insights {
    display: grid;
    gap: 12px;
    margin-top: 20px;
  }
  .insight-result h3 {
    margin: 10px 0;
    font-size: 17px;
  }
  .experiment-suggestion {
    background: #edf2e8;
  }
  .experiment-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }
  .error-message {
    padding: 12px 14px;
    color: #9e413b;
    background: #fff0ed;
    border-radius: 9px;
    font-size: 12px;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    margin-top: 50px;
    padding-top: 20px;
    border-top: 1px solid var(--line);
    color: #9aa39b;
    font-size: 9px;
    letter-spacing: 1px;
  }

  @media (min-width: 1450px) {
    .content-grid {
      grid-template-columns: minmax(0, 1.1fr) minmax(350px, 0.9fr);
      gap: 28px;
    }
    .main-content {
      padding-left: 48px;
      padding-right: 48px;
    }
  }

  @media (max-width: 1000px) {
    .app-shell {
      grid-template-columns: 190px minmax(0, 1fr);
    }
    .main-content {
      padding: 0 24px 24px;
    }
    .content-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .history-column {
      margin-top: 12px;
    }
  }

  @media (max-width: 650px) {
    .app-shell {
      grid-template-columns: 1fr;
    }
    .sidebar {
      position: static;
      height: auto;
      min-height: auto;
      padding: 14px 16px;
      border-right: 0;
      border-bottom: 1px solid var(--line);
    }
    .brand {
      margin-bottom: 15px;
    }
    .sidebar-bottom {
      display: none;
    }
    nav {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4px;
    }
    .nav-item {
      justify-content: center;
      padding: 11px 5px;
      gap: 6px;
      font-size: 11px;
    }
    .nav-item span {
      width: auto;
    }
    .main-content {
      padding: 0 15px 22px;
    }
    .topbar {
      min-height: 60px;
    }
    .breadcrumb {
      font-size: 8px;
      letter-spacing: 0.7px;
    }
    .category-switch button {
      padding: 8px 10px;
    }
    .welcome {
      padding-top: 28px;
    }
    .stats-grid {
      gap: 9px;
    }
    .stat-card {
      padding: 15px;
    }
    .stat-value {
      font-size: 25px;
    }
    .stat-label {
      font-size: 8px;
    }
    .section-heading {
      align-items: flex-start;
    }
    .section-heading h2 {
      font-size: 17px;
    }
    .panel {
      padding: 16px;
    }
    .footer {
      flex-direction: column;
    }
  }
</style>
