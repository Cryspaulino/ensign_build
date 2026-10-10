<script>
  import CheckIn from "./CheckIn.svelte";
  import InsightCard from "./InsightCard.svelte";
  import ExperimentCard from "./ExperimentCard.svelte";
  import { onMount } from "svelte";
  import {
    saveCheckIn as saveCheckInToFirebase,
    getCheckIns,
  } from "../lib/checkins.js";

  export const prerender = false;

  let activeTab = "Overview";
  let mood = 0;
  let energy = 0;
  let stress = 0;
  let selectedHabits = [""];

  let saved = false;
  let showHistory = false;

  let insights = null;
  let loadingInsights = false;
  let insightError = "";

  async function generateInsights() {
    loadingInsights = true;
    insightError = "";

    try {
      const checkins = await getCheckIns();

      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkins }),
      });

      if (!response.ok) throw new Error("Request failed");

      insights = await response.json();
    } catch {
      insightError = "Could not generate insights. Try again.";
    } finally {
      loadingInsights = false;
    }
  }

  const tabs = ["Overview", "My patterns", "Experiments"];

  const habits = [
    "Exercise",
    "Walk",
    "Social time",
    "Good sleep",
    "Meditation",
    "Time outdoors",
    "Volleyball",
  ];

  function toggleHabit(habit) {
    selectedHabits = selectedHabits.includes(habit)
      ? selectedHabits.filter((item) => item !== habit)
      : [...selectedHabits, habit];

    saved = false;
  }

  let history = [];
  let saving = false;
  let saveError = "";

  onMount(async () => {
    try {
      history = await getCheckIns();
    } catch (error) {
      console.error("Could not load check-ins:", error);
      saveError = "Could not load your check-ins.";
    }
  });

  async function saveCheckIn() {
    saving = true;
    saved = false;
    saveError = "";

    const entry = {
      date: new Date().toISOString(),
      mood: Number(mood),
      energy: Number(energy),
      stress: Number(stress),
      habits: [...selectedHabits],
    };

    try {
      await saveCheckInToFirebase(entry);
      history = await getCheckIns();
      saved = true;
    } catch (error) {
      console.error("Could not save check-in:", error);
      saveError = "Could not save. Please try again.";
    } finally {
      saving = false;
    }
  }

  $: averageMood = history.length
    ? (
        history.reduce((sum, item) => sum + item.mood, 0) / history.length
      ).toFixed(1)
    : "—";
</script>

<svelte:head>
  <title>HappyHit</title>
  <meta name="description" content="Your personal well-being lab." />
</svelte:head>

