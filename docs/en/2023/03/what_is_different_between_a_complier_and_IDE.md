---
title: Differences Between Compilers and Integrated Development Environments
date: 2023-03-09
tags:
  - Compiler
  - IDE
categories:
  - Other
---

> [!info]
> This article was auto-translated using ChatGPT.

A compiler is defined in textbooks as **a program that translates or processes a program written in one programming language into an equivalent program in another language.**

An Integrated Development Environment (IDE) is defined on Wikipedia as **application software that assists program developers in software development. It can help write source code text, compile, and package it into a usable program, and some can even design graphical interfaces.**

<!-- more -->

From the definitions of the two keywords above, it can be seen that the relationship between a compiler and an Integrated Development Environment is that an Integrated Development Environment includes a compiler; in other words, _a compiler is a subset of an Integrated Development Environment._

## What are Integrated Development Environments?

There are many Integrated Development Environments on the market. Closed-source representatives include JetBrains, while open-source representatives include Eclipse, in addition to Microsoft and many others.

- **JetBrains**
  JetBrains is a Czech software development company that has developed many well-known and familiar Integrated Development Environments. Among them, the most familiar to us is Idea, which is primarily used for Java programming language development. Besides Idea, there are many other IDEs for other languages, as follows:

| Integrated Development Environment |                                     Main Function                                      |
| :--------------------------------: | :------------------------------------------------------------------------------------: |
|              AppCode               |                       Swift and Objective-C IDE development tool                       |
|               CLion                | Cross-platform C/C++ IDE development tool, supporting C++11, C++14, libc++, and Boost. |
|              DataGrip              |                                 A database client tool                                 |
|               GoLand               |                    Go language Integrated Development Environment.                     |
|              PhpStorm              |                               PHP IDE development tool.                                |
|              PyCharm               |           A Python IDE development tool combined with the Django framework.            |
|               Rider                |              A fast, powerful, cross-platform .NET IDE development tool.               |
|              RubyMine              |                 A powerful set of Ruby on Rails IDE development tools.                 |
|              WebStorm              |                              JavaScript development tool.                              |

- **Eclipse**
  Eclipse was originally developed by IBM as a next-generation IDE development environment to replace the commercial software Visual Age for Java. It was contributed to the open-source community in November 2001 and is now managed by the non-profit software vendor consortium Eclipse Foundation.

## Is VS Code an IDE?

At this point, a question might arise: Is VS Code, a popular, lightweight tool that we use daily, an IDE?

VS Code is actually not an IDE but a free, cross-platform source code editor developed under the leadership of Microsoft.

Compared to an IDE, an editor is more compact and lightweight, but it is not as hassle-free in many aspects.

If we use VS Code without any configuration, we will be using an editor with basic source code editing functions such as syntax highlighting, code formatting, and quick operations, much like using a Word document optimized for code writing.

If we need to run and debug the code after editing, we also need to configure relevant plugins and the corresponding compiler. For example, to run C language code, I would first need to download a plugin that can run C language, which provides a link between the graphical interface run button in VS Code and the corresponding compile command. After that, I would also need to download a corresponding C language compiler, such as GCC. After completing the above steps, VS Code can then run and debug C language code.

Besides VS Code, there are many other editors, but there is a strange phenomenon that most of them are open source. These include:

- Atom (Development has been discontinued because its main developer was GitHub, but GitHub was later acquired by Microsoft. Microsoft already had VS Code, so it canceled this project a few years after acquiring GitHub.)
- Emacs
- vi/Vim/Neovim
- Notepad++
- Sublime Text

## What are the Compilers?

From the above understanding, we can know that the tools we use daily for directly editing, running, and debugging code are not actually compilers. So, what is the true nature of compilers? As briefly mentioned when introducing editors, they are tools like GCC.

These types of tools generally do not have a graphical interface and interact via commands. The common compilers corresponding to various languages are as follows:

| Language | Compiler  |
| :------: | :-------: |
|    C     | GCC/Clang |
|   C++    | GCC/Clang |
|    Go    | gc/gccgo  |
|  Python  |  CPython  |
|   Java   |   javac   |
