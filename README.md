# atom-live-code-runner

ATOM package to run code snippets via Sorna Cloud API server (https://cloud.sorna.io)

Description
===========

 `atom-live-code-runner` is ATOM editor package to add remote code execution feature using [Sorna Cloud API Service](https://cloud.sorna.io). `atom-live-code-runner` uses [Sorna framework](http://sorna.io) and [Sorna API](http://docs.sorna.io)). Currently, Sorna supports 11 programming languages now.

You can run your code (or code snippet) without installing or setting any programming environment  with this package. All you need to run code is

 * Install `atom-live-code-runner` package.
 * Get Sorna API access / secret key at [Sorna Cloud API](https://cloud.sorna.io)
 * Type your keys on package preferences page.
 * You are ready to go!

<iframe src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2FlablupInc%2Fvideos%2F1669260676704566%2F&show_text=0&width=600" width="600" height="400" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowTransparency="true" allowFullScreen="true"></iframe>


How-to
======

 1. Search and install `atom-live-code-runner` via preferences - install.
 2. Get your own API key pair (API key / Secret key) at [Sorna Cloud API Service](https://cloud.sorna.io)
 3. Type your API key pair on preferences page (preferences - packages - atom-live-code-runner)
 4. Write your code on editor.
 5. Run code by
  * Choose `Run code via Sorna` at context menu
  * Type `sorna` and choose `atom-live-code-runner: Run` at command palette.
 6. Execution result will be shown at bottom pane.

Supported Languages on this package
===================================

 * Python 2.7
 * Python 3.5
 * TensorFlow 0.11
 * PHP 7
 * Javascript (via V8 engine)
 * Node.js 4
 * R 3
 * Julia
 * haskell

Languages (to be ready soon)
============================

 * Rust
 * Swift (via Swift opensource version)
 * Theano
 * Caffe
 * Keras
 * C++ (via gcc)

Troubleshooting
===============

 1. My language is not recognized
  * Make sure that language name of your code is correctly recognized by ATOM. You can see the grammar of current editor at the right side of bottom bar. If your language is not supported by ATOM, please install language support packages. For instance, install `language-r` package to add R language support.