<div class="app-shell">
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="Happiness Lab home">
      <span class="brand-mark">h.</span>
      <span>Happy<span class="brand-light">Hit</span></span>
    </a>

    <!-- <div class="profile">
      <div class="avatar">*</div>
      <div>
        <strong>Your personal lab</strong>
        <span>Small steps, real insights</span>
      </div>
    </div> -->

    <p class="nav-label">YOUR SPACE</p>

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
      <h2>Your daily insights</h2>

      <InsightCard
        title="A pattern takes time"
        description="As you log more days, we can compare your habits with how you feel and look for possible connections."
        icon="⌁"
        color="lavender"
        tag="GETTING STARTED"
      />
      <!-- <div class="quote-mark">“</div>
      <p>One hit at a time!</p>
      <span>YOUR DAILY REMINDER</span> -->
    </div>
  </aside>

  <main class="main-content">
    <header class="topbar">
      <span class="breadcrumb">YOUR SPACE / {activeTab.toUpperCase()}</span>
      <div class="today-badge">
        <span class="status-dot"></span>
        YOUR WELL-BEING JOURNAL
      </div>
    </header>

    {#if activeTab === "Overview"}
      <section class="welcome">
        <div>
          <!-- <p class="eyebrow">A LITTLE MORE SELF-AWARENESS</p> -->
          <h1>Build your happiness<br /><span>One hit at a time</span></h1>
          <p class="welcome-copy">
            Discover the little things that shape how you feel.
          </p>
        </div>

        <!-- <div class="sun-art" aria-hidden="true">
          <div class="sun-core">✳</div>
          <span class="orbit orbit-one"></span>
          <span class="orbit orbit-two"></span>
          <span class="sun-dot">✦</span>
        </div> -->
      </section>

      <section class="stats-grid">
        <article class="stat-card">
          <span class="stat-label">AVERAGE MOOD</span>
          <div class="stat-value">{averageMood}<small>/10</small></div>
          <span class="stat-foot">Based on your saved check-ins</span>
        </article>

        <article class="stat-card">
          <span class="stat-label">DAYS CHECKED IN</span>
          <div class="stat-value">{history.length}<small> days</small></div>
          <span class="stat-foot">Every entry teaches you something</span>
        </article>

        <!-- <article class="stat-card accent-card">
          <span class="stat-label">YOUR APPROACH</span>
          <div class="stat-value small-value">Stay curious <span>✳</span></div>
          <span class="stat-foot">Progress, not perfection</span>
        </article> -->
      </section>

      <section class="content-grid">
        <div class="left-column">
          <CheckIn
            bind:mood
            bind:energy
            bind:stress
            {habits}
            {selectedHabits}
            onToggleHabit={toggleHabit}
            onSave={saveCheckIn}
            {saved}
            {saving}
          />
          {#if saveError}
            <p role="alert">{saveError}</p>
          {/if}

          <div class="section-heading">
            <div>
              <p class="eyebrow">YOUR JOURNEY</p>
              <h2>Recent check-ins</h2>
            </div>
            <button
              class="text-button"
              onclick={() => (showHistory = !showHistory)}
            >
              {showHistory ? "Show less ↑" : "View all →"}
            </button>
          </div>

          {#if history.length === 0}
            <div class="empty-state">
              <span class="empty-icon">☼</span>
              <strong>Your story starts here.</strong>
              <p>
                Complete your first check-in to start tracking your patterns.
              </p>
            </div>
          {:else}
            {#each showHistory ? [...history].reverse() : [...history]
                  .reverse()
                  .slice(0, 3) as entry}
              <div class="history-row">
                <div class="history-icon">☼</div>
                <div class="history-info">
                  <strong
                    >{new Date(entry.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}</strong
                  >
                  <span>{entry.habits?.join(", ") || "No habits selected"}</span
                  >
                </div>
                <div class="history-score">{entry.mood}<small>/10</small></div>
              </div>
            {/each}
          {/if}
        </div>

        <aside class="right-column">
          <!-- <p class="eyebrow">A NEW PERSPECTIVE</p>
          <h2>Your daily insights</h2>

          <InsightCard
            title="A pattern takes time"
            description="As you log more days, we can compare your habits with how you feel and look for possible connections."
            icon="⌁"
            color="lavender"
            tag="GETTING STARTED"
          /> -->

          <p class="eyebrow experiment-eyebrow">YOUR NEXT SMALL STEP</p>
          <ExperimentCard />
        </aside>
      </section>
    {:else if activeTab === "My patterns"}
      <section class="page-intro">
        <p class="eyebrow">NOTICE WHAT MATTERS</p>
        <h1>Your patterns<span>.</span></h1>
        <p>Learn from your own experiences, one observation at a time.</p>
      </section>

      <div class="panel">
        <h2>What your check-ins tell us</h2>
        {#if history.length < 3}
          <div class="empty-state">
            <span class="empty-icon">⌁</span>
            <strong>You're building your baseline.</strong>
            <p>
              Save at least three check-ins to begin exploring simple habit and
              mood comparisons.
            </p>
          </div>
        {:else}
          <div class="pattern-grid">
            {#each habits.filter( (h) => history.some( (e) => e.habits?.includes(h), ), ) as habit}
              <div class="pattern-card">
                <span class="pattern-icon">✳</span>
                <strong>{habit}</strong>
                <p>
                  Average mood on logged days:
                  {(
                    history
                      .filter((e) => e.habits?.includes(habit))
                      .reduce((sum, e) => sum + e.mood, 0) /
                    history.filter((e) => e.habits?.includes(habit)).length
                  ).toFixed(1)}/10
                </p>
                <small>
                  {history.filter((e) => e.habits?.includes(habit)).length}
                  {" "} checkins result.
                </small>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <section class="page-intro">
        <p class="eyebrow">SMALL EXPERIMENTS, NEW DISCOVERIES</p>
        <h1>Your experiments<span>.</span></h1>
        <p>Try one small action and observe how you feel.</p>
      </section>

      <div class="experiment-list">
        <ExperimentCard />
        <ExperimentCard
          title="Get outside"
          description="Spend 10 minutes outdoors. Notice your mood and energy before and afterward."
          icon="☼"
        />
        <ExperimentCard
          title="Connect with someone"
          description="Have one meaningful conversation today. Reflect on how it felt."
          icon="♡"
        />
      </div>
    {/if}

    <button
      class="primary-button"
      onclick={generateInsights}
      disabled={loadingInsights}
    >
      {loadingInsights ? "Finding patterns..." : "Discover my patterns"}
    </button>

    {#if insightError}
      <p role="alert">{insightError}</p>
    {/if}

    {#if insights}
      {#each insights.insights ?? [] as insight}
        <article class="insight-card">
          <p>
            {typeof insight === "string" ? insight : JSON.stringify(insight)}
          </p>
        </article>
      {/each}

      <h3>Your next experiment</h3>
      <p>{insights.experiment}</p>
    {/if}

    <footer class="footer">
      <span>HAPPYHIT © 2026</span>
      <span>A TOOL FOR Happines-Building</span>
    </footer>
  </main>
</div>
