import {customElement, state} from 'lit/decorators.js';
import {BitcoinConnectElement} from '../BitcoinConnectElement';
import {withTwind} from '../twind/withTwind';
import {html} from 'lit';
import '../internal/bci-button';
import {classes} from '../css/classes';
import store from '../../state/store';
import {clnrestConnectorTitle} from '../connectors/bc-clnrest-connector';

@customElement('bc-clnrest')
export class clnrestPage extends withTwind()(BitcoinConnectElement) {
  @state()
  private _clnrestRune = '';
  @state()
  private _clnrestHost = '';

  override render() {
    return html`<div class="w-full">
      <bc-navbar
        class="flex w-full"
        heading=${clnrestConnectorTitle}
      ></bc-navbar>
      <div class="font-sans text-sm w-full">
        <div class="px-8 pt-4 w-full">
          <div class="mb-4 ${classes['text-neutral-primary']}">
            Make sure your Core Lightning node is running clnrest. Find the host
            and port and copy below:
          </div>

          <div class="mb-1 ${classes['text-neutral-secondary']}">Rune</div>
          <input
            value=${this._clnrestRune}
            @change=${this._clnrestRuneChanged}
            type="password"
            placeholder="lightning-cli createrune"
            class="w-full mb-8 rounded-lg p-2 border-1 ${classes[
              'border-neutral-secondary'
            ]}"
          />
          <div class="mb-1 ${classes['text-neutral-secondary']}">
            CLNREST Host
          </div>

          <input
            value=${this._clnrestHost}
            @change=${this._clnrestHostChanged}
            class="w-full mb-8 rounded-lg p-2 border-1 ${classes[
              'border-neutral-secondary'
            ]}"
          />
          <bci-button @click=${this.onConnect}>
            <span class="${classes['text-brand-mixed']}">Connect</span>
          </bci-button>
        </div>
      </div>
    </div>`;
  }

  private _clnrestRuneChanged(event: {target: HTMLInputElement}) {
    this._clnrestRune = event.target.value;
  }
  private _clnrestHostChanged(event: {target: HTMLInputElement}) {
    this._clnrestHost = event.target.value;
  }
  private async onConnect() {
    if (!this._clnrestRune) {
      store.getState().setError('Please enter your rune');
      return;
    }
    if (!this._clnrestHost) {
      store.getState().setError('Please enter your clnrest host:port');
      return;
    }

    await store.getState().connect({
      clnrestRune: this._clnrestRune,
      clnrestHost: this._clnrestHost,
      connectorName: clnrestConnectorTitle,
      connectorType: 'clnrest',
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-clnrest': clnrestPage;
  }
}
