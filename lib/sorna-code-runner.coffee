SornaCodeRunnerView = require './sorna-code-runner-view'
{CompositeDisposable} = require 'atom'
crypto = require 'crypto'
util = require 'util'

module.exports = SornaCodeRunner =
  config: require('./config.coffee')
  SornaCodeRunnerView: null
  resultPanel: null
  subscriptions: null
  code: null
  accessKey: null
  secretKey: null
  signKey: null
  apiVersion: 'v1.20160915'
  hash_type: 'sha256'
  baseURL: 'https://api.sorna.io'
  kernelId: null
  kernelType: null

  # dev mode for autoreload-package-service
  consumeAutoreload: (reloader) ->
    reloader(pkg:"sorna-code-runner",files:["package.json"],folders:["lib/"])

  activate: (state) ->
    if atom.inDevMode()
      try
        @realActivate(state)
      catch e
        console.log e
    else
      @realActivate(state)

  deactivate: ->
    @resultPanel.destroy()
    @subscriptions.dispose()

  realActivate: (state) ->
    @SornaCodeRunnerView = new SornaCodeRunnerView(state.SornaCodeRunnerViewState, @)
    @resultPanel = atom.workspace.addBottomPanel(item: @SornaCodeRunnerView.getElement(), visible: false)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable
    @checkMandatorySettings()

    # Register command
    @subscriptions.add atom.commands.add 'atom-text-editor',
      'sorna-code-runner:run': => @runcode()

  serialize: ->
    SornaCodeRunnerViewState: @SornaCodeRunnerView.serialize()

  getAccessKey: ->
    accessKey = atom.config.get 'sorna-code-runner.accessKey'
    if accessKey
      accessKey = accessKey.trim()
    return accessKey

  getSecretKey: ->
    secretKey = atom.config.get 'sorna-code-runner.secretKey'
    if secretKey
      secretKey = secretKey.trim()
    return secretKey

  checkMandatorySettings: ->
    missingSettings = []
    if not @getAccessKey()
      missingSettings.push("Access Key")
    if not @getSecretKey()
      missingSettings.push("Secret Key")
    if missingSettings.length
      @notifyMissingMandatorySettings(missingSettings)
    return missingSettings.length is 0

  notifyMissingMandatorySettings: (missingSettings) ->
    context = this
    errorMsg = "sorna-code-runner: Mandatory settings missing: " + missingSettings.join(', ')

    notification = atom.notifications.addError errorMsg,
      dismissable: true
      buttons: [{
        text: "Package settings"
        onDidClick: ->
          context.goToPackageSettings()
          notification.dismiss()
      }]

  goToPackageSettings: ->
    atom.workspace.open("atom://config/packages/sorna-code-runner")

  runcode: ->
    if @resultPanel.isVisible()
      @resultPanel.hide()
    else
      editor = atom.workspace.getActiveTextEditor()
      content = editor.getText()
      @SornaCodeRunnerView.setContent(content)
    @sendCode()

  getAPIversion: ->
    d = new Date()
    requestHeaders = new Headers({
      "Content-Type": "application/json",
      "X-Sorna-Date": d.toISOString()
    })

    requestInfo =
      method: 'GET',
      headers: requestHeaders,
      mode: 'cors',
      cache: 'default'

    fetch(@baseURL+'/v1', requestInfo)
      .then( (response) ->
        if response.version
          console.log('API version: ' + response.version)
          return response.version
        return true
      )

  createKernel: (kernelType) ->
    parentObj = @
    msg = "sorna-code-runner: preparing kernel..."
    notification = atom.notifications.addInfo msg
    requestBody =
      "lang": kernelType,
      "clientSessionToken": "test-sorna-code-runner",
      "resourceLimits":
        "maxMem": 0,
        "timeout": 0
    requestInfo = @newRequest('POST', '/v1/kernel/create', requestBody)
    return fetch(@baseURL + '/v1/kernel/create', requestInfo)
      .then( (response) ->
        if response.ok is false
          errorMsg = "sorna-code-runner: " + response.statusText
          notification = atom.notifications.addError errorMsg, dismissable: true
          return false
        else if response.status is 201
          response.json().then( (json) ->
            console.debug "Kernel ID: " + json.kernelId
            parentObj.kernelId = json.kernelId
            msg = "sorna-code-runner: kernel prepared."
            notification = atom.notifications.addSuccess msg
            setTimeout ->
              notification.dismiss()
            , 1000
            return true
          )
      , (e) ->
      )

  destroyKernel: (kernelId) ->
    msg = "sorna-code-runner: destroying kernel..."
    notification = atom.notifications.addInfo msg
    requestInfo = @newRequest('DELETE', '/v1/kernel/'+kernelId, null)
    return fetch(@baseURL + '/v1/kernel/'+kernelId, requestInfo)
      .then( (response) ->
        if response.ok is false
          if response.status isnt 404
            errorMsg = "sorna-code-runner: destroy failed - " + response.statusText
            notification = atom.notifications.addError errorMsg,
              dismissable: true
            return false
          else
            return true
        return true
      , (e) ->
        return false
      )

  refreshKernel: ->
    msg = "sorna-code-runner: refreshing kernel..."
    notification = atom.notifications.addInfo msg
    requestInfo = @newRequest('PATCH', '/v1/kernel/'+@kernelId, null)
    fetch(@baseURL + '/v1/kernel/'+@kernelId, requestInfo)
      .then( (response) ->
        if response.ok is false
          errorMsg = "sorna-code-runner: " + response.statusText
          notification = atom.notifications.addError errorMsg,
            dismissable: true
        else
          if response.status isnt 404
            msg = "sorna-code-runner: kernel refreshed"
            notification = atom.notifications.addSuccess msg
        return true
      , (e) ->
        return false
      )

  newRequest: (method, queryString, body) ->
    d = new Date()
    t = @getCurrentDate(d)
    @signKey = @getSignKey(@getSecretKey(), d)
    if body is null
      requestBody = ''
    else
      requestBody = JSON.stringify(body)
    aStr = @getAuthenticationString(method, queryString, d.toISOString(), requestBody)
    sig = @sign(@signKey, 'binary', aStr, 'hex')

    requestHeaders = new Headers({
      "Content-Type": "application/json",
      "Content-Length": requestBody.length.toString(),
      'X-Sorna-Version': @apiVersion,
      "X-Sorna-Date": d.toISOString(),
      "Authorization": "Sorna signMethod=HMAC-SHA256, credential=#{@getAccessKey()}:#{sig}"
      })

    requestInfo =
      method: method,
      headers: requestHeaders,
      cache: 'default'
      body: requestBody
    return requestInfo

  chooseKernelType: ->
    editor = atom.workspace.getActiveTextEditor()
    if editor
      grammar = editor.getGrammar()
    else
      grammar = null
    if grammar
      grammarName = (grammar.name || grammar.scopeName).toLowerCase()
      switch grammarName
        when "python"
          code = editor.getText()
          if code.search("tensorflow") > 0
            kernelName = "tensorflow-python3"
          else
            kernelName = "python3"
        when "r" then kernelName = "r3"
        when "julia" then kernelName = "julia"
        when "lua" then kernelName = "lua5"
        when "php" then kernelName = "php7"
        when "haskell" then kernelName = "haskell"
        when "nodejs", "javascript" then kernelName = "nodejs4"
        else kernelName = null
      console.log "Kernel Language: "+ kernelName
      return kernelName

  sendCode: ->
    kernelType = @chooseKernelType()
    if kernelType is null
      errorMsg = "sorna-code-runner: language is not specified by Atom."
      notification = atom.notifications.addError errorMsg, dismissable: true,
      description: 'Check the grammar indicator at bottom bar and make sure that it is correctly recoginzed (NOT `Plain Text`).\nTry one of the followings:\n * Save current editor with proper file extension.\n * Install extra lauguage support package. (e.g. `language-r`, `language-haskell`)'
      return false
    if kernelType isnt @kernelType or @kernelId is null
      if @kernelId isnt null
        destroyAndCreateAndRun = @destroyKernel(@kernelId)
        .then( (result) =>
          if result is true
            return @createKernel(kernelType)
          else
            return false
        )
        .then( (result) =>
          if result is true
            @kernelType = kernelType
            return @sendCode()
        )
        return true
      else
        createAndRun = @createKernel(kernelType).then( (result) =>
          if result is true
            @kernelType = kernelType
            return @sendCode()
        )
        return true
    msg = "sorna-code-runner: running..."
    notification = atom.notifications.addInfo msg, dismissable: false
    editor = atom.workspace.getActiveTextEditor()
    @code = editor.getText()
    requestBody = {
      "codeId": "test",
      "code": @code
    }
    requestInfo = @newRequest('POST', '/v1/kernel/'+ @kernelId, requestBody)
    fetch(@baseURL + '/v1/kernel/' + @kernelId, requestInfo)
      .then( (response) =>
        if response.ok is false
          errorMsg = "sorna-code-runner: " + response.statusText
          notification = atom.notifications.addError errorMsg, dismissable: false
          if response.status is 404
            @createKernel(@kernelType)
        else
          msg = "sorna-code-runner: completed."
          notification = atom.notifications.addSuccess msg, dismissable: false
          response.json().then( (json) =>
            buffer = ''
            if json.result.media
              for m in json.result.media
                if m[0] is "image/svg+xml"
                  buffer = buffer + m[1]
            if json.result.stdout
              buffer = buffer + '<br /><pre>'+json.result.stdout+'</pre>'
            if json.result.exceptions and json.result.exceptions.length > 0
              errBuffer = ''
              for exception in json.result.exceptions
                errBuffer = errBuffer + exception[0] + '(' + exception[1].join(', ') + ')'
              @SornaCodeRunnerView.setErrorMessage(errBuffer)
            @SornaCodeRunnerView.setContent(buffer)
            @resultPanel.show()
          )
        setTimeout ->
          notification.dismiss()
        , 1000
        return true
      )

  getAuthenticationString: (method, queryString, dateValue, bodyValue) ->
    return ( method + '\n' + queryString + '\n' + dateValue + '\n' + 'host:api.sorna.io'+ '\n'+'content-type:application/json' + '\n' + 'x-sorna-version:'+@apiVersion + '\n' + crypto.createHash(@hash_type).update(bodyValue).digest('hex'))

  getCurrentDate: (now) ->
    year = ('0000' + now.getUTCFullYear()).slice(-4)
    month = ('0' + (now.getUTCMonth() + 1)).slice(-2)
    day = ('0' + (now.getUTCDate())).slice(-2)
    t = year + month + day
    return t

  sign: (key, key_encoding, msg, digest_type) ->
    kbuf = new Buffer(key, key_encoding)
    hmac = crypto.createHmac(@hash_type, kbuf)
    hmac.update(msg, 'utf8')
    return hmac.digest(digest_type)

  getSignKey: (secret_key, now) ->
    k1 = @sign(secret_key, 'utf8', @getCurrentDate(now), 'binary')
    k2 = @sign(k1, 'binary', 'api.sorna.io', 'binary')
    return k2
