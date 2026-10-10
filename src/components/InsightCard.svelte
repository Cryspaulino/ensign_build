<script>
  export let title = 'A pattern takes time';
  export let description = 'Keep checking in to discover possible connections.';
  // export let icon = '⌁';
  export let color = 'lavender';
  export let tag = 'YOUR INSIGHT';
</script>

<article class={`insight-card ${color}`}>
  <div class="insight-top">
    <!-- <span class="insight-icon">{icon}</span> -->
    <span class="insight-tag">{tag}</span>
  </div>

  <h3>{title}</h3>
  <p>{description}</p>
  <div class="insight-bottom">
    <!-- <span>✳</span> Stay curious about your patterns. -->
  </div>
</article>