package client

import (
	"context"
	"math/big"

	"github.com/D-Technologies/go-plasmamvp/bindings"
	"github.com/D-Technologies/go-plasmamvp/lib"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Client call api for RootChain
type Client struct {
	RootChain *bindings.RootChain
	Auth      *bind.TransactOpts
}

// New create Client
func New(url, contAddr, prvKey string) (*Client, error) {
	conn, err := ethclient.Dial(url)
	if err != nil {
		return nil, err
	}

	rc, err := bindings.NewRootChain(common.HexToAddress(contAddr), conn)
	if err != nil {
		return nil, err
	}

	return &Client{
			RootChain: rc,
			Auth:      lib.SetPrvKey(prvKey),
		},
		nil
}

// Deposit deposits against the root chain
func (c *Client) Deposit(ctx context.Context, value *big.Int) (*types.Transaction, error) {
	c.Auth.Context = ctx
	c.Auth.Value = value
	return c.RootChain.Deposit(c.Auth)
}
