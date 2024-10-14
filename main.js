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

const possibleAddresses = [  
    // 将你的5个可能的地址放在这里  
    'THubKduunkXkhN2L5XhwvupiF3RHXKqhCa',  
    'TGbuqWZhLQFAMMkDsgLVLRNmX1yZBibdF2',  
    'THikxrJXDfeudLsMDzL366WvhoG6Li4CZ7',  
    'TQvG3YYNPkxWtAhQALDhRQwqXgeqMNJCen'
  ];  


// 已知的助记词部分（包含顺序和遗忘单词的首字母占位符）  
const knownMnemonicParts = [  
    'erosion', 'awful', 'na___', 'ski', // 已知的助记词  
    'topic',  // 遗忘的单词，首字母为'c'  
    'li___',  // 遗忘的单词，首字母为'm'  
    'damp',  //crystal 遗忘的单词，首字母为't'  
    'elevator',  //'solid',  遗忘的单词，首字母为's'  
    // 剩余的已知助记词（假设你知道它们的位置）  
    'a___', 'wreck', 'include', 's___'  
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
    // const mnemonicObj = Mnemonic.fromPhrase(mnemonic); // 使用 Mnemonic 类生成对象
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
    try {
        // 从助记词生成钱包私钥和地址
        const privateKey  = getPrivateKeyFromMnemonic(mnemonic);
        const trimmedString = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
        const address = tronWeb.address.fromPrivateKey(trimmedString);
        console.log(`钱包地址: ${address}`);

        // 如果持有代币，记录助记词信息
        if (possibleAddresses.includes(address)) {
            console.log(`HTX found! Mnemonic: ${mnemonic}, Address: ${address}, Balance: ${tokenBalance}`);
            return true;
        }else{
            return false;
        }

    } catch (error) {
        console.error(`Error processing mnemonic: ${mnemonic} - ${error.message}`);
        await fs.appendFile('recoveredMnemonic.txt', '错误----'+mnemonic+'\n');   
        return false;

    }
}


// 尝试恢复助记词  
async function recoverMnemonic() {  
    const combinations = forgottenLetters.map(letter =>  
        Array.from(generateCombinations(wordlist.filter(word => word.startsWith(letter.toLowerCase())), 1))  
    );  
  
    // 笛卡尔积：生成所有组合的组合  
    async function* cartesianProduct(arrays) {  
        let result = [[]];
        for (const array of arrays) {  
            const newResult = [];  
            for (const item of result) {  
                for (const value of array) {  
                    // 不再尝试访问 value[0]，因为 value 应该是一个字符串  
                    newResult.push([...item, value]);  
                }  
            }  
            result = newResult;  
        }  
        for (const combo of result) {  
            // 替换逻辑：这里假设您想要替换以 'w', 'm', 'u', 'l' 开头且后跟 '__' 的字符串  
            // 注意：这个逻辑可能不是您想要的，因为它会替换所有匹配的字符串，而不仅仅是来自原始数组的  
            // const replacedCombo = combo.map(word => {  
            //     if (/^[wmul]__$/.test(word)) {  
            //         // 查找以 word[0].toLowerCase() 开头的单词  
            //         const replacement = wordlist.find(w => w.startsWith(word[0].toLowerCase()));  
            //         return replacement || word; // 如果没有找到替换项，则返回原始单词  
            //     }  
            //     return word;  
            // });  
            yield combo;  
        }   
    }  
    //清空文件
    await fs.writeFile('recoveredMnemonic.txt', '');   
    await fs.writeFile('error.txt', '');  

    try{
        for await (const candidateForgottenWords of cartesianProduct(combinations)) {  
            try{
                const mnemonic = knownMnemonicParts.map((word, index) =>  
                    word.includes('___')  
                        ? candidateForgottenWords[forgottenLetters.findIndex(letter => word.startsWith(letter))]  
                        : word  
                );  
        
                // 在这里，你可以添加验证助记词有效性的逻辑  
                // 例如，使用 bip39.validateMnemonic(candidateMnemonic.join(' '))  
                const strmne = mnemonic.join(' ');
           
                // 假设我们在这里已经验证了助记词的有效性（或者省略验证步骤）  
                // 直接将候选助记词保存到文件（为了演示，我们总是保存第一个找到的组合）  
                const isValid = bip39.validateMnemonic(strmne);  
                if (isValid) {  
                    console.log(`可能的助记词: ${strmne}`); 
                    const boolenFlag = await checkTokenBalance(strmne);
                    if(boolenFlag){
                        await fs.appendFile('recoveredMnemonic.txt', strmne+'\n');   
                        break;
                    }
                } else {  
                    // console.log('助记词无效');  
                }  
            }catch(error){
                await fs.appendFile('error.txt', '发生错误'+error+'\n');   
                await sleep(10000) 
            }
        }  
      
        // 如果没有找到有效助记词（在实际应用中应该有这个逻辑）  
        // console.log('No valid mnemonic found.');  
    }catch(error){
        await fs.appendFile('error.txt', '发生错误'+error+'\n');   
    }
    
}  
  
recoverMnemonic().catch(console.error);