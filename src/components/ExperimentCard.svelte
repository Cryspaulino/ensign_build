<script>
  export let title = 'Take a mindful walk';
  export let description = 'Spend 10 minutes walking without distractions. Check in with your mood before and afterward.';
  export let icon = '☼';

  let completed = false;
  let beforeMood = 5;
  let afterMood = 5;
  let rated = false;

  function reset() {
    completed = false;
    rated = false;
  }
</script>

<article class="experiment-card">
  <div class="experiment-illustration">
    <span>{icon}</span>
    <div class="experiment-time">10 MIN</div>
  </div>

  <div class="experiment-content">
    <span class="experiment-label">YOUR NEXT EXPERIMENT</span>
    <h3>{title}</h3>
    <p>{description}</p>

    {#if !completed}
      <button class="primary-button" onclick={() => completed = true}>
        Try this today →
      </button>
    {:else if !rated}
      <div class="experiment-rating">
        <label>
          Mood before
          <select bind:value={beforeMood}>
            {#each [1,2,3,4,5,6,7,8,9,10] as n}
              <option value={n}>{n}/10</option>
            {/each}
          </select>
        </label>
        <label>
          Mood after
          <select bind:value={afterMood}>
            {#each [1,2,3,4,5,6,7,8,9,10] as n}
              <option value={n}>{n}/10</option>
            {/each}
          </select>
        </label>
        <button class="primary-button" onclick={() => rated = true}>
          Save reflection
        </button>
      </div>
    {:else}
      <div class="experiment-result">
        <strong>
          {afterMood > beforeMood ? 'Mood improved ✳' :
           afterMood < beforeMood ? 'Today felt harder' :
           'Your mood stayed the same'}
        </strong>
        <p>
          {afterMood - beforeMood > 0 ? '+' : ''}{afterMood - beforeMood} points
          {' '}reported. One observation isn't a trend, but it is a start.
        </p>
        <button class="text-button" onclick={reset}>Try again</button>
      </div>
    {/if}
  </div>
</article>