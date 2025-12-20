import { useData } from "vitepress";
import { computed } from "vue";

type LangType = 'zh-CN' | 'en-US';

export function useLang() {
    const { site } = useData();
    const currentLang = computed(() => (site.value?.lang || 'en-US') as LangType);

    return currentLang;
}