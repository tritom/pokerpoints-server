import {Map, fromJS} from 'immutable';
import {expect} from 'chai';
import {pointScheme} from '../src/point_scheme';
import {stage} from '../src/stage';

import reducer from '../src/reducer';
import sinon from 'sinon';
import uuid from 'node-uuid';

describe('reducer', () => {
  beforeEach(() => {
    sinon.stub(uuid, 'v1').returns('abcd');
  });

  afterEach(function () {
    uuid.v1.restore();
  });
  
  it('has an initial state', () => {
    const action = {type: 'CREATE_SESSION'};
    const nextState = reducer(undefined, action);
    expect(nextState).to.equal(fromJS({
      sessionId: 'abcd', 
      stage: stage.preVoteOptions,
      pointScheme: pointScheme.fibonacci,
      users: []
    }));
  });

  it('handles JOIN_SESSION', () => {
  
  })

});
