<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import NavBarTitle from "../Atoms/NavBarTitle.vue";
import { computed } from "vue";
import { useData } from "vitepress";
const { Layout } = DefaultTheme;

const siteName = computed(() => {
    const { site } = useData()
    return site.value.title
})
</script>

<template>
    <Layout>
        <template #nav-bar-title-after>
            <NavBarTitle class="w-8 h-8" :title="siteName" />
        </template>
    </Layout>
</template>
