CMDDIR="cmd/plasma"

install:
	cd $(CMDDIR) && go install

clean:
	cd $(CMDDIR) && go clean

dep:
	npm install -g ganache-cli && npm install -g truffle && npm install && dep ensure -v

ganache:
	ganache-cli --port 7545 --account "0x9f6a8fd2536552f48affa76ca2bfa80906d90c0babb227cf38375c245dcb621d,100000000000000000000000000000"

ganache-deploy:
	truffle compile && truffle migrate --reset --network ganache

ropsten-deploy:
	truffle compile && truffle migrate --reset --network ropsten