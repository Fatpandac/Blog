---
title: 从 Neovim 迁移到 VSCode
date: 2025-12-13
tags:
  - Neovim
  - VSCode
categories:
  - 杂文
---

最近因为一些原因需要使用 VSCode 进行开发工作，之前一直使用 Neovim 作为主要的编辑器，
所以在迁移到 VSCode 的过程中遇到了一些问题和挑战，下面记录一下我的迁移过程和经验。

<!-- more -->

在迁移之前需要明确一点就是我作为一个 Mouseless 的推崇者，Neovim 之所以吸引我主要是因为它强大的键盘操作和插件生态，
所以在迁移到 VSCode 的过程中，我的首要任务就是尽可能地保留这种高效的键盘操作体验。

我安装了一些 VSCode 插件来模拟 Neovim 的功能，比如 [VSCode Neovim](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim) 插件，它可以让 VSCode 支持 Vim 的键盘操作模式，并且更好的将 VSCode 一些指令映射到 Neovim 的按键上。接下来，我配置了一些快捷键映射，使得 VSCode 的操作方式更接近 Neovim。例如，我将常用的文件导航、搜索和编辑命令映射到与 Neovim 相似的按键组合上，这样可以减少切换编辑器时的学习成本。但是仅仅这个插件并不能帮我完全的实现在仅使用键盘操作的需求，所以我还要修改一些 VSCode 默认的快捷键映射。

调用 VSCode 的命令面板（Command Palette），我将其快捷键映射为 `Cmd + k`，因为这个组合在很多地方都经常使用比如访问的一些网页的搜索、文档等地方都使用这个快捷键来进行搜索和命令调用，那么就顺水推舟使用这个命令，然后就是切换命令默认的命令切换是通过 `tab` 键来切换的，但是这样的话向上移动的话需要使用 `shift + tab` 组合键，这样的快捷键组合还是不太方便使用，在使用的时候手在键盘上移动的位置距离太大了，于是我将这个快捷键映射为 `ctrl + j` 和 `ctrl + k` 来完成命令的上下切换，这样就可以更方便的使用命令面板了同时在其他选项上也做了这样的修改，比如快捷修复等地方。

在日常开发的时候终端就是一个必要的工具，在 VSCode 里面内置了终端功能，但是唤起终端的命令默认是 `ctrl + ~` 组合键，这个组合键对于我来说还是不太方便使用，于是我把这个快捷键映射为 `Cmd + j` 来完成，因为这个快捷键方便记忆同时也比较方便使用, cmd 可以看作 command 的缩写然后 j 可以看作是 jump 的意思，跳转到终端里面去，然后在把这个终端的默认大小设置为全屏这样就可以更好的使用终端了，但还有一个问题就是在 VSCode 里面多终端需要复杂的交互切换，于是我写了一个 `tmux` 小脚本将其配置到 `terminal.integrated.defaultProfile`, 这样我打开终端的时候默认进入对应的 `tmux session` 里面，这样就可以更好的管理多个终端了，对应的脚本如下：

```sh
#!/bin/bash

# 使用当前文件名称作为 session 名称，方便管理
sessionName=$1

if [[ -z $sessionName ]]; then
  sessionName=$(basename "$PWD")
fi

# 限制最大 session 数量
MAX_SESSIONS=5
current_sessions=$(tmux list-sessions 2>/dev/null | wc -l)

if tmux has-session -t "$sessionName" 2>/dev/null; then
  tmux attach-session -t "$sessionName"
  exit 0
fi

if (( current_sessions >= MAX_SESSIONS )); then
  oldest_session=$(tmux list-sessions -F "#{session_name} #{session_last_attached}" \
                   | sort -k2n \
                   | head -n 1 \
                   | awk '{print $1}')

  echo "关闭最久未使用的 session: $oldest_session"
  read -p "按回车继续，或按 Ctrl+C 取消..."
  tmux kill-session -t "$oldest_session"
fi

tmux new-session -d -s $sessionName
window=1
tmux new-window -t $session:$window -n 'terminal'

tmux attach-session -t $sessionName
```

完成上面的部份基本就可以在 VSCode 里面完成大部分的开发工作了，但是缺少一个比较重要的功能就如何在项目文件里面遨游以及多个项目之间来回切换呢！

