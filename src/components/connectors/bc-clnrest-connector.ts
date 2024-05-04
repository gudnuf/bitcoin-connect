import {customElement} from 'lit/decorators.js';
import {ConnectorElement} from './ConnectorElement';
import store from '../../state/store';
import {lnbitsIcon} from '../icons/connectors/lnbitsIcon';

export const clnrestConnectorTitle = 'CLNREST';

@customElement('bc-clnrest-connector')
export class GenericNWCConnector extends ConnectorElement {
  constructor() {
    super('clnrest', clnrestConnectorTitle, '#673ab7', lnbitsIcon);
  }

  protected async _onClick() {
    store.getState().pushRoute('/clnrest');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-clnrest-connector': GenericNWCConnector;
  }
}
