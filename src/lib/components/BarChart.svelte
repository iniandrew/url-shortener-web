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
	<!-- Instrument readout: sharp bars on a hairline baseline, no gradients. -->
	<div
		class="flex h-36 items-end gap-px border-b border-hairline dark:border-hairline-dark"
		aria-hidden="true"
	>
		{#each days as d (d.day)}
			<div
				class="flex-1 {d.clicks > 0
					? 'bg-signal hover:bg-signal-deep'
					: 'bg-hairline dark:bg-hairline-dark'}"
				style="height: {d.clicks > 0 ? Math.max(4, (d.clicks / max) * 100) : 2}%"
				title="{d.day}: {d.clicks} clicks"
			></div>
		{/each}
	</div>
	<div
		class="mt-1 flex justify-between font-mono text-[10px] text-ink-faint dark:text-ash-faint"
		aria-hidden="true"
	>
		{#each ticks as t (t)}
			{t?.slice(5)}
		{/each}
	</div>
</div>
