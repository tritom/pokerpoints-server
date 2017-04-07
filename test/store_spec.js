import {Map, fromJS} from 'immutable';
import {expect} from 'chai';

import {pointScheme} from '../src/point_scheme';
import {stage} from '../src/stage';
import makeStore from '../src/store';
import sinon from 'sinon';
import uuid from 'node-uuid';

describe('store', () => {
  
  beforeEach(() => {
    sinon.stub(uuid, 'v1').returns('abcd');
  });

  afterEach(function () {
    uuid.v1.restore();
  });

  it('is a Redux store configured with the correct reducer', () => {
    const store = makeStore();
    expect(store.getState()).to.equal(Map());

    store.dispatch({
      type: 'CREATE_SESSION'
    });

    expect(store.getState()).to.equal(fromJS(
      {
        sessionId: 'abcd', 
        stage: stage.preVoteOptions,
        pointScheme: pointScheme.fibonacci,
        users: []
      }  
    ));
  });

});
