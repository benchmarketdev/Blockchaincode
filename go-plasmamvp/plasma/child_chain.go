package plasma

import (
	"fmt"

	contract "github.com/D-Technologies/go-plasmamvp/bindings"
)

// ChildChain TODO
type ChildChain struct {
}

// NewChildChain TODO
func NewChildChain() *ChildChain {
	return &ChildChain{}
}

// ApplyDeposit TODO
func (cc *ChildChain) ApplyDeposit(deposit *contract.RootChainDeposit) {
	fmt.Println(deposit)
}
