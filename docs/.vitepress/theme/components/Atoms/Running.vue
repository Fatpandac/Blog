<script lang="ts">
const locales = {
    'zh-CN': {
        date: '日期：',
        distance: '距离：',
        pace: '配速：',
        power: '功率：',
    },
    'en-US': {
        date: 'Date: ',
        distance: 'Distance: ',
        pace: 'Pace: ',
        power: 'Power: ',
    }
} as const;

const ICON_MAP = {
    date: 'i-solar:calendar-date-line-duotone',
    distance: 'i-solar:running-round-line-duotone',
    pace: 'i-solar:spedometer-low-line-duotone',
    power: 'i-solar:cup-paper-line-duotone',
} as const;

const UNITS = {
    distance: ' km',
    pace: ' min/km',
    power: ' W',
    date: '',
} as const;
</script>

<script setup lang="ts">
import { defineComponent, h, onMounted, ref } from 'vue';
import { useLang } from '../../Composables/useLang';
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

const CreateStatSpan = defineComponent({
    name: 'CreateStatSpan',
    props: {
        type: {
            type: String as () => keyof typeof ICON_MAP,
            required: true
        },
        value: {
            type: Object as () => RunningData & { date: string },
            required: true
        }
    },
    setup(props) {
        const currentLang = useLang();
        const { type, value } = props;

        return () => h('div', {
            class: 'text-md flex flex-none items-center justify-start min-w-[120px] flex-1 md:(min-w-[160px] justify-center) mx-auto'
        }, [
            h('div', { class: `${ICON_MAP[type]} inline-block mr-1 md:(mr-2)` }),
            h('span', {}, [
                h('span', { class: 'hidden md:(inline-block) whitespace-pre' }, `${locales[currentLang.value][type]}`),
                h('span', { class: 'font-mono tabular-nums' }, `${typeof value[type] === 'number' ? value[type].toFixed(2) : value[type]}${UNITS[type]}`)
            ])
        ])
    },
});

</script>

<template>
    <ul class="w-full list-none p-0! m-0!" v-if="Object.keys(data).length">
        <li v-for="([key, entry], _) in Object.entries(data)" :key="key"
            class="mb-3 border-b last:border-b-0 list-none items-center flex gap-1 flex-wrap justify-start">
            <create-stat-span type="date" :value="{ ...entry, date: key }" />
            <create-stat-span type="distance" :value="{ ...entry, date: key }" />
            <create-stat-span type="pace" :value="{ ...entry, date: key }" />
            <create-stat-span type="power" :value="{ ...entry, date: key }" />
        </li>
    </ul>
    <div v-else class="w-full flex items-center justify-center py-10 text-gray-500">
        Running...
    </div>
</template>
