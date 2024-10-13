import fs from 'fs/promises';  
import {TronWeb} from 'tronweb';
import bip39 from 'bip39';  
import { Wallet, HDNodeWallet } from 'ethers';
import { sleep } from 'tronweb/utils';
// 加载BIP-39词库  
const wordlist = JSON.parse(await fs.readFile('bip39-words.json', 'utf8'));  
// 初始化 TronWeb
const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io'
});

// HTX 代币合约地址
const tokenContractAddress = 'TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6';

// 已知的助记词部分（包含顺序和遗忘单词的首字母占位符）  
const knownMnemonicParts = [  
    'erosion', 'awful', 'naive', 'ski', // 已知的助记词  
    'topic',  // 遗忘的单词，首字母为'c'  
    'liar',  // 遗忘的单词，首字母为'm'  
    'damp',  //crystal 遗忘的单词，首字母为't'  
    'elevator',  //'solid',  遗忘的单词，首字母为's'  
    // 剩余的已知助记词（假设你知道它们的位置）  
    'ability', 'wreck', 'include', 'search'  
    //erosion awful naive ski topic liar damp elevator ability wreck include search
    // 'coyote', 'enough', 'equal', 'mix', 'august', 'ecology', 'stereo', 'long', 'taste', 'age', 'eternal', 'about'
  ];  
  
// 提取遗忘单词的首字母  
const forgottenLetters = knownMnemonicParts  
    .map((word, index) => (word.includes('___') ? word.slice(0, -1).replace(/_/g, '') : ''))  //word.slice(1, -1).replace(/_/g, '')
    .filter(letter => letter);  
  
// 辅助函数：生成所有可能的单词组合  
function* generateCombinations(words, length) {  
    if (length === 0) yield [];  
    else for (let word of words) for (let combo of generateCombinations(words, length - 1)) yield [word, ...combo];  
}  

// 从助记词生成私钥
function getPrivateKeyFromMnemonic(mnemonic) {
   
    const wallet = fromPhrase(mnemonic); // 从 Mnemonic 对象生成 Wallet
    return wallet.privateKey;
}

function  fromPhrase(phrase) {
    const walletHDPath = "m/44'/195'/0'/0/0"; // Tron使用的HD路径
    const wallet = HDNodeWallet.fromPhrase(phrase,null,walletHDPath,null);
    // if (Provider) { return wallet.connect(Provider); }
    return wallet;
}

// 检查代币余额
async function checkTokenBalance(mnemonic) {
    // try {
        // 从助记词生成钱包私钥和地址
        const privateKey  = getPrivateKeyFromMnemonic(mnemonic);
        const trimmedString = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
        const address = tronWeb.address.fromPrivateKey(trimmedString);
        console.log(`钱包地址: ${address}`);

        // 查询 TRX 余额
        // const balanceInSun = await tronWeb.trx.getBalance(address);
        // const balance = tronWeb.fromSun(balanceInSun); // 将 Sun 转换为 TRX

        // // 获取合约实例
        const contract = await tronWeb.contract().at(tokenContractAddress);

        // 查询地址的HTX代币余额
        const balance = await contract.balanceOf(address).call({
            from: address // 显式指定 owner_address
            });
        const tokenBalance = tronWeb.toDecimal(balance);

        // 如果持有代币，记录助记词信息
        if (tokenBalance > 0) {
            console.log(`HTX found! Mnemonic: ${mnemonic}, Address: ${address}, Balance: ${tokenBalance}`);
            return true;
        }else{
            return false;
        }

    // } catch (error) {
    //     console.error(`Error processing mnemonic: ${mnemonic} - ${error.message}`);
    //     return false;
    // }
}


// 尝试恢复助记词  
async function recoverMnemonic() {  

    try{

    
            // 在这里，你可以添加验证助记词有效性的逻辑  
            // 例如，使用 bip39.validateMnemonic(candidateMnemonic.join(' '))  
            const strmne = knownMnemonicParts.join(' ');
            try{
                // 假设我们在这里已经验证了助记词的有效性（或者省略验证步骤）  
                // 直接将候选助记词保存到文件（为了演示，我们总是保存第一个找到的组合）  
                const isValid = bip39.validateMnemonic(strmne);  
                if (isValid) {  
                    console.log(`可能的助记词: ${strmne}`); 
                    const boolenFlag = await checkTokenBalance(strmne);
                    if(boolenFlag){
                        await fs.appendFile('recoveredMnemonic.txt', strmne+'\n');   
                    }
                } else {  
                    // console.log('助记词无效');  
                }  
            }catch(error){
                await fs.appendFile('recoveredMnemonic.txt', strmne+'\n');  
                console.error('发生错误:', error);  
                console.error('休息一下'); 
                sleep(10000) 
                console.error('开始'); 
            }
        } catch(error){
         
      }
    
}  
  
recoverMnemonic().catch(console.error);