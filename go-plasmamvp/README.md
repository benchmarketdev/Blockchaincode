# Plasma MVP
This is a WIP [plasma mvp](https://ethresear.ch/t/minimal-viable-plasma/426) implementation in Go. We are learning plasma by trying to implement.

## Getting Started

1. Install [ganache-cli](https://github.com/trufflesuite/ganache-cli) for a local blockchani netwrok.
2. Build command line tool for plasma mvp

```sh
make install
```

3. Run following commands

```
export PRIVATE_KEY=[Private Key] // use one in ganache-cli
export CONTRACT_ADDRESS=$(plasma deploy)
```

## CLI Usage

`plasma` is a simple CLI that enables you to interact with Plasma chain.

### Deposit

You can deposit eth to root chain contract. it uses an address derived from provided private key above.

```
plasma deposit [AMOUNT]
```

## Author
this project is being developed by

Kensuke Sano [@sonatard](https://twitter.com/sonatard)

Ryo Fukuda [@yuzushioh](https://twitter.com/yuzushioh)

Shota Yamamoto [@Yamashou](https://twitter.com/Yamashou0314)
