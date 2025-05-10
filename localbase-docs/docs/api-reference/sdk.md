---
sidebar_position: 8
---

# SDK

LocalBase provides SDKs for popular programming languages to make it easier to integrate with the LocalBase API. This guide explains how to use the SDKs.

## Available SDKs

LocalBase provides SDKs for the following programming languages:

- [JavaScript/TypeScript](#javascripttypescript)
- [Python](#python)
- [Go](#go)
- [Ruby](#ruby)
- [PHP](#php)
- [Java](#java)
- [C#](#c)

## JavaScript/TypeScript

### Installation

```bash
npm install localbase
# or
yarn add localbase
```

### Usage

```javascript
import { LocalBase } from 'localbase';

// Initialize the client
const localbase = new LocalBase({
  apiKey: 'your-api-key',
});

// Create a chat completion
async function createChatCompletion() {
  const completion = await localbase.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, world!' },
    ],
    temperature: 0.7,
    max_tokens: 100,
  });

  console.log(completion.choices[0].message.content);
}

createChatCompletion();
```

### OpenAI Compatibility

The LocalBase SDK is compatible with the OpenAI SDK, so you can use it as a drop-in replacement:

```javascript
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: 'your-api-key',
  basePath: 'https://api.localbase.io/v1',
});

const openai = new OpenAIApi(configuration);

async function createChatCompletion() {
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, world!' },
    ],
    temperature: 0.7,
    max_tokens: 100,
  });

  console.log(completion.data.choices[0].message.content);
}

createChatCompletion();
```

### Examples

#### Chat Completions

```javascript
const completion = await localbase.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, world!' },
  ],
  temperature: 0.7,
  max_tokens: 100,
});

console.log(completion.choices[0].message.content);
```

#### Completions

```javascript
const completion = await localbase.completions.create({
  model: 'gpt-3.5-turbo-instruct',
  prompt: 'Hello, world!',
  temperature: 0.7,
  max_tokens: 100,
});

console.log(completion.choices[0].text);
```

#### Embeddings

```javascript
const embedding = await localbase.embeddings.create({
  model: 'text-embedding-ada-002',
  input: 'Hello, world!',
});

console.log(embedding.data[0].embedding);
```

#### List Models

```javascript
const models = await localbase.models.list();

console.log(models.data);
```

#### List Providers

```javascript
const providers = await localbase.providers.list();

console.log(providers.data);
```

#### Create a Job

```javascript
const job = await localbase.jobs.create({
  model: 'gpt-3.5-turbo',
  input: {
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, world!' },
    ]
  },
  parameters: {
    temperature: 0.7,
    max_tokens: 100,
  },
  type: 'chat',
});

console.log(job);
```

#### Get a Job

```javascript
const job = await localbase.jobs.get('job-123456');

console.log(job);
```

#### List Jobs

```javascript
const jobs = await localbase.jobs.list({
  status: 'completed',
  limit: 10,
});

console.log(jobs.data);
```

#### Cancel a Job

```javascript
const job = await localbase.jobs.cancel('job-123456');

console.log(job);
```

## Python

### Installation

```bash
pip install localbase
```

### Usage

```python
from localbase import LocalBase

# Initialize the client
localbase = LocalBase(api_key="your-api-key")

# Create a chat completion
completion = localbase.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, world!"},
    ],
    temperature=0.7,
    max_tokens=100,
)

print(completion.choices[0].message.content)
```

### OpenAI Compatibility

The LocalBase SDK is compatible with the OpenAI SDK, so you can use it as a drop-in replacement:

```python
import openai

openai.api_key = "your-api-key"
openai.api_base = "https://api.localbase.io/v1"

completion = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, world!"},
    ],
    temperature=0.7,
    max_tokens=100,
)

print(completion.choices[0].message.content)
```

### Examples

#### Chat Completions

```python
completion = localbase.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello, world!"},
    ],
    temperature=0.7,
    max_tokens=100,
)

print(completion.choices[0].message.content)
```

#### Completions

```python
completion = localbase.completions.create(
    model="gpt-3.5-turbo-instruct",
    prompt="Hello, world!",
    temperature=0.7,
    max_tokens=100,
)

print(completion.choices[0].text)
```

#### Embeddings

```python
embedding = localbase.embeddings.create(
    model="text-embedding-ada-002",
    input="Hello, world!",
)

print(embedding.data[0].embedding)
```

#### List Models

```python
models = localbase.models.list()

print(models.data)
```

#### List Providers

```python
providers = localbase.providers.list()

print(providers.data)
```

#### Create a Job

```python
job = localbase.jobs.create(
    model="gpt-3.5-turbo",
    input={
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, world!"},
        ]
    },
    parameters={
        "temperature": 0.7,
        "max_tokens": 100,
    },
    type="chat",
)

print(job)
```

#### Get a Job

```python
job = localbase.jobs.get("job-123456")

print(job)
```

#### List Jobs

```python
jobs = localbase.jobs.list(
    status="completed",
    limit=10,
)

print(jobs.data)
```

#### Cancel a Job

```python
job = localbase.jobs.cancel("job-123456")

print(job)
```

## Go

### Installation

```bash
go get github.com/localbase/localbase-go
```

### Usage

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/localbase/localbase-go"
)

func main() {
    // Initialize the client
    client := localbase.NewClient("your-api-key")

    // Create a chat completion
    resp, err := client.CreateChatCompletion(
        context.Background(),
        localbase.ChatCompletionRequest{
            Model: "gpt-3.5-turbo",
            Messages: []localbase.ChatCompletionMessage{
                {
                    Role:    "system",
                    Content: "You are a helpful assistant.",
                },
                {
                    Role:    "user",
                    Content: "Hello, world!",
                },
            },
            Temperature: 0.7,
            MaxTokens:   100,
        },
    )

    if err != nil {
        log.Fatal(err)
    }

    fmt.Println(resp.Choices[0].Message.Content)
}
```

## Ruby

### Installation

```bash
gem install localbase
```

### Usage

```ruby
require 'localbase'

# Initialize the client
localbase = Localbase::Client.new(api_key: 'your-api-key')

# Create a chat completion
completion = localbase.chat.completions.create(
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, world!' }
  ],
  temperature: 0.7,
  max_tokens: 100
)

puts completion.choices[0].message.content
```

## PHP

### Installation

```bash
composer require localbase/localbase-php
```

### Usage

```php
<?php

require 'vendor/autoload.php';

use Localbase\Client;

// Initialize the client
$localbase = new Client('your-api-key');

// Create a chat completion
$completion = $localbase->chat->completions->create([
    'model' => 'gpt-3.5-turbo',
    'messages' => [
        ['role' => 'system', 'content' => 'You are a helpful assistant.'],
        ['role' => 'user', 'content' => 'Hello, world!']
    ],
    'temperature' => 0.7,
    'max_tokens' => 100
]);

echo $completion->choices[0]->message->content;
```

## Java

### Installation

#### Maven

```xml
<dependency>
    <groupId>io.localbase</groupId>
    <artifactId>localbase-java</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### Gradle

```groovy
implementation 'io.localbase:localbase-java:1.0.0'
```

### Usage

```java
import io.localbase.LocalBase;
import io.localbase.model.ChatCompletion;
import io.localbase.model.ChatCompletionRequest;
import io.localbase.model.ChatMessage;

import java.util.Arrays;

public class Example {
    public static void main(String[] args) {
        // Initialize the client
        LocalBase localbase = new LocalBase("your-api-key");

        // Create a chat completion
        ChatCompletionRequest request = new ChatCompletionRequest.Builder()
            .model("gpt-3.5-turbo")
            .messages(Arrays.asList(
                new ChatMessage("system", "You are a helpful assistant."),
                new ChatMessage("user", "Hello, world!")
            ))
            .temperature(0.7)
            .maxTokens(100)
            .build();

        ChatCompletion completion = localbase.createChatCompletion(request);

        System.out.println(completion.getChoices().get(0).getMessage().getContent());
    }
}
```

## C#

### Installation

```bash
dotnet add package Localbase
```

### Usage

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Localbase;
using Localbase.Models;

class Program
{
    static async Task Main(string[] args)
    {
        // Initialize the client
        var localbase = new LocalBaseClient("your-api-key");

        // Create a chat completion
        var completion = await localbase.Chat.CreateCompletionAsync(
            new ChatCompletionRequest
            {
                Model = "gpt-3.5-turbo",
                Messages = new List<ChatMessage>
                {
                    new ChatMessage { Role = "system", Content = "You are a helpful assistant." },
                    new ChatMessage { Role = "user", Content = "Hello, world!" }
                },
                Temperature = 0.7f,
                MaxTokens = 100
            }
        );

        Console.WriteLine(completion.Choices[0].Message.Content);
    }
}
```

## Next Steps

Now that you understand how to use the LocalBase SDKs, you can explore other API endpoints:

- [Models](models.md)
- [Jobs](jobs.md)
- [Providers](providers.md)
- [Users](users.md)
- [Billing](billing.md)
