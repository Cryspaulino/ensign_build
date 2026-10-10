<script>
  export let mood = 7;
  export let energy = 6;
  export let stress = 4;
  export let habits = [];
  export let selectedHabits = [];
  export let user = null;
  export let onToggleHabit = () => {};
  export let onSave = () => {};
  export let saving = false;

  $: moodLabel =
    mood <= 3
      ? "A difficult day"
      : mood <= 5
        ? "An okay day"
        : mood <= 7
          ? "Feeling good"
          : "Feeling great";
</script>

<section class="checkin-card">
  <div class="card-heading">
    <div>
      <p class="eyebrow">DAILY REFLECTION</p>
      <h2>How are you, really?</h2>
    </div>
    <span class="card-spark">✳</span>
  </div>

  <p class="field-label">How are you feeling today?</p>

  <div class="mood-display">
    <div class="mood-emoji">
      {mood <= 3 ? "☹" : mood <= 5 ? "😐" : mood <= 7 ? "🙂" : "☺"}
    </div>
    <div>
      <strong>{moodLabel}</strong>
      <!-- <span>Your mood today</span> -->
    </div>
    <div class="mood-number">{mood}<small>/10</small></div>
  </div>

  <input
    aria-label="Mood from 1 to 10"
    type="range"
    min="1"
    max="10"
    bind:value={mood}
    oninput={() => (mood = Number(mood))}
    class="mood-slider"
    style={`--progress: ${((mood - 1) / 9) * 100}%`}
  />

  <div class="range-labels">
    <span>Not great</span>
    <span>Amazing</span>
  </div>

  <div class="metric-row">
    <div class="metric-label">
      <span>⚡</span> Energy
      <strong>{energy}/10</strong>
    </div>
    <input
      aria-label="Energy level"
      type="range"
      min="1"
      max="10"
      bind:value={energy}
    />
  </div>

  <div class="metric-row">
    <div class="metric-label">
      <span>〰</span> Stress
      <strong>{stress}/10</strong>
    </div>
    <input
      aria-label="Stress level"
      type="range"
      min="1"
      max="10"
      bind:value={stress}
    />
  </div>

  <div class="field-section">
    <p class="field-label">What have you done today?</p>
    <p class="field-hint">Select anything that applies.</p>

    <div class="habit-options">
      {#each habits as habit}
        <button
          type="button"
          class:chosen={selectedHabits.includes(habit)}
          class="habit-chip"
          onclick={() => onToggleHabit(habit)}
        >
          <span>{selectedHabits.includes(habit) ? "✓" : "+"}</span>
          {habit}
        </button>
      {/each}
    </div>
  </div>

  <button class="primary-button" disabled={saving || !user} onclick={onSave}>
    {#if user}
      Save today’s check-in →
    {:else if saving}
      Saving...
    {:else}
      Log in to save your check in
    {/if}
  </button>
</section>
