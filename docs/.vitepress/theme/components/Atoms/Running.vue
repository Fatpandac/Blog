<template>
    <div v-if="Object.keys(data).length" class="w-full flex flex-col items-start justify-center gap-4 md:(px-20) lg:(px-40)">
        <div class="text-2xl font-bold text-start">Recent Running Stats</div>
        <ul class="w-full list-none p-0! m-0!">
            <li v-for="([key, entry], index) in Object.entries(data)" :key="key"
                class="mb-2 border-b last:border-b-0 list-none flex items-center gap-4 tabular-nums">
                <span class="font-bold min-w-30 text-md">{{ key }}</span>
                <span class="min-w-45 text-md flex items-center">
                    <div class="i-solar:running-round-line-duotone inline-block mr-1" />
                    <span>Distance: {{ entry.distance.toFixed(2) }} km</span>
                </span>
                <span class="min-w-45 text-md flex items-center">
                    <div class="i-solar:spedometer-low-line-duotone inline-block mr-1" />
                    <span>Pace: {{ entry.pace.toFixed(2) }} min/km</span>
                </span>
                <span class="min-w-45 text-md flex items-center">
                    <div class="i-solar:cup-paper-bold-duotone inline-block mr-1" />
                    <span>Power: {{ entry.power.toFixed(2) }} W</span>
                </span>
            </li>
        </ul>
    </div>
    <div v-else>
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

<style scoped></style>