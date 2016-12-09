module.exports =
class SornaCodeRunnerView
  constructor: (serializedState) ->
    # Create root element
    @element = document.createElement('div')
    @element.classList.add('sorna-code-runner')

    # Create message element
    message = document.createElement('div')
    message.textContent = "Sorna code runner ready!"
    message.classList.add('message')
    @element.appendChild(message)

  setContent: (content) ->
     @element.children[0].textContent = content

  # Returns an object that can be retrieved when package is activated
  serialize: ->

  # Tear down any state and detach
  destroy: ->
    @element.remove()

  getElement: ->
    @element
