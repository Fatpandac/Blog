<script setup lang="ts">
import { computed, defineProps } from 'vue';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import type { Post } from '../../data/posts.data';
import { useData, useRouter } from 'vitepress';
import { VPBadge } from 'vitepress/theme'

const router = useRouter();
const { site } = useData();
const currentLang = computed(() => site.value?.lang || 'en');

const props = defineProps<{
    posts: Array<Post>;
}>();

</script>

<template>
    <ul class="w-full p-0! m-0! list-none!">
        <li v-for="post in props.posts" :key="post.url" @click="router.go(post.url)"
            class="py-2 cursor-pointer content-visibility-auto md:(flex items-center justify-center mb-4) hover:(text-blue-600 bg-blue-50 rounded dark:(bg-gray-800 text-blue-400))">
            <div class="flex items-center justify-center flex-1">
                <v-p-badge :text="post.categories.at(0)" type="info"
                    class="mr-2 bg-blue-100 dark:bg-gray-700 translate-y-0" />
                <span class="align-middle flex-1 line-clamp-1">{{ post.title }}</span>
            </div>
            <span class="block lg:inline text-gray-600 text-sm mt-1 text-right md:(mt-0)">{{
                dayjs(post.date).locale(currentLang).format('MMMM D, YYYY') }}</span>
        </li>
    </ul>
</template>
