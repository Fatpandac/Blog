---
title: Implementing an eventBus
date: 2023-12-08
tags:
  - JavaScript
categories:
  - Demo
---

> [!info]
> This article is auto translated by ChatGPT.

Let's build an EventBus for fun.

<!-- more -->

EventBus is a mechanism that allows different components to communicate without knowing anything about each other. A component can send an event to the EventBus without worrying about who will handle it, or how many components will process it.

![EventBus](/images/EventBus-Publish-Subscribe.png)

From the diagram above, we can see that an EventBus mainly needs two interfaces: one for publishing messages, and one for subscribing to messages. When publishing an event, the EventBus must find the corresponding subscribers, which means both subscriptions and emissions must use a shared identifier.

Based on this, we can create a simple EventBus like the following:

```js
const channels = new Map();

// Provide a key when creating an EventBus to identify the channel
export function eventBus(key) {
  function on(callback) {
    // Register callback functions under the identifier
    const callbacks = channels.get(key) || [];

    channels.set(key, [...callbacks, callback]);
  }

  function emit(message) {
    // Find the callbacks for this key and send messages to them
    const callbacks = channels.get(key);

    if (callbacks) callbacks.map((callback) => callback(message));
  }

  return {
    on,
    emit,
  };
}
```

The version above already supports basic communication, but we can further extend it with _unsubscribe_ and _subscribe once_ functionality.

```js
// Subscribe only once
function once(callback) {
  function _on_listen(...args) {
    const callbacks = channels.get(key) || [];
    // Remove this temporary callback
    const filtedCallbacks = callbacks.filter((item) => item !== _on_listen);
    channels.set(key, filtedCallbacks);

    // Call the callback passed to once
    callback(...args);
  }

  on(_on_listen);
}

// Remove the corresponding key and all its callbacks
function close() {
  if (channels.has(key)) channels.delete(key);
}
```

With this, we've implemented a lightweight EventBus.

Check out the [source code](https://github.com/Fatpandac/DemoPlayground/tree/main/packages/eventBus), and try the <a href="/demo/eventBus.html">Demo</a>.
![Demo GIF](/images/eventBus.gif)