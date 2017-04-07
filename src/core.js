import {List, Map, fromJS} from 'immutable';
import uuid from 'node-uuid';
import {pointScheme} from './point_scheme';
import {stage} from './stage';

export const INITIAL_STATE = Map();

export function createSession(state) {
  return state.remove('votingRound')
              .set('sessionId', uuid.v1())
              .set('stage', stage.preVoteOptions)
              .set('pointScheme', pointScheme.fibonacci)
              .set('users', List.of());
}

export function joinSession(state, user) {
  const users = state.get('users')

  if(users && !isUserInSession(users, user)) {
    const newUsers = users.push(Map(user))
    return state.merge({users: newUsers})
  }
  return state
}

export function startVote(state) {
  if(state.get('stage') === stage.voteInProgress) {
    return state
  }

  const observers = state.get('users').filter(u => u.get('role') === 'observer')
  const votingRound = fromJS({'votes': {}, 'observers': observers})

  return state
          .set('votingRound', votingRound)
          .set('stage', stage.voteInProgress)
}

export function endVote(state) {
  if(state.get('stage') !== stage.voteInProgress) {
    return state
  }

  const votes = state.getIn(['votingRound', 'votes'])
  let tally = Map()

  votes.entrySeq().forEach( ([user, point]) => {
    tally = tally.update( point.get('label'), 0, count => count + 1 )
  })

  return state
          .set('stage', stage.voteSummary)
          .updateIn(['votingRound'], map => map.set('tally', tally))
}

export function vote(state, ballot) {
  if(!state.get('votingRound')) {
    return state
  }

  const user = ballot.user
  const point = ballot.point
  
  if(!state.get('pointScheme').contains(point) || 
     !isUserInSession(state.get('users'), user)) {
    return state
  } 

  let nextState = state.updateIn(['votingRound', 'votes'], map => map.set(user.name, point))

  if(votesComplete(nextState)){
    nextState = endVote(nextState)
  }
  
  return nextState
}

function votesComplete(state) {
  const votes = state.getIn(['votingRound', 'votes'])
  const observers = state.getIn(['votingRound', 'observers'])
  const users = state.get('users') 

  if(votes) {
    const numObservers = observers ? observers.size : 0
    if(users.size === votes.size + numObservers){
      return true
    }
  }

  return false
}

function isUserInSession(users, user) {
  return users.find((u) => u.get('name') === user.name)
}

