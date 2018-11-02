package lib

import (
	"bytes"
	"encoding/json"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
)

// SetPrvKey creates keyed-transactor with specified private key.
func SetPrvKey(prvkeyHex string) *bind.TransactOpts {
	keyBytes := common.FromHex(prvkeyHex)
	key := crypto.ToECDSAUnsafe(keyBytes)
	return bind.NewKeyedTransactor(key)
}

// SprintTransaction print Transaction fields
func SprintTransaction(tx *types.Transaction) (string, error) {
	txbody, err := tx.MarshalJSON()
	if err != nil {
		return "", err
	}
	var txjson bytes.Buffer
	if err := json.Indent(&txjson, txbody, "", "\t"); err != nil {
		return "", err
	}

	return string(txjson.Bytes()), nil
}
