---
title: My Toolset in the AI Era
date: 2026-08-30
tags:
  - tmux
  - AI
  - pi
categories:
  - Tech
---

> [!info]
> This article was auto-translated using ChatGPT.

Since the Spring Festival this year, I've started using AI for all of my coding work. Over this period I've put together a set of tools that fit my personal coding habits pretty well, so I'm writing this article to share it.

<!-- more -->

A common problem when developing with agents is that we usually open a lot of sessions and run many tasks in parallel. At that point we need to keep track of whether these sessions have finished and whether they need us to grant permissions or make a choice. At first I used the official GUIs from Codex or Claude, but later I found they didn't match my working habits, because I had always used tmux and could operate entirely with the keyboard. So I switched to their CLIs, but then I found their CLIs were too restrictive — some features I wanted to build myself simply couldn't be implemented through plugins. That's when I moved to Pi.

With Pi I can implement the features I want through plugins. For example, I usually have two accounts, one for Codex and one for Claude, and with Pi I can switch freely between the two providers. Another thing is that Codex and Claude sessions used to be isolated: when work done in Claude needed to continue in Codex, I had to hand off to switch over, which was still a bit inconvenient. Now with Pi I can switch between models from both vendors inside a single session. And since I use two different accounts, previously when one account ran out of quota I could only switch to the other one manually. Now I can use a plugin to automatically switch to the other account and continue once the quota runs out — that's the [pi-auto-models](https://github.com/Fatpandac/pi-auto-models) plugin. With it I can set up a fallback so that when one account is out of quota it switches automatically, and it also lets me check the remaining quota on both accounts.

Once I decided to go with the CLI, it followed naturally that I started using tmux as well. But after switching to tmux I ran into a problem that comes with CLIs: I have no way to sense the state of my sessions unless I'm actively watching the CLI that's currently running. So I started looking for a tmux plugin that could solve this, and I found [tmux-agent-sidebar](https://github.com/hiroppy/tmux-agent-sidebar), which shows the state of the agent CLI sessions running in tmux in a sidebar, letting me watch every agent's status in real time. After using it for a while, though, I found it offered more features than I needed and took up some of my window space — it can be toggled away, but that was still a hassle. So I wrote my own tmux tool, [agentbar](https://github.com/Fatpandac/agentbar). It only renders a tab list at the top of tmux showing the agent status of the current sessions, and it also shows the agent status next to every window in the status bar, so I can tell what the agents in the windows I'm not looking at are doing. Combining the tab bar and the status bar, I have full visibility into every agent running under tmux. Initially agentbar provided `prefix tab` and `prefix shift tab` to cycle back and forth between sessions. Later I saw that Omarchy uses `super + number` to jump straight to the corresponding workspace, so I switched to the same scheme — on macOS that means `cmd + number`, so `cmd 1` jumps directly to the corresponding session instead of cycling through them one by one.

With agent usage and status management sorted out, the next thing was reviewing the code the agents produce. After searching around I ended up choosing [lumen](https://github.com/jnsahaj/lumen) over [hunk](https://github.com/modem-dev/hunk) — both are terminal tools for browsing git commits and diffs, letting me go over what an agent just changed right inside tmux. I went with `lumen` because its style suits me better: the interface is clean and the default theme for code highlighting looks great.

So my toolset now is tmux + Neovim + pi + agentbar + lumen. The most immediate change is parallelism: I used to be able to watch only one agent at a time, and while it was running all I could do was wait. Now I can keep three or four sessions going at once, each working on its own task, with agentbar telling me which one has stopped and is waiting for my approval and which one has finished, and then I use lumen to go over its output. The whole process never leaves the terminal and never has me guessing which window is waiting on me. It's smooth and pleasant to use — if it weren't for debugging web pages, I might never need to take my fingers off the keyboard to touch the trackpad or mouse!!!
