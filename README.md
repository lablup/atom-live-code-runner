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

## Supporting modes

Here we list the latest versions of our supported kernel iamges.  
"\*" in the Query mode column means that it supports preservation of global contexts across different query runs.

| Language      | Image Name              | Version | Batch | Query | Input Hook | TTY | Runtime Impl. |
|---------------|-------------------------|---------|-------|-------|---|---|--------------------|
| C             | `lablup/kernel-c`       | 6.3     | O     | O     | O |   | GCC on Alpine 3.6  |
| C++ (14)      | `lablup/kernel-cpp`     | 6.3     | O     | O     |   |   | GCC on Alpine 3.6  |
| Go            | `lablup/kernel-go`      | 1.9     | O     | O     |   |   |                    | 
| Haskell       | `lablup/kernel-haskell` | 8.2     | O     | O     |   |   |                    |
| Java          | `lablup/kernel-java`    | 8.0     | O     | O     |   |   |                    |
| Linux Console | `lablup/kernel-git`     | -       | -     | -     | - | O | Bash on Alpine 3.6 |  
| Lua           | `lablup/kernel-lua`     | 5.3     | O     | O     |   |   |                    |
| Node.js       | `lablup/kernel-nodejs`  | 6.11    | O     | O     |   |   |                    |
| Octave        | `lablup/kernel-octave`  | 4.2     | O     | O     |   |   |                    |
| ~Python~      | `lablup/kernel-python`  | 2.7     | O     | O     | O |   | temporarily unsupported |
| Python        | `lablup/kernel-python`  | 3.6     | O     | O\*   | O |   |                    |
| Rust          | `lablup/kernel-rust`    | 1.17    | O     | O     |   |   |                    |
| PHP           | `lablup/kernel-php`     | 7.1     | O     | O     |   |   |                    |
| R             | `lablup/kernel-r`       | 3.3     | O     | O     |   |   | CRAN R             |

| Deep-Learning Framework | Image Name           | Version | Batch | Query | Input Hook | TTY | Runtime Impl. |
|------------|-----------------------------------|---------|-------|-------|-----|---|-------------------|
| TensorFlow | `lablup/kernel-python-tensorflow` | 1.8-1.3 | O     | O\*   | O   |   | Bundled w/Keras 2 |
| PyTorch    | `lablup/kernel-python-torch`      | 2.0-0.2 | O     | O\*   | O   |   |                   |
| Theano     | `lablup/kernel-python-theano`     | 1.0     | O     | O\*   | O   |   | Bundled w/Keras 2 |
| CNTK       | `lablup/kernel-python-cntk`       | (WIP)   | O     | O\*   | O   |   | Bundled w/Keras 2 |

### Languages (to be ready soon)

 * Swift (via Swift opensource version)

### Working

 * Multi-file support (is already supported via CLI, but not in JavaScript SDK yet.)
 * Virtual Folder mount / navigation (is already supported via CLI, but not in JavaScript SDK yet.)

## Troubleshooting

 1. My language is not recognized
  * Make sure that language name of your code is correctly recognized by ATOM. You can see the grammar of current editor at the right side of bottom bar. If your language is not supported by ATOM, please install language support packages. For instance, install `language-r` package to add R language support.
