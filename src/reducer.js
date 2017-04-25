import {createSession, joinSession, startVote, vote, INITIAL_STATE} from './core'

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
  case 'CREATE_SESSION':
    return createSession(state)
  case 'JOIN_SESSION':
    return joinSession(state, action.payload)
  case 'START_VOTE':
    return startVote(state)
  case 'VOTE':
    return vote(state, action.payload)
  }
  return state
}
