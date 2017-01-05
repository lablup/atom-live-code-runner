SornaCodeRunnerView = require './sorna-code-runner-view'
{CompositeDisposable} = require 'atom'

module.exports = SornaCodeRunner =
  config: require('./config.coffee')
  SornaCodeRunnerView: null
  modalPanel: null
  subscriptions: null
  code: null

  activate: (state) ->
    @SornaCodeRunnerView = new SornaCodeRunnerView(state.SornaCodeRunnerViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @SornaCodeRunnerView.getElement(), visible: false)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

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
    if note @getSecretKey()
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
      @modalPanel.show()

  # TODO
  getAPIversion: ->
    return "v1"

  # TODO
  createKernel: (kernelType) ->
    return true

  # TODO
  destroyKernel: ->
    return true

  # TODO
  sendCode: ->
    editor = atom.workspace.getActiveTextEditor()
    @code = editor.getText()
