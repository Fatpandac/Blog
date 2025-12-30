---
title: Migrating from Neovim to VSCode
date: 2025-12-13
tags:
  - Neovim
  - VSCode
categories:
  - Other
---

> [!info]
> This article was auto-translated using ChatGPT.

Recently, due to some reasons, I needed to use VSCode for development work. Previously, I had been using Neovim as my primary editor, so during the migration to VSCode, I encountered some issues and challenges. Below, I document my migration process and experiences.

<!-- more -->

Before migrating, it's important to clarify one point: as an advocate of Mouseless development, what attracted me to Neovim was mainly its powerful keyboard operations and plugin ecosystem. Therefore, during the migration to VSCode, my primary task was to preserve this efficient keyboard operation experience as much as possible.

I installed some VSCode plugins to simulate Neovim's functionality, such as the [VSCode Neovim](https://marketplace.visualstudio.com/items?itemName=asvetliakov.vscode-neovim) plugin, which allows VSCode to support Vim's keyboard operation mode and better map some VSCode commands to Neovim's keybindings. Next, I configured some key mappings to make VSCode's operation method closer to Neovim. For example, I mapped commonly used file navigation, search, and editing commands to key combinations similar to Neovim's, which can reduce the learning cost when switching editors. However, this plugin alone couldn't fully meet my need for keyboard-only operation, so I also had to modify some of VSCode's default key mappings.

To invoke VSCode's Command Palette, I mapped its shortcut to `Cmd + k`, because this combination is frequently used in many places, such as search and command invocation on some web pages and documents. So I followed this convention. Then, for switching commands, the default method is to use the `tab` key, but this requires using the `shift + tab` combination to move upward. This key combination is still not very convenient to use, as the hand movement distance on the keyboard is too large. Therefore, I mapped these shortcuts to `ctrl + j` and `ctrl + k` to navigate up and down through commands, making the Command Palette easier to use. I also made similar modifications in other areas, such as quick fixes.

During daily development, the terminal is an essential tool. VSCode has a built-in terminal feature, but the default command to invoke the terminal is the `ctrl + ~` combination, which is not very convenient for me. So I mapped this shortcut to `Cmd + j` because this shortcut is easy to remember and use. `cmd` can be seen as an abbreviation for "command," and `j` can be interpreted as "jump," meaning jumping into the terminal. Then, I set the terminal's default size to full screen to make better use of it. However, there was still another issue: managing multiple terminals in VSCode requires complex interaction switching. So I wrote a small `tmux` script and configured it in `terminal.integrated.defaultProfile`. This way, when I open the terminal, I automatically enter the corresponding `tmux session`, making it easier to manage multiple terminals. The corresponding script is as follows:

```sh
#!/bin/bash

# Use the current file name as the session name for easy management
sessionName=$1

if [[ -z $sessionName ]]; then
  sessionName=$(basename "$PWD")
fi

# Limit the maximum number of sessions
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

  echo "Closing the least recently used session: $oldest_session"
  read -p "Press Enter to continue, or Ctrl+C to cancel..."
  tmux kill-session -t "$oldest_session"
fi

tmux new-session -d -s $sessionName
window=1
tmux new-window -t $session:$window -n 'terminal'

tmux attach-session -t $sessionName
```

After completing the above steps, I could handle most development work in VSCode. However, I was still missing an important function: how to navigate through project files and switch between multiple projects!
First, to address viewing and adjusting the project file structure, I found a plugin that makes it easy to browse the project file structure. This plugin is called [Yazi VSCode](https://marketplace.visualstudio.com/items?itemName=dautroc.yazi-vscode). It can open a full-screen terminal in the editing tab and launch the `yazi` tool inside to browse the project file structure. It also allows file operations like adding, deleting, modifying, and querying, which basically meets my needs for browsing project file structures. I mapped the launch of this plugin to `Ctrl + n`, so I can quickly open the project file structure browser.

Next, for switching between multiple projects, I initially used the [Project Manager](https://marketplace.visualstudio.com/items?itemName=alefragnani.project-manager) plugin to manage project switching. However, this plugin requires manually refreshing the project list every time a new project is added, which feels unnatural. So, inspired by the implementation of the `yazi` plugin, I created a plugin called [fzfsearch](https://marketplace.visualstudio.com/items?itemName=Fatpandac.fzfsearch). This plugin uses `fzf` and some command-line tools to quickly switch between projects and perform fast file and content searches within project files. This way, I also implemented functionality similar to the telescope plugin in Neovim, greatly improving my work efficiency and making navigation through projects as smooth as swimming in water. For a detailed introduction, you can refer to my other article: [Achieving a Telescope-like File Search Experience in VSCode](../11/fzf_search.md). Then, I mapped their shortcuts to `space + fg`, `space + ff`, and `space + fw` for project switching, file search, and content search, respectively. The configuration script is as follows:

```vim
nnoremap <silent> <leader>ff :<C-u>call VSCodeNotify('fzfsearch.search.file.toggle')<CR>
nnoremap <silent> <leader>fw :<C-u>call VSCodeNotify('fzfsearch.search.content.toggle')<CR>
nnoremap <silent> <leader>fg :<C-u>call VSCodeNotify('fzfsearch.search.repo.toggle')<CR>
```

Then, I configured some VSCode commands via Neovim as follows:

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

In summary, although I encountered some challenges during the migration from Neovim to VSCode, through reasonable plugin selection and key mapping, I successfully preserved Neovim's efficient keyboard operation experience while also enjoying VSCode's rich plugin ecosystem and powerful features. I hope my experience can be helpful to other users who want to migrate from Neovim to VSCode!
