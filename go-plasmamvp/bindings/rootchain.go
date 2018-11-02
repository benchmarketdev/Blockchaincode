// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package bindings

import (
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// ByteUtilsABI is the input ABI used to generate the binding from.
const ByteUtilsABI = "[]"

// ByteUtilsBin is the compiled bytecode used for deploying new contracts.
const ByteUtilsBin = `0x604c602c600b82828239805160001a60731460008114601c57601e565bfe5b5030600052607381538281f30073000000000000000000000000000000000000000030146080604052600080fd00a165627a7a7230582042a4334fe9887dc8148093e609df60c9f80b7b19c08d82e874ff2d14c47a4e8f0029`

// DeployByteUtils deploys a new Ethereum contract, binding an instance of ByteUtils to it.
func DeployByteUtils(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *ByteUtils, error) {
	parsed, err := abi.JSON(strings.NewReader(ByteUtilsABI))
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	address, tx, contract, err := bind.DeployContract(auth, parsed, common.FromHex(ByteUtilsBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &ByteUtils{ByteUtilsCaller: ByteUtilsCaller{contract: contract}, ByteUtilsTransactor: ByteUtilsTransactor{contract: contract}, ByteUtilsFilterer: ByteUtilsFilterer{contract: contract}}, nil
}

// ByteUtils is an auto generated Go binding around an Ethereum contract.
type ByteUtils struct {
	ByteUtilsCaller     // Read-only binding to the contract
	ByteUtilsTransactor // Write-only binding to the contract
	ByteUtilsFilterer   // Log filterer for contract events
}

// ByteUtilsCaller is an auto generated read-only Go binding around an Ethereum contract.
type ByteUtilsCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ByteUtilsTransactor is an auto generated write-only Go binding around an Ethereum contract.
type ByteUtilsTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ByteUtilsFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type ByteUtilsFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ByteUtilsSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type ByteUtilsSession struct {
	Contract     *ByteUtils        // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// ByteUtilsCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type ByteUtilsCallerSession struct {
	Contract *ByteUtilsCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts    // Call options to use throughout this session
}

// ByteUtilsTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type ByteUtilsTransactorSession struct {
	Contract     *ByteUtilsTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts    // Transaction auth options to use throughout this session
}

// ByteUtilsRaw is an auto generated low-level Go binding around an Ethereum contract.
type ByteUtilsRaw struct {
	Contract *ByteUtils // Generic contract binding to access the raw methods on
}

// ByteUtilsCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type ByteUtilsCallerRaw struct {
	Contract *ByteUtilsCaller // Generic read-only contract binding to access the raw methods on
}

// ByteUtilsTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type ByteUtilsTransactorRaw struct {
	Contract *ByteUtilsTransactor // Generic write-only contract binding to access the raw methods on
}

