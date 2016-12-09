SornaCodeRunnerView = require './sorna-code-runner-view'
{CompositeDisposable} = require 'atom'

module.exports = SornaCodeRunner =
  SornaCodeRunnerView: null
  modalPanel: null
  subscriptions: null

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
    @wordcountView.destroy()

  serialize: ->
    SornaCodeRunnerViewState: @SornaCodeRunnerView.serialize()

  runcode: ->
    console.log 'Code runner test!'

    if @modalPanel.isVisible()
      @modalPanel.hide()
    else
      editor = atom.workspace.getActiveTextEditor()
      content = editor.getText()
      @SornaCodeRunnerView.setContent(content)
      @modalPanel.show()
