module.exports =
class SornaCodeRunnerView
  constructor: (serializedState, caller) ->
    @caller = caller
    # Create root element
    @element = document.createElement('div')
    @element.classList.add('sorna-code-runner')

    # Create message element
    consoleMessage = document.createElement('div')
    consoleMessage.classList.add('sorna-code-runner-console-message')
    @element.appendChild(consoleMessage)

    errorMessage = document.createElement('div')
    errorMessage.classList.add('sorna-code-runner-error-message')
    @element.appendChild(errorMessage)

    message = document.createElement('div')
    message.classList.add('message')
    @element.appendChild(message)


    buttonArea = document.createElement('div')
    buttonArea.classList.add('sorna-code-runner-buttons')
    closeButton = document.createElement('span')
    closeButton.addEventListener('click', @closeView.bind(@))
    closeButton.classList.add('icon')
    closeButton.classList.add('icon-x')
    refreshButton = document.createElement('span')
    refreshButton.addEventListener('click', @refreshKernel.bind(@))
    refreshButton.classList.add('icon')
    refreshButton.classList.add('icon-repo-sync')
    buttonArea.appendChild(refreshButton)
    buttonArea.appendChild(closeButton)

    @element.appendChild(buttonArea)

  closeView: =>
    @clearView()
    @caller.resultPanel.hide()

  refreshKernel: =>
    @clearView()
    @caller.refreshKernel()

  # Clear all views
  clearView: ->
     @element.children[2].innerHTML = ''
     @element.children[1].textContent = ''
     @element.children[0].innerHTML = ''

  # Set content
  setContent: (content) ->
     @element.children[2].innerHTML = content

  # Set error message
  setErrorMessage: (content) ->
     @element.children[1].textContent = content

  # Adds console message
  addConsoleMessage: (content) ->
     @element.children[0].innerHTML = @element.children[0].innerHTML + '<br />' +  content

  # Clears console message
  clearConsoleMessage: ->
     @element.children[0].innerHTML = ''

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @element.remove()

  getElement: ->
    @element
