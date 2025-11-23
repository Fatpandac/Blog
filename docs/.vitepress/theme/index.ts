import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import MyLayout from "./components/Layout/MyLayout.vue";
import GiscusComments from "./components/Atoms/GiscusComments.vue";
import 'virtual:uno.css'

export default {
  extends: DefaultTheme,
  Layout: MyLayout,
  enhanceApp: ({ app, router, siteData }) => {
    app.component("GiscusComments", GiscusComments);
  }
} satisfies Theme;
