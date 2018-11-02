<?php

namespace App\Models;

use EthereumPHP\Types\BlockNumber;
use Bezhanov\Ethereum\Converter;
use phpseclib\Math\BigInteger;
use File;
use Web3\Web3;
use Web3\Providers\HttpProvider;
use Web3\RequestManagers\HttpRequestManager;
use Web3\Contract;
use Web3\Eth;
use Web3\Net;
use EthereumPHP\EthereumClient;
use EthereumPHP\Types\BlockHash;
use EthereumPHP\Types\Address;
use App\Models\BaseEthProvider;

class EthLibrary
{
    //
    private $web3;
    private $eth;
    private $contract;
    private $contractABI;
    private $contractByteCode;
    private $contractAddress;
    private $ethProvider;
    private $ethClient;

    public function __construct()
    {
        $this->initWeb3();
        $this->loadContract();
        $this->initContract();
    }

    private function initWeb3() {

        $data = app(BaseEthProvider::class)->all()->first();
        if ( $data ) $data = $data->toArray();
        if ( $data['provider'] == 'test' ) {
            $eth_provider = $data['test_provider'];
            $this->contractAddress = $data['test_contract_address'];
        }
        else {
            $eth_provider = $data['main_provider'];
            $this->contractAddress = $data['main_contract_address'];
        }

        $this->web3 = new Web3(new HttpProvider(new HttpRequestManager($eth_provider, 3)));

        $this->eth = $this->web3->eth;
        $this->ethProvider = $eth_provider;
    }

    public function createNewAddress($userSecString='CryptoFantasy') {
        $client = new EthereumClient($this->ethProvider);
        $account = $client->personal()->newAccount($userSecString);
//        $this->web3->personal->newAccount($userSecString, function($err, $account) {
//dd($err, $account);
//            if (!is_null($err)) {
//                return 'error';
//            }
//            else {
//                return $account;
//            }
//        });
    }
    private function loadContract() {
        $this->contractABI = file_get_contents(base_path()."/config/AthleteToken.json");
        $this->contractByteCode = file_get_contents(base_path()."/config/AthleteToken.bytecode");
    }
    private function initContract() {
        $this->contract = new Contract($this->web3->provider, $this->contractABI);
        $this->contract->setAbi($this->contractABI);
        $this->contract->setBytecode($this->contractByteCode);
        $this->contract->setToAddress($this->contractAddress);
    }
    public function getContractAddress() {
        return $this->contractAddress;
    }
    public function getContracInstance() {
        return ['contract'=>$this->contract, 'eth'=>$this->eth, 'web3'=>$this->web3];
    }
    public function unLockAccount($address, $privateKey) {
        $this->web3->personal->unlockAccount($address, $privateKey, function($err, $unlocked){
            if ( $err !== null ) return false;
            if ( $unlocked )
                return true;
            else
                return false;
        });
    }
    /**
     ** param : address -string
     *  ** return : balance - ether
     */
    public function getBalance( $address ) {
        $_address = new \EthereumPHP\Types\Address($address);
        $this->ethClient = new EthereumClient($this->ethProvider);
        return $this->ethClient->eth()->getBalance($_address, new BlockNumber())->toEther();
    }
    /**
     **********************************  STATIC FUNCTIONS  *************************************
     */
    public static function weiToEth($wei, $round=5) {
        $converter = new Converter();
        return round($converter->fromWei($wei, 'ether')*1, $round);
    }
    public static function ethToWei($ether) {
        $converter = new Converter();
        return $converter->toWei($ether)*1;
    }
    public static function stringtoAddress( $addressStr ){
        return new \EthereumPHP\Types\Address($addressStr);
    }

    public static function strToHex($string){
        return dechex($string);
        $hex = '';
        for ($i=0; $i<strlen($string); $i++){
            $ord = ord($string[$i]);
            $hexCode = dechex($ord);
            $hex .= substr('0'.$hexCode, -2);
        }
        return strToUpper($hex);
    }
    public static function hexToStr($hex){
        $string='';
        for ($i=0; $i < strlen($hex)-1; $i+=2){
            $string .= chr(hexdec($hex[$i].$hex[$i+1]));
        }
        return $string;
    }

//        $contract->call("cooAddress", null, function($err, $result) use ( $contract ){
//                    if ( $err != null ){
//                        dd($err);
//                    }
//        dd($result);
//        $bigN = $result['total'];
//        dd( "Totalsupply is ".($bigN->toString()));
//        //print_r($contract, true);
//        });
}
