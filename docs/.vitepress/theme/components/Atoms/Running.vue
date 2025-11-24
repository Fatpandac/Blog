<template>
    <ul class="w-full list-none p-0! m-0!" v-if="Object.keys(data).length">
        <li v-for="([key, entry], _) in Object.entries(data)" :key="key"
            class="mb-2 border-b last:border-b-0 list-none items-center tabular-nums flex gap-1 flex-wrap justify-start">
            <span class="text-md flex items-center min-w-[160px] flex-1 gap-1">
                <div class="i-solar:calendar-date-line-duotone inline-block" />
                <span>Date: {{ key }}</span>
            </span>
            <span class="text-md flex items-center min-w-[160px] flex-1 gap-1">
                <div class="i-solar:running-round-line-duotone inline-block" />
                <span>Distance: {{ entry.distance.toFixed(2) }} km</span>
            </span>
            <span class="text-md flex items-center min-w-[160px] flex-1 gap-1">
                <div class="i-solar:spedometer-low-line-duotone inline-block" />
                <span>Pace: {{ entry.pace.toFixed(2) }} min/km</span>
            </span>
            <span class="text-md flex items-center min-w-[160px] flex-1 gap-1">
                <div class="i-solar:cup-paper-line-duotone inline-block" />
                <span>Power: {{ entry.power.toFixed(2) }} W</span>
            </span>
        </li>
    </ul>
    <div v-else class="w-full flex items-center justify-center py-10 text-gray-500">
        Running...
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
const DataURL = import.meta.env.DEV ? '/api/running' : 'https://hidden-mud-7c6e.tingfeizheng.workers.dev/running';
type RunningData = {
    distance: number;
    pace: number;
    power: number;
};

const data = ref<Record<string, RunningData>>({});
onMounted(async () => {
    const values = await fetch(DataURL).then(res => res.json());
    data.value = values.data;
})
</script>