---
title: Convert Class Schedule to ICS File for iCalendar
date: 2025-10-12
tags:
  - ics
  - iCalendar
categories:
  - Tech
---

> [!info]
> This article was auto-translated using ChatGPT.

Back in my school days, I always had a need to import my class schedule into a calendar for easier viewing. At the time, I relied on scripts to accomplish this. Now a friend has the same need, but asking them to run a script and modify code might be inconvenient. So I decided to simply build a web page to handle it!

<!-- more -->

For the tech stack, I chose **React + shadcn + TailwindCSS**, and built the following website in one go:

[ics.fatpandac.com](https://ics.fatpandac.com)

<iframe src="https://ics.fatpandac.com" style="border: none; width: 100%; height: 500px; pointer-events: none;" />

On this site, you can fill in your schedule information and click **`Preview`** to see a preview of the generated calendar events. This helps you verify that the information entered is correct. Once confirmed, click **`Export`** to download an ICS file containing the events generated from your inputs. You can then open the file with your calendar app.

Here is the code snippet used to generate the ICS file:

```ts
const ics = generateIcs(data.events, preinfo as PreinfoData);
const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = "timetable.ics";
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);
```
