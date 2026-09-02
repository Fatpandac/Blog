---
title: AI 时代我的工具集
date: 2026-08-30
tags:
  - tmux
  - AI
  - pi
categories:
  - 技文
---

从今年春节之后我就开始全面使用 AI 来完成我的代码工作，在这段时间里
积累了一些我觉得比较符合我个人写代码习惯的工具集合，现在就写一篇文章分享一下。

<!-- more -->

在使用 agent 开发的时候经常会遇到一个问题就是我们通常都会打开很多的 session 
然后让很多任务同时并行，这时候我们需要关注这些 session 是否已经完成是否需要
我们做一些操作授权以及选择，一开始的时候我都是使用 Codex 或 Claude 自家的 GUI
后来发现这个和我的工作习惯不太相符因为我之前一直都是用 tmux 的可以完全使用键盘
来操作，后面我就换成了使用他们的 CLI 但是后来我发现他们的 CLI 限制太多了有些我想
自己实现的功能通过插件并不能实现，于是我就转向了 Pi。

使用 Pi 之后我就可以自己通过一些插件来实现我自己想要的功能了，比如我一般都会有
两个账号一个 Codex 一个 Claude，现在使用 Pi 之后我就可以自由的切换两个供应商，
还有就是之前 Codex 和 Claude 的会话是隔离开的有时候 Claude 的工作需要在 Codex
继续进行的时候就要 Handoff 来帮助我切换但是这样还是有点不方便，现在使用了 Pi
之后我就可以直接在一个 session 里完成两个厂商的模型切换了，还有就是我用的
是两个不同的账号之前一个账号额度使用完了之后我只能切换另一个账号继续，现在我
可以通过一个插件来实现额度用完之后自动切换另一个账号继续，也就是下面这个
插件 [pi-auto-models](https://github.com/Fatpandac/pi-auto-models)，通过这个插件我就可以设置一个 fallback 方便我一个账号额度
没有之后自动切换，同时还可以支持查看两个账号的额度余额。

因为我已经决定使用 CLI 之后我也顺理成章的把 tmux 给用起来了，但在使用 tmux 之后
就遇到了一个 CLI 会遇到的问题那就是我的 session 状态是没有办法感知的除非我关注
当前的 CLI 执行状态，于是我就开始寻找一个能解决我问题的 tmux 插件，我找到了
[tmux-agent-sidebar](https://github.com/hiroppy/tmux-agent-sidebar) 它可以把当前 tmux 运行的 agent CLI 的 session 状态展示到
一个 sidebar 上，这样就可以实时的关注每一个 agent 的运行状态了，但是使用了一段
时间我发现它提供的功能太多而且还会占用我的窗口的一些空间虽然说它可以 toggle 收起
但还是麻烦。于是我就自己写了一个 tmux 工具
[agentbar](https://github.com/Fatpandac/agentbar)，它只在 tmux 的顶部展示一个 tab
列表然后在列表上面展示出来当前 session 的 agent 运行状态并且在当前 status bar
上的每一个 window 旁边也会展示 agent 的运行状态这样就可以知道没有展示的 window
下的 agent 的运行状态，结合 tab bar 和 status bar 就可以完全掌控 tmux 下的所有
agent 的运行状态了，一开始我的 agentbar 为了方便切换 session 我提供了
`prefix tab` 和 `prefix shift tab` 来实现 session 之间的来回切换，后来看到
Omarchy 用 `super + 数字` 直接跳到对应的 workspace，我就把它改成了同样的形式，
在 macOS 上对应的就是 `cmd + 数字`，这样只要 `cmd 1` 就能直接跳到对应的
session，不用再一个个切过去了。

解决完 agent 使用和状态的管理后接着就是查看 agent 的产出代码了，我在搜索了一圈
之后在 [hunk](https://github.com/modem-dev/hunk) 和 [lumen](https://github.com/jnsahaj/lumen) 之间选择了使用 `lumen`，它们都是终端下看 git 提交
和 diff 的工具，可以直接在 tmux 里把 agent 刚改的东西过一遍，最后选 `lumen`
是因为它的风格更适合我，界面很简洁，代码高亮的默认主题也很好看。

所以我现在的工具集就是 tmux + Neovim + pi + agentbar + lumen。最直接的变化是
并行度：以前我一次只能盯一个 agent，它在跑我就只能等，现在我可以同时挂三
四个 session 让它们各自干活，由 agentbar 告诉我谁停下来在等我授权、谁已经
写完了，我再用 lumen 把它的产出过一遍，整个过程不用离开终端也不用去猜哪个
窗口在等我。它很流畅也很好用，如果不是要调试页面我
可能都不需要把手指离开键盘去操作触控板或鼠标！！！


