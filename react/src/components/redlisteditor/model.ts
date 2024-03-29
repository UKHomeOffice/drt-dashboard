export type RedListUpdate = {
  effectiveFrom: number
  additions: [string, string][]
  removals: string[]
}

export type RedListUpdates = {
  updates: RedListUpdate[]
}

export type RedListUpdatesLoaded = {
  kind: "RedListUpdatesLoaded"
  updates: RedListUpdates
}

export type RedListUpdatesPending = {
  kind: "RedListUpdatesPending"
}

export type RedListUpdatesState = RedListUpdatesPending | RedListUpdatesLoaded

export type Addition = {
  name: string
  code: string
}

export type Editing = {
  update: RedListUpdate
  addingAddition: Addition | null
  addingRemoval: string | null
  originalDate: number
}

export class Editing_ {

  public static setAddition(editing: Editing, country: string, code: string): Editing {
    const updatedAddition = editing.addingAddition && {...editing.addingAddition, name: country, code: code}
    return {...editing, addingAddition: updatedAddition}
  }

  public static setRemovalCode(editing: Editing, code: string): Editing {
    return {...editing, addingRemoval: code}
  }

  public static setEffectiveFrom(editing: Editing, newDate: number): Editing {
    return {...editing, update: {...editing.update, effectiveFrom: newDate}}
  }

  public static removeAddition(editing: Editing, name: string): Editing {
    const additions = editing.update.additions.filter(entry => entry[0] !== name)
    return {...editing, update: {...editing.update, additions: additions}}
  }

  public static removeRemoval(editing: Editing, code: string): Editing {
    const removals = editing.update.removals.filter(c => c !== code)
    return {...editing, update: {...editing.update, removals: removals}}
  }
}

export type State = {
  updates: RedListUpdate[],
  editing: Editing | null
}

export class State_ {
  public static addingAddition(state: State): State {
    return state.editing ? {...state, editing: {...state.editing, addingAddition: {name: "", code: ""}}} : state
  }

  public static updatingAddition(state: State, country: string, code: string): State {
    return state.editing ? {...state, editing: Editing_.setAddition(state.editing, country, code)} : state
  }

  public static addingRemoval(state: State): State {
    return state.editing ? {...state, editing: {...state.editing, addingRemoval: ""}} : state
  }

  public static updatingRemoval(state: State, country: string): State {
    return state.editing ? {...state, editing: Editing_.setRemovalCode(state.editing, country)} : state
  }
}
