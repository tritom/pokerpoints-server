import {createSession, INITIAL_STATE} from './core';

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
  case 'CREATE_SESSION':
    return createSession(state);
  }
  return state;
}
