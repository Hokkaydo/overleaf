import { EditorSelection, StateEffect, Line, Text } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { hasEffect, updateHasEffect } from '../../utils/effects'

export const selectionIntersects = (
  selection: EditorSelection,
  extents: { from: number; to: number }
) =>
  selection.ranges.some(
    range =>
      // Case 1: from is inside node
      (extents.from <= range.from && extents.to >= range.from) ||
      // Case 2: to is inside node
      (extents.from <= range.to && extents.to >= range.to)
  )

export const placeSelectionInsideBlock = (
  view: EditorView,
  event: MouseEvent
) => {
  const line = view.lineBlockAtHeight(event.pageY - view.documentTop)

  const selectionRange = EditorSelection.cursor(line.to)
  const selection = event.ctrlKey
    ? view.state.selection.addRange(selectionRange)
    : selectionRange

  return { selection, effects: EditorView.scrollIntoView(line.to) }
}

export const extendBackwardsOverEmptyLines = (doc: Text, line: Line) => {
  let { number, from } = line
  for (let lineNumber = number - 1; lineNumber > 0; lineNumber--) {
    const line = doc.line(lineNumber)
    if (line.text.trim().length > 0) {
      break
    }
    from = line.from
  }
  return from
}

export const extendForwardsOverEmptyLines = (doc: Text, line: Line) => {
  let { number, to } = line
  for (let lineNumber = number + 1; lineNumber <= doc.lines; lineNumber++) {
    const line = doc.line(lineNumber)
    if (line.text.trim().length > 0) {
      break
    }
    to = line.to
  }

  return to
}

export const mouseDownEffect = StateEffect.define<boolean>()
export const hasMouseDownEffect = hasEffect(mouseDownEffect)
export const updateHasMouseDownEffect = updateHasEffect(mouseDownEffect)

export const mouseDownListener = EditorView.domEventHandlers({
  mousedown: (event, view) => {
    // not wrapped in a timeout, so update listeners know that the mouse is down before they process the selection
    view.dispatch({
      effects: mouseDownEffect.of(true),
    })
  },
  mouseup: (event, view) => {
    // wrap in a timeout, so update listeners receive this effect after the new selection has finished being handled
    window.setTimeout(() => {
      view.dispatch({
        effects: mouseDownEffect.of(false),
      })
    })
  },
})
