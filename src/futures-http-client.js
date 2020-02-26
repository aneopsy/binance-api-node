import httpMethods from 'http-client'

class Futures extends httpMethods {
  constructor(opts = {}) {
    super({ httpBase: 'https://fapi.binance.com', ...opts })
    this.endpoint = opts.endpoint || {
      ping: '/fapi/v1/ping',
      time: '/fapi/v1/time',
      exchangeInfo: '/fapi/v1/exchangeInfo',
      book: '/fapi/v1/depth',
      aggTrades: '/fapi/v1/aggTrades',
      markPrice: '/fapi/v1/premiumIndex',
      allForceOrders: '/fapi/v1/allForceOrders',
      candles: '/fapi/v1/klines',
      trades: '/fapi/v1/trades',
      tradesHistory: '/fapi/v1/historicalTrades',
      dailyStats: '/fapi/v1/ticker/24hr',
      prices: '/fapi/v1/ticker/allPrices',
      avgPrice: '/api/v3/avgPrice', //FIXME:
      allBookTickers: '/fapi/v1/ticker/allBookTickers',
      order: '/fapi/v1/order',
      accountInfo: '/api/v3/account', //FIXME:
      tradeFee: '/wapi/v3/tradeFee.html', //FIXME:
      myTrades: '/api/v3/myTrades', //FIXME:
      allOrders: '/api/v3/allOrders', //FIXME:
      orderOco: '/api/v3/order/oco', //FIXME:
      withdraw: '/wapi/v3/withdraw.html', //FIXME:
      orderTest: '/api/v3/order/test', //FIXME:
      getOrder: '/fapi/v1/order',
      cancelOrder: '/fapi/v1/order',
      openOrders: '/fapi/v1/openOrders',
      positionRisk: '/fapi/v1/positionRisk',
      fundingRate: '/fapi/v1/fundingRate',
      withdrawHistory: '/wapi/v3/withdrawHistory.html', //FIXME:
      depositHistory: '/wapi/v3/depositHistory.html', //FIXME:
      depositAddress: '/wapi/v3/depositAddress.html', //FIXME:
      assetDetail: '/wapi/v3/assetDetail.html', //FIXME:
      getDataStream: '/api/v1/userDataStream', //FIXME:
      keepDataStream: '/api/v1/userDataStream', //FIXME:
      closeDataStream: '/api/v1/userDataStream', //FIXME:
    }
  }

  markPrice(payload) {
    return this.publicCall(this.endpoint.markPrice, payload)
  }

  allForceOrders(payload) {
    return this.publicCall(this.endpoint.allForceOrders, payload)
  }

  positionRisk(payload) {
    this.privateCall(this.endpoint.positionRisk, payload)
  }

  fundingRate(payload) {
    return (
      this.checkParams('fundingRate', payload, ['symbol']) &&
      this.publicCall(this.endpoint.fundingRate, payload)
    )
  }
}

export default Futures