// NewByteUtils creates a new instance of ByteUtils, bound to a specific deployed contract.
func NewByteUtils(address common.Address, backend bind.ContractBackend) (*ByteUtils, error) {
	contract, err := bindByteUtils(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &ByteUtils{ByteUtilsCaller: ByteUtilsCaller{contract: contract}, ByteUtilsTransactor: ByteUtilsTransactor{contract: contract}, ByteUtilsFilterer: ByteUtilsFilterer{contract: contract}}, nil
}

// NewByteUtilsCaller creates a new read-only instance of ByteUtils, bound to a specific deployed contract.
func NewByteUtilsCaller(address common.Address, caller bind.ContractCaller) (*ByteUtilsCaller, error) {
	contract, err := bindByteUtils(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ByteUtilsCaller{contract: contract}, nil
}

// NewByteUtilsTransactor creates a new write-only instance of ByteUtils, bound to a specific deployed contract.
func NewByteUtilsTransactor(address common.Address, transactor bind.ContractTransactor) (*ByteUtilsTransactor, error) {
	contract, err := bindByteUtils(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ByteUtilsTransactor{contract: contract}, nil
}

// NewByteUtilsFilterer creates a new log filterer instance of ByteUtils, bound to a specific deployed contract.
func NewByteUtilsFilterer(address common.Address, filterer bind.ContractFilterer) (*ByteUtilsFilterer, error) {
	contract, err := bindByteUtils(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ByteUtilsFilterer{contract: contract}, nil
}

// bindByteUtils binds a generic wrapper to an already deployed contract.
func bindByteUtils(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(ByteUtilsABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ByteUtils *ByteUtilsRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _ByteUtils.Contract.ByteUtilsCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ByteUtils *ByteUtilsRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ByteUtils.Contract.ByteUtilsTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ByteUtils *ByteUtilsRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ByteUtils.Contract.ByteUtilsTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ByteUtils *ByteUtilsCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _ByteUtils.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ByteUtils *ByteUtilsTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ByteUtils.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ByteUtils *ByteUtilsTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ByteUtils.Contract.contract.Transact(opts, method, params...)
}

// ECRecoveryABI is the input ABI used to generate the binding from.
const ECRecoveryABI = "[]"

// ECRecoveryBin is the compiled bytecode used for deploying new contracts.
const ECRecoveryBin = `0x604c602c600b82828239805160001a60731460008114601c57601e565bfe5b5030600052607381538281f30073000000000000000000000000000000000000000030146080604052600080fd00a165627a7a72305820b73e21d384fd722f1ac843da57eb64f98f3ff36052d5f778e5dafcbe0b89a8d90029`

// DeployECRecovery deploys a new Ethereum contract, binding an instance of ECRecovery to it.
func DeployECRecovery(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *ECRecovery, error) {
	parsed, err := abi.JSON(strings.NewReader(ECRecoveryABI))
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	address, tx, contract, err := bind.DeployContract(auth, parsed, common.FromHex(ECRecoveryBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &ECRecovery{ECRecoveryCaller: ECRecoveryCaller{contract: contract}, ECRecoveryTransactor: ECRecoveryTransactor{contract: contract}, ECRecoveryFilterer: ECRecoveryFilterer{contract: contract}}, nil
}

// ECRecovery is an auto generated Go binding around an Ethereum contract.
type ECRecovery struct {
	ECRecoveryCaller     // Read-only binding to the contract
	ECRecoveryTransactor // Write-only binding to the contract
	ECRecoveryFilterer   // Log filterer for contract events
}

// ECRecoveryCaller is an auto generated read-only Go binding around an Ethereum contract.
type ECRecoveryCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ECRecoveryTransactor is an auto generated write-only Go binding around an Ethereum contract.
type ECRecoveryTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ECRecoveryFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type ECRecoveryFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ECRecoverySession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type ECRecoverySession struct {
	Contract     *ECRecovery       // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// ECRecoveryCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type ECRecoveryCallerSession struct {
	Contract *ECRecoveryCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts     // Call options to use throughout this session
}

// ECRecoveryTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type ECRecoveryTransactorSession struct {
	Contract     *ECRecoveryTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts     // Transaction auth options to use throughout this session
}

// ECRecoveryRaw is an auto generated low-level Go binding around an Ethereum contract.
type ECRecoveryRaw struct {
	Contract *ECRecovery // Generic contract binding to access the raw methods on
}

// ECRecoveryCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type ECRecoveryCallerRaw struct {
	Contract *ECRecoveryCaller // Generic read-only contract binding to access the raw methods on
}

// ECRecoveryTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type ECRecoveryTransactorRaw struct {
	Contract *ECRecoveryTransactor // Generic write-only contract binding to access the raw methods on
}

// NewECRecovery creates a new instance of ECRecovery, bound to a specific deployed contract.
func NewECRecovery(address common.Address, backend bind.ContractBackend) (*ECRecovery, error) {
	contract, err := bindECRecovery(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &ECRecovery{ECRecoveryCaller: ECRecoveryCaller{contract: contract}, ECRecoveryTransactor: ECRecoveryTransactor{contract: contract}, ECRecoveryFilterer: ECRecoveryFilterer{contract: contract}}, nil
}

// NewECRecoveryCaller creates a new read-only instance of ECRecovery, bound to a specific deployed contract.
func NewECRecoveryCaller(address common.Address, caller bind.ContractCaller) (*ECRecoveryCaller, error) {
	contract, err := bindECRecovery(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ECRecoveryCaller{contract: contract}, nil
}

// NewECRecoveryTransactor creates a new write-only instance of ECRecovery, bound to a specific deployed contract.
func NewECRecoveryTransactor(address common.Address, transactor bind.ContractTransactor) (*ECRecoveryTransactor, error) {
	contract, err := bindECRecovery(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ECRecoveryTransactor{contract: contract}, nil
}

// NewECRecoveryFilterer creates a new log filterer instance of ECRecovery, bound to a specific deployed contract.
func NewECRecoveryFilterer(address common.Address, filterer bind.ContractFilterer) (*ECRecoveryFilterer, error) {
	contract, err := bindECRecovery(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ECRecoveryFilterer{contract: contract}, nil
}

// bindECRecovery binds a generic wrapper to an already deployed contract.
func bindECRecovery(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(ECRecoveryABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ECRecovery *ECRecoveryRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _ECRecovery.Contract.ECRecoveryCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ECRecovery *ECRecoveryRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ECRecovery.Contract.ECRecoveryTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ECRecovery *ECRecoveryRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ECRecovery.Contract.ECRecoveryTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_ECRecovery *ECRecoveryCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _ECRecovery.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_ECRecovery *ECRecoveryTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _ECRecovery.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_ECRecovery *ECRecoveryTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _ECRecovery.Contract.contract.Transact(opts, method, params...)
}

// MathABI is the input ABI used to generate the binding from.
const MathABI = "[]"

// MathBin is the compiled bytecode used for deploying new contracts.
const MathBin = `0x604c602c600b82828239805160001a60731460008114601c57601e565bfe5b5030600052607381538281f30073000000000000000000000000000000000000000030146080604052600080fd00a165627a7a72305820a510e5988c9b5da4c1f461d4e0e592ed18e4c08c34372a46b9ecdddd3baae4f80029`

// DeployMath deploys a new Ethereum contract, binding an instance of Math to it.
func DeployMath(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *Math, error) {
	parsed, err := abi.JSON(strings.NewReader(MathABI))
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	address, tx, contract, err := bind.DeployContract(auth, parsed, common.FromHex(MathBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &Math{MathCaller: MathCaller{contract: contract}, MathTransactor: MathTransactor{contract: contract}, MathFilterer: MathFilterer{contract: contract}}, nil
}

// Math is an auto generated Go binding around an Ethereum contract.
type Math struct {
	MathCaller     // Read-only binding to the contract
	MathTransactor // Write-only binding to the contract
	MathFilterer   // Log filterer for contract events
}

// MathCaller is an auto generated read-only Go binding around an Ethereum contract.
type MathCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MathTransactor is an auto generated write-only Go binding around an Ethereum contract.
type MathTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MathFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type MathFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MathSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type MathSession struct {
	Contract     *Math             // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// MathCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type MathCallerSession struct {
	Contract *MathCaller   // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts // Call options to use throughout this session
}

// MathTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type MathTransactorSession struct {
	Contract     *MathTransactor   // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// MathRaw is an auto generated low-level Go binding around an Ethereum contract.
type MathRaw struct {
	Contract *Math // Generic contract binding to access the raw methods on
}

// MathCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type MathCallerRaw struct {
	Contract *MathCaller // Generic read-only contract binding to access the raw methods on
}

// MathTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type MathTransactorRaw struct {
	Contract *MathTransactor // Generic write-only contract binding to access the raw methods on
}

// NewMath creates a new instance of Math, bound to a specific deployed contract.
func NewMath(address common.Address, backend bind.ContractBackend) (*Math, error) {
	contract, err := bindMath(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Math{MathCaller: MathCaller{contract: contract}, MathTransactor: MathTransactor{contract: contract}, MathFilterer: MathFilterer{contract: contract}}, nil
}

// NewMathCaller creates a new read-only instance of Math, bound to a specific deployed contract.
func NewMathCaller(address common.Address, caller bind.ContractCaller) (*MathCaller, error) {
	contract, err := bindMath(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &MathCaller{contract: contract}, nil
}

// NewMathTransactor creates a new write-only instance of Math, bound to a specific deployed contract.
func NewMathTransactor(address common.Address, transactor bind.ContractTransactor) (*MathTransactor, error) {
	contract, err := bindMath(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &MathTransactor{contract: contract}, nil
}

// NewMathFilterer creates a new log filterer instance of Math, bound to a specific deployed contract.
func NewMathFilterer(address common.Address, filterer bind.ContractFilterer) (*MathFilterer, error) {
	contract, err := bindMath(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &MathFilterer{contract: contract}, nil
}

// bindMath binds a generic wrapper to an already deployed contract.
func bindMath(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(MathABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Math *MathRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _Math.Contract.MathCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Math *MathRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Math.Contract.MathTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Math *MathRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Math.Contract.MathTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Math *MathCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _Math.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Math *MathTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Math.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Math *MathTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Math.Contract.contract.Transact(opts, method, params...)
}

// MerkleABI is the input ABI used to generate the binding from.
const MerkleABI = "[]"

// MerkleBin is the compiled bytecode used for deploying new contracts.
const MerkleBin = `0x604c602c600b82828239805160001a60731460008114601c57601e565bfe5b5030600052607381538281f30073000000000000000000000000000000000000000030146080604052600080fd00a165627a7a72305820bd9de282940881d60ddee37fa1b3d0bcc7b2fbfb228f6dd02238a0a2cdfa8e690029`

// DeployMerkle deploys a new Ethereum contract, binding an instance of Merkle to it.
func DeployMerkle(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *Merkle, error) {
	parsed, err := abi.JSON(strings.NewReader(MerkleABI))
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	address, tx, contract, err := bind.DeployContract(auth, parsed, common.FromHex(MerkleBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &Merkle{MerkleCaller: MerkleCaller{contract: contract}, MerkleTransactor: MerkleTransactor{contract: contract}, MerkleFilterer: MerkleFilterer{contract: contract}}, nil
}

// Merkle is an auto generated Go binding around an Ethereum contract.
type Merkle struct {
	MerkleCaller     // Read-only binding to the contract
	MerkleTransactor // Write-only binding to the contract
	MerkleFilterer   // Log filterer for contract events
}

// MerkleCaller is an auto generated read-only Go binding around an Ethereum contract.
type MerkleCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MerkleTransactor is an auto generated write-only Go binding around an Ethereum contract.
type MerkleTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MerkleFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type MerkleFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// MerkleSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type MerkleSession struct {
	Contract     *Merkle           // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// MerkleCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type MerkleCallerSession struct {
	Contract *MerkleCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts // Call options to use throughout this session
}

// MerkleTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type MerkleTransactorSession struct {
	Contract     *MerkleTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// MerkleRaw is an auto generated low-level Go binding around an Ethereum contract.
type MerkleRaw struct {
	Contract *Merkle // Generic contract binding to access the raw methods on
}

// MerkleCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type MerkleCallerRaw struct {
	Contract *MerkleCaller // Generic read-only contract binding to access the raw methods on
}

// MerkleTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type MerkleTransactorRaw struct {
	Contract *MerkleTransactor // Generic write-only contract binding to access the raw methods on
}

// NewMerkle creates a new instance of Merkle, bound to a specific deployed contract.
func NewMerkle(address common.Address, backend bind.ContractBackend) (*Merkle, error) {
	contract, err := bindMerkle(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Merkle{MerkleCaller: MerkleCaller{contract: contract}, MerkleTransactor: MerkleTransactor{contract: contract}, MerkleFilterer: MerkleFilterer{contract: contract}}, nil
}

// NewMerkleCaller creates a new read-only instance of Merkle, bound to a specific deployed contract.
func NewMerkleCaller(address common.Address, caller bind.ContractCaller) (*MerkleCaller, error) {
	contract, err := bindMerkle(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &MerkleCaller{contract: contract}, nil
}

// NewMerkleTransactor creates a new write-only instance of Merkle, bound to a specific deployed contract.
func NewMerkleTransactor(address common.Address, transactor bind.ContractTransactor) (*MerkleTransactor, error) {
	contract, err := bindMerkle(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &MerkleTransactor{contract: contract}, nil
}

// NewMerkleFilterer creates a new log filterer instance of Merkle, bound to a specific deployed contract.
func NewMerkleFilterer(address common.Address, filterer bind.ContractFilterer) (*MerkleFilterer, error) {
	contract, err := bindMerkle(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &MerkleFilterer{contract: contract}, nil
}

// bindMerkle binds a generic wrapper to an already deployed contract.
func bindMerkle(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(MerkleABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Merkle *MerkleRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _Merkle.Contract.MerkleCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Merkle *MerkleRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Merkle.Contract.MerkleTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Merkle *MerkleRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Merkle.Contract.MerkleTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Merkle *MerkleCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _Merkle.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Merkle *MerkleTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Merkle.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Merkle *MerkleTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Merkle.Contract.contract.Transact(opts, method, params...)
}

// PriorityQueueABI is the input ABI used to generate the binding from.
const PriorityQueueABI = "[{\"constant\":true,\"inputs\":[{\"name\":\"i\",\"type\":\"uint256\"}],\"name\":\"minChild\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"k\",\"type\":\"uint256\"}],\"name\":\"insert\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"delMin\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"currentSize\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getMin\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"}]"

// PriorityQueueBin is the compiled bytecode used for deploying new contracts.
const PriorityQueueBin = `0x608060405234801561001057600080fd5b5060008054600160a060020a03191633600160a060020a031617815560408051602081019091529081526100479060019081610052565b5060006002556100bf565b828054828255906000526020600020908101928215610092579160200282015b82811115610092578251829060ff16905591602001919060010190610072565b5061009e9291506100a2565b5090565b6100bc91905b8082111561009e57600081556001016100a8565b90565b6105c2806100ce6000396000f30060806040526004361061006c5763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416632dcdcd0c811461007157806390b5561d1461009b578063b07576ac146100b5578063bda1504b146100ca578063d6362e97146100df575b600080fd5b34801561007d57600080fd5b506100896004356100f4565b60408051918252519081900360200190f35b3480156100a757600080fd5b506100b36004356101c3565b005b3480156100c157600080fd5b50610089610241565b3480156100d657600080fd5b50610089610324565b3480156100eb57600080fd5b5061008961032a565b600060025461011e600161011260028661034c90919063ffffffff16565b9063ffffffff61038216565b111561013c5761013582600263ffffffff61034c16565b90506101be565b60016101538161011285600263ffffffff61034c16565b8154811061015d57fe5b600091825260209091200154600161017c84600263ffffffff61034c16565b8154811061018657fe5b906000526020600020015410156101a85761013582600263ffffffff61034c16565b610135600161011284600263ffffffff61034c16565b919050565b6000543373ffffffffffffffffffffffffffffffffffffffff9081169116146101eb57600080fd5b60018054808201825560008290527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6018290556002546102309163ffffffff61038216565b600281905561023e90610391565b50565b6000805481903373ffffffffffffffffffffffffffffffffffffffff90811691161461026c57600080fd5b600180548190811061027a57fe5b90600052602060002001549050600160025481548110151561029857fe5b90600052602060002001546001808154811015156102b257fe5b906000526020600020018190555060016002548154811015156102d157fe5b60009182526020822001556002546102f090600163ffffffff61046516565b6002556102fd6001610477565b600180546103109163ffffffff61046516565b61031b60018261055d565b508091505b5090565b60025481565b600060018081548110151561033b57fe5b906000526020600020015490505b90565b60008083151561035f576000915061037b565b5082820282848281151561036f57fe5b041461037757fe5b8091505b5092915050565b60008282018381101561037757fe5b600180548291600091839081106103a457fe5b906000526020600020015490505b60016103c584600263ffffffff61054616565b815481106103cf57fe5b906000526020600020015481101561043c5760016103f484600263ffffffff61054616565b815481106103fe57fe5b906000526020600020015460018481548110151561041857fe5b60009182526020909120015561043583600263ffffffff61054616565b92506103b2565b828214610460578060018481548110151561045357fe5b6000918252602090912001555b505050565b60008282111561047157fe5b50900390565b600080600083925060018481548110151561048e57fe5b906000526020600020015491506104a4846100f4565b90505b60025481111580156104d0575060018054829081106104c257fe5b906000526020600020015482115b1561051c5760018054829081106104e357fe5b90600052602060002001546001858154811015156104fd57fe5b600091825260209091200155925082610515816100f4565b90506104a7565b838314610540578160018581548110151561053357fe5b6000918252602090912001555b50505050565b600080828481151561055457fe5b04949350505050565b8154818355818111156104605760008381526020902061046091810190830161034991905b8082111561032057600081556001016105825600a165627a7a723058209169a95bd8f6f0401b736ab56f82e476610886a537c19d68d92e629d73b845c70029`

// DeployPriorityQueue deploys a new Ethereum contract, binding an instance of PriorityQueue to it.
func DeployPriorityQueue(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *PriorityQueue, error) {
	parsed, err := abi.JSON(strings.NewReader(PriorityQueueABI))
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	address, tx, contract, err := bind.DeployContract(auth, parsed, common.FromHex(PriorityQueueBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &PriorityQueue{PriorityQueueCaller: PriorityQueueCaller{contract: contract}, PriorityQueueTransactor: PriorityQueueTransactor{contract: contract}, PriorityQueueFilterer: PriorityQueueFilterer{contract: contract}}, nil
}

// PriorityQueue is an auto generated Go binding around an Ethereum contract.
type PriorityQueue struct {
	PriorityQueueCaller     // Read-only binding to the contract
	PriorityQueueTransactor // Write-only binding to the contract
	PriorityQueueFilterer   // Log filterer for contract events
}

// PriorityQueueCaller is an auto generated read-only Go binding around an Ethereum contract.
type PriorityQueueCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// PriorityQueueTransactor is an auto generated write-only Go binding around an Ethereum contract.
type PriorityQueueTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// PriorityQueueFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type PriorityQueueFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// PriorityQueueSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type PriorityQueueSession struct {
	Contract     *PriorityQueue    // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// PriorityQueueCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type PriorityQueueCallerSession struct {
	Contract *PriorityQueueCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts        // Call options to use throughout this session
}

// PriorityQueueTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type PriorityQueueTransactorSession struct {
	Contract     *PriorityQueueTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts        // Transaction auth options to use throughout this session
}

// PriorityQueueRaw is an auto generated low-level Go binding around an Ethereum contract.
type PriorityQueueRaw struct {
	Contract *PriorityQueue // Generic contract binding to access the raw methods on
}

// PriorityQueueCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type PriorityQueueCallerRaw struct {
	Contract *PriorityQueueCaller // Generic read-only contract binding to access the raw methods on
}

// PriorityQueueTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type PriorityQueueTransactorRaw struct {
	Contract *PriorityQueueTransactor // Generic write-only contract binding to access the raw methods on
}

// NewPriorityQueue creates a new instance of PriorityQueue, bound to a specific deployed contract.
func NewPriorityQueue(address common.Address, backend bind.ContractBackend) (*PriorityQueue, error) {
	contract, err := bindPriorityQueue(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &PriorityQueue{PriorityQueueCaller: PriorityQueueCaller{contract: contract}, PriorityQueueTransactor: PriorityQueueTransactor{contract: contract}, PriorityQueueFilterer: PriorityQueueFilterer{contract: contract}}, nil
}

// NewPriorityQueueCaller creates a new read-only instance of PriorityQueue, bound to a specific deployed contract.
func NewPriorityQueueCaller(address common.Address, caller bind.ContractCaller) (*PriorityQueueCaller, error) {
	contract, err := bindPriorityQueue(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &PriorityQueueCaller{contract: contract}, nil
}

// NewPriorityQueueTransactor creates a new write-only instance of PriorityQueue, bound to a specific deployed contract.
func NewPriorityQueueTransactor(address common.Address, transactor bind.ContractTransactor) (*PriorityQueueTransactor, error) {
	contract, err := bindPriorityQueue(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &PriorityQueueTransactor{contract: contract}, nil
}

// NewPriorityQueueFilterer creates a new log filterer instance of PriorityQueue, bound to a specific deployed contract.
func NewPriorityQueueFilterer(address common.Address, filterer bind.ContractFilterer) (*PriorityQueueFilterer, error) {
	contract, err := bindPriorityQueue(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &PriorityQueueFilterer{contract: contract}, nil
}

// bindPriorityQueue binds a generic wrapper to an already deployed contract.
func bindPriorityQueue(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(PriorityQueueABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_PriorityQueue *PriorityQueueRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _PriorityQueue.Contract.PriorityQueueCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_PriorityQueue *PriorityQueueRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _PriorityQueue.Contract.PriorityQueueTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_PriorityQueue *PriorityQueueRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _PriorityQueue.Contract.PriorityQueueTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_PriorityQueue *PriorityQueueCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _PriorityQueue.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_PriorityQueue *PriorityQueueTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _PriorityQueue.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_PriorityQueue *PriorityQueueTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _PriorityQueue.Contract.contract.Transact(opts, method, params...)
}

// CurrentSize is a free data retrieval call binding the contract method 0xbda1504b.
//
// Solidity: function currentSize() constant returns(uint256)
func (_PriorityQueue *PriorityQueueCaller) CurrentSize(opts *bind.CallOpts) (*big.Int, error) {
	var (
		ret0 = new(*big.Int)
	)
	out := ret0
	err := _PriorityQueue.contract.Call(opts, out, "currentSize")
	return *ret0, err
}

// CurrentSize is a free data retrieval call binding the contract method 0xbda1504b.
//
// Solidity: function currentSize() constant returns(uint256)
func (_PriorityQueue *PriorityQueueSession) CurrentSize() (*big.Int, error) {
	return _PriorityQueue.Contract.CurrentSize(&_PriorityQueue.CallOpts)
}

// CurrentSize is a free data retrieval call binding the contract method 0xbda1504b.
//
// Solidity: function currentSize() constant returns(uint256)
func (_PriorityQueue *PriorityQueueCallerSession) CurrentSize() (*big.Int, error) {
	return _PriorityQueue.Contract.CurrentSize(&_PriorityQueue.CallOpts)
}

// GetMin is a free data retrieval call binding the contract method 0xd6362e97.
//
// Solidity: function getMin() constant returns(uint256)
func (_PriorityQueue *PriorityQueueCaller) GetMin(opts *bind.CallOpts) (*big.Int, error) {
	var (
		ret0 = new(*big.Int)
	)
	out := ret0
	err := _PriorityQueue.contract.Call(opts, out, "getMin")
	return *ret0, err
}

// GetMin is a free data retrieval call binding the contract method 0xd6362e97.
//
// Solidity: function getMin() constant returns(uint256)
func (_PriorityQueue *PriorityQueueSession) GetMin() (*big.Int, error) {
	return _PriorityQueue.Contract.GetMin(&_PriorityQueue.CallOpts)
}

// GetMin is a free data retrieval call binding the contract method 0xd6362e97.
//
// Solidity: function getMin() constant returns(uint256)
func (_PriorityQueue *PriorityQueueCallerSession) GetMin() (*big.Int, error) {
	return _PriorityQueue.Contract.GetMin(&_PriorityQueue.CallOpts)
}

// MinChild is a free data retrieval call binding the contract method 0x2dcdcd0c.
//
// Solidity: function minChild(i uint256) constant returns(uint256)
func (_PriorityQueue *PriorityQueueCaller) MinChild(opts *bind.CallOpts, i *big.Int) (*big.Int, error) {
	var (
		ret0 = new(*big.Int)
	)
	out := ret0
	err := _PriorityQueue.contract.Call(opts, out, "minChild", i)
	return *ret0, err
}

// MinChild is a free data retrieval call binding the contract method 0x2dcdcd0c.
//
// Solidity: function minChild(i uint256) constant returns(uint256)
func (_PriorityQueue *PriorityQueueSession) MinChild(i *big.Int) (*big.Int, error) {
	return _PriorityQueue.Contract.MinChild(&_PriorityQueue.CallOpts, i)
}

// MinChild is a free data retrieval call binding the contract method 0x2dcdcd0c.
//
// Solidity: function minChild(i uint256) constant returns(uint256)
func (_PriorityQueue *PriorityQueueCallerSession) MinChild(i *big.Int) (*big.Int, error) {
	return _PriorityQueue.Contract.MinChild(&_PriorityQueue.CallOpts, i)
}

// DelMin is a paid mutator transaction binding the contract method 0xb07576ac.
//
// Solidity: function delMin() returns(uint256)
func (_PriorityQueue *PriorityQueueTransactor) DelMin(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _PriorityQueue.contract.Transact(opts, "delMin")
}

// DelMin is a paid mutator transaction binding the contract method 0xb07576ac.
//
// Solidity: function delMin() returns(uint256)
func (_PriorityQueue *PriorityQueueSession) DelMin() (*types.Transaction, error) {
	return _PriorityQueue.Contract.DelMin(&_PriorityQueue.TransactOpts)
}

// DelMin is a paid mutator transaction binding the contract method 0xb07576ac.
//
// Solidity: function delMin() returns(uint256)
func (_PriorityQueue *PriorityQueueTransactorSession) DelMin() (*types.Transaction, error) {
	return _PriorityQueue.Contract.DelMin(&_PriorityQueue.TransactOpts)
}

// Insert is a paid mutator transaction binding the contract method 0x90b5561d.
//
// Solidity: function insert(k uint256) returns()
func (_PriorityQueue *PriorityQueueTransactor) Insert(opts *bind.TransactOpts, k *big.Int) (*types.Transaction, error) {
	return _PriorityQueue.contract.Transact(opts, "insert", k)
}

// Insert is a paid mutator transaction binding the contract method 0x90b5561d.
//
// Solidity: function insert(k uint256) returns()
func (_PriorityQueue *PriorityQueueSession) Insert(k *big.Int) (*types.Transaction, error) {
	return _PriorityQueue.Contract.Insert(&_PriorityQueue.TransactOpts, k)
}

// Insert is a paid mutator transaction binding the contract method 0x90b5561d.
//
// Solidity: function insert(k uint256) returns()
func (_PriorityQueue *PriorityQueueTransactorSession) Insert(k *big.Int) (*types.Transaction, error) {
	return _PriorityQueue.Contract.Insert(&_PriorityQueue.TransactOpts, k)
}

// RLPABI is the input ABI used to generate the binding from.
const RLPABI = "[]"

// RLPBin is the compiled bytecode used for deploying new contracts.
const RLPBin = `0x604c602c600b82828239805160001a60731460008114601c57601e565bfe5b5030600052607381538281f30073000000000000000000000000000000000000000030146080604052600080fd00a165627a7a7230582043349256a920abeedc7b4f8e7b57f598f92ca371e2ecc8d32a7e2c9597664d810029`

// DeployRLP deploys a new Ethereum contract, binding an instance of RLP to it.
func DeployRLP(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *RLP, error) {
	parsed, err := abi.JSON(strings.NewReader(RLPABI))
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	address, tx, contract, err := bind.DeployContract(auth, parsed, common.FromHex(RLPBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &RLP{RLPCaller: RLPCaller{contract: contract}, RLPTransactor: RLPTransactor{contract: contract}, RLPFilterer: RLPFilterer{contract: contract}}, nil
}

// RLP is an auto generated Go binding around an Ethereum contract.
type RLP struct {
	RLPCaller     // Read-only binding to the contract
	RLPTransactor // Write-only binding to the contract
	RLPFilterer   // Log filterer for contract events
}

// RLPCaller is an auto generated read-only Go binding around an Ethereum contract.
type RLPCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// RLPTransactor is an auto generated write-only Go binding around an Ethereum contract.
type RLPTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// RLPFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type RLPFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// RLPSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type RLPSession struct {
	Contract     *RLP              // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// RLPCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type RLPCallerSession struct {
	Contract *RLPCaller    // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts // Call options to use throughout this session
}

// RLPTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type RLPTransactorSession struct {
	Contract     *RLPTransactor    // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// RLPRaw is an auto generated low-level Go binding around an Ethereum contract.
type RLPRaw struct {
	Contract *RLP // Generic contract binding to access the raw methods on
}

// RLPCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type RLPCallerRaw struct {
	Contract *RLPCaller // Generic read-only contract binding to access the raw methods on
}

// RLPTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type RLPTransactorRaw struct {
	Contract *RLPTransactor // Generic write-only contract binding to access the raw methods on
}

// NewRLP creates a new instance of RLP, bound to a specific deployed contract.
func NewRLP(address common.Address, backend bind.ContractBackend) (*RLP, error) {
	contract, err := bindRLP(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &RLP{RLPCaller: RLPCaller{contract: contract}, RLPTransactor: RLPTransactor{contract: contract}, RLPFilterer: RLPFilterer{contract: contract}}, nil
}

// NewRLPCaller creates a new read-only instance of RLP, bound to a specific deployed contract.
func NewRLPCaller(address common.Address, caller bind.ContractCaller) (*RLPCaller, error) {
	contract, err := bindRLP(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &RLPCaller{contract: contract}, nil
}

// NewRLPTransactor creates a new write-only instance of RLP, bound to a specific deployed contract.
func NewRLPTransactor(address common.Address, transactor bind.ContractTransactor) (*RLPTransactor, error) {
	contract, err := bindRLP(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &RLPTransactor{contract: contract}, nil
}

// NewRLPFilterer creates a new log filterer instance of RLP, bound to a specific deployed contract.
func NewRLPFilterer(address common.Address, filterer bind.ContractFilterer) (*RLPFilterer, error) {
	contract, err := bindRLP(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &RLPFilterer{contract: contract}, nil
}

// bindRLP binds a generic wrapper to an already deployed contract.
func bindRLP(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(RLPABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_RLP *RLPRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _RLP.Contract.RLPCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_RLP *RLPRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _RLP.Contract.RLPTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_RLP *RLPRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _RLP.Contract.RLPTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_RLP *RLPCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _RLP.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_RLP *RLPTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _RLP.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_RLP *RLPTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _RLP.Contract.contract.Transact(opts, method, params...)
}

// RootChainABI is the input ABI used to generate the binding from.
const RootChainABI = "[{\"constant\":false,\"inputs\":[{\"name\":\"utxoPos\",\"type\":\"uint256\"},{\"name\":\"txBytes\",\"type\":\"bytes\"},{\"name\":\"proof\",\"type\":\"bytes\"},{\"name\":\"sigs\",\"type\":\"bytes\"}],\"name\":\"startExit\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getNextExit\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"},{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"cUtxoPos\",\"type\":\"uint256\"},{\"name\":\"eUtxoIndex\",\"type\":\"uint256\"},{\"name\":\"txBytes\",\"type\":\"bytes\"},{\"name\":\"proof\",\"type\":\"bytes\"},{\"name\":\"sigs\",\"type\":\"bytes\"},{\"name\":\"confirmationSig\",\"type\":\"bytes\"}],\"name\":\"challengeExit\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"exits\",\"outputs\":[{\"name\":\"owner\",\"type\":\"address\"},{\"name\":\"amount\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"childBlockInterval\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"depositPos\",\"type\":\"uint256\"},{\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"startDepositExit\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"currentChildBlock\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"blockNumber\",\"type\":\"uint256\"}],\"name\":\"getChildChain\",\"outputs\":[{\"name\":\"\",\"type\":\"bytes32\"},{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"currentDepositBlock\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"txBytes\",\"type\":\"bytes\"},{\"name\":\"oIndex\",\"type\":\"uint256\"}],\"name\":\"getUtxoPos\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"root\",\"type\":\"bytes32\"}],\"name\":\"submitBlock\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"getDepositBlock\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"authority\",\"outputs\":[{\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"finalizeExits\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":false,\"inputs\":[],\"name\":\"deposit\",\"outputs\":[],\"payable\":true,\"stateMutability\":\"payable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"utxoPos\",\"type\":\"uint256\"}],\"name\":\"getExit\",\"outputs\":[{\"name\":\"\",\"type\":\"address\"},{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"childChain\",\"outputs\":[{\"name\":\"root\",\"type\":\"bytes32\"},{\"name\":\"created_at\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"name\":\"depositor\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"name\":\"depositBlock\",\"type\":\"uint256\"}],\"name\":\"Deposit\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"name\":\"exitor\",\"type\":\"address\"},{\"indexed\":false,\"name\":\"utxoPos\",\"type\":\"uint256\"}],\"name\":\"Exit\",\"type\":\"event\"}]"

// RootChainBin is the compiled bytecode used for deploying new contracts.
const RootChainBin = `0x608060405234801561001057600080fd5b5060038054600160a060020a03191633600160a060020a03161790556103e860068190556004556001600555610044610086565b604051809103906000f080158015610060573d6000803e3d6000fd5b5060028054600160a060020a031916600160a060020a0392909216919091179055610096565b6040516106908061187483390190565b6117cf806100a56000396000f3006080604052600436106100d75763ffffffff60e060020a6000350416631c91a6b981146100dc5780632fd56a25146101b857806332773ba3146101e6578063342de1791461030057806338a9e0bc1461033b57806370e4abf6146103625780637a95f1e81461037d57806385444de314610392578063a98c7f2c146103aa578063ad1f763f146103bf578063baa476941461041a578063bcd5926114610432578063bf7e214f14610447578063c6ab44cd14610478578063d0e30db01461048d578063e60f1ff114610495578063f95643b1146104ad575b600080fd5b3480156100e857600080fd5b5060408051602060046024803582810135601f81018590048502860185019096528585526101b695833595369560449491939091019190819084018382808284375050604080516020601f89358b018035918201839004830284018301909452808352979a99988101979196509182019450925082915084018382808284375050604080516020601f89358b018035918201839004830284018301909452808352979a9998810197919650918201945092508291508401838280828437509497506104c59650505050505050565b005b3480156101c457600080fd5b506101cd610735565b6040805192835260208301919091528051918290030190f35b3480156101f257600080fd5b50604080516020600460443581810135601f81018490048402850184019095528484526101b694823594602480359536959460649492019190819084018382808284375050604080516020601f89358b018035918201839004830284018301909452808352979a99988101979196509182019450925082915084018382808284375050604080516020601f89358b018035918201839004830284018301909452808352979a99988101979196509182019450925082915084018382808284375050604080516020601f89358b018035918201839004830284018301909452808352979a9998810197919650918201945092508291508401838280828437509497506107ee9650505050505050565b34801561030c57600080fd5b50610318600435610998565b60408051600160a060020a03909316835260208301919091528051918290030190f35b34801561034757600080fd5b506103506109bd565b60408051918252519081900360200190f35b34801561036e57600080fd5b506101b66004356024356109c3565b34801561038957600080fd5b50610350610a4a565b34801561039e57600080fd5b506101cd600435610a50565b3480156103b657600080fd5b50610350610a6a565b3480156103cb57600080fd5b506040805160206004803580820135601f81018490048402850184019095528484526103509436949293602493928401919081908401838280828437509497505093359450610a709350505050565b34801561042657600080fd5b506101b6600435610ad3565b34801561043e57600080fd5b50610350610b3d565b34801561045357600080fd5b5061045c610b6d565b60408051600160a060020a039092168252519081900360200190f35b34801561048457600080fd5b506101b6610b7c565b6101b6610d9a565b3480156104a157600080fd5b50610318600435610e7c565b3480156104b957600080fd5b506101cd600435610ea0565b606060008060008060008060006104ec600b6104e08d610eb9565b9063ffffffff610f0c16565b9750633b9aca00808d049750612710908d06049550856127100287633b9aca00028d03039450610538888660020260070181518110151561052957fe5b90602001906020020151610fac565b9350610560888660020260060181518110151561055157fe5b90602001906020020151610ff4565b925082600160a060020a031633600160a060020a031614151561058257600080fd5b6000808881526020019081526020016000206000015491508a6040518082805190602001908083835b602083106105ca5780518252601f1990920191602091820191016105ab565b6001836020036101000a03801982511681845116808217855250505050505090500191505060405180910390206106048a60006082611040565b6040518281528151602080830191908401908083835b602083106106395780518252601f19909201916020918201910161061a565b6001836020036101000a03801982511681845116808217855250505050505090500192505050604051809103902090506106f48b6040518082805190602001908083835b6020831061069c5780518252601f19909201916020918201910161067d565b6001836020036101000a0380198251168184511680821785525050505050509050019150506040518091039020836106dc8b600081518110151561052957fe5b6106ee8c600381518110151561052957fe5b8d6110c1565b15156106ff57600080fd5b6107118187848d63ffffffff6111cd16565b151561071c57600080fd5b6107278c8486611259565b505050505050505050505050565b6000806000806000600260009054906101000a9004600160a060020a0316600160a060020a031663d6362e976040518163ffffffff1660e060020a028152600401602060405180830381600087803b15801561079057600080fd5b505af11580156107a4573d6000803e3d6000fd5b505050506040513d60208110156107ba57600080fd5b50516fffffffffffffffffffffffffffffffff81169670010000000000000000000000000000000090910495509350505050565b60008060008060008060006108038b8d610a70565b9650612710633b9aca008e06049550600080633b9aca008f0481526020019081526020016000206000015494508a6040518082805190602001908083835b602083106108605780518252601f199092019160209182019101610841565b51815160001960209485036101000a01908116901991909116179052604080519490920184900384208085528482018c905282519485900390920184208285528f51929a5098508995508e945083810192508401908083835b602083106108d85780518252601f1990920191602091820191016108b9565b51815160209384036101000a6000190180199092169116179052604080519290940182900390912060008e815260019092529290205491965050600160a060020a0316935061092d92508591508a90506113d8565b600160a060020a0382811691161461094457600080fd5b6109568287878d63ffffffff6111cd16565b151561096157600080fd5b5050506000938452505060016020525060409020805473ffffffffffffffffffffffffffffffffffffffff19169055505050505050565b60016020819052600091825260409091208054910154600160a060020a039091169082565b60065481565b60008080633b9aca0085049250600654838115156109dd57fe5b0615156109e957600080fd5b5050600081815260208190526040908190205481516c01000000000000000000000000600160a060020a03331602815260148101859052915191829003603401909120808214610a3857600080fd5b610a43853386611259565b5050505050565b60045481565b600090815260208190526040902080546001909101549091565b60055481565b600060606000610a84600b6104e087610eb9565b9150836003029050610aa0828260020181518110151561052957fe5b610ab4838360010181518110151561052957fe5b8351610ac69085908590811061052957fe5b010192505b505092915050565b60035433600160a060020a03908116911614610aee57600080fd5b6040805180820182528281524260208083019182526004805460009081529182905293902091518255516001909101556006549054610b329163ffffffff6114ad16565b600455506001600555565b6000610b68600554610b5c6006546004546114c390919063ffffffff16565b9063ffffffff6114ad16565b905090565b600354600160a060020a031681565b6000806000610b8961176b565b610b9c426212750063ffffffff6114c316565b9350610ba6610735565b60008281526001602081815260409283902083518085019094528054600160a060020a031684529091015490820152919450925090505b83821015610d9457506000828152600160208181526040808420815180830183528154600160a060020a0316808252919094015492840183905290519293909282156108fc029291818181858888f19350505050158015610c42573d6000803e3d6000fd5b50600260009054906101000a9004600160a060020a0316600160a060020a031663b07576ac6040518163ffffffff1660e060020a028152600401602060405180830381600087803b158015610c9657600080fd5b505af1158015610caa573d6000803e3d6000fd5b505050506040513d6020811015610cc057600080fd5b50506000838152600160209081526040808320805473ffffffffffffffffffffffffffffffffffffffff1916905560025481517fbda1504b0000000000000000000000000000000000000000000000000000000081529151600160a060020a039091169263bda1504b926004808201939182900301818787803b158015610d4657600080fd5b505af1158015610d5a573d6000803e3d6000fd5b505050506040513d6020811015610d7057600080fd5b50511115610d8a57610d80610735565b9093509150610d8f565b610d94565b610bdd565b50505050565b600080600654600554101515610daf57600080fd5b604080516c01000000000000000000000000600160a060020a03331602815234601482015290519081900360340190209150610de9610b3d565b60408051808201825284815242602080830191825260008581529081905292909220905181559051600191820155600554919250610e2d919063ffffffff6114ad16565b60055560408051600160a060020a033316815234602082015280820183905290517f90890809c654f11d6e72a28fa60149770a0d11ec6c92319d6ceb2bb0a4ea1a159181900360600190a15050565b60009081526001602081905260409091208054910154600160a060020a0390911691565b6000602081905290815260409020805460019091015482565b610ec161176b565b81516000811515610ee75760408051808201909152600080825260208201529250610f05565b60208401905060408051908101604052808281526020018381525092505b5050919050565b6060610f16611782565b6000610f21856114d5565b1515610f2c57600080fd5b83604051908082528060200260200182016040528015610f6657816020015b610f5361176b565b815260200190600190039081610f4b5790505b509250610f7285611507565b91505b610f7e82611540565b15610acb57610f8c8261155f565b8382815181101515610f9a57fe5b60209081029091010152600101610f75565b6000806000610fba846115a1565b1515610fc557600080fd5b610fce846115ca565b915091506020811115610fe057600080fd5b806020036101000a82510492505050919050565b6000806000611002846115a1565b151561100d57600080fd5b611016846115ca565b90925090506014811461102857600080fd5b50516c01000000000000000000000000900492915050565b60608082840185511015151561105557600080fd5b8215801561106e576040519150602082016040526110b8565b6040519150601f8416801560200281840101858101878315602002848b0101015b818310156110a757805183526020928301920161108f565b5050858452601f01601f1916604052505b50949350505050565b6000606080606060008060006060604189518115156110dc57fe5b061580156110ed5750610104895111155b15156110f857600080fd5b6111058960006041611040565b965061111389604180611040565b95506111228960826041611040565b604080518f8152602081018f9052815190819003909101902090955093506001925082915061115184866113d8565b600160a060020a03166111648e896113d8565b600160a060020a031614925060008a11156111b2576111868960c36041611040565b905061119284826113d8565b600160a060020a03166111a58e886113d8565b600160a060020a03161491505b8280156111bc5750815b9d9c50505050505050505050505050565b60008060008084516102001415156111e457600080fd5b5086905060205b610200811161124b57848101519250600287061515611222576040805192835260208301849052805192839003019091209061123d565b60408051848152602081019390935280519283900301909120905b6002870496506020016111eb565b509390931495945050505050565b633b9aca008304600081815260208190526040812060010154611282904262093a7f1901611647565b7001000000000000000000000000000000000285179050600083116112a657600080fd5b60008581526001602081905260409091200154156112c357600080fd5b600254604080517f90b5561d000000000000000000000000000000000000000000000000000000008152600481018490529051600160a060020a03909216916390b5561d9160248082019260009290919082900301818387803b15801561132957600080fd5b505af115801561133d573d6000803e3d6000fd5b5050604080518082018252600160a060020a0388811680835260208084018a815260008d81526001808452908790209551865473ffffffffffffffffffffffffffffffffffffffff191695169490941785555193909201929092558251918252810189905281517f22d324652c93739755cf4581508b60875ebdd78c20c0cff5cf8e23452b2996319450908190039091019150a15050505050565b600080600080845160411415156113f257600093506114a4565b50505060208201516040830151606084015160001a601b60ff8216101561141757601b015b8060ff16601b1415801561142f57508060ff16601c14155b1561143d57600093506114a4565b60408051600080825260208083018085528a905260ff8516838501526060830187905260808301869052925160019360a0808501949193601f19840193928390039091019190865af1158015611497573d6000803e3d6000fd5b5050506020604051035193505b50505092915050565b6000828201838110156114bc57fe5b9392505050565b6000828211156114cf57fe5b50900390565b6000808260200151600014156114ee5760009150611501565b8260000151905060c0815160001a101591505b50919050565b61150f611782565b600061151a836114d5565b151561152557600080fd5b61152e8361165e565b83519383529092016020820152919050565b600061154a61176b565b50508051602080820151915192015191011190565b61156761176b565b60008061157384611540565b156100d75783602001519150611588826116de565b8284526020808501829052838201908601529050610f05565b6000808260200151600014156115ba5760009150611501565b5050515160c060009190911a1090565b60008060008060006115db866115a1565b15156115e657600080fd5b8551805160001a935091506080831015611606578194506001935061163f565b60b8831015611624576001866020015103935081600101945061163f565b60b78303905080600187602001510303935080820160010194505b505050915091565b60008183101561165757816114bc565b5090919050565b60008060008360200151600014156116795760009250610f05565b50508151805160001a9060808210156116955760009250610f05565b60b88210806116b0575060c082101580156116b0575060f882105b156116be5760019250610f05565b60c08210156116d35760b51982019250610f05565b5060f5190192915050565b8051600090811a60808110156116f75760019150611501565b60b881101561170c57607e1981019150611501565b60c081101561173557600183015160b76020839003016101000a9004810160b519019150611501565b60f881101561174a5760be1981019150611501565b6001929092015160f76020849003016101000a900490910160f51901919050565b604080518082019091526000808252602082015290565b60606040519081016040528061179661176b565b81526020016000815250905600a165627a7a72305820059b27af32a23ac25c7c7b0dd0a81c562093e084f3d91f2c53e7da00b29c91a60029608060405234801561001057600080fd5b5060008054600160a060020a03191633600160a060020a031617815560408051602081019091529081526100479060019081610052565b5060006002556100bf565b828054828255906000526020600020908101928215610092579160200282015b82811115610092578251829060ff16905591602001919060010190610072565b5061009e9291506100a2565b5090565b6100bc91905b8082111561009e57600081556001016100a8565b90565b6105c2806100ce6000396000f30060806040526004361061006c5763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416632dcdcd0c811461007157806390b5561d1461009b578063b07576ac146100b5578063bda1504b146100ca578063d6362e97146100df575b600080fd5b34801561007d57600080fd5b506100896004356100f4565b60408051918252519081900360200190f35b3480156100a757600080fd5b506100b36004356101c3565b005b3480156100c157600080fd5b50610089610241565b3480156100d657600080fd5b50610089610324565b3480156100eb57600080fd5b5061008961032a565b600060025461011e600161011260028661034c90919063ffffffff16565b9063ffffffff61038216565b111561013c5761013582600263ffffffff61034c16565b90506101be565b60016101538161011285600263ffffffff61034c16565b8154811061015d57fe5b600091825260209091200154600161017c84600263ffffffff61034c16565b8154811061018657fe5b906000526020600020015410156101a85761013582600263ffffffff61034c16565b610135600161011284600263ffffffff61034c16565b919050565b6000543373ffffffffffffffffffffffffffffffffffffffff9081169116146101eb57600080fd5b60018054808201825560008290527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6018290556002546102309163ffffffff61038216565b600281905561023e90610391565b50565b6000805481903373ffffffffffffffffffffffffffffffffffffffff90811691161461026c57600080fd5b600180548190811061027a57fe5b90600052602060002001549050600160025481548110151561029857fe5b90600052602060002001546001808154811015156102b257fe5b906000526020600020018190555060016002548154811015156102d157fe5b60009182526020822001556002546102f090600163ffffffff61046516565b6002556102fd6001610477565b600180546103109163ffffffff61046516565b61031b60018261055d565b508091505b5090565b60025481565b600060018081548110151561033b57fe5b906000526020600020015490505b90565b60008083151561035f576000915061037b565b5082820282848281151561036f57fe5b041461037757fe5b8091505b5092915050565b60008282018381101561037757fe5b600180548291600091839081106103a457fe5b906000526020600020015490505b60016103c584600263ffffffff61054616565b815481106103cf57fe5b906000526020600020015481101561043c5760016103f484600263ffffffff61054616565b815481106103fe57fe5b906000526020600020015460018481548110151561041857fe5b60009182526020909120015561043583600263ffffffff61054616565b92506103b2565b828214610460578060018481548110151561045357fe5b6000918252602090912001555b505050565b60008282111561047157fe5b50900390565b600080600083925060018481548110151561048e57fe5b906000526020600020015491506104a4846100f4565b90505b60025481111580156104d0575060018054829081106104c257fe5b906000526020600020015482115b1561051c5760018054829081106104e357fe5b90600052602060002001546001858154811015156104fd57fe5b600091825260209091200155925082610515816100f4565b90506104a7565b838314610540578160018581548110151561053357fe5b6000918252602090912001555b50505050565b600080828481151561055457fe5b04949350505050565b8154818355818111156104605760008381526020902061046091810190830161034991905b8082111561032057600081556001016105825600a165627a7a723058209169a95bd8f6f0401b736ab56f82e476610886a537c19d68d92e629d73b845c70029`

// DeployRootChain deploys a new Ethereum contract, binding an instance of RootChain to it.
func DeployRootChain(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *RootChain, error) {
	parsed, err := abi.JSON(strings.NewReader(RootChainABI))
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	address, tx, contract, err := bind.DeployContract(auth, parsed, common.FromHex(RootChainBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &RootChain{RootChainCaller: RootChainCaller{contract: contract}, RootChainTransactor: RootChainTransactor{contract: contract}, RootChainFilterer: RootChainFilterer{contract: contract}}, nil
}

// RootChain is an auto generated Go binding around an Ethereum contract.
type RootChain struct {
	RootChainCaller     // Read-only binding to the contract
	RootChainTransactor // Write-only binding to the contract
	RootChainFilterer   // Log filterer for contract events
}

// RootChainCaller is an auto generated read-only Go binding around an Ethereum contract.
type RootChainCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// RootChainTransactor is an auto generated write-only Go binding around an Ethereum contract.
type RootChainTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// RootChainFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type RootChainFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// RootChainSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type RootChainSession struct {
	Contract     *RootChain        // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// RootChainCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type RootChainCallerSession struct {
	Contract *RootChainCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts    // Call options to use throughout this session
}

// RootChainTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type RootChainTransactorSession struct {
	Contract     *RootChainTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts    // Transaction auth options to use throughout this session
}

// RootChainRaw is an auto generated low-level Go binding around an Ethereum contract.
type RootChainRaw struct {
	Contract *RootChain // Generic contract binding to access the raw methods on
}

// RootChainCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type RootChainCallerRaw struct {
	Contract *RootChainCaller // Generic read-only contract binding to access the raw methods on
}

// RootChainTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type RootChainTransactorRaw struct {
	Contract *RootChainTransactor // Generic write-only contract binding to access the raw methods on
}

// NewRootChain creates a new instance of RootChain, bound to a specific deployed contract.
func NewRootChain(address common.Address, backend bind.ContractBackend) (*RootChain, error) {
	contract, err := bindRootChain(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &RootChain{RootChainCaller: RootChainCaller{contract: contract}, RootChainTransactor: RootChainTransactor{contract: contract}, RootChainFilterer: RootChainFilterer{contract: contract}}, nil
}

// NewRootChainCaller creates a new read-only instance of RootChain, bound to a specific deployed contract.
func NewRootChainCaller(address common.Address, caller bind.ContractCaller) (*RootChainCaller, error) {
	contract, err := bindRootChain(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &RootChainCaller{contract: contract}, nil
}

// NewRootChainTransactor creates a new write-only instance of RootChain, bound to a specific deployed contract.
func NewRootChainTransactor(address common.Address, transactor bind.ContractTransactor) (*RootChainTransactor, error) {
	contract, err := bindRootChain(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &RootChainTransactor{contract: contract}, nil
}

// NewRootChainFilterer creates a new log filterer instance of RootChain, bound to a specific deployed contract.
func NewRootChainFilterer(address common.Address, filterer bind.ContractFilterer) (*RootChainFilterer, error) {
	contract, err := bindRootChain(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &RootChainFilterer{contract: contract}, nil
}

// bindRootChain binds a generic wrapper to an already deployed contract.
func bindRootChain(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(RootChainABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_RootChain *RootChainRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _RootChain.Contract.RootChainCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_RootChain *RootChainRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _RootChain.Contract.RootChainTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_RootChain *RootChainRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _RootChain.Contract.RootChainTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_RootChain *RootChainCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _RootChain.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_RootChain *RootChainTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _RootChain.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_RootChain *RootChainTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _RootChain.Contract.contract.Transact(opts, method, params...)
}

// Authority is a free data retrieval call binding the contract method 0xbf7e214f.
//
// Solidity: function authority() constant returns(address)
func (_RootChain *RootChainCaller) Authority(opts *bind.CallOpts) (common.Address, error) {
	var (
		ret0 = new(common.Address)
	)
	out := ret0
	err := _RootChain.contract.Call(opts, out, "authority")
	return *ret0, err
}

// Authority is a free data retrieval call binding the contract method 0xbf7e214f.
//
// Solidity: function authority() constant returns(address)
func (_RootChain *RootChainSession) Authority() (common.Address, error) {
	return _RootChain.Contract.Authority(&_RootChain.CallOpts)
}

// Authority is a free data retrieval call binding the contract method 0xbf7e214f.
//
// Solidity: function authority() constant returns(address)
func (_RootChain *RootChainCallerSession) Authority() (common.Address, error) {
	return _RootChain.Contract.Authority(&_RootChain.CallOpts)
}

// ChildBlockInterval is a free data retrieval call binding the contract method 0x38a9e0bc.
//
// Solidity: function childBlockInterval() constant returns(uint256)
func (_RootChain *RootChainCaller) ChildBlockInterval(opts *bind.CallOpts) (*big.Int, error) {
	var (
		ret0 = new(*big.Int)
	)
	out := ret0
	err := _RootChain.contract.Call(opts, out, "childBlockInterval")
	return *ret0, err
}

// ChildBlockInterval is a free data retrieval call binding the contract method 0x38a9e0bc.
//
// Solidity: function childBlockInterval() constant returns(uint256)
func (_RootChain *RootChainSession) ChildBlockInterval() (*big.Int, error) {
	return _RootChain.Contract.ChildBlockInterval(&_RootChain.CallOpts)
}

// ChildBlockInterval is a free data retrieval call binding the contract method 0x38a9e0bc.
//
// Solidity: function childBlockInterval() constant returns(uint256)
func (_RootChain *RootChainCallerSession) ChildBlockInterval() (*big.Int, error) {
	return _RootChain.Contract.ChildBlockInterval(&_RootChain.CallOpts)
}

// ChildChain is a free data retrieval call binding the contract method 0xf95643b1.
//
// Solidity: function childChain( uint256) constant returns(root bytes32, created_at uint256)
func (_RootChain *RootChainCaller) ChildChain(opts *bind.CallOpts, arg0 *big.Int) (struct {
	Root      [32]byte
	CreatedAt *big.Int
}, error) {
	ret := new(struct {
		Root      [32]byte
		CreatedAt *big.Int
	})
	out := ret
	err := _RootChain.contract.Call(opts, out, "childChain", arg0)
	return *ret, err
}

// ChildChain is a free data retrieval call binding the contract method 0xf95643b1.
//
// Solidity: function childChain( uint256) constant returns(root bytes32, created_at uint256)
func (_RootChain *RootChainSession) ChildChain(arg0 *big.Int) (struct {
	Root      [32]byte
	CreatedAt *big.Int
}, error) {
	return _RootChain.Contract.ChildChain(&_RootChain.CallOpts, arg0)
}

// ChildChain is a free data retrieval call binding the contract method 0xf95643b1.
//
// Solidity: function childChain( uint256) constant returns(root bytes32, created_at uint256)
func (_RootChain *RootChainCallerSession) ChildChain(arg0 *big.Int) (struct {
	Root      [32]byte
	CreatedAt *big.Int
}, error) {
	return _RootChain.Contract.ChildChain(&_RootChain.CallOpts, arg0)
}

// CurrentChildBlock is a free data retrieval call binding the contract method 0x7a95f1e8.
//
// Solidity: function currentChildBlock() constant returns(uint256)
func (_RootChain *RootChainCaller) CurrentChildBlock(opts *bind.CallOpts) (*big.Int, error) {
	var (
		ret0 = new(*big.Int)
	)
	out := ret0
	err := _RootChain.contract.Call(opts, out, "currentChildBlock")
	return *ret0, err
}

// CurrentChildBlock is a free data retrieval call binding the contract method 0x7a95f1e8.
//
// Solidity: function currentChildBlock() constant returns(uint256)
func (_RootChain *RootChainSession) CurrentChildBlock() (*big.Int, error) {
	return _RootChain.Contract.CurrentChildBlock(&_RootChain.CallOpts)
}

// CurrentChildBlock is a free data retrieval call binding the contract method 0x7a95f1e8.
//
// Solidity: function currentChildBlock() constant returns(uint256)
func (_RootChain *RootChainCallerSession) CurrentChildBlock() (*big.Int, error) {
	return _RootChain.Contract.CurrentChildBlock(&_RootChain.CallOpts)
}

// CurrentDepositBlock is a free data retrieval call binding the contract method 0xa98c7f2c.
//
// Solidity: function currentDepositBlock() constant returns(uint256)
func (_RootChain *RootChainCaller) CurrentDepositBlock(opts *bind.CallOpts) (*big.Int, error) {
	var (
		ret0 = new(*big.Int)
	)
	out := ret0
	err := _RootChain.contract.Call(opts, out, "currentDepositBlock")
	return *ret0, err
}

// CurrentDepositBlock is a free data retrieval call binding the contract method 0xa98c7f2c.
//
// Solidity: function currentDepositBlock() constant returns(uint256)
func (_RootChain *RootChainSession) CurrentDepositBlock() (*big.Int, error) {
	return _RootChain.Contract.CurrentDepositBlock(&_RootChain.CallOpts)
}

// CurrentDepositBlock is a free data retrieval call binding the contract method 0xa98c7f2c.
//
// Solidity: function currentDepositBlock() constant returns(uint256)
func (_RootChain *RootChainCallerSession) CurrentDepositBlock() (*big.Int, error) {
	return _RootChain.Contract.CurrentDepositBlock(&_RootChain.CallOpts)
}

// Exits is a free data retrieval call binding the contract method 0x342de179.
//
// Solidity: function exits( uint256) constant returns(owner address, amount uint256)
func (_RootChain *RootChainCaller) Exits(opts *bind.CallOpts, arg0 *big.Int) (struct {
	Owner  common.Address
	Amount *big.Int
}, error) {
	ret := new(struct {
		Owner  common.Address
		Amount *big.Int
	})
	out := ret
	err := _RootChain.contract.Call(opts, out, "exits", arg0)
	return *ret, err
}

// Exits is a free data retrieval call binding the contract method 0x342de179.
//
// Solidity: function exits( uint256) constant returns(owner address, amount uint256)
func (_RootChain *RootChainSession) Exits(arg0 *big.Int) (struct {
	Owner  common.Address
	Amount *big.Int
}, error) {
	return _RootChain.Contract.Exits(&_RootChain.CallOpts, arg0)
}

// Exits is a free data retrieval call binding the contract method 0x342de179.
//
// Solidity: function exits( uint256) constant returns(owner address, amount uint256)
func (_RootChain *RootChainCallerSession) Exits(arg0 *big.Int) (struct {
	Owner  common.Address
	Amount *big.Int
}, error) {
	return _RootChain.Contract.Exits(&_RootChain.CallOpts, arg0)
}

// GetChildChain is a free data retrieval call binding the contract method 0x85444de3.
//
// Solidity: function getChildChain(blockNumber uint256) constant returns(bytes32, uint256)
func (_RootChain *RootChainCaller) GetChildChain(opts *bind.CallOpts, blockNumber *big.Int) ([32]byte, *big.Int, error) {
	var (
		ret0 = new([32]byte)
		ret1 = new(*big.Int)
	)
	out := &[]interface{}{
		ret0,
		ret1,
	}
	err := _RootChain.contract.Call(opts, out, "getChildChain", blockNumber)
	return *ret0, *ret1, err
}

// GetChildChain is a free data retrieval call binding the contract method 0x85444de3.
//
// Solidity: function getChildChain(blockNumber uint256) constant returns(bytes32, uint256)
func (_RootChain *RootChainSession) GetChildChain(blockNumber *big.Int) ([32]byte, *big.Int, error) {
	return _RootChain.Contract.GetChildChain(&_RootChain.CallOpts, blockNumber)
}

// GetChildChain is a free data retrieval call binding the contract method 0x85444de3.
//
// Solidity: function getChildChain(blockNumber uint256) constant returns(bytes32, uint256)
func (_RootChain *RootChainCallerSession) GetChildChain(blockNumber *big.Int) ([32]byte, *big.Int, error) {
	return _RootChain.Contract.GetChildChain(&_RootChain.CallOpts, blockNumber)
}

// GetDepositBlock is a free data retrieval call binding the contract method 0xbcd59261.
//
// Solidity: function getDepositBlock() constant returns(uint256)
func (_RootChain *RootChainCaller) GetDepositBlock(opts *bind.CallOpts) (*big.Int, error) {
	var (
		ret0 = new(*big.Int)
	)
	out := ret0
	err := _RootChain.contract.Call(opts, out, "getDepositBlock")
	return *ret0, err
}

// GetDepositBlock is a free data retrieval call binding the contract method 0xbcd59261.
//
// Solidity: function getDepositBlock() constant returns(uint256)
func (_RootChain *RootChainSession) GetDepositBlock() (*big.Int, error) {
	return _RootChain.Contract.GetDepositBlock(&_RootChain.CallOpts)
}

// GetDepositBlock is a free data retrieval call binding the contract method 0xbcd59261.
//
// Solidity: function getDepositBlock() constant returns(uint256)
func (_RootChain *RootChainCallerSession) GetDepositBlock() (*big.Int, error) {
	return _RootChain.Contract.GetDepositBlock(&_RootChain.CallOpts)
}

// GetExit is a free data retrieval call binding the contract method 0xe60f1ff1.
//
// Solidity: function getExit(utxoPos uint256) constant returns(address, uint256)
func (_RootChain *RootChainCaller) GetExit(opts *bind.CallOpts, utxoPos *big.Int) (common.Address, *big.Int, error) {
	var (
		ret0 = new(common.Address)
		ret1 = new(*big.Int)
	)
	out := &[]interface{}{
		ret0,
		ret1,
	}
	err := _RootChain.contract.Call(opts, out, "getExit", utxoPos)
	return *ret0, *ret1, err
}

// GetExit is a free data retrieval call binding the contract method 0xe60f1ff1.
//
// Solidity: function getExit(utxoPos uint256) constant returns(address, uint256)
func (_RootChain *RootChainSession) GetExit(utxoPos *big.Int) (common.Address, *big.Int, error) {
	return _RootChain.Contract.GetExit(&_RootChain.CallOpts, utxoPos)
}

// GetExit is a free data retrieval call binding the contract method 0xe60f1ff1.
//
// Solidity: function getExit(utxoPos uint256) constant returns(address, uint256)
func (_RootChain *RootChainCallerSession) GetExit(utxoPos *big.Int) (common.Address, *big.Int, error) {
	return _RootChain.Contract.GetExit(&_RootChain.CallOpts, utxoPos)
}

// GetNextExit is a free data retrieval call binding the contract method 0x2fd56a25.
//
// Solidity: function getNextExit() constant returns(uint256, uint256)
func (_RootChain *RootChainCaller) GetNextExit(opts *bind.CallOpts) (*big.Int, *big.Int, error) {
	var (
		ret0 = new(*big.Int)
		ret1 = new(*big.Int)
	)
	out := &[]interface{}{
		ret0,
		ret1,
	}
	err := _RootChain.contract.Call(opts, out, "getNextExit")
	return *ret0, *ret1, err
}

// GetNextExit is a free data retrieval call binding the contract method 0x2fd56a25.
//
// Solidity: function getNextExit() constant returns(uint256, uint256)
func (_RootChain *RootChainSession) GetNextExit() (*big.Int, *big.Int, error) {
	return _RootChain.Contract.GetNextExit(&_RootChain.CallOpts)
}

// GetNextExit is a free data retrieval call binding the contract method 0x2fd56a25.
//
// Solidity: function getNextExit() constant returns(uint256, uint256)
func (_RootChain *RootChainCallerSession) GetNextExit() (*big.Int, *big.Int, error) {
	return _RootChain.Contract.GetNextExit(&_RootChain.CallOpts)
}

// ChallengeExit is a paid mutator transaction binding the contract method 0x32773ba3.
//
// Solidity: function challengeExit(cUtxoPos uint256, eUtxoIndex uint256, txBytes bytes, proof bytes, sigs bytes, confirmationSig bytes) returns()
func (_RootChain *RootChainTransactor) ChallengeExit(opts *bind.TransactOpts, cUtxoPos *big.Int, eUtxoIndex *big.Int, txBytes []byte, proof []byte, sigs []byte, confirmationSig []byte) (*types.Transaction, error) {
	return _RootChain.contract.Transact(opts, "challengeExit", cUtxoPos, eUtxoIndex, txBytes, proof, sigs, confirmationSig)
}

// ChallengeExit is a paid mutator transaction binding the contract method 0x32773ba3.
//
// Solidity: function challengeExit(cUtxoPos uint256, eUtxoIndex uint256, txBytes bytes, proof bytes, sigs bytes, confirmationSig bytes) returns()
func (_RootChain *RootChainSession) ChallengeExit(cUtxoPos *big.Int, eUtxoIndex *big.Int, txBytes []byte, proof []byte, sigs []byte, confirmationSig []byte) (*types.Transaction, error) {
	return _RootChain.Contract.ChallengeExit(&_RootChain.TransactOpts, cUtxoPos, eUtxoIndex, txBytes, proof, sigs, confirmationSig)
}

// ChallengeExit is a paid mutator transaction binding the contract method 0x32773ba3.
//
// Solidity: function challengeExit(cUtxoPos uint256, eUtxoIndex uint256, txBytes bytes, proof bytes, sigs bytes, confirmationSig bytes) returns()
func (_RootChain *RootChainTransactorSession) ChallengeExit(cUtxoPos *big.Int, eUtxoIndex *big.Int, txBytes []byte, proof []byte, sigs []byte, confirmationSig []byte) (*types.Transaction, error) {
	return _RootChain.Contract.ChallengeExit(&_RootChain.TransactOpts, cUtxoPos, eUtxoIndex, txBytes, proof, sigs, confirmationSig)
}

// Deposit is a paid mutator transaction binding the contract method 0xd0e30db0.
//
// Solidity: function deposit() returns()
func (_RootChain *RootChainTransactor) Deposit(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _RootChain.contract.Transact(opts, "deposit")
}

// Deposit is a paid mutator transaction binding the contract method 0xd0e30db0.
//
// Solidity: function deposit() returns()
func (_RootChain *RootChainSession) Deposit() (*types.Transaction, error) {
	return _RootChain.Contract.Deposit(&_RootChain.TransactOpts)
}

// Deposit is a paid mutator transaction binding the contract method 0xd0e30db0.
//
// Solidity: function deposit() returns()
func (_RootChain *RootChainTransactorSession) Deposit() (*types.Transaction, error) {
	return _RootChain.Contract.Deposit(&_RootChain.TransactOpts)
}

// FinalizeExits is a paid mutator transaction binding the contract method 0xc6ab44cd.
//
// Solidity: function finalizeExits() returns()
func (_RootChain *RootChainTransactor) FinalizeExits(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _RootChain.contract.Transact(opts, "finalizeExits")
}

// FinalizeExits is a paid mutator transaction binding the contract method 0xc6ab44cd.
//
// Solidity: function finalizeExits() returns()
func (_RootChain *RootChainSession) FinalizeExits() (*types.Transaction, error) {
	return _RootChain.Contract.FinalizeExits(&_RootChain.TransactOpts)
}

// FinalizeExits is a paid mutator transaction binding the contract method 0xc6ab44cd.
//
// Solidity: function finalizeExits() returns()
func (_RootChain *RootChainTransactorSession) FinalizeExits() (*types.Transaction, error) {
	return _RootChain.Contract.FinalizeExits(&_RootChain.TransactOpts)
}

// GetUtxoPos is a paid mutator transaction binding the contract method 0xad1f763f.
//
// Solidity: function getUtxoPos(txBytes bytes, oIndex uint256) returns(uint256)
func (_RootChain *RootChainTransactor) GetUtxoPos(opts *bind.TransactOpts, txBytes []byte, oIndex *big.Int) (*types.Transaction, error) {
	return _RootChain.contract.Transact(opts, "getUtxoPos", txBytes, oIndex)
}

// GetUtxoPos is a paid mutator transaction binding the contract method 0xad1f763f.
//
// Solidity: function getUtxoPos(txBytes bytes, oIndex uint256) returns(uint256)
func (_RootChain *RootChainSession) GetUtxoPos(txBytes []byte, oIndex *big.Int) (*types.Transaction, error) {
	return _RootChain.Contract.GetUtxoPos(&_RootChain.TransactOpts, txBytes, oIndex)
}

// GetUtxoPos is a paid mutator transaction binding the contract method 0xad1f763f.
//
// Solidity: function getUtxoPos(txBytes bytes, oIndex uint256) returns(uint256)
func (_RootChain *RootChainTransactorSession) GetUtxoPos(txBytes []byte, oIndex *big.Int) (*types.Transaction, error) {
	return _RootChain.Contract.GetUtxoPos(&_RootChain.TransactOpts, txBytes, oIndex)
}

// StartDepositExit is a paid mutator transaction binding the contract method 0x70e4abf6.
//
// Solidity: function startDepositExit(depositPos uint256, amount uint256) returns()
func (_RootChain *RootChainTransactor) StartDepositExit(opts *bind.TransactOpts, depositPos *big.Int, amount *big.Int) (*types.Transaction, error) {
	return _RootChain.contract.Transact(opts, "startDepositExit", depositPos, amount)
}

// StartDepositExit is a paid mutator transaction binding the contract method 0x70e4abf6.
//
// Solidity: function startDepositExit(depositPos uint256, amount uint256) returns()
func (_RootChain *RootChainSession) StartDepositExit(depositPos *big.Int, amount *big.Int) (*types.Transaction, error) {
	return _RootChain.Contract.StartDepositExit(&_RootChain.TransactOpts, depositPos, amount)
}

// StartDepositExit is a paid mutator transaction binding the contract method 0x70e4abf6.
//
// Solidity: function startDepositExit(depositPos uint256, amount uint256) returns()
func (_RootChain *RootChainTransactorSession) StartDepositExit(depositPos *big.Int, amount *big.Int) (*types.Transaction, error) {
	return _RootChain.Contract.StartDepositExit(&_RootChain.TransactOpts, depositPos, amount)
}

// StartExit is a paid mutator transaction binding the contract method 0x1c91a6b9.
//
// Solidity: function startExit(utxoPos uint256, txBytes bytes, proof bytes, sigs bytes) returns()
func (_RootChain *RootChainTransactor) StartExit(opts *bind.TransactOpts, utxoPos *big.Int, txBytes []byte, proof []byte, sigs []byte) (*types.Transaction, error) {
	return _RootChain.contract.Transact(opts, "startExit", utxoPos, txBytes, proof, sigs)
}

// StartExit is a paid mutator transaction binding the contract method 0x1c91a6b9.
//
// Solidity: function startExit(utxoPos uint256, txBytes bytes, proof bytes, sigs bytes) returns()
func (_RootChain *RootChainSession) StartExit(utxoPos *big.Int, txBytes []byte, proof []byte, sigs []byte) (*types.Transaction, error) {
	return _RootChain.Contract.StartExit(&_RootChain.TransactOpts, utxoPos, txBytes, proof, sigs)
}

// StartExit is a paid mutator transaction binding the contract method 0x1c91a6b9.
//
// Solidity: function startExit(utxoPos uint256, txBytes bytes, proof bytes, sigs bytes) returns()
func (_RootChain *RootChainTransactorSession) StartExit(utxoPos *big.Int, txBytes []byte, proof []byte, sigs []byte) (*types.Transaction, error) {
	return _RootChain.Contract.StartExit(&_RootChain.TransactOpts, utxoPos, txBytes, proof, sigs)
}

// SubmitBlock is a paid mutator transaction binding the contract method 0xbaa47694.
//
// Solidity: function submitBlock(root bytes32) returns()
func (_RootChain *RootChainTransactor) SubmitBlock(opts *bind.TransactOpts, root [32]byte) (*types.Transaction, error) {
	return _RootChain.contract.Transact(opts, "submitBlock", root)
}

// SubmitBlock is a paid mutator transaction binding the contract method 0xbaa47694.
//
// Solidity: function submitBlock(root bytes32) returns()
func (_RootChain *RootChainSession) SubmitBlock(root [32]byte) (*types.Transaction, error) {
	return _RootChain.Contract.SubmitBlock(&_RootChain.TransactOpts, root)
}

// SubmitBlock is a paid mutator transaction binding the contract method 0xbaa47694.
//
// Solidity: function submitBlock(root bytes32) returns()
func (_RootChain *RootChainTransactorSession) SubmitBlock(root [32]byte) (*types.Transaction, error) {
	return _RootChain.Contract.SubmitBlock(&_RootChain.TransactOpts, root)
}

// RootChainDepositIterator is returned from FilterDeposit and is used to iterate over the raw logs and unpacked data for Deposit events raised by the RootChain contract.
type RootChainDepositIterator struct {
	Event *RootChainDeposit // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *RootChainDepositIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(RootChainDeposit)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(RootChainDeposit)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *RootChainDepositIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *RootChainDepositIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// RootChainDeposit represents a Deposit event raised by the RootChain contract.
type RootChainDeposit struct {
	Depositor    common.Address
	Amount       *big.Int
	DepositBlock *big.Int
	Raw          types.Log // Blockchain specific contextual infos
}

// FilterDeposit is a free log retrieval operation binding the contract event 0x90890809c654f11d6e72a28fa60149770a0d11ec6c92319d6ceb2bb0a4ea1a15.
//
// Solidity: e Deposit(depositor address, amount uint256, depositBlock uint256)
func (_RootChain *RootChainFilterer) FilterDeposit(opts *bind.FilterOpts) (*RootChainDepositIterator, error) {

	logs, sub, err := _RootChain.contract.FilterLogs(opts, "Deposit")
	if err != nil {
		return nil, err
	}
	return &RootChainDepositIterator{contract: _RootChain.contract, event: "Deposit", logs: logs, sub: sub}, nil
}

// WatchDeposit is a free log subscription operation binding the contract event 0x90890809c654f11d6e72a28fa60149770a0d11ec6c92319d6ceb2bb0a4ea1a15.
//
// Solidity: e Deposit(depositor address, amount uint256, depositBlock uint256)
func (_RootChain *RootChainFilterer) WatchDeposit(opts *bind.WatchOpts, sink chan<- *RootChainDeposit) (event.Subscription, error) {

	logs, sub, err := _RootChain.contract.WatchLogs(opts, "Deposit")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(RootChainDeposit)
				if err := _RootChain.contract.UnpackLog(event, "Deposit", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// RootChainExitIterator is returned from FilterExit and is used to iterate over the raw logs and unpacked data for Exit events raised by the RootChain contract.
type RootChainExitIterator struct {
	Event *RootChainExit // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *RootChainExitIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(RootChainExit)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(RootChainExit)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *RootChainExitIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *RootChainExitIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// RootChainExit represents a Exit event raised by the RootChain contract.
type RootChainExit struct {
	Exitor  common.Address
	UtxoPos *big.Int
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterExit is a free log retrieval operation binding the contract event 0x22d324652c93739755cf4581508b60875ebdd78c20c0cff5cf8e23452b299631.
//
// Solidity: e Exit(exitor address, utxoPos uint256)
func (_RootChain *RootChainFilterer) FilterExit(opts *bind.FilterOpts) (*RootChainExitIterator, error) {

	logs, sub, err := _RootChain.contract.FilterLogs(opts, "Exit")
	if err != nil {
		return nil, err
	}
	return &RootChainExitIterator{contract: _RootChain.contract, event: "Exit", logs: logs, sub: sub}, nil
}

// WatchExit is a free log subscription operation binding the contract event 0x22d324652c93739755cf4581508b60875ebdd78c20c0cff5cf8e23452b299631.
//
// Solidity: e Exit(exitor address, utxoPos uint256)
func (_RootChain *RootChainFilterer) WatchExit(opts *bind.WatchOpts, sink chan<- *RootChainExit) (event.Subscription, error) {

	logs, sub, err := _RootChain.contract.WatchLogs(opts, "Exit")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(RootChainExit)
				if err := _RootChain.contract.UnpackLog(event, "Exit", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// SafeMathABI is the input ABI used to generate the binding from.
const SafeMathABI = "[]"

// SafeMathBin is the compiled bytecode used for deploying new contracts.
const SafeMathBin = `0x604c602c600b82828239805160001a60731460008114601c57601e565bfe5b5030600052607381538281f30073000000000000000000000000000000000000000030146080604052600080fd00a165627a7a723058201716eb0c8884909ccbad890769ac3bfc11d72ade539b9cfa751c1d8c8f11f95c0029`

// DeploySafeMath deploys a new Ethereum contract, binding an instance of SafeMath to it.
func DeploySafeMath(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *SafeMath, error) {
	parsed, err := abi.JSON(strings.NewReader(SafeMathABI))
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	address, tx, contract, err := bind.DeployContract(auth, parsed, common.FromHex(SafeMathBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &SafeMath{SafeMathCaller: SafeMathCaller{contract: contract}, SafeMathTransactor: SafeMathTransactor{contract: contract}, SafeMathFilterer: SafeMathFilterer{contract: contract}}, nil
}

// SafeMath is an auto generated Go binding around an Ethereum contract.
type SafeMath struct {
	SafeMathCaller     // Read-only binding to the contract
	SafeMathTransactor // Write-only binding to the contract
	SafeMathFilterer   // Log filterer for contract events
}

// SafeMathCaller is an auto generated read-only Go binding around an Ethereum contract.
type SafeMathCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// SafeMathTransactor is an auto generated write-only Go binding around an Ethereum contract.
type SafeMathTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// SafeMathFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type SafeMathFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// SafeMathSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type SafeMathSession struct {
	Contract     *SafeMath         // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// SafeMathCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type SafeMathCallerSession struct {
	Contract *SafeMathCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts   // Call options to use throughout this session
}

// SafeMathTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type SafeMathTransactorSession struct {
	Contract     *SafeMathTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts   // Transaction auth options to use throughout this session
}

// SafeMathRaw is an auto generated low-level Go binding around an Ethereum contract.
type SafeMathRaw struct {
	Contract *SafeMath // Generic contract binding to access the raw methods on
}

// SafeMathCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type SafeMathCallerRaw struct {
	Contract *SafeMathCaller // Generic read-only contract binding to access the raw methods on
}

// SafeMathTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type SafeMathTransactorRaw struct {
	Contract *SafeMathTransactor // Generic write-only contract binding to access the raw methods on
}

// NewSafeMath creates a new instance of SafeMath, bound to a specific deployed contract.
func NewSafeMath(address common.Address, backend bind.ContractBackend) (*SafeMath, error) {
	contract, err := bindSafeMath(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &SafeMath{SafeMathCaller: SafeMathCaller{contract: contract}, SafeMathTransactor: SafeMathTransactor{contract: contract}, SafeMathFilterer: SafeMathFilterer{contract: contract}}, nil
}

// NewSafeMathCaller creates a new read-only instance of SafeMath, bound to a specific deployed contract.
func NewSafeMathCaller(address common.Address, caller bind.ContractCaller) (*SafeMathCaller, error) {
	contract, err := bindSafeMath(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &SafeMathCaller{contract: contract}, nil
}

// NewSafeMathTransactor creates a new write-only instance of SafeMath, bound to a specific deployed contract.
func NewSafeMathTransactor(address common.Address, transactor bind.ContractTransactor) (*SafeMathTransactor, error) {
	contract, err := bindSafeMath(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &SafeMathTransactor{contract: contract}, nil
}

// NewSafeMathFilterer creates a new log filterer instance of SafeMath, bound to a specific deployed contract.
func NewSafeMathFilterer(address common.Address, filterer bind.ContractFilterer) (*SafeMathFilterer, error) {
	contract, err := bindSafeMath(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &SafeMathFilterer{contract: contract}, nil
}

// bindSafeMath binds a generic wrapper to an already deployed contract.
func bindSafeMath(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(SafeMathABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_SafeMath *SafeMathRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _SafeMath.Contract.SafeMathCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_SafeMath *SafeMathRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _SafeMath.Contract.SafeMathTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_SafeMath *SafeMathRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _SafeMath.Contract.SafeMathTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_SafeMath *SafeMathCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _SafeMath.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_SafeMath *SafeMathTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _SafeMath.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_SafeMath *SafeMathTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _SafeMath.Contract.contract.Transact(opts, method, params...)
}

// ValidateABI is the input ABI used to generate the binding from.
const ValidateABI = "[]"

// ValidateBin is the compiled bytecode used for deploying new contracts.
const ValidateBin = `0x604c602c600b82828239805160001a60731460008114601c57601e565bfe5b5030600052607381538281f30073000000000000000000000000000000000000000030146080604052600080fd00a165627a7a7230582060c7905e399de36b0b87137c45e884d6058b988e661fafdd6de354027b8dbbbd0029`

// DeployValidate deploys a new Ethereum contract, binding an instance of Validate to it.
func DeployValidate(auth *bind.TransactOpts, backend bind.ContractBackend) (common.Address, *types.Transaction, *Validate, error) {
	parsed, err := abi.JSON(strings.NewReader(ValidateABI))
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	address, tx, contract, err := bind.DeployContract(auth, parsed, common.FromHex(ValidateBin), backend)
	if err != nil {
		return common.Address{}, nil, nil, err
	}
	return address, tx, &Validate{ValidateCaller: ValidateCaller{contract: contract}, ValidateTransactor: ValidateTransactor{contract: contract}, ValidateFilterer: ValidateFilterer{contract: contract}}, nil
}

// Validate is an auto generated Go binding around an Ethereum contract.
type Validate struct {
	ValidateCaller     // Read-only binding to the contract
	ValidateTransactor // Write-only binding to the contract
	ValidateFilterer   // Log filterer for contract events
}

// ValidateCaller is an auto generated read-only Go binding around an Ethereum contract.
type ValidateCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ValidateTransactor is an auto generated write-only Go binding around an Ethereum contract.
type ValidateTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ValidateFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type ValidateFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// ValidateSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type ValidateSession struct {
	Contract     *Validate         // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// ValidateCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type ValidateCallerSession struct {
	Contract *ValidateCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts   // Call options to use throughout this session
}

// ValidateTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type ValidateTransactorSession struct {
	Contract     *ValidateTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts   // Transaction auth options to use throughout this session
}

// ValidateRaw is an auto generated low-level Go binding around an Ethereum contract.
type ValidateRaw struct {
	Contract *Validate // Generic contract binding to access the raw methods on
}

// ValidateCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type ValidateCallerRaw struct {
	Contract *ValidateCaller // Generic read-only contract binding to access the raw methods on
}

// ValidateTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type ValidateTransactorRaw struct {
	Contract *ValidateTransactor // Generic write-only contract binding to access the raw methods on
}

// NewValidate creates a new instance of Validate, bound to a specific deployed contract.
func NewValidate(address common.Address, backend bind.ContractBackend) (*Validate, error) {
	contract, err := bindValidate(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Validate{ValidateCaller: ValidateCaller{contract: contract}, ValidateTransactor: ValidateTransactor{contract: contract}, ValidateFilterer: ValidateFilterer{contract: contract}}, nil
}

// NewValidateCaller creates a new read-only instance of Validate, bound to a specific deployed contract.
func NewValidateCaller(address common.Address, caller bind.ContractCaller) (*ValidateCaller, error) {
	contract, err := bindValidate(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &ValidateCaller{contract: contract}, nil
}

// NewValidateTransactor creates a new write-only instance of Validate, bound to a specific deployed contract.
func NewValidateTransactor(address common.Address, transactor bind.ContractTransactor) (*ValidateTransactor, error) {
	contract, err := bindValidate(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &ValidateTransactor{contract: contract}, nil
}

// NewValidateFilterer creates a new log filterer instance of Validate, bound to a specific deployed contract.
func NewValidateFilterer(address common.Address, filterer bind.ContractFilterer) (*ValidateFilterer, error) {
	contract, err := bindValidate(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &ValidateFilterer{contract: contract}, nil
}

// bindValidate binds a generic wrapper to an already deployed contract.
func bindValidate(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(ValidateABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Validate *ValidateRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _Validate.Contract.ValidateCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Validate *ValidateRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Validate.Contract.ValidateTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Validate *ValidateRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Validate.Contract.ValidateTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Validate *ValidateCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _Validate.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Validate *ValidateTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Validate.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Validate *ValidateTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Validate.Contract.contract.Transact(opts, method, params...)
}
