SornaCodeRunnerView = require './sorna-code-runner-view'
{CompositeDisposable} = require 'atom'
crypto = require 'crypto'
util = require 'util'

module.exports = SornaCodeRunner =
  config: require('./config.coffee')
  SornaCodeRunnerView: null
  modalPanel: null
  subscriptions: null
  code: null
  accessKey: null
  secretKey: null
  signKey: null
  apiVersion: 'v1.20160915'
  hash_type: 'sha256'
  baseURL: 'https://api.sorna.io'
  kernelId: null

  activate: (state) ->
    @SornaCodeRunnerView = new SornaCodeRunnerView(state.SornaCodeRunnerViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @SornaCodeRunnerView.getElement(), visible: false)
    console.log('Current access key: '+ @getAccessKey())

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable
    @checkMandatorySettings()

    # Register command
    @subscriptions.add atom.commands.add 'atom-text-editor',
      'sorna-code-runner:run': => @runcode()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()

  serialize: ->
    SornaCodeRunnerViewState: @SornaCodeRunnerView.serialize()

  getAccessKey: ->
    accessKey = atom.config.get 'sorna-code-runner.accessKey'
    console.log accessKey
    if accessKey
      accessKey = accessKey.trim()
    return accessKey

  getSecretKey: ->
    secretKey = atom.config.get 'sorna-code-runner.secretKey'
    console.log secretKey
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
    console.log 'Code runner test!'

    if @modalPanel.isVisible()
      @modalPanel.hide()
    else
      editor = atom.workspace.getActiveTextEditor()
      content = editor.getText()
      @SornaCodeRunnerView.setContent(content)
      #@modalPanel.show()
    @createKernel('python3')
    #@sendCode()
    #@getAPIversion()

  # TODO
  getAPIversion: ->
    d = new Date()
    k = @getSignKey(@getSecretKey())
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
        console.log(response)
        return response.version
      )

  # TODO
  createKernel: (kernelType) ->
    requestBody =
      "lang": "python3",
      "resourceLimits":
        "maxMem": 51240,
        "timeout": 5000
    requestInfo = @newRequest('POST', '/v1/kernel/create', requestBody)
    fetch(@baseURL + '/v1/kernel/create', requestInfo)
      .then( (response) ->
        console.log(response)
        if response.ok is false
          errorMsg = "sorna-code-runner: " + response.statusText
          notification = atom.notifications.addError errorMsg,
            dismissable: true
        else
          @kernelId = response.kernelId
        return true
      , (e) ->
      )

  # TODO
  destroyKernel: (kernelId) ->
    requestInfo = @newRequest('DELETE', '/v1/kernel/'+kernelId, null)
    fetch(@baseURL + '/v1/kernel/'+kernelId, requestInfo)
      .then( (response) ->
        console.log(response)
        if response.ok is false
          errorMsg = "sorna-code-runner: " + response.statusText
          notification = atom.notifications.addError errorMsg,
            dismissable: true
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
    aStr = @getAuthenticationString('POST', queryString, d.toISOString(), requestBody)
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

  # TODO
  sendCode: ->
    if @kernelId is null
      @createKernel()
      msg = "sorna-code-runner: preparing kernel..."
      notification = atom.notifications.addInfo msg,
        dismissable: true
      return true
    editor = atom.workspace.getActiveTextEditor()
    @code = editor.getText()
    requestBody = {
      "codeId": "test",
      "code": @code
    }
    requestInfo = @newRequest('POST', '/v1/kernel/'+ @kernelId, requestBody)
    fetch(@baseURL + '/v1/kernel/' + @kernelId, requestInfo)
      .then( (response) ->
        console.log(response)
        if response.ok is false
          errorMsg = "sorna-code-runner: " + response.statusText
          notification = atom.notifications.addError errorMsg,
            dismissable: true
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
