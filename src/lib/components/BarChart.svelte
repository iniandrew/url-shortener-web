<script lang="ts">
	let {
		days,
		label = 'Daily clicks'
	}: {
		days: { day: string; clicks: number }[];
		label?: string;
	} = $props();

	const max = $derived(Math.max(1, ...days.map((d) => d.clicks)));
	const total = $derived(days.reduce((sum, d) => sum + d.clicks, 0));

	// Sparse x labels: first, middle, last — enough to read the range at a glance.
	const ticks = $derived(
		days.length <= 1
			? [days[0]?.day]
			: [days[0].day, days[Math.floor((days.length - 1) / 2)].day, days[days.length - 1].day]
	);
</script>

<div
	role="img"
	aria-label="{label}: {total} clicks across {days.length} days, peak {max} on the busiest day"
>
	<div class="flex h-40 items-end gap-px" aria-hidden="true">
		{#each days as d (d.day)}
			<div
				class="flex-1 rounded-t-sm transition-[height] {d.clicks > 0
					? 'bg-brand-500/80 hover:bg-brand-400'
					: 'bg-zinc-200 dark:bg-zinc-800'}"
				style="height: {d.clicks > 0 ? Math.max(4, (d.clicks / max) * 100) : 2}%"
				title="{d.day}: {d.clicks} clicks"
			></div>
		{/each}
	</div>
	<div
		class="mt-1 flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500"
		aria-hidden="true"
	>
		{#each ticks as t (t)}
			{t?.slice(5)}
		{/each}
	</div>
</div>
