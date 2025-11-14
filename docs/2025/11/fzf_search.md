---
title: 在 VSCode 使用 fzf 查找
date: 2025-11-14
tags:
  - fzf
  - VSCode
categories:
  - 杂文
---

这几天因为一些事情需要使用 VSCode 之前在 Neovim 的时候习惯了使用 telescope 来
搜索代码的内容和文件，现在切换到 VSCode 之后为了保持 telescope 的习惯，决定！
在 VSCode 实现一个类似的功能于是就有了一个新的 VSCode 插件，我取名叫 **fzfSearch**！

<!-- more -->

先看东西吧！

![screenshot](/images/fzfSearch.gif)

主要就是在 VSCode 里面在窗口启动一个终端窗口然后在里面使用 `fzf` 来完成对应的搜索，
使用 `bat` 来完成代码的 preview 窗口渲染然后然后在使用内容搜索的时候使用 `ripgrep`。

就这样就可以进行搜索了，这里面 `fzf` 的脚本如下分别为 文件名称搜索 和 文件内容搜索：

```ts
const KEYMAPPING =
  '--bind "ctrl-d:preview-half-page-down,ctrl-u:preview-half-page-up,esc:become:"';
const LAYOUT = "--layout=reverse";

export const SEARCH_FILE_CMD = (chooseFilePaths: string) => {
  return `
fzf \
--preview "bat --color=always --plain {}" \
${LAYOUT} \
${KEYMAPPING} \
--multi > "${chooseFilePaths}"`;
};

export const SEARCH_CONTENT_CMD = (chooseFilePaths: string) => {
  return `
fzf --phony --query "" ${LAYOUT} \
--preview "bat --color=always --plain --highlight-line {2} {1} 2>/dev/null || true" \
--delimiter ':' \
--preview-window "+{2}-10" \
--bind "change:reload:(rg -n {q} || true)" \
${KEYMAPPING} \
--multi > "${chooseFilePaths}"`;
};
```

里面绑定快捷键使用 `ctrl-d` 和 `ctrl-u` 来完成 preview 页面的上下翻页方便浏览。

最后在这个插件里面可以使用如下快捷键完成快速的搜索：  
| 快捷键 | 描述 |
|--------------- | --------------- |
| `ctrl-j` | 向上选择文件 |
| `ctrl-k` | 向下选择文件 |
| `tab` | 多选文件 |
| `enter` | 打开文件 如果没有选择文件默认打开当前光标文件 |
| `ctrl-d` | preview 向下翻页 |
| `ctrl-u` | preview 向上翻页 |

大概就是这些了，希望你喜欢～

<GiscusComments />