首先就是解决看项目文件结构以及文件结构调整的这些操作，于是我找到了一个插件可以方便的浏览项目文件结构，这个插件叫做 [Yazi VSCode](https://marketplace.visualstudio.com/items?itemName=dautroc.yazi-vscode)，他可以在编辑 tab 打开一个全屏终端然后在里面打开 `yazi` 这个工具来浏览项目文件结构，同时也可以进行文件的增删改查等操作，基本上可以满足我对项目文件结构浏览的需求。我将这个插件的启动映射到了 `Ctrl + n` 这样我就可以快捷的打开项目文件结构浏览器了。

接着是多个项目之间的切换问题我一开始使用的是 [Project Manager](https://marketplace.visualstudio.com/items?itemName=alefragnani.project-manager) 这个插件来管理多个项目的切换，但是这个插件在每一次添加新的项目的时候都要手动 Refresh 一下更新项目列表，这样有点太不自然了，于是我就借鉴了 `yazi` 插件的实现方式，实现了一个插件叫 [fzfsearch](https://marketplace.visualstudio.com/items?itemName=Fatpandac.fzfsearch) 这个插件通过 `fzf` 和一些命令行工具实现快速的在项目之间切换，同时也可以在项目文件里面进行快速的文件搜索和内容搜索，这样我也就实现了 Neovim 上的 telescope
插件的相关功能，大大的提升了我的工作效率，使得在项目里如鱼得水般丝滑的来回跳跃，具体的介绍可以看我的另一篇文章 [在 VSCode 里实现类似 telescope 的文件搜索体验](../11/fzf_search.md)。然后我分别将他们的
快捷键映射为 `space + fg`、`space + ff` 和 `space + fw` 来完成项目切换、文件搜索和内容搜索，配置的脚本如下:

```vim
nnoremap <silent> <leader>ff :<C-u>call VSCodeNotify('fzfsearch.search.file.toggle')<CR>
nnoremap <silent> <leader>fw :<C-u>call VSCodeNotify('fzfsearch.search.content.toggle')<CR>
nnoremap <silent> <leader>fg :<C-u>call VSCodeNotify('fzfsearch.search.repo.toggle')<CR>
```

然后通过 Neovim 配置了一些 VSCode 命令如下：

```vim
nnoremap <silent> <leader>x :<C-u>call VSCodeNotify('workbench.action.closeActiveEditor')<CR>
nnoremap <silent> <leader>X :<C-u>call VSCodeNotify('workbench.action.closeOtherEditors')<CR>
nnoremap <silent> <leader>fm :<C-u>call VSCodeNotify('editor.action.formatDocument')<CR>
nnoremap <silent> gd :<C-u>call VSCodeNotify('editor.action.revealDefinition')<CR>
nnoremap <silent> gr :<C-u>call VSCodeNotify('editor.action.goToReferences')<CR>
nnoremap <silent> gg :<C-u>call VSCodeNotify('list.focusFirst')<CR>
nnoremap <silent> gg :<C-u>call VSCodeNotify('cursorTop')<CR>
nnoremap <silent> <leader>ra :<C-u>call VSCodeNotify('editor.action.rename')<CR>
nnoremap <silent> cl :call CopyCursorPosGitRoot()<CR>

function! CopyCursorPosGitRoot()
  let file = expand('%:p')

  let git_root = system('git -C ' . shellescape(fnamemodify(file, ':h')) . ' rev-parse --show-toplevel')
  let git_root = substitute(git_root, '\n$', '', '')

  if v:shell_error != 0 || git_root == ''
    let relative = expand('%:.')
  else
    let relative = substitute(file, git_root . '/', '', '')
  endif

  let line = line('.')

  let @+ = relative . ':' . line
endfunction
```

总的来说，虽然从 Neovim 迁移到 VSCode 过程中遇到了一些挑战，但是通过合理的插件选择和快捷键映射，我成功地保留了 Neovim 的高效键盘操作体验，同时也享受到了 VSCode 丰富的插件生态和强大的功能。希望我的经验能对其他想要从 Neovim 迁移到 VSCode 的用户有所帮助！
