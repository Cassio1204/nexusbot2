const { Web3 } = require('web3');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    try {
        const { mainWalletKey, receivingAddresses, amount, rpcUrl } = JSON.parse(event.body);
        const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        
        const mainWallet = web3.eth.accounts.privateKeyToAccount(mainWalletKey);
        const nonce = await web3.eth.getTransactionCount(mainWallet.address, 'latest');
        const gasPrice = await web3.eth.getGasPrice();

        const tx = {
            from: mainWallet.address,
            to: receivingAddresses[0],
            value: web3.utils.toWei(amount.toString(), 'ether'),
            gas: 21000,
            gasPrice: gasPrice,
            nonce: nonce
        };

        const signedTx = await web3.eth.accounts.signTransaction(tx, mainWallet.privateKey);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                transaction: {
                    hash: receipt.transactionHash,
                    from: mainWallet.address,
                    to: receivingAddresses[0]
                }
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
