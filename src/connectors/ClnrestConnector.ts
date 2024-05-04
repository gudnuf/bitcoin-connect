import {Connector} from './Connector';
import {ConnectorConfig} from '../types/ConnectorConfig';
import {
  GetBalanceResponse,
  GetInfoResponse,
  KeysendArgs,
  LookupInvoiceArgs,
  LookupInvoiceResponse,
  MakeInvoiceResponse,
  RequestInvoiceArgs,
  SendPaymentResponse,
  SignMessageResponse,
  WebLNProvider,
  WebLNRequestMethod,
} from '@webbtc/webln-types';

export class ClnrestConnector extends Connector {
  constructor(config: ConnectorConfig) {
    super(config);
  }

  async init(): Promise<WebLNProvider> {
    if (!this._config.clnrestHost) {
      throw new Error('no clnrest host provided');
    }
    if (!this._config.clnrestRune) {
      throw new Error('no clnrest rune provided');
    }

    return new ClnrestWeblnConnector(
      this._config.clnrestHost,
      this._config.clnrestRune
    );
  }
}

export class ClnrestWeblnConnector implements WebLNProvider {
  private _instanceUrl: string;
  private _adminKey: string;

  constructor(clnrestUrl: string, rune: string) {
    this._instanceUrl = clnrestUrl;
    this._adminKey = rune;
  }
  enable(): Promise<void> {
    return Promise.resolve();
  }
  async getInfo(): Promise<GetInfoResponse> {
    const response = await this.requestClnrest<{alias: string}>(
      'GET',
      '/v1/getinfo'
    );

    return {
      node: {
        alias: response.alias,
        pubkey: '',
      },
      methods: [
        'getInfo',
        'getBalance',
        'sendPayment',
        // TODO: support makeInvoice and sendPaymentAsync
      ],
      version: '1.0',
      supports: ['lightning'],
    };
  }
  makeInvoice(
    _args: string | number | RequestInvoiceArgs
  ): Promise<MakeInvoiceResponse> {
    throw new Error('Method not implemented.');
  }
  async sendPayment(paymentRequest: string): Promise<SendPaymentResponse> {
    console.log('paymentRequest', paymentRequest);
    if (paymentRequest.startsWith('lno1')) {
      const [offer, amount_sat] = paymentRequest.split(':');
      const amount_msat = parseInt(amount_sat) * 1000;
      console.log('offer', offer);
      const invoiceRes = await this.requestClnrest<{invoice: string}>(
        'POST',
        '/v1/fetchinvoice',
        {
          offer,
          amount_msat,
        }
      );

      const payResponse = await this.requestClnrest<{payment_preimage: string}>(
        'POST',
        '/v1/pay',
        {
          bolt11: invoiceRes.invoice,
        }
      );

      if (!payResponse.payment_preimage) {
        throw new Error('No preimage');
      }

      return {
        preimage: payResponse.payment_preimage,
      };
    }

    const response = await this.requestClnrest<{payment_hash: string}>(
      'POST',
      '/v1/payments',
      {
        bolt11: paymentRequest,
        out: true,
      }
    );

    const checkResponse = await this.requestClnrest<{preimage: string}>(
      'GET',
      `/api/v1/payments/${response.payment_hash}`
    );

    if (!checkResponse.preimage) {
      throw new Error('No preimage');
    }
    return {
      preimage: checkResponse.preimage,
    };
  }

  async getBalance(): Promise<GetBalanceResponse> {
    return {
      balance: 0,
    };
    // const response = await this.requestClnrest<{balance: number}>(
    //   'GET',
    //   '/api/v1/wallet'
    // );

    // const balance = Math.floor(response.balance / 1000);

    // return {
    //   balance,
    // };
  }

  keysend(_args: KeysendArgs): Promise<SendPaymentResponse> {
    throw new Error('Method not implemented.');
  }
  lnurl(
    _lnurl: string
  ): Promise<{status: 'OK'} | {status: 'ERROR'; reason: string}> {
    throw new Error('Method not implemented.');
  }
  lookupInvoice(_args: LookupInvoiceArgs): Promise<LookupInvoiceResponse> {
    throw new Error('Method not implemented.');
  }
  request:
    | ((method: WebLNRequestMethod, args?: unknown) => Promise<unknown>)
    | undefined;
  signMessage(_message: string): Promise<SignMessageResponse> {
    throw new Error('Method not implemented.');
  }
  verifyMessage(_signature: string, _message: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async requestClnrest<T>(
    method: string,
    path: string,
    args?: Record<string, unknown>
  ) {
    let body = null;
    const query = '';
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-Type', 'application/json');
    headers.append('rune', this._adminKey);

    if (method === 'POST') {
      body = JSON.stringify(args);
    } else if (args !== undefined) {
      throw new Error('TODO: support args in GET');
      // query = ...
    }
    const res = await fetch(this._instanceUrl + path + query, {
      method,
      headers,
      body,
    });
    if (!res.ok) {
      const errBody = await res.json();
      console.error('errBody', errBody);
      throw new Error(errBody.detail);
    }
    return (await res.json()) as T;
  }
}
