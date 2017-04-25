import {Map, fromJS} from 'immutable'
import {expect} from 'chai'
import {pointScheme} from '../src/point_scheme'
import {stage} from '../src/stage'

import reducer from '../src/reducer'
import sinon from 'sinon'
import uuid from 'node-uuid'

describe('reducer', () => {
  
  const startState = fromJS({
    sessionId: 'abcd', 
    stage: stage.preVoteOptions,
    pointScheme: pointScheme.fibonacci,
    users: []
  })
  
  const users = [
    {'name' : 'Bob', 'role': 'voter'}, 
    {'name' : 'Tom', 'role': 'voter'}, 
    {'name' : 'Dave', 'role': 'voter'}, 
    {'name' : 'Jim', 'role': 'observer'}
  ]
  
  beforeEach(() => {
    sinon.stub(uuid, 'v1').returns('abcd')
  })

  afterEach(function () {
    uuid.v1.restore()
  })
  
  it('has an initial state', () => {
    const action = {type: 'CREATE_SESSION'}
    const nextState = reducer(undefined, action)
    expect(nextState).to.equal(startState)
  })

  it('handles JOIN_SESSION', () => {
    const action = {type: 'JOIN_SESSION', payload: users[0]}
    const nextState = reducer(startState, action)
    expect(nextState).to.equal(startState.merge(
      fromJS(
        {
          users: users.slice(0,1)
        }
      )
    )) 
  })

  it('handles START_VOTE', () => {
    const action = {type: 'START_VOTE'}
    const nextState = reducer(startState, action)
    expect(nextState).to.equal(startState.merge(
      fromJS(
        {
          stage: stage.voteInProgress,
          votingRound: { "votes": {}, "observers": [] }
        }
      )
    )) 
  })
  
  it('handles VOTE', () => {
    const preVoteState =  startState.merge(
      fromJS(
        {
          users: users,
          stage: stage.voteInProgress,
          votingRound: { "votes": {}, "observers": [] }
        }
      ))
    const point = pointScheme.fibonacci[0]
    const action = {type: 'VOTE', payload: {user: users[0], point: point}}
    const nextState = reducer(preVoteState, action)
    let votes = {}
    votes[users[0].name] = point
    expect(nextState).to.equal(preVoteState.merge(
      fromJS(
        {
          votingRound: { "votes": votes, "observers": [] }
        }
      )
    )) 
  })
})
