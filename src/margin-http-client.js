import httpMethods from 'http-client'

class Spot extends httpMethods {
  constructor(opts = {}) {
    super(opts)
    this.endpoint = opts.endpoint || {
      order: '/sapi/v1/margin/order',
      accountInfo: '/sapi/v1/margin/account',
      myTrades: '/sapi/v1/margin/myTrades',
      allOrders: '/sapi/v1/margin/allOrders',
      cancelOrder: '/sapi/v1/margin/order',
      openOrders: '/sapi/v1/margin/openOrders',
      priceIndex: '/sapi/v1/margin/priceIndex',
      asset: '/sapi/v1/margin/asset',
      pair: '/sapi/v1/margin/pair',
      allAssets: '/sapi/v1/margin/allAssets',
      allPairs: '/sapi/v1/margin/allPairs',
    }
  }

  priceIndex(payload) {
    return (
      this.checkParams('priceIndex', payload, ['symbol']) &&
      this.keyCall(this.endpoint.priceIndex, payload)
    )
  }

  asset(payload) {
    return (
      this.checkParams('asset', payload, ['asset']) && this.keyCall(this.endpoint.asset, payload)
    )
  }

  pair(payload) {
    return (
      this.checkParams('pair', payload, ['symbol']) && this.keyCall(this.endpoint.pair, payload)
    )
  }

  allAssets() {
    return this.keyCall(this.endpoint.allAssets)
  }

  allPairs() {
    return this.keyCall(this.endpoint.allPairs)
  }
}

export default Spot
