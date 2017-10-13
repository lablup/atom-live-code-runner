# live-code-runner

ATOM editor package to run code snippets via Backend.AI Cloud server (https://cloud.backend.ai)

## Description

 `live-code-runner` is ATOM editor package to add remote code execution feature using [Backend.AI Cloud Service](https://cloud.backend.ai). `live-code-runner` uses [Backend.AI framework](https://www.lablup.ai/#/ground) and [Backend.AI API](http://docs.sorna.io). Currently, Backend.AI supports 15 programming languages now.

You can run your code (or code snippet) without installing or setting any programming environment  with this package. All you need to run code is

 * Install `live-code-runner` package.
 * Get Backend.AI Cloud API access / secret key at [Backend.AI Cloud](https://cloud.sorna.io)
 * Type your keys on package preferences page.
 * You are ready to go!

<iframe width="853" height="480" src="https://www.youtube.com/embed/IVX1SClEaMY" frameborder="0" allowfullscreen></iframe>

## How-to

 1. Search and install `live-code-runner` via preferences - install.
 2. Get your own API key pair (API key / Secret key) at [Backend.AI Cloud Service](https://cloud.backend.ai)
 3. Type your API key pair on preferences page (preferences - packages - live-code-runner)
 4. Write your code on editor.
 5. Run code by
  * Choose `Run code on Backend.AI Cloud` at context menu
  * Type `backend` and choose `live-code-runner: Run` at command palette.
 6. Execution result will be shown at bottom pane.

### Supported Languages / frameworks on this package

 * Python 2.7
 * Python 3.6
 * TensorFlow 1.2
 * Theano 0.8
 * Keras 2.0
 * C / C++ (via gcc)
 * PHP 7
 * Javascript (via V8 engine)
 * Node.js 4
 * R 3
 * Octave 4.2
 * Julia
 * haskell
 * Lua 5

### Languages (to be ready soon)

 * Rust
 * Swift (via Swift opensource version)
 * Caffe

## Troubleshooting

 1. My language is not recognized
  * Make sure that language name of your code is correctly recognized by ATOM. You can see the grammar of current editor at the right side of bottom bar. If your language is not supported by ATOM, please install language support packages. For instance, install `language-r` package to add R language support.
