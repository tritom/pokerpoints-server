import {List, Map, fromJS} from 'immutable'
import {expect} from 'chai'
import {createSession, joinSession, startVote, endVote, vote} from '../src/core'
import {pointScheme} from '../src/point_scheme'
import {stage} from '../src/stage'
import uuid from 'node-uuid'
import sinon from 'sinon'

describe('application logic', () => {
  const points = fromJS(pointScheme.fibonacci)
  const users = [
    {'name' : 'Bob', 'role': 'voter'}, 
    {'name' : 'Tom', 'role': 'voter'}, 
    {'name' : 'Dave', 'role': 'voter'}, 
    {'name' : 'Jim', 'role': 'observer'}
  ]

  describe('createSession', () => {
    beforeEach(() => {
      sinon.stub(uuid, 'v1').returns('NEW_SESSION_ID')
    })

    afterEach(function () {
      uuid.v1.restore()
    })
    
    it('returns session with initial state', () => {
      const state = Map()
      const nextState = createSession(state)
      expect(nextState).to.equal(Map({
        sessionId: 'NEW_SESSION_ID', 
        stage: stage.preVoteOptions,
        pointScheme: points,
        users: List.of()
      }))
    })

    it('returns resets existing session with initial state', () => {
      const state = fromJS({ sessionId: 'OLD_SESSION_ID', 
        stage: stage.VoteSummary,
        pointScheme: points,
        users: users,
        votingRound: {votes: {}, observers:[]}
      })
      
      const nextState = createSession(state)
      
      expect(nextState).to.equal(Map({
        sessionId: 'NEW_SESSION_ID', 
        stage: stage.preVoteOptions,
        pointScheme: points,
        users: List.of()
      }))
    })
  })

  describe('joinSession', () => {
    let state = fromJS({
        sessionId: 'NEW_SESSION_ID', 
        stage: stage.preVoteOptions,
        pointScheme: points,
        users: [] 
    })
    const user = users[0]
    
    it('should not add user to empty state', () => {
      const nextState = joinSession(Map(), user)
      expect(nextState).to.equal(Map())
    })

    it('should add user to state', () => {
      const nextState = joinSession(state, user)
      expect(nextState.get('users')).to.equal(fromJS([user]))
    })
    
    it('should not add user with same name to state', () => {
      const nextState = joinSession(state, user)
      const finalState = joinSession(nextState, user) 
      expect(finalState.get('users').size).to.equal(1)
    })
  })

  describe('startVote', () => {
    let state = fromJS({
        sessionId: 'NEW_SESSION_ID', 
        stage: stage.preVoteOptions,
        pointScheme: points,
        users: [users[0]] 
    })
    
    it('should set stage to VoteInProgress from PreVoteOptions', () => {
      const nextState = startVote(state)  
      expect(nextState.get('stage')).to.equal('VoteInProgress')
    })

    it('should set stage to VoteInProgress from VoteSummary', () => {
      state = state.set('stage', stage.voteSummary)
      const nextState = startVote(state)  
      expect(nextState.get('stage')).to.equal('VoteInProgress')
    })

    it('should add votingRound to state', () => {
      const nextState = startVote(state)  
      expect(nextState.get('votingRound')).to.equal(fromJS( {votes:{}, observers:[]}))
    })

    it('should add observers to votingRound', () => {
      state = state.updateIn(['users'], list => list.push(fromJS(users[3])))
      const nextState = startVote(state)  
      expect(nextState.getIn(['votingRound', 'observers']))
        .to.equal(fromJS([users[3]]))
    })
    
    it('should return same state if VoteInProgress', () => {
      const existingVoteState = 
        state.merge( 
          fromJS(
            { 
              stage : stage.voteInProgress,
              votingRound : 
              { votes: {'USER_ID': 'POINT_LABEL'} }
            }
          )
        )
      const nextState = startVote(existingVoteState)  
      expect(nextState).to.equal(existingVoteState)
    })
  })

  describe('endVote', () => {
    let votes = {}
    votes[users[0].name] = points.get(0)
    votes[users[1].name] = points.get(0)
    votes[users[2].name] = points.get(1)

    let state = fromJS({
        sessionId: 'NEW_SESSION_ID', 
        stage: stage.voteInProgress,
        pointScheme: points,
        users: users,
        votingRound: {
          votes: votes
        }
    })

    it('should change state to voteSummary', () => {
      const nextState = endVote(state)
      expect(nextState.get('stage')).to.equal(stage.voteSummary)
    })
     
    it('should calculate ', () => {
      const nextState = endVote(state)
      expect(nextState.get('stage')).to.equal(stage.voteSummary)
    })

    it('should add vote tally to voteSummary', () => {
      const nextState = endVote(state)
      let tally = {}
      tally[points.get(0).get('label')] = 2
      tally[points.get(1).get('label')] = 1 
      expect(nextState.getIn(['votingRound', 'tally'])).to.equal(
        fromJS(
          tally 
        )
      )
    })
  })

  describe('vote', () => {
    const testUsers = users.slice(0,2)
    const userName = testUsers[0].name
    const ballot = {'user' : {'name': userName}, 'point' : points.get(0)}
    let state = fromJS({
        sessionId: 'NEW_SESSION_ID', 
        stage: stage.voteInProgress,
        pointScheme: points,
        users: testUsers,
        votingRound: {
          votes: {}
        }
    })

    it('should return same state if no votingRound', () => {
      const invalidVoteState = createSession(Map())
      const nextState = vote(invalidVoteState, ballot)
      expect(nextState).to.equal(invalidVoteState)
    })
    
    it('should add vote to votes', () => {
      const nextState = vote(state, ballot)
      const votes = nextState.getIn(['votingRound', 'votes'])
      expect(votes).to.equal(Map({ 'Bob' : ballot.point }))
    })
    
    it('should not change stage if votes remaining', () => {
      const nextState = vote(state, ballot)
      const votes = nextState.getIn(['votingRound', 'votes'])
      expect(nextState.get('stage')).to.equal(stage.voteInProgress) 
    })
    
    it('should not add vote when point not part of pointScheme', () => {
      const invalidPointBallot = {'user' : userName, 'point' : Map({label:'88', value: 88})}
      const nextState = vote(state, invalidPointBallot)
      const votes = nextState.getIn(['votingRound', 'votes'])
      expect(votes).to.equal(Map({}))
    })
     
    it('should not add vote when user not part of session', () => {
      const invalidUserballot = {'user' : {'name': 'BOGUS'}, 'point' : points.get(0)}
      const nextState = vote(state, invalidUserballot)
      const votes = nextState.getIn(['votingRound', 'votes'])
      expect(votes).to.equal(Map({}))
    })
    
    it('should end vote when all users have voted', () => {
      state = vote(state, ballot)
      const secondBallot = {'user' : {'name': testUsers[1].name}, 'point' : points.get(1)}
      const nextState = vote(state, secondBallot)
      expect(nextState.get('stage')).to.equal(stage.voteSummary) 
    })

    it('should end vote when votes + observers matches total users', () => {
      state = state.updateIn(['votingRound'], map => map.set('observers', fromJS([{'name': 'Jim'}])))
      const nextState = vote(state, ballot)
      expect(nextState.get('stage')).to.equal(stage.voteSummary) 
    })
  })
})
