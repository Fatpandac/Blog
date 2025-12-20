<script setup lang="ts">
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import type { Post } from '../../data/posts.data';
import { useRouter } from 'vitepress';
import { VPBadge } from 'vitepress/theme'
import { useLang } from '../../Composables/useLang';

const router = useRouter();
const currentLang = useLang();

const props = defineProps<{
    posts: Array<Post>;
    /** default: false */
    showDescription?: boolean;
}>();
</script>

<template>
    <ul class="w-full p-0! m-0! list-none!">
        <li v-for="post in props.posts" :key="post.url" @click="router.go(post.url)"
            :class="`py-2 cursor-pointer content-visibility-auto md:(flex justify-center mb-4) md:${props.showDescription ? 'items-end' : 'items-center'} `">
            <div class="flex items-center justify-start flex-1 flex-col md:(mr-4)">
                <div class="flex items-center justify-center w-full">
                    <v-p-badge :text="post.categories?.at(0) || ''" type="info"
                        class="mr-2 bg-blue-100 dark:bg-gray-700 translate-y-0" />
                    <span class="align-middle flex-1 line-clamp-1">{{ post.title }}</span>
                </div>
                <span v-if="props.showDescription"
                    class="align-middle text-xs text-gray-500 mt-1 [&_p]:(m-0 leading-5) w-full [&_a]:pointer-events-none"
                    v-html="post.description"></span>
            </div>
            <span class="block lg:inline text-gray-600 text-sm mt-1 text-right md:(mt-0)">{{
                dayjs(post.date).locale(currentLang).format('MMMM D, YYYY') }}</span>
        </li>
    </ul>
</template>
