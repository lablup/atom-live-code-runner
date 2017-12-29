# live-code-runner

ATOM editor package to run code snippets via Backend.AI Cloud server (https://cloud.backend.ai) or on-premise Backend.AI server.

## Description

 `live-code-runner` is ATOM editor package to add remote code execution feature using [Backend.AI Cloud Service](https://cloud.backend.ai). `live-code-runner` uses [Backend.AI framework](https://www.lablup.ai/#/ground) and [Backend.AI API](http://docs.backend.ai). Currently, Backend.AI supports 15 programming languages now.

You can run your code (or code snippet) without installing or setting any programming environment  with this package. All you need to run code is

 * Install `live-code-runner` package.
 * Get Backend.AI Cloud API access / secret key at [Backend.AI Cloud](https://cloud.backend.ai)
 * Type your keys on package preferences page.
 * You are ready to go!

<iframe width="853" height="480" src="https://www.youtube.com/embed/IVX1SClEaMY" frameborder="0" allowfullscreen></iframe>

## How-to

 1. Search and install `live-code-runner` via preferences - install.
 2. Get your own API key pair (API key / Secret key) at [Backend.AI Cloud Service](https://cloud.backend.ai). If you have set up your own Backend.AI on-premise server, you can your own server endpoint and API key set.
 3. Type your API key pair on preferences page (preferences - packages - live-code-runner)
 4. Write your code on editor.
 5. Run code by
  * Choose `Run code on Backend.AI Cloud` at context menu
  * Type `backend` and choose `live-code-runner: Run` at command palette.
 6. Execution result will be shown at bottom pane.

### Supported Languages / frameworks on this package

| Language      | Version | Batch | Query | Input Hook | TTY | ETC |
|---------------|------|---|---|---|---|-------------------|
| C             | 6.3  | O | O | O |   | GCC compiler      |
| C++ (C+14)    | 6.3  | O | O | O |   | GCC compiler      |
| Go            | 1.9  | O | O |   |   |                   |
| Haskell       | 8.2  | O | O |   |   |                   |
| Java          | 8.0  | O | O |   |   |                   |
| Linux Console | -    |   | O | O | O | Not supported in this plugin (Soon!) |  
| Node.js       | 6    |   | O |   |   |                   |
| Octave        | 4.2  |   | O |   |   |                   |
| Python        | 2.7  | O | O | O |   |                   |
| Python        | 3.6  | O | O | O |   |                   |
| Rust          | 1.21 | O | O |   |   |                   |
| PHP           | 7.0  |   | O |   |   |                   |
| R             | 3.0  |   | O |   |   | CRAN R            |

| Deep-Learning Framework | Version | Batch | Query | Input Hook | TTY | ETC |
|---------------|------|---|---|---|---|-------------------|
| TensorFlow    | 1.4  | O | O | O |   | Bundled w/Keras 2 |
| PyTorch       | 0.2  | O | O | O |   |                   |
| Theano        | 0.9  | O | O | O |   | Bundled w/Keras 2 |
| CNTK          |(WIP) | O | O | O |   | Bundled w/Keras 2 |

### Languages (to be ready soon)

 * Swift (via Swift opensource version)
 * Caffe 2

## Troubleshooting

 1. My language is not recognized
  * Make sure that language name of your code is correctly recognized by ATOM. You can see the grammar of current editor at the right side of bottom bar. If your language is not supported by ATOM, please install language support packages. For instance, install `language-r` package to add R language support.
