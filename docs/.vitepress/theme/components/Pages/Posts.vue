<script lang="ts">
const locales = {
    'zh-CN': {
        allTags: '所有标签',
        allPosts: '所有文章',
    },
    'en-US': {
        allTags: 'All Tags',
        allPosts: 'All Posts',
    }
} as const;
</script>

<script setup lang="ts">
import 'dayjs/locale/zh-cn';
import { data as posts } from '../../data/posts.data';
import { VPBadge } from 'vitepress/theme'
import { computed } from 'vue';
import Section from '../Atoms/Section.vue';
import PostList from '../Atoms/PostList.vue';
import { useLang } from '../../Composables/useLang';
import { useRoute, useRouter } from 'vitepress';

const route = useRoute();
const router = useRouter();
const currentLang = useLang();
const selectedTags = computed(() => {
    const urlParams = new URLSearchParams(route.query);
    const tagsParam = urlParams.get('tags');
    return tagsParam ? tagsParam.indexOf(',') !== -1 ? tagsParam.split(',') : [tagsParam] : [];
});

const showPosts = computed(() => {
    if (selectedTags.value.length === 0) {
        return posts[currentLang.value] || [];
    }
    return posts[currentLang.value].filter(post => selectedTags.value.every(tag => post.tags.includes(tag)));
});

const selectTag = (tag: string) => {
    const tags = new Set(selectedTags.value);
    if (tags.has(tag)) {
        tags.delete(tag);
    } else {
        tags.add(tag);
    }
    const url = new URL(window.location.href);
    if (tags.size > 0) {
        url.searchParams.set('tags', Array.from(tags).join(','));
    } else {
        url.searchParams.delete('tags');
    }
    router.go(url.pathname + url.search, { replace: true });
};
</script>

<template>
    <Section>
        <template #title>
            <div class="w-full text-2xl font-bold text-start mb-2">
                {{ locales[currentLang]?.allTags }}
            </div>
        </template>
        <template #content>
            <div class="flex flex-wrap gap-2 mb-6 justify-start">
                <v-p-badge v-for="tag in Array.from(new Set(posts[currentLang].flatMap(post => post.tags)))" :key="tag"
                    :text="tag" type="info"
                    class=" dark:bg-gray-700 translate-y-0 cursor-pointer hover:(bg-blue-200 dark:bg-gray-600)"
                    :class="selectedTags.includes(tag) ? 'text-white! bg-blue-600! dark:bg-blue-500!' : ''"
                    @click="selectTag(tag)" />
            </div>
        </template>
    </Section>
    <Section>
        <template #title>
            <div class="w-full text-2xl font-bold text-start mb-2">
                {{ locales[currentLang]?.allPosts }}
            </div>
        </template>
        <template #content>
            <PostList :posts="showPosts" />
        </template>
    </Section>
</template>