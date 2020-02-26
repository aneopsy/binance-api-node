import crypto from 'crypto'
import zip from 'lodash.zipobject'
import wsMethods from 'websocket'

import 'isomorphic-fetch'

export const candleFields = [
  'openTime',
  'open',
  'high',
  'low',
  'close',
  'volume',
  'closeTime',
  'quoteVolume',
  'trades',
  'baseAssetVolume',
  'quoteAssetVolume',
]
class HttpClient {
  constructor({ httpBase = 'https://api.binance.com', apiKey, apiSecret }) {
    if (this.constructor === HttpClient) {
      throw new TypeError('Abstract class "AbstractConfig" cannot be instantiated directly')
    }
    this.urlBase = httpBase
    this.apiKey = apiKey
    this.apiSecret = apiSecret
    this.ws = wsMethods({ httpBase, apiKey, apiSecret })
  }

  defaultGetTime() {
    return Date.now()
  }

  /**
   * Build query string for uri encoded url based on json object
   */
  makeQueryString(q) {
    return q
      ? `?${Object.keys(q)
          .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(q[k])}`)
          .join('&')}`
      : ''
  }

  /**
   * Finalize API response
   */
  sendResult(call) {
    return call.then(res => {
      // If response is ok, we can safely assume it is valid JSON
      if (res.ok) {
        return res.json()
      }

      // Errors might come from the API itself or the proxy Binance is using.
      // For API errors the response will be valid JSON,but for proxy errors
      // it will be HTML
      return res.text().then(text => {
        let error
        try {
          const json = JSON.parse(text)
          // The body was JSON parseable, assume it is an API response error
          error = new Error(json.msg || `${res.status} ${res.statusText}`)
          error.code = json.code
          error.url = res.url
        } catch (e) {
          // The body was not JSON parseable, assume it is proxy error
          error = new Error(`${res.status} ${res.statusText} ${text}`)
          error.response = res
          error.responseText = text
        }
        throw error
      })
    })
  }

  /**
   * Util to validate existence of required parameter(s)
   */
  checkParams(name, payload, requires = []) {
    if (!payload) {
      throw new Error('You need to pass a payload object.')
    }

    requires.forEach(r => {
      if (!payload[r] && isNaN(payload[r])) {
        throw new Error(`Method ${name} requires ${r} parameter.`)
      }
    })

    return true
  }

  /**
   * Make public calls against the api
   *
   * @param {string} path Endpoint path
   * @param {object} data The payload to be sent
   * @param {string} method HTTB VERB, GET by default
   * @param {object} headers
   * @returns {object} The api response
   */
  publicCall(path, data, method = 'GET', headers = {}) {
    if (!path) {
      throw new Error('You need to pass an path to make this call.')
    }
    return this.sendResult(
      fetch(`${this.urlBase}${path}${this.makeQueryString(data)}`, {
        method,
        json: true,
        headers,
      }),
    )
  }

  /**
   * Factory method for partial private calls against the api
   *
   * @param {string} path Endpoint path
   * @param {object} data The payload to be sent
   * @param {string} method HTTB VERB, GET by default
   * @returns {object} The api response
   */
  keyCall(path, data, method = 'GET') {
    if (!path) {
      throw new Error('You need to pass an path to make this call.')
    }
    if (!this.apiKey) {
      throw new Error('You need to pass an API key to make this call.')
    }

    return this.publicCall(path, data, method, {
      'X-MBX-APIKEY': this.apiKey,
    })
  }

  /**
   * Factory method for private calls against the api
   *
   * @param {string} path Endpoint path
   * @param {object} data The payload to be sent
   * @param {string} method HTTB VERB, GET by default
   * @param {object} headers
   * @returns {object} The api response
   */
  privateCall(path, data = {}, method = 'GET', noData, noExtra) {
    if (!path) {
      throw new Error('You need to pass an path to make this call.')
    }
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('You need to pass an API key and secret to make authenticated calls.')
    }

    return (data && data.useServerTime
      ? this.pubblicCall('/api/v1/time').then(r => r.serverTime)
      : Promise.resolve(this.defaultGetTime())
    ).then(timestamp => {
      if (data) {
        delete data.useServerTime
      }

      const signature = crypto
        .createHmac('sha256', this.apiSecret)
        .update(this.makeQueryString({ ...data, timestamp }).substr(1))
        .digest('hex')

      const newData = noExtra ? data : { ...data, timestamp, signature }

      return this.sendResult(
        fetch(`${this.urlBase}${path}${noData ? '' : this.makeQueryString(newData)}`, {
          method,
          headers: { 'X-MBX-APIKEY': this.apiKey },
          json: true,
        }),
      )
    })
  }

  /**
   * Get candles for a specific pair and interval and convert response
   * to a user friendly collection.
   */
  candles(payload) {
    return (
      this.checkParams('candles', payload, ['symbol']) &&
      this.publicCall(this.endpoint.candles, { interval: '5m', ...payload }).then(candles =>
        candles.map(candle => zip(candleFields, candle)),
      )
    )
  }

  /**
   * Create a new order wrapper for market order simplicity
   */
  order(payload = {}) {
    const newPayload =
      ['LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'].includes(payload.type) || !payload.type
        ? { timeInForce: 'GTC', ...payload }
        : payload

    return (
      this.checkParams('order', newPayload, ['symbol', 'side', 'quantity']) &&
      this.privateCall(this.endpoint.order, { type: 'LIMIT', ...newPayload }, 'POST')
    )
  }

  orderOco(payload = {}) {
    const newPayload =
      payload.stopLimitPrice && !payload.stopLimitTimeInForce
        ? { stopLimitTimeInForce: 'GTC', ...payload }
        : payload

    return (
      this.checkParams('order', newPayload, ['symbol', 'side', 'quantity', 'price', 'stopPrice']) &&
      this.privateCall(this.endpoint.orderOco, newPayload, 'POST')
    )
  }

  /**
   * Zip asks and bids reponse from order book
   */
  book(payload) {
    return (
      this.checkParams('book', payload, ['symbol']) &&
      this.publicCall(this.endpoint.book, payload).then(({ lastUpdateId, asks, bids }) => ({
        lastUpdateId,
        asks: asks.map(a => zip(['price', 'quantity'], a)),
        bids: bids.map(b => zip(['price', 'quantity'], b)),
      }))
    )
  }

  aggTrades(payload) {
    return (
      this.checkParams('aggTrades', payload, ['symbol']) &&
      this.publicCall(this.endpoint.aggTrades, payload).then(trades =>
        trades.map(trade => ({
          aggId: trade.a,
          price: trade.p,
          quantity: trade.q,
          firstId: trade.f,
          lastId: trade.l,
          timestamp: trade.T,
          isBuyerMaker: trade.m,
          wasBestPrice: trade.M,
        })),
      )
    )
  }

  ping() {
    return this.publicCall(this.endpoint.ping).then(() => true)
  }

  time() {
    return this.publicCall(this.endpoint.time).then(r => r.serverTime)
  }

  exchangeInfo() {
    return this.publicCall(this.endpoint.exchangeInfo)
  }

  trades(payload) {
    return (
      this.checkParams('trades', payload, ['symbol']) &&
      this.publicCall(this.endpoint.trades, payload)
    )
  }

  tradesHistory(payload) {
    return (
      this.checkParams('tradesHitory', payload, ['symbol']) &&
      this.keyCall(this.endpoint.dailyStats, payload)
    )
  }

  dailyStats(payload) {
    return this.publicCall(this.endpoint.dailyStats, payload)
  }

  prices() {
    return this.publicCall(this.endpoint.prices).then(r =>
      r.reduce((out, cur) => ((out[cur.symbol] = cur.price), out), {}),
    )
  }

  avgPrice(payload) {
    return this.publicCall(this.endpoint.avgPrice, payload)
  }

  allBookTickers() {
    return this.publicCall(this.endpoint.allBookTickers).then(r =>
      r.reduce((out, cur) => ((out[cur.symbol] = cur), out), {}),
    )
  }

  orderTest(payload) {
    return this.order(payload, this.endpoint.orderTest)
  }
  getOrder(payload) {
    return this.privateCall(this.endpoint.getOrder, payload)
  }

  cancelOrder(payload) {
    return this.privateCall(this.endpoint.cancelOrder, payload, 'DELETE')
  }

  openOrders(payload) {
    return this.privateCall(this.endpoint.openOrders, payload)
  }

  allOrders(payload) {
    return this.privateCall(this.privateCall.allOrders, payload)
  }

  accountInfo(payload) {
    return this.privateCall(this.endpoint.accountInfo, payload)
  }
  myTrades(payload) {
    return this.privateCall(this.endpoint.myTrades, payload)
  }

  withdraw(payload) {
    return this.privateCall(this.endpoint.withdraw, payload, 'POST')
  }

  withdrawHistory(payload) {
    return this.privateCall(this.endpoint.withdrawHistory, payload)
  }
  depositHistory(payload) {
    return this.privateCall(this.endpoint.depositHistory, payload)
  }
  depositAddress(payload) {
    return this.privateCall(this.endpoint.depositAddress, payload)
  }
  tradeFee(payload) {
    return this.privateCall(this.endpoint.tradeFee, payload)
  }

  assetDetail(payload) {
    return this.privateCall(this.endpoint.assetDetail, payload)
  }

  getDataStream() {
    return this.privateCall(this.endpoint.getDataStream, null, 'POST', true)
  }

  keepDataStream(payload) {
    return this.privateCall('/api/v1/userDataStream', payload, 'PUT', false, true)
  }

  closeDataStream(payload) {
    return this.privateCall('/api/v1/userDataStream', payload, 'DELETE', false, true)
  }
}

export default HttpClient
