export const userData = {
  user: {
    id: "123",
    username: "test_user@gmail.com",
    name: {
      full: "Test User",
      first: "Test",
      last: "User"
    },
    email: {
      email: "test_user@gmail.com",
      verified: true
    },
    phone: {
      phone: "",
      verified: false
    },
    country: "JPN",
    identity: {
      civic: {
        state: "unverified"
      },
      kyc: {
        failureCount: 0,
        overallState: "unverified",
        data: {
          state: "unverified"
        },
        documents: {
          state: "unverified"
        },
        residency: {
          state: "unverified"
        }
      },
      verified: false
    },
    otpDevices: [],
    rateLimits: {},
    disableReset2FA: false,
    currency: {
      currency: "USD",
      bitcoinUnit: "BTC"
    },
    timezone: "US/Pacific",
    isActive: true,
    ecdhKeychain: "123",
    referrer: {},
    apps: {
      coinbase: {}
    },
    forceResetPassword: false,
    allowedCoins: [],
    agreements: {
      termsOfUse: 1,
      termsOfUseAcceptanceDate: "2018-07-18T15:24:24.360Z"
    },
    lastLogin: "2018-07-23T14:14:22.686Z",
    featureFlags: []
  }
};
