import httpMethods from 'http-client'

class Spot extends httpMethods {
  constructor(opts = {}) {
    super(opts)
    this.endpoint = opts.endpoint || {
      ping: '/api/v1/ping',
      time: '/api/v1/time',
      exchangeInfo: '/api/v1/exchangeInfo',
      book: '/api/v1/depth',
      aggTrades: '/api/v1/aggTrades',
      candles: '/api/v1/klines',
      trades: '/api/v1/trades',
      tradesHistory: '/api/v1/historicalTrades',
      dailyStats: '/api/v1/ticker/24hr',
      prices: '/api/v1/ticker/allPrices',
      avgPrice: '/api/v3/avgPrice',
      allBookTickers: '/api/v1/ticker/allBookTickers',
      order: '/api/v3/order',
      accountInfo: '/api/v3/account',
      tradeFee: '/wapi/v3/tradeFee.html',
      myTrades: '/api/v3/myTrades',
      allOrders: '/api/v3/allOrders',
      orderOco: '/api/v3/order/oco',
      withdraw: '/wapi/v3/withdraw.html',
      orderTest: '/api/v3/order/test',
      getOrder: '/api/v3/order',
      cancelOrder: '/api/v3/order',
      openOrders: '/api/v3/openOrders',
      withdrawHistory: '/wapi/v3/withdrawHistory.html',
      depositHistory: '/wapi/v3/depositHistory.html',
      depositAddress: '/wapi/v3/depositAddress.html',
      assetDetail: '/wapi/v3/assetDetail.html',
      getDataStream: '/api/v1/userDataStream',
      keepDataStream: '/api/v1/userDataStream',
      closeDataStream: '/api/v1/userDataStream',
    }
  }
}

export default Spot
